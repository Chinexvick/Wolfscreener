import { Newspaper } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { BriefClient } from "./BriefClient";

export const metadata: Metadata = { title: "Daily Brief" };

export default function BriefPage() {
  return (
    <>
      <PageHeader
        icon={<Newspaper className="size-7 text-accent" />}
        title="WOLF AI Daily Brief"
        subtitle="A live intelligence report: movers, risk flags, large trades and new pools. It becomes personal once you follow tokens."
      />
      <BriefClient />
    </>
  );
}
