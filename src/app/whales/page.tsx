import { Fish } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { WhalesClient } from "./WhalesClient";

export const metadata: Metadata = { title: "Whale Radar" };

export default function WhalesPage() {
  return (
    <>
      <PageHeader
        icon={<Fish className="size-7 text-brand" />}
        title="WOLF Whale Radar"
        subtitle="Large trades on the most active pools, as they happen. Tap an alert to investigate the token."
      />
      <WhalesClient />
    </>
  );
}
