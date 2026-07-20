"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BREW_CREDIT_COST } from "@/config/subscriptions";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required"
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect("success", "/dashboard", "Thanks for signing up!");
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/dashboard/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed"
    );
  }

  encodedRedirect("success", "/dashboard/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

/**
 * createSkill — 完成酝酿，将 Skill 存入数据库
 *
 * 接收风味档案和铁律，关联当前用户，写入 skills 表。
 * 每次蒸馏消耗 1 积分（新用户注册赠送 3 积分）。
 * 成功后跳转到品鉴页 /skill/[id]
 */
export const createSkillAction = async (formData: FormData) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/sign-in", "Please sign in to create a persona.");
  }

  const name = formData.get("name")?.toString();
  const flavor = formData.get("flavor")?.toString();
  const voiceSamplesJson = formData.get("voice_samples")?.toString();
  const rulesJson = formData.get("rules")?.toString();
  const boundariesJson = formData.get("boundaries")?.toString();
  const material = formData.get("material")?.toString();
  const mode = formData.get("mode")?.toString() || "host";
  const quotaTotal = parseInt(formData.get("quota_total")?.toString() || "50", 10);
  const priceCredits = parseInt(formData.get("price_credits")?.toString() || "0", 10);

  if (!name || !flavor || !rulesJson) {
    return encodedRedirect(
      "error",
      "/brew",
      "Name, flavor profile, and brewing rules are required."
    );
  }

  let rules: string[];
  try {
    rules = JSON.parse(rulesJson);
    if (!Array.isArray(rules) || rules.length === 0) {
      throw new Error("Rules must be a non-empty array");
    }
  } catch {
    return encodedRedirect("error", "/brew", "Invalid brewing rules format. Please try again.");
  }

  let voice_samples: string[] = [];
  if (voiceSamplesJson) {
    try {
      voice_samples = JSON.parse(voiceSamplesJson);
      if (!Array.isArray(voice_samples)) voice_samples = [];
    } catch {
      voice_samples = [];
    }
  }

  let boundaries: string[] = [];
  if (boundariesJson) {
    try {
      boundaries = JSON.parse(boundariesJson);
      if (!Array.isArray(boundaries)) boundaries = [];
    } catch {
      boundaries = [];
    }
  }

  // 校验 mode
  if (mode !== "host" && mode !== "draw") {
    return encodedRedirect("error", "/brew", "Invalid business model selection.");
  }

  // 校验数值范围
  if (quotaTotal < 10 || quotaTotal > 500) {
    return encodedRedirect("error", "/brew", "Free tasting quota must be between 10 and 500.");
  }
  if (priceCredits < 0 || priceCredits > 100) {
    return encodedRedirect("error", "/brew", "Price must be between 0 and 100 credits.");
  }

  // ── 积分检查与扣减（原子操作：WHERE credits >= cost 防竞态）──
  const { data: customer } = await supabase
    .from("customers")
    .select("id, credits")
    .eq("user_id", user.id)
    .single();

  if (!customer || customer.credits < BREW_CREDIT_COST) {
    return encodedRedirect(
      "error",
      "/brew",
      `Not enough credits. Bottling a persona costs ${BREW_CREDIT_COST} credits. You have ${customer?.credits ?? 0}. Get more credits to continue.`
    );
  }

  // 原子扣减：只有余额 ≥ 扣减额时才执行更新
  const { data: deducted, error: deductError } = await supabase
    .from("customers")
    .update({ credits: customer.credits - BREW_CREDIT_COST })
    .eq("id", customer.id)
    .gte("credits", BREW_CREDIT_COST)
    .select("credits")
    .single();

  if (deductError || !deducted) {
    console.error("Failed to deduct credits:", deductError);
    return encodedRedirect("error", "/brew", "Failed to process credits. Please try again.");
  }

  // 记录积分流水
  await supabase.from("credits_history").insert({
    customer_id: customer.id,
    amount: BREW_CREDIT_COST,
    type: "subtract",
    description: `Brewed persona: ${name}`,
  });

  const { data: skill, error } = await supabase
    .from("skills")
    .insert({
      user_id: user.id,
      name,
      flavor,
      voice_samples,
      rules,
      boundaries,
      material: material || null,
      mode,
      quota_total: quotaTotal,
      price_credits: priceCredits,
    })
    .select("id")
    .single();

  if (error || !skill) {
    console.error("Failed to create skill:", error);
    return encodedRedirect("error", "/brew", "Failed to complete the brew. Please try again.");
  }

  return redirect(`/skill/${skill.id}`);
};

/**
 * deleteSkill — 删除用户自己的 Skill
 */
export const deleteSkillAction = async (skillId: string) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/sign-in", "Please sign in.");
  }

  const { error } = await supabase
    .from("skills")
    .delete()
    .eq("id", skillId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete skill:", error);
    return encodedRedirect("error", "/dashboard", "Failed to delete persona.");
  }

  revalidatePath("/dashboard");
  return redirect("/dashboard");
};

