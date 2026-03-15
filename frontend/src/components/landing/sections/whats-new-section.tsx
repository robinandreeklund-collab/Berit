"use client";

import MagicBento, { type BentoCardProps } from "@/components/ui/magic-bento";
import { cn } from "@/lib/utils";

import { Section } from "../section";

const COLOR = "#0a0a0a";
const features: BentoCardProps[] = [
  {
    color: COLOR,
    label: "Kontextdesign",
    title: "Lång- och korttidsminne",
    description: "Nu kan agenten förstå dig bättre",
  },
  {
    color: COLOR,
    label: "Långa uppgifter",
    title: "Planering och deluppgifter",
    description:
      "Planerar, resonerar genom komplexitet, och exekverar sekventiellt eller parallellt",
  },
  {
    color: COLOR,
    label: "Utbyggbar",
    title: "Färdigheter och verktyg",
    description:
      "Koppla in, byt ut eller anpassa inbyggda verktyg. Bygg agenten du vill ha.",
  },

  {
    color: COLOR,
    label: "Persistent",
    title: "Sandlåda med filsystem",
    description: "Läs, skriv, kör — som en riktig dator",
  },
  {
    color: COLOR,
    label: "Flexibel",
    title: "Stöd för flera modeller",
    description: "Nemotron, DeepSeek, OpenAI, Gemini m.fl.",
  },
  {
    color: COLOR,
    label: "Gratis",
    title: "Öppen källkod",
    description: "MIT-licens, egen hosting, full kontroll",
  },
];

export function WhatsNewSection({ className }: { className?: string }) {
  return (
    <Section
      className={cn("", className)}
      title="Nyheter i Berit 2.0"
      subtitle="Berit utvecklas från en djupforskningsagent till en fullfjädrad superagent"
    >
      <div className="flex w-full items-center justify-center">
        <MagicBento data={features} />
      </div>
    </Section>
  );
}
