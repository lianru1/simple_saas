"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { CREDITS_TIERS } from "@/config/subscriptions";
import { ProductTier } from "@/types/subscriptions";

interface PricingSectionProps {
  className?: string;
}

export function PricingSection({ className }: PricingSectionProps) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handlePurchase = async (tier: ProductTier) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive",
      });
      router.push("/sign-in");
      return;
    }

    setIsProcessing(tier.id);

    try {
      const response = await fetch("/api/creem/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: tier.productId,
          productType: "credits",
          userId: user.id,
          credits: tier.creditAmount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { checkoutUrl } = await response.json();

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <section id="pricing" className={`w-full py-24 ${className}`}>
      <div className="container px-4 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground text-balance">
            You get 3 free distillations.
            <br />
            Need more? Grab a few credits.
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Credits are skmint&rsquo;s currency. Distill a persona (3 credits),
            chat with one (10 messages / credit), or unlock a draw-mode mind
            (creator&rsquo;s price). No subscription &mdash; pay for what you use.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-4xl mx-auto">
          {CREDITS_TIERS.map((tier, index) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              index={index}
              isProcessing={isProcessing}
              onPurchase={handlePurchase}
            />
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Credits never expire. Use them whenever you&rsquo;re ready to mint
          something new.
        </p>
      </div>
    </section>
  );
}

function PricingCard({
  tier,
  index,
  isProcessing,
  onPurchase,
}: {
  tier: ProductTier;
  index: number;
  isProcessing: string | null;
  onPurchase: (tier: ProductTier) => void;
}) {
  const priceNum = tier.creditAmount
    ? parseFloat(tier.priceMonthly.replace("$", ""))
    : 0;
  const perCredit = tier.creditAmount
    ? (priceNum / tier.creditAmount).toFixed(2)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative"
    >
      <Card
        className={`h-full flex flex-col ${
          tier.featured
            ? "border-primary shadow-lg scale-105 z-10"
            : "border-border"
        }`}
      >
        {tier.featured && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary px-3 py-1">Best Value</Badge>
          </div>
        )}

        <CardHeader>
          <CardTitle className="text-xl">{tier.name}</CardTitle>
          <CardDescription>{tier.description}</CardDescription>
          <div className="mt-4">
            <span className="text-4xl font-bold">{tier.priceMonthly}</span>
            <span className="text-muted-foreground ml-1 text-sm">
              one-time
            </span>
          </div>
          {perCredit && (
            <p className="text-xs text-muted-foreground mt-1">${perCredit}/credit</p>
          )}
        </CardHeader>

        <CardContent className="flex-1">
          <ul className="space-y-2.5">
            {tier.features?.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            variant={tier.featured ? "default" : "outline"}
            onClick={() => onPurchase(tier)}
            disabled={isProcessing === tier.id}
          >
            {isProcessing === tier.id ? "Redirecting..." : `Get ${tier.creditAmount} Credits`}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
