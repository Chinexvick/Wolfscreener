import { Layers } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { NarrativesClient } from "./NarrativesClient";

export const metadata: Metadata = { title: "Narrative Radar" };

export default function NarrativesPage() {
  return (
    <>
      <PageHeader icon={<Layers className="size-7 text-accent" />} title="WOLF Narrative Radar" subtitle="Sectors detected from live volume and price action, and the tokens driving them." />
      <NarrativesClient />
    </>
  );
}
