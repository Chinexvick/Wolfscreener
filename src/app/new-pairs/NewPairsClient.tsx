"use client";

import { Globe, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useChain } from "@/components/Shell";
import { Chip, LpBadge, RiskBadge, ScoreRing, TokenAvatar, cx } from "@/components/ui";
import { chainById, tokens } from "@/lib/data";
import { age, num, price, shortAddr, usd } from "@/lib/format";

const windows = [
  ["5m", 5],
  ["15m", 15],
  ["30m", 30],
  ["1h", 60],
  ["6h", 360],
  ["24h", 1440],
] as const;

export function NewPairsClient() {
  const { chain } = useChain();
  const [win, setWin] = useState<number>(1440);
  const list = tokens
    .filter((t) => t.ageMinutes <= win && (chain === "all" || t.chain === chain))
    .sort((a, b) => a.ageMinutes - b.ageMinutes);

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {windows.map(([l, m]) => (
          <Chip key={l} active={win === m} onClick={() => setWin(m)}>
            Last {l}
          </Chip>
        ))}
      </div>
      {list.length === 0 && <div className="card p-10 text-center text-sm text-muted">No new pairs in this window yet. Try a longer window.</div>}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {list.map((t) => {
          const initial = t.liquidity * 0.55;
          return (
            <Link key={t.id} href={`/token/${t.id}`} className="card block p-4 transition hover:border-gold/60">
              <div className="flex items-center gap-3">
                <TokenAvatar token={t} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold">{t.symbol}</span>
                    <span className="rounded-full px-2 py-px text-[10px] font-bold text-white" style={{ background: chainById[t.chain].color }}>
                      {chainById[t.chain].short}
                    </span>
                    <span className="rounded-full bg-gold-soft px-2 py-px text-[10px] font-bold text-gold-ink">{age(t.ageMinutes)} old</span>
                  </div>
                  <div className="truncate font-mono text-[11px] text-muted">{shortAddr(t.address)}</div>
                </div>
                <div className="text-right">
                  <div className="tabular text-sm font-bold">{price(t.price)}</div>
                  <span className={cx("text-xs font-semibold", t.change24h >= 0 ? "text-up" : "text-down")}>{t.change24h.toFixed(1)}%</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-surface-2 p-2.5 text-[11px]">
                {[
                  ["Init. liq", usd(initial)],
                  ["Liquidity", usd(t.liquidity)],
                  ["Volume", usd(t.volume24h)],
                  ["Holders", num(t.holders)],
                  ["Buyers", num(t.buys)],
                  ["Sellers", num(t.sells)],
                  ["Tax", `${t.buyTax}/${t.sellTax}%`],
                  ["Txns", num(t.txns24h)],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div className="text-muted">{l}</div>
                    <div className="tabular font-semibold">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <LpBadge status={t.lp} />
                <RiskBadge risk={t.risk} />
                <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                  <ShieldCheck className="size-3.5 text-emerald" /> Audited
                </span>
                <span className="ml-auto flex items-center gap-2 text-muted">
                  <Globe className="size-4" />
                  <Send className="size-4" />
                  <ScoreRing score={t.auditScore} size={30} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
