import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { NewPairsClient } from "./NewPairsClient";

export const metadata: Metadata = { title: "New Pairs" };

export default function NewPairsPage() {
  return (
    <>
      <PageHeader
        icon={<Sparkles className="size-7 text-gold" />}
        title="WOLF New Pairs"
        subtitle="Newly created pairs with initial vs current liquidity, LP status, taxes, contract risk and audit status — the moment they appear."
      />
      <NewPairsClient />
    </>
  );
}
