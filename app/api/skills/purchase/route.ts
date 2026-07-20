import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

/**
 * POST /api/skills/purchase
 *
 * Draw 模式买断：用积分一次性购买 Skill 的永久访问权和下载权。
 *
 * Request:  { skillId: string }
 * Response: { success: true } | error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillId } = body;

    if (!skillId) {
      return NextResponse.json({ error: "Missing skillId" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to purchase." },
        { status: 401 }
      );
    }

    const serviceClient = createServiceRoleClient();

    // 1. 查询 Skill
    const { data: skill, error: skillError } = await serviceClient
      .from("skills")
      .select("*")
      .eq("id", skillId)
      .single();

    if (skillError || !skill) {
      return NextResponse.json({ error: "Skill not found." }, { status: 404 });
    }

    if (skill.mode !== "draw") {
      return NextResponse.json(
        { error: "This persona is not available for purchase." },
        { status: 400 }
      );
    }

    if (skill.user_id === user.id) {
      return NextResponse.json(
        { error: "You can't purchase your own persona." },
        { status: 400 }
      );
    }

    // 2. 检查是否已购买
    const { data: existingPurchase } = await serviceClient
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("skill_id", skillId)
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json(
        { error: "You already own this persona." },
        { status: 409 }
      );
    }

    // 3. 检查积分余额
    const { data: customer } = await serviceClient
      .from("customers")
      .select("id, credits")
      .eq("user_id", user.id)
      .single();

    if (!customer || customer.credits < skill.price_credits) {
      return NextResponse.json(
        {
          error: `Not enough credits. This persona costs ${skill.price_credits} credits. You have ${customer?.credits ?? 0}.`,
        },
        { status: 402 }
      );
    }

    // 4. 原子扣积分（WHERE credits >= price 防竞态）
    const { data: deducted, error: deductError } = await serviceClient
      .from("customers")
      .update({ credits: customer.credits - skill.price_credits })
      .eq("id", customer.id)
      .gte("credits", skill.price_credits)
      .select("credits")
      .single();

    if (deductError || !deducted) {
      console.error("Failed to deduct credits:", deductError);
      return NextResponse.json(
        { error: "Failed to process payment. Please try again." },
        { status: 500 }
      );
    }

    // 5. 记录购买
    const { error: purchaseError } = await serviceClient
      .from("purchases")
      .insert({
        user_id: user.id,
        skill_id: skillId,
        price_credits: skill.price_credits,
      });

    if (purchaseError) {
      console.error("Failed to record purchase:", purchaseError);
      return NextResponse.json(
        { error: "Failed to record purchase. Please try again." },
        { status: 500 }
      );
    }

    // 6. 记录积分流水（含 skill_id 用于分成统计）
    await serviceClient.from("credits_history").insert({
      customer_id: customer.id,
      amount: skill.price_credits,
      type: "subtract",
      description: `Purchased: ${skill.name}`,
      skill_id: skillId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Purchase API error:", error);
    return NextResponse.json(
      { error: "Purchase service is temporarily unavailable." },
      { status: 500 }
    );
  }
}
