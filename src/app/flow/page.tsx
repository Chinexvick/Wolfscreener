import { Waves } from "lucide-react";
import type { Metadata } from "next";
import { Columns, PressureBar } from "@/components/charts";
import { Card, CardHeader, PageHeader, TokenAvatar } from "@/components/ui";
import { chains, rng, tokens } from "@/lib/data";
import { usd } from "@/lib/format";

export const metadata: Metadata = { title: "WOLF Flow" };

export default function FlowPage() {
  const r = rng(77);
  const hours = Array.from({ length: 24 }, () => ({ a: 40 + r() * 100, b: 30 + r() * 90 }));
  const sums = (k: "buys" | "sells") => tokens.reduce((a, t) => a + t[k], 0);
  const flows = [
    { title: "Buy vs sell pressure", buy: sums("buys"), sell: sums("sells"), labels: ["Buy", "Sell"] as [string, string] },
    { title: "Liquidity flow", buy: 62, sell: 38, labels: ["Added", "Removed"] as [string, string] },
    { title: "Whale flow", buy: 57, sell: 43, labels: ["Accumulating", "Distributing"] as [string, string] },
    { title: "Smart-money flow", buy: 64, sell: 36, labels: ["Inflow", "Outflow"] as [string, string] },
    { title: "Holder flow", buy: 71, sell: 29, labels: ["New holders", "Exited"] as [string, string] },
    { title: "Exchange flow (identified)", buy: 44, sell: 56, labels: ["Withdrawals", "Deposits"] as [string, string] },
  ];
  return (
    <>
      <PageHeader icon={<Waves className="size-7 text-accent" />} title="WOLF Flow" subtitle="Where money, liquidity and holders are moving right now — across the market and per chain." />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 lg:grid-cols-3">
        {flows.map((f) => (
          <Card key={f.title} className="p-4">
            <h2 className="mb-3 font-display text-[15px] font-bold">{f.title}</h2>
            <PressureBar buy={f.buy} sell={f.sell} labels={f.labels} />
          </Card>
        ))}
        <Card className="lg:col-span-2">
          <CardHeader title="Hourly buy (green) vs sell (red) volume" />
          <div className="px-4 pb-4">
            <Columns data={hours} height={160} labels={["00", "", "", "", "", "", "06", "", "", "", "", "", "12", "", "", "", "", "", "18", "", "", "", "", "23"]} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Net flow by chain" />
          <ul className="space-y-2.5 px-4 pb-4">
            {chains.map((c, i) => {
              const v = (r() - 0.35) * 40_000_000;
              return (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="flex-1 font-semibold">{c.name}</span>
                  <span className={v >= 0 ? "font-bold text-up" : "font-bold text-down"} data-i={i}>
                    {v >= 0 ? "+" : "-"}
                    {usd(Math.abs(v))}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader title="Strongest token inflows" />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-3 px-4 pb-4 md:grid-cols-2">
            {[...tokens]
              .sort((a, b) => b.buys / (b.sells || 1) - a.buys / (a.sells || 1))
              .slice(0, 8)
              .map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <TokenAvatar token={t} size={28} />
                  <span className="w-14 text-sm font-bold">{t.symbol}</span>
                  <div className="flex-1">
                    <PressureBar buy={t.buys} sell={t.sells} />
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </>
  );
}
