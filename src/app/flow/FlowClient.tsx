"use client";

import { PressureBar } from "@/components/charts";
import { DataBadge } from "@/components/TokenTable";
import { Card, CardHeader, TokenAvatar } from "@/components/ui";
import { chains } from "@/lib/data";
import { usd } from "@/lib/format";
import { useTokenList, useWhales } from "@/lib/live/client";
import Link from "next/link";

export function FlowClient() {
  const m = useTokenList();
  const w = useWhales();
  if (m.status === "loading") return <div className="card h-64 animate-pulse" />;
  const t = m.tokens.filter((x) => x.liquidity >= 10_000);
  const buys = t.reduce((a, x) => a + x.buys, 0);
  const sells = t.reduce((a, x) => a + x.sells, 0);
  const whaleBuy = w.moves.filter((x) => x.trade.kind === "buy").reduce((a, x) => a + x.trade.usd, 0);
  const whaleSell = w.moves.filter((x) => x.trade.kind === "sell").reduce((a, x) => a + x.trade.usd, 0);
  const up = t.filter((x) => x.change24h > 0).length;
  const perChain = chains
    .map((c) => {
      const ts = t.filter((x) => x.chain === c.id);
      return { c, buys: ts.reduce((a, x) => a + x.buys, 0), sells: ts.reduce((a, x) => a + x.sells, 0), vol: ts.reduce((a, x) => a + x.volume24h, 0) };
    })
    .filter((r) => r.buys + r.sells > 0)
    .sort((a, b) => b.vol - a.vol);
  const strongest = [...t].filter((x) => x.txns24h > 200).sort((a, b) => b.buys / Math.max(1, b.sells) - a.buys / Math.max(1, a.sells)).slice(0, 8);

  return (
    <div className="space-y-4 sm:space-y-6">
      <DataBadge status={m.status} updated={m.updated} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="p-4">
          <h2 className="mb-3 font-display text-[15px] font-bold">Buy vs sell pressure (24h transactions)</h2>
          <PressureBar buy={buys} sell={sells} labels={["Buys", "Sells"]} />
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 font-display text-[15px] font-bold">Large-trade flow</h2>
          {w.loading ? <div className="h-8 animate-pulse rounded bg-surface-3" /> : whaleBuy + whaleSell > 0 ? <PressureBar buy={whaleBuy} sell={whaleSell} labels={[`Large buys ${usd(whaleBuy)}`, `Large sells ${usd(whaleSell)}`]} /> : <p className="text-sm text-muted">No large trades in the latest window.</p>}
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 font-display text-[15px] font-bold">Market breadth (24h)</h2>
          <PressureBar buy={up} sell={t.length - up} labels={[`Rising ${up}`, `Falling ${t.length - up}`]} />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Buy vs sell by chain" />
          <ul className="space-y-3 px-4 pb-4">
            {perChain.map(({ c, buys: b, sells: s, vol }) => (
              <li key={c.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <span className="text-muted">{usd(vol)} volume</span>
                </div>
                <PressureBar buy={b} sell={s} labels={["Buys", "Sells"]} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Strongest buy pressure" />
          <ul className="px-2 pb-2">
            {strongest.map((x) => (
              <li key={x.id}>
                <Link href={`/token/${x.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                  <TokenAvatar token={x} size={26} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{x.symbol}</span>
                  <span className="text-xs font-semibold text-up">{(x.buys / Math.max(1, x.sells)).toFixed(2)}x</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <p className="text-[11px] text-muted">Liquidity, smart-money, holder and exchange flows need an on-chain indexer and wallet labels. They are added when those keys are connected.</p>
    </div>
  );
}
