"use client";
import { useChain } from "@/components/Shell";

import { Activity, Clock, Droplets, Gauge, Receipt, ShoppingCart, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { DataBadge } from "@/components/TokenTable";
import { Card, TokenAvatar } from "@/components/ui";
import { BreakoutRadar } from "@/components/widgets";
import { chainById, type Token } from "@/lib/data";
import { age, usd } from "@/lib/format";
import { useTokenList } from "@/lib/live/client";

const signals: { title: string; icon: typeof Activity; metric: (t: Token) => number; fmt: (t: Token) => string }[] = [
  { title: "Volume acceleration", icon: Activity, metric: (t) => t.volumeChange, fmt: (t) => `+${t.volumeChange.toFixed(0)}% vs 24h avg` },
  { title: "Trader acceleration", icon: Users, metric: (t) => t.traderGrowth ?? 0, fmt: (t) => `+${(t.traderGrowth ?? 0).toFixed(0)}% traders` },
  { title: "Buy-pressure increase", icon: ShoppingCart, metric: (t) => t.buys / Math.max(1, t.sells), fmt: (t) => `${(t.buys / Math.max(1, t.sells)).toFixed(2)} buys per sell` },
  { title: "Price momentum (1h)", icon: TrendingUp, metric: (t) => t.change1h, fmt: (t) => `${t.change1h >= 0 ? "+" : ""}${t.change1h.toFixed(1)}% 1h` },
  { title: "Liquidity depth", icon: Droplets, metric: (t) => t.liquidity, fmt: (t) => usd(t.liquidity) },
  { title: "Fresh pools", icon: Clock, metric: (t) => -t.ageMinutes, fmt: (t) => `${age(t.ageMinutes)} old` },
  { title: "Largest average trade", icon: Receipt, metric: (t) => t.volume24h / Math.max(1, t.txns24h), fmt: (t) => `${usd(t.volume24h / Math.max(1, t.txns24h))} per trade` },
  { title: "Volume turnover", icon: Gauge, metric: (t) => t.volume24h / Math.max(1, t.liquidity), fmt: (t) => `${(t.volume24h / Math.max(1, t.liquidity)).toFixed(1)}x liquidity` },
];

export function RadarClient() {
  const m = useTokenList();
  const { chain } = useChain();
  const liquid = m.tokens.filter((t) => t.liquidity >= 25_000 && (chain === "all" || t.chain === chain));
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-3">
        <DataBadge status={m.status} updated={m.updated} />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
          {m.status === "loading" && Array.from({ length: 4 }, (_, i) => <div key={i} className="card h-44 animate-pulse" />)}
          {m.status !== "loading" &&
            signals.map(({ title, icon: Icon, metric, fmt }) => (
              <Card key={title} className="p-4">
                <h2 className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold">
                  <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand-ink">
                    <Icon className="size-4" />
                  </span>
                  {title}
                </h2>
                <ul className="space-y-1">
                  {[...liquid]
                    .sort((a, b) => metric(b) - metric(a))
                    .slice(0, 3)
                    .map((t) => (
                      <li key={t.id}>
                        <Link href={`/token/${t.id}`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-surface-2">
                          <TokenAvatar token={t} size={26} />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {t.symbol} <span className="font-normal text-muted">· {chainById[t.chain].short}</span>
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-up">{fmt(t)}</span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </Card>
            ))}
        </div>
        <p className="text-[11px] text-muted">Pools under $25K liquidity are excluded. Whale, smart-money and social signals appear once wallet-label and social data sources are connected.</p>
      </div>
      <div>
        <BreakoutRadar />
      </div>
    </div>
  );
}
