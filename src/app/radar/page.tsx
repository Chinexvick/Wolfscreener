import { Radar } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { RadarClient } from "./RadarClient";

export const metadata: Metadata = { title: "Trend Radar" };

export default function RadarPage() {
  return (
    <>
      <PageHeader
        icon={<Radar className="size-7 text-accent" />}
        title="WOLF Trend Radar"
        subtitle="Automatic detection of unusual on-chain activity from live pools. Informational market intelligence, not trading signals."
      />
      <RadarClient />
    </>
  );
}
