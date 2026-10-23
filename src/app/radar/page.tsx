import { Activity, Brain, Droplets, Fish, MessageCircle, Radar, ShoppingCart, Users, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, TokenAvatar } from "@/components/ui";
import { BreakoutRadar } from "@/components/widgets";
import { tokens, type Token } from "@/lib/data";

export const metadata: Metadata = { title: "Trend Radar" };

const signals: { title: string; icon: typeof Activity; metric: (t: Token) => number; fmt: (t: Token) => string }[] = [
  { title: "Volume acceleration", icon: Activity, metric: (t) => t.volumeChange, fmt: (t) => `+${t.volumeChange.toFixed(0)}% vol` },
  { title: "Holder acceleration", icon: Users, metric: (t) => t.holderGrowth, fmt: (t) => `+${t.holderGrowth.toFixed(1)}% holders` },
  { title: "Liquidity expansion", icon: Droplets, metric: (t) => t.liquidityChange, fmt: (t) => `+${t.liquidityChange.toFixed(1)}% liq` },
  { title: "Whale accumulation", icon: Fish, metric: (t) => t.whaleActivity, fmt: (t) => `${t.whaleActivity}/100 whale` },
  { title: "Smart-money accumulation", icon: Brain, metric: (t) => t.smartMoney, fmt: (t) => `${t.smartMoney}/100 smart` },
  { title: "New-wallet growth", icon: UserPlus, metric: (t) => t.holderGrowth * (t.ageMinutes < 10000 ? 2 : 1), fmt: (t) => `${Math.round(t.holders * t.holderGrowth / 100)} new wallets` },
  { title: "Social activity increase", icon: MessageCircle, metric: (t) => t.social, fmt: (t) => `${t.social}/100 social` },
  { title: "Buy-pressure increase", icon: ShoppingCart, metric: (t) => t.buys / (t.sells || 1), fmt: (t) => `${(t.buys / (t.sells || 1)).toFixed(2)} buy/sell` },
];

export default function RadarPage() {
  return (
    <>
      <PageHeader
        icon={<Radar className="size-7 text-emerald" />}
        title="WOLF Trend Radar"
        subtitle="Automatic detection of unusual on-chain and social activity. Informational market intelligence — not trading signals."
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
          {signals.map(({ title, icon: Icon, metric, fmt }) => (
            <Card key={title} className="p-4">
              <h2 className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold">
                <span className="grid size-8 place-items-center rounded-lg bg-gold-soft text-gold-ink">
                  <Icon className="size-4" />
                </span>
                {title}
              </h2>
              <ul className="space-y-1">
                {[...tokens]
                  .sort((a, b) => metric(b) - metric(a))
                  .slice(0, 3)
                  .map((t) => (
                    <li key={t.id}>
                      <Link href={`/token/${t.id}`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-surface-2">
                        <TokenAvatar token={t} size={26} />
                        <span className="flex-1 text-sm font-semibold">{t.symbol}</span>
                        <span className="text-xs font-semibold text-up">{fmt(t)}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
        </div>
        <div>
          <BreakoutRadar />
        </div>
      </div>
    </>
  );
}
