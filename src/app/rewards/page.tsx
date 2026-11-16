import { Trophy } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { RewardsClient } from "./RewardsClient";

export const metadata: Metadata = { title: "Rewards & Quests" };

export default function RewardsPage() {
  return (
    <>
      <PageHeader
        icon={<Trophy className="size-7 text-brand" />}
        title="WOLF Rewards"
        subtitle="Earn XP for legitimate participation and learning — not for trading performance. Progress is saved on this device."
      />
      <RewardsClient />
    </>
  );
}
