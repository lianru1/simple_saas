"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import type { Skill } from "@/types/skill";

interface SkillTasteCardProps {
  skill: Skill;
}

export function SkillTasteCard({ skill }: SkillTasteCardProps) {
  return (
    <Card
      className="group relative overflow-hidden border-border/60 bg-card
        hover:border-primary/40 hover:shadow-md transition-all duration-500
        flex flex-col"
    >
      {/* Top accent — cooper's hoop motif */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5
          bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      />

      <div className="flex flex-col flex-1 p-5">
        {/* Name + mode badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className="font-semibold text-foreground text-base leading-snug
              group-hover:text-primary transition-colors duration-300"
          >
            {skill.name}
          </h3>
          <Badge
            variant={skill.mode === "draw" ? "default" : "secondary"}
            className="shrink-0 text-[10px] px-2 py-0.5"
          >
            {skill.mode === "draw" ? "Draw" : "Host"}
          </Badge>
        </div>

        {/* Flavor excerpt — like a tasting note */}
        <p
          className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-2 mb-4
            italic"
        >
          &ldquo;{skill.flavor}&rdquo;
        </p>

        {/* Stats row */}
        <div
          className="mt-auto flex items-center justify-between text-[11px] text-muted-foreground/70"
        >
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60
                group-hover:bg-primary group-hover:scale-125 transition-all duration-300"
            />
            {skill.quota_used}/{skill.quota_total} tastings
          </span>
          {skill.mode === "draw" ? (
            <span className="font-medium text-primary/90 tabular-nums">
              {skill.price_credits} credits
            </span>
          ) : (
            <span className="font-normal text-muted-foreground/50">Free</span>
          )}
        </div>

        {/* CTA — hover reveal */}
        <div
          className="mt-4 pt-4 border-t border-border/40
            opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
            transition-all duration-300"
        >
          <Link href={`/skill/${skill.id}`} className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs h-8
                border-primary/30 hover:border-primary/60
                bg-transparent hover:bg-primary/10
                text-foreground hover:text-primary
                transition-all duration-300"
            >
              Taste
              <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover/button:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
