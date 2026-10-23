"use client";

import { BadgeCheck, BarChart3, ChevronRight, Bell, Brain, Flame, Layers, Megaphone, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { alertMeta, chainById, feed, narratives, projects, tokenById, tokens, type FeedAlert } from "@/lib/data";
import { age, num, pct, usd } from "@/lib/format";
import { AreaChart } from "./charts";
import { useChain } from "./Shell";
import { Card, CardHeader, Change, ChainDot, LpBadge, PromotedTag, ScoreRing, TokenAvatar, VerifiedBadge, cx } from "./ui";

function series(seed: number, n: number, drift: number) {
  let s = seed;
  let v = 100;
  return Array.from({ length: n }, () => {
    s = (s * 9301 + 49297) % 233280;
    v = v * (1 + (s / 233280 - 0.5 + drift) * 0.05);
    return v;
  });
}

export function MarketOverview() {
  const { chain } = useChain();
  const [range, setRange] = useState<"1H" | "24H" | "7D" | "30D">("24H");
  const scope = chain === "all" ? tokens : tokens.filter((t) => t.chain === chain);
  const totalMcap = scope.reduce((a, t) => a + t.mcap, 0) * 18;
  const totalVol = scope.reduce((a, t) => a + t.volume24h, 0) * 14;
  const data = useMemo(() => series((chain.length + 3) * 7919 + range.length * 131, 48, 0.08), [chain, range]);
  const name = chain === "all" ? "All Chains" : chainById[chain].name;

  return (
    <Card>
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="flex items-center gap-2 font-display text-[15px] font-bold">
          <BarChart3 className="size-4 text-brand" />
          {`${name} Market Overview`}
        </h2>
        <Link href="/radar" aria-label="Open radar" className="-m-2.5 p-2.5 text-muted hover:text-ink">
          <ChevronRight className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4">
        <div>
          <div className="text-[11px] text-muted">Total Mkt Cap</div>
          <div className="tabular font-display text-lg font-bold">{usd(totalMcap)}</div>
          <Change value={6.3} className="text-xs" />
        </div>
        <div>
          <div className="text-[11px] text-muted">24h Volume</div>
          <div className="tabular font-display text-lg font-bold">{usd(totalVol)}</div>
          <Change value={18.7} className="text-xs" />
        </div>
        <div>
          <div className="text-[11px] text-muted">Active Pairs</div>
          <div className="tabular font-display text-lg font-bold">{num(scope.length * 311)}</div>
          <Change value={11.2} className="text-xs" />
        </div>
      </div>
      <AreaChart data={data} height={110} className="mt-3" />
      <div className="flex gap-1 p-3 pt-2">
        {(["1H", "24H", "7D", "30D"] as const).map((r) => (
          <button
            type="button"
            key={r}
            onClick={() => setRange(r)}
            className={cx("flex-1 rounded-full py-1.5 text-xs font-semibold", range === r ? "bg-brand text-white" : "text-muted hover:bg-surface-3")}
          >
            {r}
          </button>
        ))}
      </div>
    </Card>
  );
}

export function TopGainers({ limit = 5 }: { limit?: number }) {
  const list = [...tokens].sort((a, b) => b.change24h - a.change24h).slice(0, limit);
  return (
    <Card>
      <CardHeader icon={<TrendingUp className="size-4 text-up" />} title="Top Gainers (24h)" action="View all" href="/screener" />
      <ul className="px-2 pb-2">
        {list.map((t, i) => (
          <li key={t.id}>
            <Link href={`/token/${t.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
              <span className="w-3 text-xs font-semibold text-muted">{i + 1}</span>
              <TokenAvatar token={t} size={28} />
              <span className="flex-1 text-sm font-semibold">{t.symbol}</span>
              <Change value={t.change24h} className="text-sm" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function NewPairsMini({ limit = 5 }: { limit?: number }) {
  const list = [...tokens].sort((a, b) => a.ageMinutes - b.ageMinutes).slice(0, limit);
  return (
    <Card>
      <CardHeader icon={<Sparkles className="size-4 text-brand" />} title="Recent New Pairs" action="View all" href="/new-pairs" />
      <ul className="px-2 pb-2">
        {list.map((t) => (
          <li key={t.id}>
            <Link href={`/token/${t.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
              <TokenAvatar token={t} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  {t.symbol} <span className="font-normal text-muted">/ {chainById[t.chain].short === "SOL" ? "SOL" : "W" + chainById[t.chain].short}</span>
                </span>
              </span>
              <LpBadge status={t.lp} />
              <span className="w-14 text-right text-xs text-muted">{age(t.ageMinutes)} ago</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function AlertRow({ a, compact }: { a: FeedAlert; compact?: boolean }) {
  const t = tokenById(a.tokenId)!;
  const m = alertMeta[a.kind];
  const tone = { up: "bg-up-soft", down: "bg-down-soft", warn: "bg-warn-soft", brand: "bg-brand-soft" }[m.tone];
  return (
    <Link href={`/token/${t.id}`} className="flex gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-2">
      <span className={cx("grid size-9 shrink-0 place-items-center rounded-xl text-base", tone)} aria-hidden>
        {m.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">{a.title}</span>
          <span className="shrink-0 text-[11px] text-muted">{a.when}</span>
        </span>
        <span className={cx("block text-xs text-muted", compact && "line-clamp-2")}>{a.body}</span>
      </span>
    </Link>
  );
}

export function AlertFeed({ limit = 6, kinds, title = "WOLF Alerts", href = "/alerts" }: { limit?: number; kinds?: FeedAlert["kind"][]; title?: string; href?: string }) {
  const list = feed.filter((a) => !kinds || kinds.includes(a.kind)).slice(0, limit);
  return (
    <Card>
      <CardHeader
        icon={
          <span className="relative">
            <Bell className="size-4 text-brand" />
            <span className="live-dot absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-down" />
          </span>
        }
        title={title}
        action="All alerts"
        href={href}
      />
      <div className="px-2 pb-2">
        {list.map((a) => (
          <AlertRow key={a.id} a={a} compact />
        ))}
      </div>
    </Card>
  );
}

export function AiInsights() {
  const top = [...tokens].sort((a, b) => b.smartMoney - a.smartMoney)[0];
  const vol = [...tokens].sort((a, b) => b.volumeChange - a.volumeChange)[0];
  const risk = [...tokens].filter((t) => t.lp === "UNLOCKED").sort((a, b) => b.volume24h - a.volume24h)[0];
  const insights = [
    { icon: Brain, text: `Smart-money wallets added to $${top.symbol} for the 3rd day in a row; ${num(top.holders)} holders, holder growth ${pct(top.holderGrowth, 1)}.`, href: `/token/${top.id}` },
    { icon: Zap, text: `$${vol.symbol} volume is up ${vol.volumeChange.toFixed(0)}% while liquidity changed ${pct(vol.liquidityChange, 1)} — check whether volume is organic.`, href: `/token/${vol.id}` },
    { icon: ShieldCheck, text: `$${risk?.symbol ?? "—"} trades with UNLOCKED liquidity and ${usd(risk?.volume24h ?? 0)} volume. LP can be withdrawn at any time.`, href: `/token/${risk?.id ?? ""}?tab=audit` },
    { icon: Layers, text: `AI and DePIN narratives lead holder growth this week; Memes lead raw volume.`, href: "/narratives" },
  ];
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#5b21b6] to-[#0b0712] px-4 py-3 text-white">
        <h2 className="flex items-center gap-2 font-display text-[15px] font-bold">
          <Sparkles className="size-4 text-violet-300" /> WOLF AI Insights
        </h2>
        <span className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">Updated 1m ago</span>
      </div>
      <ul className="divide-y divide-line">
        {insights.map(({ icon: Icon, text, href }) => (
          <li key={text}>
            <Link href={href} className="flex gap-3 px-4 py-3 text-sm hover:bg-surface-2">
              <Icon className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>{text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function NarrativeMini() {
  const rows = narratives.map((n) => {
    const ts = tokens.filter((t) => t.narrative === n);
    return { n, change: ts.reduce((a, t) => a + t.change24h, 0) / (ts.length || 1), vol: ts.reduce((a, t) => a + t.volume24h, 0), count: ts.length };
  }).sort((a, b) => b.change - a.change);
  const max = Math.max(...rows.map((r) => Math.abs(r.change)));
  return (
    <Card>
      <CardHeader icon={<Layers className="size-4 text-accent" />} title="Narrative Radar" action="Explore" href="/narratives" />
      <ul className="space-y-2.5 px-4 pb-4">
        {rows.map((r) => (
          <li key={r.n} className="flex items-center gap-3 text-sm">
            <span className="w-14 font-semibold">{r.n}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
              <div className={cx("h-full rounded-full", r.change >= 0 ? "bg-up" : "bg-down")} style={{ width: `${(Math.abs(r.change) / max) * 100}%` }} />
            </div>
            <Change value={r.change} className="w-16 text-right text-xs" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function BreakoutRadar() {
  const list = [...tokens]
    .map((t) => ({ t, score: t.volumeChange / 3 + t.holderGrowth * 2 + t.liquidityChange + (t.buys / (t.sells || 1)) * 10 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  return (
    <Card>
      <CardHeader icon={<Zap className="size-4 text-brand" />} title="Breakout Radar" action="Radar" href="/radar" />
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        {list.map(({ t }) => (
          <Link key={t.id} href={`/token/${t.id}`} className="rounded-xl border border-line bg-surface-2 p-3 hover:border-brand/60">
            <div className="flex items-center gap-2">
              <TokenAvatar token={t} size={24} />
              <span className="text-sm font-bold">{t.symbol}</span>
            </div>
            <div className="mt-2 space-y-0.5 text-[11px] text-muted">
              <div>
                Vol <Change value={t.volumeChange} className="text-[11px]" />
              </div>
              <div>
                Holders <Change value={t.holderGrowth} className="text-[11px]" />
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p className="px-4 pb-3 text-[10px] text-muted">Unusual-activity detection. Informational, not a trading signal.</p>
    </Card>
  );
}

export function RecentlyAudited() {
  const list = tokens.slice(5, 10);
  return (
    <Card>
      <CardHeader icon={<ShieldCheck className="size-4 text-accent" />} title="Recently Audited" action="Run audit" href="/audit" />
      <ul className="px-2 pb-2">
        {list.map((t, i) => (
          <li key={t.id}>
            <Link href={`/token/${t.id}?tab=audit`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
              <TokenAvatar token={t} size={28} />
              <span className="flex-1">
                <span className="block text-sm font-semibold">{t.symbol}</span>
                <span className="block text-[11px] text-muted">{(i + 1) * 4}m ago</span>
              </span>
              <ScoreRing score={t.auditScore} size={32} />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function VerifiedProjects() {
  return (
    <Card>
      <CardHeader icon={<BadgeCheck className="size-4 text-accent" />} title="Recently Verified" action="Projects" href="/projects" />
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-4">
        {projects.slice(0, 6).map((p) => {
          const t = tokenById(p.tokenId)!;
          return (
            <Link key={p.tokenId} href={`/projects#${t.id}`} className="w-36 shrink-0 rounded-xl border border-line bg-surface-2 p-3 hover:border-brand/60">
              <TokenAvatar token={t} size={32} />
              <div className="mt-2 flex items-center gap-1 text-sm font-bold">
                {t.name.split(" ")[0]} <VerifiedBadge className="size-3.5" />
              </div>
              <div className="text-[11px] text-muted">{p.verifications.filter((v) => v.done).length}/5 checks</div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

export function PromotedProjects() {
  const list = tokens.filter((t) => t.promoted);
  return (
    <Card>
      <CardHeader icon={<Megaphone className="size-4 text-brand" />} title="Promoted Projects" action="Boost yours" href="/boost" />
      <ul className="space-y-2 px-4 pb-3">
        {list.map((t) => (
          <li key={t.id}>
            <Link href={`/token/${t.id}`} className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand-soft/40 p-2.5">
              <TokenAvatar token={t} size={32} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  {t.name} <PromotedTag />
                </span>
                <span className="text-[11px] text-muted">
                  Audit score {t.auditScore} · unaffected by promotion
                </span>
              </span>
              <ChainDot chain={t.chain} />
            </Link>
          </li>
        ))}
      </ul>
      <p className="px-4 pb-3 text-[10px] text-muted">Sponsored placement. Paying never changes audit, risk or organic rankings.</p>
    </Card>
  );
}

export function CommunityActivity() {
  const items = [
    ["@NightOwl", "shared a whale alert on $" + tokens[3].symbol],
    ["@ApexFlow", "published a watchlist: “AI infra picks”"],
    ["@WolfAlpha", "reached Alpha level"],
    ["@DeltaPack", "reported a suspicious contract (verified)"],
  ];
  return (
    <Card>
      <CardHeader icon={<Flame className="size-4 text-down" />} title="Community Activity" />
      <ul className="space-y-3 px-4 pb-4 text-sm">
        {items.map(([who, what]) => (
          <li key={who} className="flex gap-2">
            <span className="font-semibold text-accent">{who}</span>
            <span className="text-muted">{what}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

