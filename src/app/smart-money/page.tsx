import { Brain } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SmartMoneyClient } from "./SmartMoneyClient";

export const metadata: Metadata = { title: "Smart Money" };

export default function SmartMoneyPage() {
  return (
    <>
      <PageHeader
        icon={<Brain className="size-7 text-accent" />}
        title="WOLF Smart Money"
        subtitle="Follow notable wallets: what they buy, sell and hold, with P&L where calculable. Wallet intelligence — not copy trading."
      />
      <SmartMoneyClient />
    </>
  );
}
