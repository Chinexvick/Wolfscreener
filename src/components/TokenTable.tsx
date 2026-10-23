"use client";

import { ChevronLeft, ChevronRight, Eye, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { narratives, tokens as allTokens, type Narrative, type Token } from "@/lib/data";
import { age, num, price, usd } from "@/lib/format";
import { useLiveTokens, type LiveToken } from "@/lib/live";
import { useWatchlist } from "@/lib/watchlist";
import { useChain } from "./Shell";
import { Change, ChainDot, Chip, PromotedTag, RiskBadge, ScoreRing, TokenAvatar, VerifiedBadge, cx } from "./ui";

export const tableTabs = {
  gainers: { label: "Top Gainers", sort: (a: Token, b: Token) => b.change24h - a.change24h },
  trending: { label: "Trending", sort: (a: Token, b: Token) => b.volume24h * (1 + b.social / 100) - a.volume24h * (1 + a.social / 100) },
  volume: { label: "Volume Surge", sort: (a: Token, b: Token) => b.volumeChange - a.volumeChange },
  liquidity: { label: "Liquidity Surge", sort: (a: Token, b: Token) => b.liquidityChange - a.liquidityChange },
  holders: { label: "Holder Growth", sort: (a: Token, b: Token) => b.holderGrowth - a.holderGrowth },
  new: { label: "New", sort: (a: Token, b: Token) => a.ageMinutes - b.ageMinutes },
  wolf: { label: "WOLF Score", sort: (a: Token, b: Token) => b.wolfScore - a.wolfScore },
} as const;

export type TabKey = keyof typeof tableTabs;

function WatchButton({ id }: { id: string }) {
  const { has, toggle } = useWatchlist();
  const on = has(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggle(id);
      }}
      aria-label={on ? "Remove from watchlist" : "Add to watchlist"}
      className="grid size-8 place-items-center rounded-full hover:bg-surface-3"
    >
      <Star className={cx("size-4", on ? "fill-brand text-brand" : "text-muted")} />
    </button>
  );
}

