import { Newspaper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader, Change, PageHeader, TokenAvatar } from "@/components/ui";
import { AlertRow } from "@/components/widgets";
import { feed, smartWallets, tokenById, tokens } from "@/lib/data";
import { usd } from "@/lib/format";

export const metadata: Metadata = { title: "Daily Brief" };

export default function BriefPage() {
  const movers = [...tokens].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 5);
  const scoreChanges = feed.filter((a) => a.kind === "audit").slice(0, 3);
  const whales = feed.filter((a) => a.kind === "whale").slice(0, 3);
  const liq = feed.filter((a) => a.kind === "liquidity").slice(0, 3);
  const sm = smartWallets[0];
  return (
    <>
      <PageHeader
        icon={<Newspaper className="size-7 text-accent" />}
        title="WOLF AI Daily Brief"
        subtitle="Your personalized intelligence report: watchlist changes, whales, smart money, audit-score changes, liquidity and new narratives."
      />
      <Card className="mb-4 bg-gradient-to-br from-[#5b21b6] to-[#0b0712] p-5 text-white sm:mb-6">
        <div className="text-[11px] font-bold tracking-[0.14em] text-violet-300 uppercase">Today in 30 seconds</div>
        <p className="mt-2 text-sm leading-relaxed sm:text-base">
          Market activity is up with AI and DePIN leading holder growth. {movers[0].symbol} moved {movers[0].change24h.toFixed(0)}% on{" "}
          {usd(movers[0].volume24h)} volume. {sm.label} was the most active smart-money wallet. {scoreChanges.length} audit scores on tokens you watch changed
          overnight — mostly from liquidity and developer-wallet movements.
        </p>
      </Card>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="Watchlist movers" action="Watchlist" href="/watchlist" />
          <ul className="px-2 pb-2">
            {movers.map((t) => (
              <li key={t.id}>
                <Link href={`/token/${t.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                  <TokenAvatar token={t} size={28} />
                  <span className="flex-1 text-sm font-semibold">{t.symbol}</span>
                  <Change value={t.change24h} className="text-sm" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        {[
          ["Audit-score changes", scoreChanges],
          ["Whale movements", whales],
          ["Liquidity changes", liq],
        ].map(([title, list]) => (
          <Card key={title as string}>
            <CardHeader title={title as string} />
            <div className="px-2 pb-2">
              {(list as typeof feed).map((a) => (
                <AlertRow key={a.id} a={a} />
              ))}
            </div>
          </Card>
        ))}
        <Card className="md:col-span-2">
          <CardHeader title="Smart-money activity" action="Smart money" href="/smart-money" />
          <ul className="grid grid-cols-1 gap-x-6 px-4 pb-4 text-sm sm:grid-cols-2">
            {smartWallets.slice(0, 4).map((w) => (
              <li key={w.label} className="flex justify-between border-t border-line py-2">
                <span className="font-semibold text-accent">{w.label}</span>
                <span>
                  {w.recent[0].side} <b>${tokenById(w.recent[0].tokenId)!.symbol}</b> · {usd(w.recent[0].usd)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
