import { NextRequest } from "next/server";
import { deepseek, AI_MODEL } from "@/lib/ai-client";
import { buildChatPrompt, DISCLAIMER } from "@/lib/chat-prompt";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import {
  CHAT_FREE_LIMIT,
  CHAT_MESSAGES_PER_CREDIT,
} from "@/config/subscriptions";
import type { ChatRequest, Skill } from "@/types/skill";

/**
 * POST /api/chat
 *
 * 品鉴聊天接口 —— 平台统一定价（无例外）：
 *   - 任何人（含创建者、Draw 购买者）：前 3 条免费，之后每 10 条消耗 1 积分
 *   - Draw 买断只给下载权，不包含免费聊天
 *   - 未登录用户：前 3 条免费（全局计数），之后需登录
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.skillId || !body.message) {
      return new Response("Missing skillId or message", { status: 400 });
    }

    if (typeof body.message !== "string" || body.message.trim().length === 0) {
      return new Response("Message cannot be empty", { status: 400 });
    }

    // 消息长度上限 5,000 字符，防止滥用消耗 Token
    if (body.message.length > 5_000) {
      return new Response("Message is too long. Maximum 5,000 characters allowed.", { status: 400 });
    }

    const supabase = await createClient();

    // ── 查询 Skill ──
    const { data: skill, error } = await supabase
      .from("skills")
      .select("*")
      .eq("id", body.skillId)
      .single<Skill>();

    if (error || !skill) {
      return new Response("Skill not found", { status: 404 });
    }

    // ── 身份判断 ──
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user;

    // ── 已登录用户：统一走按条计费 ──
    if (currentUser) {
      return handleAuthenticatedChat(supabase, skill, currentUser.id, body.message);
    }

    // ── 未登录用户：旧配额系统（全局计数，3 条免费）──
    if (skill.quota_used >= CHAT_FREE_LIMIT) {
      return new Response(
        "Free tastings exhausted. Sign in to continue — your first 3 messages are free, then 1 credit per 10 messages.",
        { status: 403 }
      );
    }

    // 匿名用户：先流式回复，成功后再扣配额
    const response = await streamChat(skill, body.message);

    // 扣全局配额
    await supabase
      .from("skills")
      .update({ quota_used: skill.quota_used + 1 })
      .eq("id", skill.id);

    return response;
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      "Chat service is temporarily unavailable. Please try again later.",
      { status: 500 }
    );
  }
}

/**
 * 已登录用户的按条计费逻辑
 */
async function handleAuthenticatedChat(
  supabase: Awaited<ReturnType<typeof createClient>>,
  skill: Skill,
  userId: string,
  message: string
) {
  const serviceClient = createServiceRoleClient();

  // 1. 获取或创建对话记录
  const { data: conv } = await serviceClient
    .from("skill_conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("skill_id", skill.id)
    .maybeSingle();

  let record = conv;

  if (!record) {
    const { data: newConv } = await serviceClient
      .from("skill_conversations")
      .insert({
        user_id: userId,
        skill_id: skill.id,
        message_count: 0,
        free_messages_used: 0,
        credits_spent: 0,
      })
      .select("*")
      .single();

    if (!newConv) {
      return new Response("Failed to initialize conversation tracking.", { status: 500 });
    }
    record = newConv;
  }

  // 2. 还在免费额度内？
  if (record.free_messages_used < CHAT_FREE_LIMIT) {
    // AI 调用
    const response = await streamChat(skill, message);

    // 更新免费计数
    await serviceClient
      .from("skill_conversations")
      .update({
        free_messages_used: record.free_messages_used + 1,
        message_count: record.message_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    // 同步更新全局配额
    await serviceClient
      .from("skills")
      .update({ quota_used: skill.quota_used + 1 })
      .eq("id", skill.id);

    return response;
  }

  // 3. 已超出免费额度 —— 检查当前计费周期
  // 已消耗积分数 = credits_spent
  // 已付费涵盖的消息数 = credits_spent * CHAT_MESSAGES_PER_CREDIT
  const paidMessagesCovered = record.credits_spent * CHAT_MESSAGES_PER_CREDIT;
  const totalPaidMessages = record.message_count - record.free_messages_used;
  // 当前付费周期是否已满 10 条？
  const messagesInCurrentPeriod = totalPaidMessages - (record.credits_spent - 1) * CHAT_MESSAGES_PER_CREDIT;

  // 需要新扣积分：当前周期的第 1 条消息时扣
  const needsNewCredit =
    record.credits_spent === 0 ||
    totalPaidMessages >= record.credits_spent * CHAT_MESSAGES_PER_CREDIT;

  if (needsNewCredit) {
    // 检查积分余额
    const { data: customer } = await serviceClient
      .from("customers")
      .select("id, credits")
      .eq("user_id", userId)
      .single();

    if (!customer || customer.credits < 1) {
      return new Response(
        "Not enough credits to continue tasting. Get more credits to keep the conversation going.",
        { status: 402 }
      );
    }

    // 原子扣 1 积分（WHERE credits >= 1 防竞态）
    const { data: deducted, error: deductChatError } = await serviceClient
      .from("customers")
      .update({ credits: customer.credits - 1 })
      .eq("id", customer.id)
      .gte("credits", 1)
      .select("credits")
      .single();

    if (deductChatError || !deducted) {
      return new Response(
        "Not enough credits to continue tasting. Get more credits to keep the conversation going.",
        { status: 402 }
      );
    }

    // 记录积分流水（含 skill_id 用于分成）
    await serviceClient.from("credits_history").insert({
      customer_id: customer.id,
      amount: 1,
      type: "subtract",
      description: `Chat with: ${skill.name}`,
      skill_id: skill.id,
    });

    // 更新对话记录
    await serviceClient
      .from("skill_conversations")
      .update({
        credits_spent: record.credits_spent + 1,
      })
      .eq("id", record.id);
  }

  // 4. AI 调用
  const response = await streamChat(skill, message);

  // 5. 更新计数
  await serviceClient
    .from("skill_conversations")
    .update({
      message_count: record.message_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", record.id);

  // 同步更新全局配额
  await serviceClient
    .from("skills")
    .update({ quota_used: skill.quota_used + 1 })
    .eq("id", skill.id);

  return response;
}

/**
 * 流式调用 AI 并返回 ReadableStream 响应
 */
async function streamChat(skill: Skill, message: string) {
  const systemPrompt = buildChatPrompt(
    skill.flavor,
    skill.rules,
    skill.material,
    skill.voice_samples,
    skill.boundaries
  );

  const stream = await deepseek.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    temperature: 0.8,
    max_tokens: 1024,
    stream: true,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          controller.enqueue(encoder.encode(delta));
        }
      }
      // Append disclaimer
      controller.enqueue(encoder.encode(DISCLAIMER));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
