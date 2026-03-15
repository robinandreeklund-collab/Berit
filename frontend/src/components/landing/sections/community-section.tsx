"use client";

import { GitHubLogoIcon } from "@radix-ui/react-icons";
import Link from "next/link";

import { AuroraText } from "@/components/ui/aurora-text";
import { Button } from "@/components/ui/button";

import { Section } from "../section";

export function CommunitySection() {
  return (
    <Section
      title={
        <AuroraText colors={["#60A5FA", "#A5FA60", "#A560FA"]}>
          Gå med i communityn
        </AuroraText>
      }
      subtitle="Bidra med briljanta idéer för att forma framtiden för Berit. Samarbeta, innovera och gör skillnad."
    >
      <div className="flex justify-center">
        <Button className="text-xl" size="lg" asChild>
          <Link
            href="https://github.com/robinandreeklund-collab/Berit"
            target="_blank"
          >
            <GitHubLogoIcon />
            Bidra nu
          </Link>
        </Button>
      </div>
    </Section>
  );
}
