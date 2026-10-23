import { ScanSearch } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ScreenerClient } from "./ScreenerClient";

export const metadata: Metadata = { title: "Multi-Chain Screener" };

export default function ScreenerPage() {
  return (
    <>
      <PageHeader
        icon={<ScanSearch className="size-7 text-accent" />}
        title="Multi-Chain Screener"
        subtitle="Filter tokens across Ethereum, BNB Chain, Solana, Base, TON, Arbitrum, Polygon, Avalanche and Sui. Save your own screening conditions."
      />
      <ScreenerClient />
    </>
  );
}
