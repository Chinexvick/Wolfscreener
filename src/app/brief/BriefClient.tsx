"use client";

import Link from "next/link";
import { DataBadge } from "@/components/TokenTable";
import { Card, CardHeader, Change, TokenAvatar } from "@/components/ui";
import { AlertRow } from "@/components/widgets";
import { usd } from "@/lib/format";
import { useFeed, useTokenList } from "@/lib/live/client";
import { useWatchlist } from "@/lib/watchlist";

export function BriefClient() {
  const m = useTokenList();
  const { feed } = useFeed();
  const { ids } = useWatchlist();
  if (m.status === "loading") return <div className="card h-64 animate-pulse" />;
  const liquid = m.tokens.filter((t) => t.liquidity >= 25_000);
  const watched = m.tokens.filter((t) => ids.includes(t.id));
  const movers = [...(watched.length ? watched : liquid)].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 5);
  const risks = feed.filter((a) => a.kind === "audit").slice(0, 4);
  const whales = feed.filter((a) => a.kind === "whale").slice(0, 4);
  const fresh = feed.filter((a) => a.kind === "holders").slice(0, 4);
  const volume = liquid.reduce((a, t) => a + t.volume24h, 0);
  const lead = [...liquid].sort((a, b) => b.change24h - a.change24h)[0];
  const scanned = m.tokens.filter((t) => t.scanned);
  const flagged = scanned.filter((t) => t.auditScore < 52).length;

  return (
    <>
      <Card className="mb-4 bg-gradient-to-br from-[#5b21b6] to-[#0b0712] p-5 text-white sm:mb-6">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold tracking-[0.14em] text-violet-300 uppercase">Today in 30 seconds</div>
          <DataBadge status={m.status} updated={m.updated} />
        </div>
        <p className="mt-2 text-sm leading-relaxed sm:text-base">
          WOLF is tracking {liquid.length} liquid pools with {usd(volume)} of 24h volume. {lead ? `${lead.symbol} leads gainers at ${lead.change24h.toFixed(0)}% on ${usd(lead.liquidity)} liquidity.` : ""} Of {scanned.length}{" "}
          tokens with a full contract scan, {flagged} score below 52 (high risk). {whales.length ? `${whales.length} large trades were just detected.` : ""}
        </p>
      </Card>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title={watched.length ? "Watchlist movers" : "Biggest movers"} action="Watchlist" href="/watchlist" />
          {!watched.length && <p className="px-4 pb-2 text-xs text-muted">Star tokens to personalise this brief. Showing the biggest liquid movers meanwhile.</p>}
          <ul className="px-2 pb-2">
            {movers.map((t) => (
              <li key={t.id}>
                <Link href={`/token/${t.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                  <TokenAvatar token={t} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t.symbol}</span>
                  <Change value={t.change24h} className="text-sm" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        {[
          ["Risk flags", risks, "No risk flags right now."],
          ["Large trades", whales, "No large trades in the latest window."],
          ["New pools", fresh, "No new liquid pools in the last hours."],
        ].map(([title, list, empty]) => (
          <Card key={title as string}>
            <CardHeader title={title as string} />
            <div className="px-2 pb-2">
              {(list as typeof feed).length === 0 && <p className="px-2 pb-2 text-sm text-muted">{empty as string}</p>}
              {(list as typeof feed).map((a) => (
                <AlertRow key={a.id} a={a} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
