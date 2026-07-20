import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SubscriptionStatusCard } from "@/components/dashboard/subscription-status-card";
import { CreditsBalanceCard } from "@/components/dashboard/credits-balance-card";
import { SkillCard } from "@/components/dashboard/skill-card";
import { Plus } from "lucide-react";
import type { Skill } from "@/types/skill";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Check Auth User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // 2. Fetch Customer Data (Credits, Subscription)
  const { data: customerData } = await supabase
    .from("customers")
    .select(
      `
      *,
      subscriptions (
        status,
        current_period_end,
        creem_product_id
      ),
      credits_history (
        amount,
        type,
        created_at
      )
    `
    )
    .eq("user_id", user.id)
    .single();

  const subscription = customerData?.subscriptions?.[0];
  const credits = customerData?.credits || 0;
  const recentCreditsHistory = customerData?.credits_history?.slice(0, 2) || [];

  // 3. Fetch User's Skills
  const { data: skills } = await supabase
    .from("skills")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 w-full flex flex-col gap-6 sm:gap-8 px-4 sm:px-8 container">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border rounded-lg p-6 sm:p-8 mt-6 sm:mt-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
          Welcome back, {customerData?.name || user.email?.split("@")[0]}
        </h1>
        <p className="text-muted-foreground">
          Your personas, your credits, your legacy.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CreditsBalanceCard credits={credits} recentHistory={recentCreditsHistory} />
        <SubscriptionStatusCard subscription={subscription} />
      </div>

      {/* Skills Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Your Minted Minds
          </h2>
          <Button asChild size="sm" className="gap-1">
            <Link href="/brew">
              <Plus className="w-4 h-4" /> Mint Another
            </Link>
          </Button>
        </div>

        {skills && skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill as Skill} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20">
            <p className="mb-3">
              You haven&rsquo;t minted any minds yet.
            </p>
            <p className="text-sm text-muted-foreground/60 mb-6 max-w-md">
              Every experience is worth preserving. Distill your knowledge into
              an AI persona the world can talk to.
            </p>
            <Button asChild>
              <Link href="/brew">Mint Your First Persona</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
