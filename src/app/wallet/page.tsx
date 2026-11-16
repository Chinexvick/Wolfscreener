import { Wallet } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { WalletClient } from "./WalletClient";

export const metadata: Metadata = { title: "Wallet Intelligence" };

export default function WalletPage() {
  return (
    <>
      <PageHeader
        icon={<Wallet className="size-7 text-accent" />}
        title="Wallet Intelligence"
        subtitle="Connect your wallet to see your holdings, or look up any address. Read-only, always."
      />
      <Suspense fallback={<div className="card h-24 animate-pulse" />}>
        <WalletClient />
      </Suspense>
    </>
  );
}
