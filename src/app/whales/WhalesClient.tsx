"use client";

import { PressureBar } from "@/components/charts";
import { DataBadge } from "@/components/TokenTable";
import { Card, CardHeader, TokenAvatar } from "@/components/ui";
import { AlertRow } from "@/components/widgets";
import type { Token } from "@/lib/data";
import { usd } from "@/lib/format";
import { useFeed, useWhales } from "@/lib/live/client";

export function WhalesClient() {
  const { feed, status, updated, loading } = useFeed();
  const w = useWhales();
  const moves = feed.filter((a) => a.kind === "whale");
  const byToken = new Map<string, { token: Token; buy: number; sell: number }>();
  for (const m of w.moves) {
    const e = byToken.get(m.token.id) ?? { token: m.token, buy: 0, sell: 0 };
    if (m.trade.kind === "buy") e.buy += m.trade.usd;
    else e.sell += m.trade.usd;
    byToken.set(m.token.id, e);
  }
  const flows = [...byToken.values()].sort((a, b) => b.buy + b.sell - (a.buy + a.sell)).slice(0, 8);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader title="Live large trades" />
        <div className="-mt-1 px-4 pb-2">
          <DataBadge status={status} updated={updated} />
        </div>
        {loading || w.loading ? (
          <div className="space-y-3 px-4 pb-4">{Array.from({ length: 5 }, (_, i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-surface-3" />)}</div>
        ) : moves.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted">No large trades in the latest window. This feed refreshes every minute.</p>
        ) : (
          <div className="px-2 pb-2">
            {moves.map((a) => (
              <AlertRow key={a.id} a={a} />
            ))}
          </div>
        )}
      </Card>
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader title="Large-trade flow by token" />
          {flows.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-muted">Waiting for large trades.</p>
          ) : (
            <ul className="space-y-3 px-4 pb-4">
              {flows.map(({ token, buy, sell }) => (
                <li key={token.id} className="flex items-center gap-3">
                  <TokenAvatar token={token} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-bold">{token.symbol}</span>
                      <span className="text-muted">{usd(buy + sell)} large trades</span>
                    </div>
                    <PressureBar buy={buy} sell={sell} labels={["Bought", "Sold"]} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-4 text-sm text-muted">
          A large trade is a single swap of $5K or more (or 0.4% of a pool&apos;s liquidity) on one of the 8 highest-volume pools. Wallet labels such as exchange or fund wallets need a labeling provider and
          are not shown yet.
        </Card>
      </div>
    </div>
  );
}
