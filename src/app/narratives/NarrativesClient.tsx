"use client";

import Link from "next/link";
import { useCategories } from "@/components/cg";
import { useChain } from "@/components/Shell";
import { DataBadge } from "@/components/TokenTable";
import { Card, Change, TokenAvatar } from "@/components/ui";
import { narratives } from "@/lib/data";
import { usd } from "@/lib/format";
import { useTokenList } from "@/lib/live/client";
import { median } from "@/lib/stats";

const blurbs: Record<string, string> = {
  AI: "Agents, inference networks and AI tooling.",
  Memes: "Community-driven tokens and culture coins.",
  DeFi: "Lending, DEXs, yield, stablecoins and staking.",
  RWA: "Tokenized real-world assets and credit.",
  DePIN: "Decentralized physical infrastructure networks.",
  Gaming: "On-chain games and gaming economies.",
  Infra: "L1/L2s, data availability and tooling.",
  Social: "SocialFi and creator economies.",
};

export function NarrativesClient() {
  const m = useTokenList();
  const cats = useCategories();
  const { chain } = useChain();
  const scoped = chain === "all" ? m.tokens : m.tokens.filter((t) => t.chain === chain);
  const liquid = scoped.filter((t) => t.liquidity >= 25_000);
  const rows = narratives
    .map((n) => {
      const ts = liquid.filter((t) => t.narrative === n).sort((a, b) => b.volume24h - a.volume24h);
      return {
        n,
        ts,
        change: median(ts.map((t) => t.change24h)),
        vol: ts.reduce((a, t) => a + t.volume24h, 0),
        mcap: ts.reduce((a, t) => a + t.mcap, 0),
        traders: median(ts.map((t) => t.traderGrowth ?? 0)),
      };
    })
    .filter((r) => r.ts.length > 0)
    .sort((a, b) => b.change - a.change);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Sector performance</h2>
          <span className="text-[11px] text-muted">CoinGecko categories · 24h market-cap change</span>
        </div>
        {cats.loading && <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="card h-24 animate-pulse" />)}</div>}
        {!cats.loading && !cats.data && <p className="card p-4 text-sm text-muted">CoinGecko is rate limiting right now. Sector data refreshes automatically.</p>}
        {cats.data && (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[...cats.data].sort((a, b) => b.change24h - a.change24h).slice(0, 16).map((c) => (
              <a key={c.id} href={`https://www.coingecko.com/en/categories/${c.id}`} target="_blank" rel="noreferrer" className="card block p-3.5 transition hover:border-brand/60">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 text-sm leading-tight font-bold">{c.name}</h3>
                  <Change value={c.change24h} className="shrink-0 text-sm" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                  <span>Mkt cap {usd(c.marketCap)}</span>
                  <span className="flex -space-x-1.5">
                    {c.topCoins.slice(0, 3).map((src) => (
                      <img key={src} src={src} alt="" width={20} height={20} loading="lazy" referrerPolicy="no-referrer" className="size-5 rounded-full bg-surface-3 ring-2 ring-surface" />
                    ))}
                  </span>
                </div>
                <div className="text-[11px] text-muted">Vol {usd(c.volume24h)}</div>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">On-chain pools by sector</h2>
          <DataBadge status={m.status} updated={m.updated} />
        </div>
        {m.status === "loading" ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="card h-64 animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-4">
            {rows.map((r, i) => (
              <Card key={r.n} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-muted">#{i + 1}</div>
                    <h3 className="font-display text-xl font-extrabold">{r.n}</h3>
                  </div>
                  <Change value={r.change} className="text-sm" />
                </div>
                <p className="mt-1 text-xs text-muted">{blurbs[r.n]}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-2.5 text-[11px]">
                  <div>
                    <div className="text-muted">Mkt cap</div>
                    <b>{usd(r.mcap)}</b>
                  </div>
                  <div>
                    <div className="text-muted">Volume</div>
                    <b>{usd(r.vol)}</b>
                  </div>
                  <div>
                    <div className="text-muted">Traders</div>
                    <b className={r.traders >= 0 ? "text-up" : "text-down"}>{r.traders.toFixed(0)}%</b>
                  </div>
                </div>
                <ul className="mt-3 space-y-1">
                  {r.ts.slice(0, 4).map((t) => (
                    <li key={t.id}>
                      <Link href={`/token/${t.id}`} className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-surface-2">
                        <TokenAvatar token={t} size={22} />
                        <span className="min-w-0 flex-1 truncate font-semibold">{t.symbol}</span>
                        <Change value={t.change24h} className="text-xs" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted">Pool sectors are inferred from token names, so they are approximate. Medians use pools above $25K liquidity.</p>
      </section>
    </div>
  );
}
