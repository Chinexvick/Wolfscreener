"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { track } from "@/lib/activity";
import { LpBadge, TokenAvatar, cx } from "@/components/ui";
import { chainById, type Token } from "@/lib/data";
import { useTokenList } from "@/lib/live/client";
import { num, pct, usd } from "@/lib/format";

const rows: { label: string; get: (t: Token) => React.ReactNode }[] = [
  { label: "Chain", get: (t) => chainById[t.chain].name },
  { label: "Market Cap", get: (t) => usd(t.mcap) },
  { label: "FDV", get: (t) => usd(t.fdv) },
  { label: "Liquidity", get: (t) => usd(t.liquidity) },
  { label: "24h Volume", get: (t) => usd(t.volume24h) },
  { label: "Holders", get: (t) => (t.holders ? num(t.holders) : "n/a") },
  { label: "Trader growth (1h)", get: (t) => pct(t.traderGrowth ?? t.holderGrowth, 0) },
  { label: "Price 24h", get: (t) => pct(t.change24h, 1) },
  { label: "Audit score", get: (t) => `${t.auditScore}/100` },
  { label: "Contract flags", get: (t) => (t.contractFlags === undefined ? "Not scanned" : `${t.contractFlags} flagged`) },
  { label: "LP status", get: (t) => <LpBadge status={t.lp} /> },
  { label: "Top 10 holders (adjusted)", get: (t) => (t.top10Pct === undefined ? "n/a" : `${t.top10Pct}%`) },
  { label: "Tax (buy/sell)", get: (t) => `${t.buyTax}% / ${t.sellTax}%` },
  { label: "Narrative", get: (t) => t.narrative },
];

function Picker({ value, onChange, list }: { value: string; onChange: (v: string) => void; list: Token[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold outline-none focus:border-brand">
      {list.map((t) => (
        <option key={t.id} value={t.id}>
          {t.symbol} · {chainById[t.chain].short}
        </option>
      ))}
    </select>
  );
}

export function CompareClient() {
  const params = useSearchParams();
  const market = useTokenList();
  const list = [...market.tokens].sort((x, y) => y.liquidity - x.liquidity).slice(0, 80);
  const [pickA, setA] = useState(params.get("a") ?? "");
  const [pickB, setB] = useState(params.get("b") ?? "");
  if (market.status === "loading" || list.length < 2) return <div className="card h-64 animate-pulse" />;
  const a = list.some((t) => t.id === pickA) ? pickA : list[0].id;
  const b = list.some((t) => t.id === pickB) ? pickB : list[1].id;
  const ta = list.find((t) => t.id === a)!;
  const tb = list.find((t) => t.id === b)!;
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-2 gap-3 p-4">
        {[
          [ta, a, (v: string) => (setA(v), track("compare", `${v}:${b}`))],
          [tb, b, (v: string) => (setB(v), track("compare", `${a}:${v}`))],
        ].map(([t, v, set], i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <TokenAvatar token={t as Token} size={36} />
              <span className="font-display text-lg font-bold">{(t as Token).symbol}</span>
            </div>
            <Picker list={list} value={v as string} onChange={set as (v: string) => void} />
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
      <table className="w-full table-fixed text-xs sm:text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.label} className={cx("border-t border-line", i % 2 === 1 && "bg-surface-2")}>
              <th className="w-[34%] px-3 py-2.5 text-left text-xs font-semibold text-muted sm:px-4">{r.label}</th>
              <td className="tabular px-2 py-2.5 font-semibold break-words">{r.get(ta)}</td>
              <td className="tabular px-2 py-2.5 font-semibold break-words sm:px-4">{r.get(tb)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <p className="border-t border-line p-4 text-xs text-muted">WOLF never declares a winner. Compare the underlying data and make your own decision.</p>
    </div>
  );
}
