import { Layers } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, Change, PageHeader, TokenAvatar } from "@/components/ui";
import { narratives, tokens } from "@/lib/data";
import { usd } from "@/lib/format";

export const metadata: Metadata = { title: "Narrative Radar" };

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

export default function NarrativesPage() {
  const rows = narratives
    .map((n) => {
      const ts = tokens.filter((t) => t.narrative === n).sort((a, b) => b.volume24h - a.volume24h);
      return {
        n,
        ts,
        change: ts.reduce((a, t) => a + t.change24h, 0) / (ts.length || 1),
        vol: ts.reduce((a, t) => a + t.volume24h, 0),
        mcap: ts.reduce((a, t) => a + t.mcap, 0),
        holders: ts.reduce((a, t) => a + t.holderGrowth, 0) / (ts.length || 1),
      };
    })
    .sort((a, b) => b.change - a.change);
  return (
    <>
      <PageHeader icon={<Layers className="size-7 text-accent" />} title="WOLF Narrative Radar" subtitle="Emerging sectors detected from volume, holder growth and social momentum — and the tokens driving them." />
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
                <div className="text-muted">Holders</div>
                <b className={r.holders >= 0 ? "text-up" : "text-down"}>{r.holders.toFixed(1)}%</b>
              </div>
            </div>
            <ul className="mt-3 space-y-1">
              {r.ts.slice(0, 4).map((t) => (
                <li key={t.id}>
                  <Link href={`/token/${t.id}`} className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-surface-2">
                    <TokenAvatar token={t} size={22} />
                    <span className="flex-1 font-semibold">{t.symbol}</span>
                    <Change value={t.change24h} className="text-xs" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
