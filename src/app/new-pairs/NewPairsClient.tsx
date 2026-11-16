"use client";

import { Globe, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useChain } from "@/components/Shell";
import { Chip, LpBadge, RiskBadge, ScoreRing, TokenAvatar, cx } from "@/components/ui";
import { chainById } from "@/lib/data";
import { useNewPairs } from "@/lib/live/client";
import { DataBadge } from "@/components/TokenTable";
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
  const m = useNewPairs();
  const [win, setWin] = useState<number>(1440);
  const [hideTiny, setHideTiny] = useState(true);
  const list = m.tokens
    .filter((t) => t.ageMinutes <= win && (chain === "all" || t.chain === chain) && (!hideTiny || t.liquidity >= 2000))
    .sort((a, b) => a.ageMinutes - b.ageMinutes);

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {windows.map(([l, mins]) => (
          <Chip key={l} active={win === mins} onClick={() => setWin(mins)}>
            Last {l}
          </Chip>
        ))}
        <Chip active={hideTiny} onClick={() => setHideTiny((v) => !v)}>
          Hide pools under $2K
        </Chip>
        <span className="ml-auto shrink-0 self-center pl-2">
          <DataBadge status={m.status} updated={m.updated} />
        </span>
      </div>
      {m.status === "loading" && <div className="card h-40 animate-pulse" />}
      {list.length === 0 && m.status !== "loading" && <div className="card p-10 text-center text-sm text-muted">No new pairs in this window yet. Try a longer window.</div>}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {list.map((t) => {
          return (
            <Link key={t.id} href={`/token/${t.id}`} className="card block p-4 transition hover:border-brand/60">
              <div className="flex items-center gap-3">
                <TokenAvatar token={t} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold">{t.symbol}</span>
                    <span className="rounded-full px-2 py-px text-[10px] font-bold text-white" style={{ background: chainById[t.chain].color }}>
                      {chainById[t.chain].short}
                    </span>
                    <span className="rounded-full bg-brand-soft px-2 py-px text-[10px] font-bold text-brand-ink">{age(t.ageMinutes)} old</span>
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
                  ["FDV", usd(t.fdv)],
                  ["Liquidity", usd(t.liquidity)],
                  ["Volume", usd(t.volume24h)],
                  ["Holders", t.holders ? num(t.holders) : "—"],
                  ["Buys 24h", num(t.buys)],
                  ["Sells 24h", num(t.sells)],
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
                  <ShieldCheck className="size-3.5 text-accent" /> {t.scanned ? "Scanned" : "Not scanned"}
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
