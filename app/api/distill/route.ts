import { NextRequest, NextResponse } from "next/server";
import { deepseek, AI_MODEL } from "@/lib/ai-client";
import { DISTILL_PROMPT, buildDistillUserMessage } from "@/lib/distill-prompt";
import { createClient } from "@/utils/supabase/server";
import type { DistillRequest, DistillResponse } from "@/types/skill";

/** 原料文本最大长度：50,000 字符（约 12,000 tokens），防止滥用消耗 API 费用 */
const MAX_MATERIAL_LENGTH = 50_000;

/**
 * POST /api/distill
 *
 * 接收用户的原料文本，调用 AI 蒸馏出风味档案和酿造铁律。
 * 需要登录（防止匿名滥用消耗 AI 费用）。
 *
 * Request:  { material: string }
 * Response: { flavor: string, rules: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    // ── 认证检查：未登录用户不可调用蒸馏 ──
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to distill a persona." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as DistillRequest;

    if (!body.material || typeof body.material !== "string") {
      return NextResponse.json(
        { error: "Please provide source material." },
        { status: 400 }
      );
    }

    if (body.material.trim().length < 10) {
      return NextResponse.json(
        { error: "Material is too short. Please enter at least 10 characters." },
        { status: 400 }
      );
    }

    if (body.material.length > MAX_MATERIAL_LENGTH) {
      return NextResponse.json(
        { error: `Material is too long. Maximum ${MAX_MATERIAL_LENGTH.toLocaleString()} characters allowed.` },
        { status: 400 }
      );
    }

    // 调用 DeepSeek
    const completion = await deepseek.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: DISTILL_PROMPT },
        { role: "user", content: buildDistillUserMessage(body.material) },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!raw) {
      return NextResponse.json(
        { error: "Distillation interrupted. Please try again." },
        { status: 500 }
      );
    }

    // 尝试解析 JSON（兼容模型偶尔输出 markdown 代码块的情况）
    let parsed: DistillResponse;
    try {
      parsed = JSON.parse(raw) as DistillResponse;
    } catch {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1].trim()) as DistillResponse;
        } catch {
          console.error("Failed to parse distill response (length:", raw.length, ")");
          return NextResponse.json(
            { error: "Distillation interrupted. Please try again." },
            { status: 500 }
          );
        }
      } else {
        console.error("Failed to parse distill response (length:", raw.length, ")");
        return NextResponse.json(
          { error: "Distillation interrupted. Please try again." },
          { status: 500 }
        );
      }
    }

    if (!parsed.flavor || !Array.isArray(parsed.rules)) {
      return NextResponse.json(
        { error: "Distillation interrupted. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      flavor: parsed.flavor,
      voice_samples: Array.isArray(parsed.voice_samples)
        ? parsed.voice_samples.slice(0, 5)
        : [],
      rules: parsed.rules.slice(0, 5),
      boundaries: Array.isArray(parsed.boundaries)
        ? parsed.boundaries.slice(0, 3)
        : [],
    } satisfies DistillResponse);
  } catch (error) {
    console.error("Distill API error:", error);
    return NextResponse.json(
      { error: "Distillation interrupted. Please try again." },
      { status: 500 }
    );
  }
}
