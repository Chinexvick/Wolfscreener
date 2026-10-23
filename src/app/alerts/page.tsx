import { Bell } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { AlertsClient } from "./AlertsClient";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <>
      <PageHeader
        icon={<Bell className="size-7 text-gold" />}
        title="WOLF Alerts"
        subtitle="Alerts for whales, developers, liquidity, contract and tax changes, minting, burns and score changes. Delivered in-app, by push, Telegram or email."
      />
      <AlertsClient />
    </>
  );
}
