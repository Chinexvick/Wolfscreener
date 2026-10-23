import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { AuditClient } from "./AuditClient";

export const metadata: Metadata = { title: "WOLF AI Audit" };

export default function AuditPage() {
  return (
    <>
      <PageHeader
        icon={<ShieldCheck className="size-7 text-accent" />}
        title="WOLF AI Audit"
        subtitle="Enter any supported token contract. WOLF AI produces a continuously updated professional audit with evidence and an explainable score."
      />
      <Suspense fallback={<div className="card h-32 animate-pulse" />}>
        <AuditClient />
      </Suspense>
    </>
  );
}
