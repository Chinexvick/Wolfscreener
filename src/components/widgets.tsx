"use client";

import { BadgeCheck, BarChart3, Bell, Flame, Layers, Megaphone, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { alertMeta, chainById, chains, narratives, tokenById, tokens as demoTokens, type FeedAlert, type Token } from "@/lib/data";
import { age, num, pct, usd } from "@/lib/format";
import { clampedWeighted, median } from "@/lib/stats";
import { useFeed, useNewPairs, useTokenList } from "@/lib/live/client";
import { useChain } from "./Shell";
import { DataBadge } from "./TokenTable";
import { Card, CardHeader, Change, ChainDot, LpBadge, PromotedTag, ScoreRing, TokenAvatar, VerifiedBadge, cx } from "./ui";

/** Tokens for the selected chain filter. */
function useScoped(): { tokens: Token[]; status: ReturnType<typeof useTokenList>["status"]; updated: number | null } {
  const { chain } = useChain();
  const m = useTokenList();
  const tokens = useMemo(() => (chain === "all" ? m.tokens : m.tokens.filter((t) => t.chain === chain)), [m.tokens, chain]);
  return { tokens, status: m.status, updated: m.updated };
}

function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-4 pb-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3">
          <div className="size-7 rounded-full bg-surface-3" />
          <div className="h-3 flex-1 rounded bg-surface-3" />
          <div className="h-3 w-12 rounded bg-surface-3" />
        </div>
      ))}
    </div>
  );
}

const Empty = ({ text }: { text: string }) => <p className="px-4 pb-4 text-sm text-muted">{text}</p>;