function Row({ t, rank }: { t: LiveToken; rank: number | null }) {
  const flash = t.tick === "up" ? "flash-up" : t.tick === "down" ? "flash-down" : "";
  return (
    <tr className={cx("border-t border-line transition hover:bg-surface-2", rank === null && "bg-brand-soft/40")}>
      <td className="py-3 pl-4 text-xs font-semibold text-muted">{rank ?? <PromotedTag />}</td>
      <td className="py-3 pr-3">
        <Link href={`/token/${t.id}`} className="flex items-center gap-3">
          <TokenAvatar token={t} size={34} />
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-sm font-bold">
              {t.symbol}
              {t.verified && <VerifiedBadge className="size-3.5" />}
            </span>
            <span className="flex items-center gap-1.5 truncate text-xs text-muted">
              {t.name} <ChainDot chain={t.chain} />
            </span>
          </span>
        </Link>
      </td>
      <td className={cx("tabular px-3 text-sm font-semibold", flash)}>{price(t.price)}</td>
      <td className="px-3 text-sm">
        <Change value={t.change24h} />
      </td>
      <td className="tabular px-3 text-sm">{usd(t.liquidity)}</td>
      <td className="tabular px-3 text-sm">{usd(t.volume24h)}</td>
      <td className="tabular px-3 text-sm">{usd(t.mcap)}</td>
      <td className="tabular px-3 text-sm">{num(t.txns24h)}</td>
      <td className="tabular px-3 text-xs text-muted">{age(t.ageMinutes)}</td>
      <td className="px-3">
        <RiskBadge risk={t.risk} />
      </td>
      <td className="px-3">
        <ScoreRing score={t.wolfScore} size={34} label="WOLF Score" />
      </td>
      <td className="pr-3">
        <div className="flex items-center justify-end">
          <WatchButton id={t.id} />
          <Link href={`/token/${t.id}`} aria-label="View token" className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-3">
            <Eye className="size-4" />
          </Link>
          <Link href={`/token/${t.id}?tab=audit`} aria-label="AI audit" className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-3">
            <ShieldCheck className="size-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

function MobileCard({ t, rank }: { t: LiveToken; rank: number | null }) {
  const flash = t.tick === "up" ? "flash-up" : t.tick === "down" ? "flash-down" : "";
  return (
    <Link href={`/token/${t.id}`} className={cx("block border-t border-line px-4 py-3 active:bg-surface-2", rank === null && "bg-brand-soft/40")}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <TokenAvatar token={t} size={40} />
          {rank !== null && (
            <span className="absolute -top-1 -left-1 grid size-4 place-items-center rounded-full bg-ink text-[9px] font-bold text-bg">{rank}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-bold">{t.symbol}</span>
            {t.verified && <VerifiedBadge className="size-3.5" />}
            {rank === null && <PromotedTag />}
          </div>
          <div className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted">
            <ChainDot chain={t.chain} label /> · {age(t.ageMinutes)} · <RiskBadgeInline risk={t.risk} />
          </div>
        </div>
        <div className={cx("rounded-md px-1 text-right", flash)}>
          <div className="tabular text-sm font-bold">{price(t.price)}</div>
          <Change value={t.change24h} className="text-xs" />
        </div>
        <ScoreRing score={t.wolfScore} size={36} label="WOLF Score" />
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[11px]">
        <div>
          <div className="text-muted">Liquidity</div>
          <div className="tabular font-semibold">{usd(t.liquidity)}</div>
        </div>
        <div>
          <div className="text-muted">Volume 24h</div>
          <div className="tabular font-semibold">{usd(t.volume24h)}</div>
        </div>
        <div>
          <div className="text-muted">Mkt Cap</div>
          <div className="tabular font-semibold">{usd(t.mcap)}</div>
        </div>
      </div>
    </Link>
  );
}

function RiskBadgeInline({ risk }: { risk: Token["risk"] }) {
  return <span className={cx("font-semibold", risk === "Low" ? "text-up" : risk === "Medium" ? "text-warn" : "text-down")}>{risk} risk</span>;
}

export function TokenTable({
  source = allTokens,
  defaultTab = "gainers",
  tabs = ["gainers", "trending", "volume", "liquidity", "holders", "wolf"],
  pageSize = 10,
  showPromoted = true,
  title,
}: {
  source?: Token[];
  defaultTab?: TabKey;
  tabs?: TabKey[];
  pageSize?: number;
  showPromoted?: boolean;
  title?: string;
}) {
  const { chain } = useChain();
  const [tab, setTab] = useState<TabKey>(defaultTab);
  const [narrative, setNarrative] = useState<Narrative | "all">("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const live = useLiveTokens(source);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return live
      .filter((t) => chain === "all" || t.chain === chain)
      .filter((t) => narrative === "all" || t.narrative === narrative)
      .filter((t) => !s || t.symbol.toLowerCase().includes(s) || t.name.toLowerCase().includes(s) || t.address.toLowerCase() === s)
      .sort(tableTabs[tab].sort);
  }, [live, chain, narrative, q, tab]);

  // Paid placement is shown separately and never alters organic rank.
  const promoted = showPromoted && page === 0 ? live.filter((t) => t.promoted && (chain === "all" || t.chain === chain)).slice(0, 1) : [];
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div className="card overflow-hidden">
      <div className="space-y-3 p-4 pb-3">
        {title && <h2 className="font-display text-[15px] font-bold">{title}</h2>}
        {tabs.length > 1 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {tabs.map((k) => (
              <Chip
                key={k}
                active={tab === k}
                onClick={() => {
                  setTab(k);
                  setPage(0);
                }}
              >
                {tableTabs[k].label}
              </Chip>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Filter by name or address…"
            className="h-10 rounded-full border border-line bg-surface-2 px-4 text-sm outline-none focus:border-brand sm:w-64"
          />
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {(["all", ...narratives] as const).map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => {
                  setNarrative(n);
                  setPage(0);
                }}
                className={cx(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                  narrative === n ? "bg-ink text-bg" : "bg-surface-3 text-ink hover:bg-line",
                )}
              >
                {n === "all" ? "All" : n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="text-[11px] font-semibold text-muted uppercase">
              <th className="py-2 pl-4 font-semibold">#</th>
              <th className="py-2 font-semibold">Token</th>
              <th className="px-3 font-semibold">Price</th>
              <th className="px-3 font-semibold">24h</th>
              <th className="px-3 font-semibold">Liquidity</th>
              <th className="px-3 font-semibold">Volume</th>
              <th className="px-3 font-semibold">Mkt Cap</th>
              <th className="px-3 font-semibold">Txns</th>
              <th className="px-3 font-semibold">Age</th>
              <th className="px-3 font-semibold">Risk</th>
              <th className="px-3 font-semibold">WOLF</th>
              <th className="pr-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promoted.map((t) => (
              <Row key={`p-${t.id}`} t={t} rank={null} />
            ))}
            {rows.map((t, i) => (
              <Row key={t.id} t={t} rank={page * pageSize + i + 1} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        {promoted.map((t) => (
          <MobileCard key={`p-${t.id}`} t={t} rank={null} />
        ))}
        {rows.map((t, i) => (
          <MobileCard key={t.id} t={t} rank={page * pageSize + i + 1} />
        ))}
      </div>

      {rows.length === 0 && <div className="border-t border-line p-8 text-center text-sm text-muted">No tokens match these filters.</div>}

      <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-muted">
        <span>
          Showing {filtered.length ? page * pageSize + 1 : 0}–{Math.min(filtered.length, (page + 1) * pageSize)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="grid size-8 place-items-center rounded-lg border border-line disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="px-2 font-semibold text-ink">
            {page + 1} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="grid size-8 place-items-center rounded-lg border border-line disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
