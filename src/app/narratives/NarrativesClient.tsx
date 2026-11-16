"use client";

import Link from "next/link";
import { DataBadge } from "@/components/TokenTable";
import { Card, Change, TokenAvatar } from "@/components/ui";
import { narratives } from "@/lib/data";
import { usd } from "@/lib/format";
import { median } from "@/lib/stats";
import { useTokenList } from "@/lib/live/client";

const blurbs: Record<string, string> = {
  AI: "Agents, inference networks and AI tooling.",
  Memes: "Community-driven tokens and culture coins.",
  DeFi: "Lending, DEXs, yield and on-chain finance.",
  RWA: "Tokenized real-world assets and credit.",
  DePIN: "Decentralized physical infrastructure networks.",
  Gaming: "On-chain games and gaming economies.",
  Infra: "L1/L2s, data availability and tooling.",
  Social: "SocialFi and creator economies.",
};

export function NarrativesClient() {
  const m = useTokenList();
  if (m.status === "loading") return <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="card h-64 animate-pulse" />)}</div>;
  const liquid = m.tokens.filter((t) => t.liquidity >= 25_000);
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
    <div className="space-y-3">
      <DataBadge status={m.status} updated={m.updated} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((r, i) => (
          <Card key={r.n} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold text-muted">#{i + 1}</div>
                <h2 className="font-display text-xl font-extrabold">{r.n}</h2>
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
      <p className="text-[11px] text-muted">Sectors are inferred from token names and symbols, so they are approximate. Medians use pools above $25K liquidity, so single pumps do not skew a sector.</p>
    </div>
  );
}