export function MarketOverview() {
  const { chain } = useChain();
  const { tokens, status, updated } = useScoped();
  const name = chain === "all" ? "All Chains" : chainById[chain].name;
  const totalVol = tokens.reduce((a, t) => a + t.volume24h, 0);
  const totalMcap = tokens.reduce((a, t) => a + t.mcap, 0);
  const weighted = clampedWeighted(tokens.filter((t) => t.liquidity >= 25_000).map((t) => ({ value: t.change24h, weight: t.volume24h })));
  const byChain = chains
    .map((c) => ({ c, vol: tokens.filter((t) => t.chain === c.id).reduce((a, t) => a + t.volume24h, 0) }))
    .filter((r) => r.vol > 0)
    .sort((a, b) => b.vol - a.vol);
  const max = byChain[0]?.vol || 1;

  return (
    <Card>
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="flex items-center gap-2 font-display text-[15px] font-bold">
          <BarChart3 className="size-4 text-brand" />
          {`${name} Market Overview`}
        </h2>
        <DataBadge status={status} updated={updated} />
      </div>
      {status === "loading" ? (
        <Skeleton rows={4} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 px-4">
            <div>
              <div className="text-[11px] text-muted">Tracked Mkt Cap</div>
              <div className="tabular font-display text-lg font-bold">{usd(totalMcap)}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted">24h Volume</div>
              <div className="tabular font-display text-lg font-bold">{usd(totalVol)}</div>
              <Change value={weighted} className="text-xs" />
            </div>
            <div>
              <div className="text-[11px] text-muted">Active Pools</div>
              <div className="tabular font-display text-lg font-bold">{num(tokens.length)}</div>
            </div>
          </div>
          <div className="mt-4 px-4 pb-4">
            <div className="mb-2 text-[11px] font-semibold text-muted uppercase">Volume by chain</div>
            <ul className="space-y-2">
              {byChain.slice(0, 6).map(({ c, vol }) => (
                <li key={c.id} className="flex items-center gap-2 text-xs">
                  <span className="w-14 shrink-0 font-semibold">{c.short}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <span className="block h-full rounded-full" style={{ width: `${(vol / max) * 100}%`, background: c.color }} />
                  </span>
                  <span className="tabular w-16 text-right text-muted">{usd(vol)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] text-muted">Totals cover the trending pools tracked by WOLF, not the whole market.</p>
          </div>
        </>
      )}
    </Card>
  );
}

export function TopGainers({ limit = 5 }: { limit?: number }) {
  const { tokens, status } = useScoped();
  // Ignore illiquid pools: tiny pools produce meaningless +10,000% moves.
  const list = [...tokens].filter((t) => t.liquidity >= 25_000).sort((a, b) => b.change24h - a.change24h).slice(0, limit);
  return (
    <Card>
      <CardHeader icon={<TrendingUp className="size-4 text-up" />} title="Top Gainers (24h)" action="View all" href="/screener" />
      {status === "loading" ? (
        <Skeleton />
      ) : list.length === 0 ? (
        <Empty text="No liquid gainers on this chain right now." />
      ) : (
        <ul className="px-2 pb-2">
          {list.map((t, i) => (
            <li key={t.id}>
              <Link href={`/token/${t.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                <span className="w-3 text-xs font-semibold text-muted">{i + 1}</span>
                <TokenAvatar token={t} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t.symbol}</span>
                <Change value={t.change24h} className="text-sm" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function NewPairsMini({ limit = 5 }: { limit?: number }) {
  const { chain } = useChain();
  const m = useNewPairs();
  const list = (chain === "all" ? m.tokens : m.tokens.filter((t) => t.chain === chain)).filter((t) => t.liquidity >= 5_000).sort((a, b) => a.ageMinutes - b.ageMinutes).slice(0, limit);
  return (
    <Card>
      <CardHeader icon={<Sparkles className="size-4 text-brand" />} title="Recent New Pairs" action="View all" href="/new-pairs" />
      {m.status === "loading" ? (
        <Skeleton />
      ) : list.length === 0 ? (
        <Empty text="No new pairs on this chain right now." />
      ) : (
        <ul className="px-2 pb-2">
          {list.map((t) => (
            <li key={t.id}>
              <Link href={`/token/${t.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                <TokenAvatar token={t} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {t.symbol} <span className="font-normal text-muted">· {chainById[t.chain].short}</span>
                  </span>
                </span>
                <LpBadge status={t.lp} />
                <span className="w-14 text-right text-xs text-muted">{age(t.ageMinutes)} ago</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function AlertRow({ a, compact }: { a: FeedAlert; compact?: boolean }) {
  const demo = tokenById(a.tokenId);
  const t = a.token ?? (demo ? { id: demo.id, symbol: demo.symbol, image: demo.image, hue: demo.hue } : null);
  const m = alertMeta[a.kind];
  const tone = { up: "bg-up-soft", down: "bg-down-soft", warn: "bg-warn-soft", brand: "bg-brand-soft" }[m.tone];
  const body = (
    <>
      {t?.image ? <TokenAvatar token={{ ...t, image: t.image }} size={36} /> : (
        <span className={cx("grid size-9 shrink-0 place-items-center rounded-xl text-base", tone)} aria-hidden>
          {m.emoji}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">
            <span aria-hidden>{m.emoji} </span>
            {a.title}
          </span>
          <span className="shrink-0 text-[11px] text-muted">{a.when}</span>
        </span>
        <span className={cx("block text-xs text-muted", compact && "line-clamp-2")}>{a.body}</span>
      </span>
    </>
  );
  const cls = "flex gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-2";
  return t ? (
    <Link href={`/token/${t.id}`} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function AlertFeed({ limit = 6, kinds, title = "WOLF Alerts", href = "/alerts" }: { limit?: number; kinds?: FeedAlert["kind"][]; title?: string; href?: string }) {
  const { feed, loading, status, updated } = useFeed();
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
      <div className="-mt-1 px-4 pb-2">
        <DataBadge status={status} updated={updated} />
      </div>
      {loading ? (
        <Skeleton />
      ) : list.length === 0 ? (
        <Empty text="No alerts match right now. Whale trades and surges appear as they happen." />
      ) : (
        <div className="px-2 pb-2">
          {list.map((a) => (
            <AlertRow key={a.id} a={a} compact />
          ))}
        </div>
      )}
    </Card>
  );
}

export function AiInsights() {
  const { tokens, status } = useScoped();
  const insights = useMemo(() => {
    const liquid = tokens.filter((t) => t.liquidity >= 50_000);
    if (!liquid.length) return [];
    const out: { icon: typeof Zap; text: string; href: string }[] = [];
    const surge = [...liquid].sort((a, b) => b.volumeChange - a.volumeChange)[0];
    if (surge && surge.volumeChange > 50)
      out.push({ icon: Zap, text: `$${surge.symbol} 1h volume is ${surge.volumeChange.toFixed(0)}% above its 24h average on ${usd(surge.liquidity)} liquidity. Check whether the activity is organic.`, href: `/token/${surge.id}` });
    const risky = [...liquid].filter((t) => t.scanned && (t.lp === "UNLOCKED" || (t.sellTax ?? 0) > 10 || (t.contractFlags ?? 0) >= 3)).sort((a, b) => b.volume24h - a.volume24h)[0];
    if (risky) {
      const why = [risky.lp === "UNLOCKED" ? "unlocked LP" : "", (risky.sellTax ?? 0) > 10 ? `${risky.sellTax}% sell tax` : "", (risky.contractFlags ?? 0) >= 3 ? `${risky.contractFlags} contract flags` : ""].filter(Boolean).join(", ");
      out.push({ icon: ShieldCheck, text: `$${risky.symbol} trades ${usd(risky.volume24h)} a day with ${why}. Review the audit before relying on its liquidity.`, href: `/token/${risky.id}?tab=audit` });
    }
    const safe = [...liquid].filter((t) => t.scanned && t.auditScore >= 80).sort((a, b) => b.volume24h - a.volume24h)[0];
    if (safe) out.push({ icon: BadgeCheck, text: `$${safe.symbol} has the cleanest profile among high-volume tokens: audit ${safe.auditScore}/100, LP ${safe.lp.toLowerCase()}, taxes ${safe.buyTax}%/${safe.sellTax}%.`, href: `/token/${safe.id}?tab=audit` });
    const byNar = narratives.map((n) => {
      const ts = liquid.filter((t) => t.narrative === n);
      return { n, avg: median(ts.map((t) => t.change24h)), count: ts.length };
    }).filter((x) => x.count >= 3).sort((a, b) => b.avg - a.avg)[0];
    if (byNar) out.push({ icon: Layers, text: `${byNar.n} leads the tracked sectors with a median ${pct(byNar.avg, 1)} over 24h across ${byNar.count} liquid tokens (sector is inferred from token names).`, href: "/narratives" });
    return out;
  }, [tokens]);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#5b21b6] to-[#0b0712] px-4 py-3 text-white">
        <h2 className="flex items-center gap-2 font-display text-[15px] font-bold">
          <Sparkles className="size-4 text-violet-300" /> WOLF AI Insights
        </h2>
        <span className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">{status === "live" ? "Live data" : status === "demo" ? "Sample data" : "Loading"}</span>
      </div>
      {status === "loading" ? (
        <div className="pt-4"><Skeleton rows={4} /></div>
      ) : insights.length === 0 ? (
        <div className="pt-4"><Empty text="Not enough liquid tokens to analyse yet." /></div>
      ) : (
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
      )}
    </Card>
  );
}

export function NarrativeMini() {
  const { tokens, status } = useScoped();
  const rows = narratives
    .map((n) => {
      const ts = tokens.filter((t) => t.narrative === n && t.liquidity >= 25_000);
      return { n, change: median(ts.map((t) => t.change24h)), count: ts.length };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.change - a.change);
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.change)));
  return (
    <Card>
      <CardHeader icon={<Layers className="size-4 text-accent" />} title="Narrative Radar" action="Explore" href="/narratives" />
      {status === "loading" ? (
        <Skeleton rows={6} />
      ) : (
        <ul className="space-y-2.5 px-4 pb-2">
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
      )}
      <p className="px-4 pb-4 text-[10px] text-muted">Sectors are inferred from token names. Medians use pools above $25K liquidity.</p>
    </Card>
  );
}

export function BreakoutRadar() {
  const { tokens, status } = useScoped();
  const list = [...tokens]
    .filter((t) => t.liquidity >= 25_000)
    .map((t) => ({ t, score: t.volumeChange / 3 + (t.traderGrowth ?? 0) / 2 + (t.buys / Math.max(1, t.sells)) * 10 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  return (
    <Card>
      <CardHeader icon={<Zap className="size-4 text-brand" />} title="Breakout Radar" action="Radar" href="/radar" />
      {status === "loading" ? (
        <Skeleton rows={4} />
      ) : (
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          {list.map(({ t }) => (
            <Link key={t.id} href={`/token/${t.id}`} className="rounded-xl border border-line bg-surface-2 p-3 hover:border-brand/60">
              <div className="flex items-center gap-2">
                <TokenAvatar token={t} size={24} />
                <span className="truncate text-sm font-bold">{t.symbol}</span>
              </div>
              <div className="mt-2 space-y-0.5 text-[11px] text-muted">
                <div>
                  Vol <Change value={t.volumeChange} className="text-[11px]" />
                </div>
                <div>
                  Traders <Change value={t.traderGrowth ?? 0} className="text-[11px]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <p className="px-4 pb-3 text-[10px] text-muted">Unusual-activity detection. Informational, not a trading signal.</p>
    </Card>
  );
}

export function RecentlyAudited() {
  const { tokens, status } = useScoped();
  const list = [...tokens].filter((t) => t.scanned).sort((a, b) => b.volume24h - a.volume24h).slice(0, 5);
  return (
    <Card>
      <CardHeader icon={<ShieldCheck className="size-4 text-accent" />} title="Latest Audits" action="Run audit" href="/audit" />
      {status === "loading" ? (
        <Skeleton />
      ) : list.length === 0 ? (
        <Empty text="No scanned tokens on this chain yet." />
      ) : (
        <ul className="px-2 pb-2">
          {list.map((t) => (
            <li key={t.id}>
              <Link href={`/token/${t.id}?tab=audit`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                <TokenAvatar token={t} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{t.symbol}</span>
                  <span className="block text-[11px] text-muted">{chainById[t.chain].short} · {t.risk} risk</span>
                </span>
                <ScoreRing score={t.auditScore} size={32} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function VerifiedProjects() {
  const { tokens, status } = useScoped();
  const list = tokens.filter((t) => t.verified).sort((a, b) => b.liquidity - a.liquidity).slice(0, 6);
  return (
    <Card>
      <CardHeader icon={<BadgeCheck className="size-4 text-accent" />} title="Trusted Tokens" action="Projects" href="/projects" />
      {status === "loading" ? (
        <Skeleton rows={3} />
      ) : list.length === 0 ? (
        <Empty text="No tokens on the GoPlus trust list in the current view." />
      ) : (
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
          {list.map((t) => (
            <Link key={t.id} href={`/token/${t.id}`} className="w-36 shrink-0 rounded-xl border border-line bg-surface-2 p-3 hover:border-brand/60">
              <TokenAvatar token={t} size={32} />
              <div className="mt-2 flex items-center gap-1 text-sm font-bold">
                <span className="truncate">{t.symbol}</span> <VerifiedBadge className="size-3.5" />
              </div>
              <div className="text-[11px] text-muted">Audit {t.auditScore}/100</div>
            </Link>
          ))}
        </div>
      )}
      <p className="px-4 pb-3 text-[10px] text-muted">Tokens on the GoPlus trust list. This is a third-party signal, not a WOLF guarantee.</p>
    </Card>
  );
}

/** Paid placements. Renders nothing until promotions are enabled. */
export function PromotedProjects() {
  const list = demoTokens.filter((t) => t.promoted && false);
  if (!list.length) return null;
  return (
    <Card>
      <CardHeader icon={<Megaphone className="size-4 text-brand" />} title="Promoted Projects" action="Boost yours" href="/boost" />
      <ul className="space-y-2 px-4 pb-3">
        {list.map((t) => (
          <li key={t.id}>
            <Link href={`/token/${t.id}`} className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand-soft/40 p-2.5">
              <TokenAvatar token={t} size={32} />
              <span className="flex items-center gap-1.5 text-sm font-bold">
                {t.name} <PromotedTag />
              </span>
              <ChainDot chain={t.chain} />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function CommunityActivity() {
  return (
    <Card>
      <CardHeader icon={<Flame className="size-4 text-down" />} title="Community Activity" />
      <p className="px-4 pb-4 text-sm text-muted">Community posts, shared alerts and follows appear here once accounts are connected.</p>
    </Card>
  );
}
