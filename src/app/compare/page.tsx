import { Swords } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { CompareClient } from "./CompareClient";

export const metadata: Metadata = { title: "Token Battles" };

export default function ComparePage() {
  return (
    <>
      <PageHeader icon={<Swords className="size-7 text-brand" />} title="WOLF Token Battles" subtitle="Side-by-side comparison of market, audit, liquidity, holder and developer data." />
      <Suspense fallback={<div className="card h-64 animate-pulse" />}>
        <CompareClient />
      </Suspense>
    </>
  );
}
