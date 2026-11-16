"use client";

import { Flame } from "lucide-react";
import { useApi } from "@/lib/live/client";
import type { Category, GlobalStats, TrendingCoin } from "@/lib/live/coingecko";
import { pct, price, usd } from "@/lib/format";
import { Card, CardHeader, Change } from "./ui";

export const useGlobalStats = () => useApi<GlobalStats>("/api/cg/global", 180_000);
export const useCategories = () => useApi<Category[]>("/api/cg/categories", 300_000);

function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-4 pb-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3">
          <div className="size-7 rounded-full bg-surface-3" />
          <div className="h-3 flex-1 rounded bg-surface-3" />
          <div className="h-3 w-12 rounded bg-surface-3" />
        </div>
      ))}
    </div>
  );
}

export function CgTrending({ limit = 7 }: { limit?: number }) {
  const { data, loading, unavailable } = useApi<TrendingCoin[]>("/api/cg/trending", 180_000);
  return (
    <Card>
      <CardHeader icon={<Flame className="size-4 text-down" />} title="Trending on CoinGecko" />
      {loading ? (
        <Skeleton />
      ) : unavailable || !data ? (
        <p className="px-4 pb-4 text-sm text-muted">CoinGecko is rate limiting right now. This refreshes automatically.</p>
      ) : (
        <ul className="px-2 pb-2">
          {data.slice(0, limit).map((c, i) => (
            <li key={c.id}>
              <a href={`https://www.coingecko.com/en/coins/${c.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                <span className="w-3 text-xs font-semibold text-muted">{i + 1}</span>
                <img src={c.image} alt="" width={28} height={28} loading="lazy" referrerPolicy="no-referrer" className="size-7 rounded-full bg-surface-3 object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{c.symbol}</span>
                  <span className="block truncate text-[11px] text-muted">{c.name}{c.rank ? ` · #${c.rank}` : ""}</span>
                </span>
                <span className="text-right text-xs">
                  {c.price !== null && <span className="tabular block font-semibold">{price(c.price)}</span>}
                  {c.change24h !== null && <Change value={c.change24h} />}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function GlobalStatsRow() {
  const { data, loading } = useGlobalStats();
  if (loading) return <div className="mx-4 h-14 animate-pulse rounded-xl bg-surface-3" />;
  if (!data) return null;
  return (
    <div className="grid grid-cols-3 gap-2 px-4">
      <div>
        <div className="text-[11px] text-muted">Global Mkt Cap</div>
        <div className="tabular font-display text-lg font-bold">{usd(data.marketCap)}</div>
        <Change value={data.marketCapChange24h} className="text-xs" />
      </div>
      <div>
        <div className="text-[11px] text-muted">24h Volume</div>
        <div className="tabular font-display text-lg font-bold">{usd(data.volume24h)}</div>
      </div>
      <div>
        <div className="text-[11px] text-muted">BTC Dominance</div>
        <div className="tabular font-display text-lg font-bold">{pct(data.btcDominance, 1).replace("+", "")}</div>
        <div className="text-xs text-muted">ETH {data.ethDominance.toFixed(1)}%</div>
      </div>
    </div>
  );
}
