"use client";
import { useChain } from "@/components/Shell";

import { UserCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { ChainDot, cx } from "@/components/ui";
import { DataBadge } from "@/components/TokenTable";
import { track } from "@/lib/activity";
import { useAlertRules } from "@/lib/alerts";
import { explorerAddressUrl } from "@/lib/live/config";
import { useWhales } from "@/lib/live/client";
import { ago } from "@/lib/live/feed";
import { useLocal } from "@/lib/local";
import { shortAddr, usd } from "@/lib/format";
import type { WhaleMove } from "@/lib/live/tokens";

interface Agg {
  wallet: string;
  chain: WhaleMove["token"]["chain"];
  buys: number;
  sells: number;
  count: number;
  last: number;
  moves: WhaleMove[];
}

function aggregate(moves: WhaleMove[]): Agg[] {
  const by = new Map<string, Agg>();
  for (const m of moves) {
    const k = `${m.token.chain}:${m.trade.wallet}`;
    const a = by.get(k) ?? { wallet: m.trade.wallet, chain: m.token.chain, buys: 0, sells: 0, count: 0, last: 0, moves: [] };
    if (m.trade.kind === "buy") a.buys += m.trade.usd;
    else a.sells += m.trade.usd;
    a.count++;
    a.last = Math.max(a.last, m.trade.at);
    a.moves.push(m);
    by.set(k, a);
  }
  return [...by.values()].filter((a) => a.wallet).sort((a, b) => b.buys + b.sells - (a.buys + a.sells));
}

export function SmartMoneyClient() {
  const { moves: all, loading } = useWhales();
  const { chain } = useChain();
  const moves = all.filter((m) => chain === "all" || m.token.chain === chain);
  const [saved, setSaved] = useLocal<{ addr: string; name: string }[]>("wolf-saved-wallets", []);
  const { add, remove, rules } = useAlertRules();
  const wallets = aggregate(moves).slice(0, 30);

  const follow = (a: Agg, on: boolean) => {
    if (on) {
      setSaved((s) => s.filter((x) => x.addr !== a.wallet));
      for (const r of rules.filter((r) => r.trigger === "wallet" && r.wallet?.toLowerCase() === a.wallet.toLowerCase())) remove(r.id);
      return;
    }
    setSaved((s) => [...s.filter((x) => x.addr !== a.wallet), { addr: a.wallet, name: shortAddr(a.wallet) }]);
    track("follow", a.wallet);
    for (const t of [...new Map(a.moves.map((m) => [m.token.id, m.token])).values()].slice(0, 3)) {
      add({ tokenId: t.id, symbol: t.symbol, image: t.image, trigger: "wallet", threshold: 0, wallet: a.wallet, push: false });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <DataBadge status={loading ? "loading" : moves.length ? "live" : "demo"} updated={null} />
        <span>Wallets are ranked by trade volume across the largest pools right now. Following a wallet saves it and alerts you when it trades again.</span>
      </div>
      {loading && <div className="card h-40 animate-pulse" />}
      {!loading && wallets.length === 0 && <div className="card p-4 text-sm text-muted">No large trades could be loaded right now. This refreshes automatically.</div>}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3">
        {wallets.map((w, i) => {
          const on = saved.some((x) => x.addr === w.wallet);
          const net = w.buys - w.sells;
          return (
            <div key={`${w.chain}:${w.wallet}`} className="card p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-[#5b21b6] to-[#0b0712] font-display text-sm font-bold text-violet-300">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/wallet?address=${encodeURIComponent(w.wallet)}`} className="-my-1 inline-block max-w-full truncate py-1 font-mono font-bold text-accent hover:underline">
                    {shortAddr(w.wallet)}
                  </Link>
                  <div className="flex items-center gap-2 text-[11px] text-muted">
                    <ChainDot chain={w.chain} label />
                    <a href={explorerAddressUrl(w.chain, w.wallet)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Explorer
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => follow(w, on)}
                  className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", on ? "bg-accent-soft text-accent" : "bg-brand text-white")}
                >
                  {on ? <UserCheck className="size-3.5" /> : <UserPlus className="size-3.5" />}
                  {on ? "Following" : "Follow"}
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-2.5 text-[11px]">
                <div>
                  <div className="text-muted">Bought</div>
                  <div className="font-bold text-up">{usd(w.buys)}</div>
                </div>
                <div>
                  <div className="text-muted">Sold</div>
                  <div className="font-bold text-down">{usd(w.sells)}</div>
                </div>
                <div>
                  <div className="text-muted">Net flow</div>
                  <div className={cx("font-bold", net >= 0 ? "text-up" : "text-down")}>
                    {net >= 0 ? "+" : "-"}
                    {usd(Math.abs(net))}
                  </div>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs">
                {w.moves.slice(0, 4).map((m) => (
                  <li key={m.trade.tx} className="flex items-center justify-between gap-2">
                    <span>
                      <span className={cx("font-bold", m.trade.kind === "buy" ? "text-up" : "text-down")}>{m.trade.kind === "buy" ? "Bought" : "Sold"}</span>{" "}
                      <Link href={`/token/${m.token.id}`} className="-my-1.5 inline-block py-1.5 font-semibold hover:underline">
                        ${m.token.symbol}
                      </Link>
                    </span>
                    <span>
                      <b>{usd(m.trade.usd)}</b> <span className="text-muted">· {ago(m.trade.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
