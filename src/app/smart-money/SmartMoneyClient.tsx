"use client";

import { UserPlus, UserCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ChainDot, cx } from "@/components/ui";
import { smartWallets, tokenById } from "@/lib/data";
import { num, shortAddr, usd } from "@/lib/format";

export function SmartMoneyClient() {
  const [following, setFollowing] = useState<string[]>([]);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[...smartWallets]
        .sort((a, b) => b.pnl30d - a.pnl30d)
        .map((w, i) => {
          const on = following.includes(w.label);
          return (
            <div key={w.label} className="card p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-emerald to-[#0a3a1d] font-display text-sm font-bold text-gold">
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/wallet?address=${encodeURIComponent(w.label)}`} className="font-display font-bold text-emerald hover:underline">
                    {w.label}
                  </Link>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
                    {shortAddr(w.address)} <ChainDot chain={w.chain} label />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFollowing(on ? following.filter((x) => x !== w.label) : [...following, w.label])}
                  className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", on ? "bg-emerald-soft text-emerald" : "bg-gold text-black")}
                >
                  {on ? <UserCheck className="size-3.5" /> : <UserPlus className="size-3.5" />}
                  {on ? "Following" : "Follow"}
                </button>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-surface-2 p-2.5 text-[11px]">
                <div>
                  <div className="text-muted">30d P&L</div>
                  <div className={cx("font-bold", w.pnl30d >= 0 ? "text-up" : "text-down")}>{w.pnl30d >= 0 ? "+" : "-"}{usd(Math.abs(w.pnl30d))}</div>
                </div>
                <div>
                  <div className="text-muted">Win rate</div>
                  <div className="font-bold">{w.winRate.toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-muted">Value</div>
                  <div className="font-bold">{usd(w.value)}</div>
                </div>
                <div>
                  <div className="text-muted">Followers</div>
                  <div className="font-bold">{num(w.followers)}</div>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs">
                {w.recent.slice(0, 4).map((r, k) => {
                  const t = tokenById(r.tokenId)!;
                  return (
                    <li key={k} className="flex items-center justify-between">
                      <span>
                        <span className={cx("font-bold", r.side === "Bought" ? "text-up" : "text-down")}>{r.side}</span>{" "}
                        <Link href={`/token/${t.id}`} className="font-semibold hover:underline">
                          ${t.symbol}
                        </Link>
                      </span>
                      <span>
                        <b>{usd(r.usd)}</b> <span className="text-muted">· {r.when}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
    </div>
  );
}
