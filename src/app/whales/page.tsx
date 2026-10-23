import { Fish } from "lucide-react";
import type { Metadata } from "next";
import { PressureBar } from "@/components/charts";
import { Card, CardHeader, PageHeader, TokenAvatar } from "@/components/ui";
import { AlertFeed } from "@/components/widgets";
import { tokens } from "@/lib/data";
import { usd } from "@/lib/format";

export const metadata: Metadata = { title: "Whale Radar" };

export default function WhalesPage() {
  const accum = [...tokens].sort((a, b) => b.whaleActivity - a.whaleActivity).slice(0, 8);
  return (
    <>
      <PageHeader
        icon={<Fish className="size-7 text-brand" />}
        title="WOLF Whale Radar"
        subtitle="Real-time whale buys, transfers, accumulation and distribution. Tap any alert to investigate the wallet and token."
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <AlertFeed limit={14} kinds={["whale", "smart", "liquidity"]} title="Live whale feed" />
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader title="Whale net flow by token (24h)" />
            <ul className="space-y-3 px-4 pb-4">
              {accum.map((t) => (
                <li key={t.id} className="flex items-center gap-3">
                  <TokenAvatar token={t} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-bold">{t.symbol}</span>
                      <span className="text-muted">{usd(t.volume24h * (t.whaleActivity / 300))} whale vol</span>
                    </div>
                    <PressureBar buy={t.whaleActivity} sell={100 - t.whaleActivity + 20} labels={["Accum.", "Distrib."]} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4 text-sm text-muted">
            Whale = wallet holding or moving more than 0.5% of circulating supply or $100K+. Exchange-associated wallets are identified from
            labeled deposit addresses where available.
          </Card>
        </div>
      </div>
    </>
  );
}
