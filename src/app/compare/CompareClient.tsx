"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LpBadge, TokenAvatar, cx } from "@/components/ui";
import { buildAudit, chainById, tokenById, tokens, type Token } from "@/lib/data";
import { num, pct, usd } from "@/lib/format";

const rows: { label: string; get: (t: Token) => React.ReactNode }[] = [
  { label: "Chain", get: (t) => chainById[t.chain].name },
  { label: "Market Cap", get: (t) => usd(t.mcap) },
  { label: "FDV", get: (t) => usd(t.fdv) },
  { label: "Liquidity", get: (t) => usd(t.liquidity) },
  { label: "24h Volume", get: (t) => usd(t.volume24h) },
  { label: "Holders", get: (t) => num(t.holders) },
  { label: "Holder growth", get: (t) => pct(t.holderGrowth, 1) },
  { label: "Audit score", get: (t) => `${buildAudit(t).overall}/100` },
  { label: "Contract permissions", get: (t) => `${buildAudit(t).contract.filter((c) => c.status === "fail" || c.status === "warn").length} flagged` },
  { label: "LP status", get: (t) => <LpBadge status={t.lp} /> },
  { label: "Top 10 (adjusted)", get: (t) => `${buildAudit(t).concentration[2].adjusted}%` },
  { label: "Whale activity", get: (t) => `${t.whaleActivity}/100` },
  { label: "Developer activity", get: (t) => buildAudit(t).categories.find((c) => c.key === "dev")!.score + "/100" },
  { label: "Social activity", get: (t) => `${t.social}/100` },
  { label: "Tax (buy/sell)", get: (t) => `${t.buyTax}% / ${t.sellTax}%` },
  { label: "Narrative", get: (t) => t.narrative },
];

function Picker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold outline-none focus:border-brand">
      {tokens.map((t) => (
        <option key={t.id} value={t.id}>
          {t.symbol}
        </option>
      ))}
    </select>
  );
}

export function CompareClient() {
  const params = useSearchParams();
  const [a, setA] = useState(params.get("a") ?? tokens[1].id);
  const [b, setB] = useState(params.get("b") ?? tokens[7].id);
  const ta = tokenById(a)!;
  const tb = tokenById(b)!;
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-2 gap-3 p-4">
        {[
          [ta, a, setA],
          [tb, b, setB],
        ].map(([t, v, set], i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <TokenAvatar token={t as Token} size={36} />
              <span className="font-display text-lg font-bold">{(t as Token).symbol}</span>
            </div>
            <Picker value={v as string} onChange={set as (v: string) => void} />
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
