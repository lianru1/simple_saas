"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PricingSection } from "@/components/pricing-section";
import { useUser } from "@/hooks/use-user";
import heroIllustration from "@/public/images/页面装饰图.png";
import step1Gather from "@/public/images/区配图1-gather.png";
import step2Age from "@/public/images/区配图2-age.png";
import step3Bottle from "@/public/images/区配图3-Minted​.png";

// 共享动画配置
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function Home() {
  const { user } = useUser();

  const ctaHref = user ? "/brew" : "/sign-in";
  const ctaLabel = user ? "Start brewing" : "Get started";

  const steps = [
    {
      step: 1,
      image: step1Gather,
      title: "Share your story",
      body: "Notebooks, voice memos, hard-won lessons — the raw stuff that made you who you are.",
    },
    {
      step: 2,
      image: step2Age,
      title: "Distill the essence",
      body: "AI reads your material and finds the patterns — your style, your rules, your voice. You guide it.",
    },
    {
      step: 3,
      image: step3Bottle,
      title: "Let the world taste it",
      body: "Share a link. Your persona talks like you, thinks like you. Host it or sell it — you decide.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero ── */}
      <section className="relative py-24 md:py-36 overflow-hidden">
        {/* Hero background illustration */}
        <motion.div
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <Image
            src={heroIllustration}
            alt=""
            fill
            className="object-cover opacity-25 dark:opacity-20"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
        </motion.div>

        <div className="container px-4 md:px-6 relative">
          <motion.div
            className="flex flex-col items-center text-center max-w-2xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-balance"
              variants={fadeUp}
            >
              Distill your expertise.
              <br />
              Share your spirit.
            </motion.h1>
            <motion.p
              className="mt-6 text-lg text-muted-foreground max-w-lg text-pretty"
              variants={fadeUp}
            >
              Everyone has a way of thinking, a set of rules they live by, a
              voice nobody else has. Mint yours.
            </motion.p>
            <motion.div
              className="flex flex-col items-center gap-3 mt-8"
              variants={fadeUp}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Link href={ctaHref}>
                    <Button size="lg" className="h-11 px-8 gap-2 group">
                      {ctaLabel}{" "}
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Link href="#how-it-works">
                    <Button variant="outline" size="lg" className="h-11 px-8">
                      How it works
                    </Button>
                  </Link>
                </motion.div>
              </div>
              <p className="text-sm text-muted-foreground">
                {user
                  ? "Your minted minds are waiting. Pick up where you left off."
                  : "Start free. 3 credits included. No credit card required."}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 border-t">
        <div className="container px-4 md:px-6">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-center text-foreground text-balance mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Your mind, minted. Three steps.
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                className="flex flex-col items-center text-center group"
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={cardReveal}
              >
                <span className="text-xs font-medium text-accent mb-4 uppercase tracking-wider">
                  Step {s.step}
                </span>
                {/* 图片容器：品牌色叠加 + 内阴影柔边 → 融入背景 */}
                <div className="relative w-full aspect-square mb-6">
                  <Image
                    src={s.image}
                    alt={s.title}
                    fill
                    className="object-contain transition-all duration-500
                      group-hover:scale-105
                      opacity-90 dark:opacity-85"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* 内边缘渐变遮罩 — 四周渐隐到背景色 */}
                  <div className="absolute inset-0 pointer-events-none
                    [background:radial-gradient(circle_at_center,transparent_60%,oklch(var(--background)/1)_95%)]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
                  {s.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why ── */}
      <section className="py-24 border-t">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            This isn&apos;t a template. It&apos;s you.
          </motion.h2>

          <motion.div
            className="space-y-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            <motion.div className="md:flex gap-12 items-start" variants={fadeUp}>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  It sounds like you, not a help desk
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your persona carries your phrases, your humor, your
                  contradictions. The things you always say. The way you say
                  them. Not some corporate &quot;How may I assist you today?&quot;
                </p>
              </div>
              <div className="flex-1 mt-6 md:mt-0">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  With your boundaries baked in
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  You decide what it will and won&apos;t do. Where your knowledge
                  ends, it admits it. No pretending, no hallucinating authority.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Your experience has value
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-lg">
                The big platforms sell access to generic AI. You sell access to
                you — decades of intuition, judgment, and stories that only
                exist in your head. We handle the tech and payments.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t">
        <div className="container px-4 md:px-6 text-center">
          {user ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-4">
                Pick up where you left off.
              </h2>
              <p className="text-muted-foreground mb-8">
                Your minted minds are waiting. Ready to brew another?
              </p>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="inline-block"
              >
                <Link href="/brew">
                  <Button size="lg" className="h-11 px-8 gap-2 group">
                    Continue brewing{" "}
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-4">
                Your story is worth minting.
              </h2>
              <p className="text-muted-foreground mb-8">
                Start free. 3 distillations included. No credit card required.
              </p>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="inline-block"
              >
                <Link href="/sign-in">
                  <Button size="lg" className="h-11 px-8 gap-2 group">
                    Get started{" "}
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Pricing ── */}
      <PricingSection />
    </div>
  );
}
