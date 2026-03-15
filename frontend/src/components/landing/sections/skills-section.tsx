"use client";

import { cn } from "@/lib/utils";

import ProgressiveSkillsAnimation from "../progressive-skills-animation";
import { Section } from "../section";

export function SkillsSection({ className }: { className?: string }) {
  return (
    <Section
      className={cn("h-[calc(100vh-64px)] w-full bg-white/2", className)}
      title="Agentfärdigheter"
      subtitle={
        <div>
          Agentfärdigheter laddas progressivt — bara det som behövs, när det
          behövs.
          <br />
          Utöka Berit med egna färdighetsfiler eller använd det inbyggda
          biblioteket.
        </div>
      }
    >
      <div className="relative overflow-hidden">
        <ProgressiveSkillsAnimation />
      </div>
    </Section>
  );
}
