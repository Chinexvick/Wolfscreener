"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useCategories } from "@/components/cg";
import { Chip } from "@/components/ui";
import { Sparkline } from "@/components/ui";
import { Change } from "@/components/ui";
import { pct, price, usd } from "@/lib/format";
import { useApi } from "@/lib/live/client";
import type { Coin } from "@/lib/live/coingecko";

const quick = [
  ["", "Top 50"],
  ["artificial-intelligence", "AI"],
  ["meme-token", "Memes"],
  ["decentralized-finance-defi", "DeFi"],
  ["real-world-assets-rwa", "RWA"],
  ["depin", "DePIN"],
  ["gaming", "Gaming"],
  ["layer-1", "Layer 1"],
  ["layer-2", "Layer 2"],
] as const;

export function ProjectsClient() {
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const { data, loading, unavailable } = useApi<Coin[]>(`/api/cg/coins?category=${category}&page=${page}`, 180_000);
  const cats = useCategories();
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter((c) => !s || c.name.toLowerCase().includes(s) || c.symbol.toLowerCase().includes(s));
  }, [data, q]);

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {quick.map(([id, label]) => (
          <Chip
            key={id || "top"}
            active={category === id}
            onClick={() => {
              setCategory(id);
              setPage(1);
            }}
          >
            {label}
          </Chip>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name or symbol…" className="h-10 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm outline-none focus:border-brand" />
        </div>
        <select
          value={quick.some(([id]) => id === category) ? "" : category}
          onChange={(e) => {
            if (e.target.value) {
              setCategory(e.target.value);
              setPage(1);
            }
          }}
          className="h-10 rounded-full border border-line bg-surface px-4 text-sm"
          aria-label="More categories"
        >
          <option value="">More categories…</option>
          {(cats.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-muted sm:ml-auto">Live from CoinGecko. Verification badges need WOLF review and are not shown yet.</span>
      </div>

      {loading && <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="card h-28 animate-pulse" />)}</div>}
      {unavailable && !data && <p className="card p-5 text-sm text-muted">CoinGecko is rate limiting right now. This page refreshes automatically.</p>}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <a key={c.id} href={`https://www.coingecko.com/en/coins/${c.id}`} target="_blank" rel="noreferrer" className="card block p-4 transition hover:border-brand/60">
            <div className="flex items-center gap-3">
              <img src={c.image} alt="" width={40} height={40} loading="lazy" referrerPolicy="no-referrer" className="size-10 rounded-full bg-surface-3 object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display font-bold">{c.name}</div>
                <div className="text-xs text-muted">
                  {c.symbol}
                  {c.rank ? ` · Rank #${c.rank}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="tabular text-sm font-bold">{price(c.price)}</div>
                <Change value={c.change24h} className="text-xs" />
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3 rounded-xl bg-surface-2 p-2.5 text-[11px]">
              <div className="space-y-0.5">
                <div>
                  <span className="text-muted">Mkt cap </span>
                  <b>{usd(c.marketCap)}</b>
                </div>
                <div>
                  <span className="text-muted">Volume </span>
                  <b>{usd(c.volume24h)}</b>
                </div>
                <div>
                  <span className="text-muted">7d </span>
                  <b className={c.change7d >= 0 ? "text-up" : "text-down"}>{pct(c.change7d, 1)}</b>
                </div>
              </div>
              {c.spark.length > 3 && <Sparkline data={c.spark} width={110} height={34} />}
            </div>
          </a>
        ))}
      </div>
      {data && data.length >= 50 && (
        <div className="flex justify-center gap-2">
          <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold disabled:opacity-40">
            Previous
          </button>
          <span className="self-center text-sm text-muted">Page {page}</span>
          <button type="button" onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
