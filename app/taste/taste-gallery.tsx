"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SkillTasteCard } from "@/components/taste/skill-taste-card";
import type { Skill } from "@/types/skill";

const cardReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

type Filter = "all" | "host" | "draw";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "host", label: "Host" },
  { key: "draw", label: "Draw" },
];

interface TasteGalleryProps {
  skills: Skill[];
}

export function TasteGallery({ skills }: TasteGalleryProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all" ? skills : skills.filter((s) => s.mode === filter);

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300
              ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          No personas found in this category yet.
        </p>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          {filtered.map((skill) => (
            <motion.div key={skill.id} variants={cardReveal}>
              <SkillTasteCard skill={skill} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
