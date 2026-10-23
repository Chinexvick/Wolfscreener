"use client";

import { Bell, Copy, ExternalLink, Globe, Send, Share2, Star } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AuditReport } from "@/components/AuditReport";
import { AreaChart, PressureBar } from "@/components/charts";
import { Card, CardHeader, Change, Chip, LpBadge, PromotedTag, RiskBadge, ScoreRing, Stat, TokenAvatar, VerifiedBadge, cx } from "@/components/ui";
import { AlertRow } from "@/components/widgets";
import { buildAudit, chainById, feed, projects, rng, smartWallets, tokenById, walletLabels } from "@/lib/data";
import { age, num, price, shortAddr, usd } from "@/lib/format";
import { useWatchlist } from "@/lib/watchlist";

const tabs = ["Overview", "Chart", "Transactions", "Holders", "Whales", "Smart Money", "AI Audit", "Social", "Project", "Alerts"] as const;
type Tab = (typeof tabs)[number];
const slug = (t: Tab) => t.toLowerCase().replace(/\s+/g, "-").replace("ai-audit", "audit");

export function TokenView({ id }: { id: string }) {
  const t = tokenById(id)!;
  const params = useSearchParams();
  const router = useRouter();
  const current = tabs.find((x) => slug(x) === params.get("tab")) ?? "Overview";
  const setTab = (x: Tab) => router.replace(`/token/${id}${x === "Overview" ? "" : `?tab=${slug(x)}`}`, { scroll: false });
  const { has, toggle } = useWatchlist();
  const audit = useMemo(() => buildAudit(t), [t]);
  const [range, setRange] = useState("24H");

  const r = rng(t.id.length * 977 + t.hue);
  const txs = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const buy = r() < t.buys / (t.buys + t.sells);
        const v = Math.round(50 + Math.pow(r(), 3) * 60000);
        return { buy, v, amount: v / t.price, wallet: r() > 0.85 ? walletLabels[Math.floor(r() * walletLabels.length)] : shortAddr("0x" + Math.floor(r() * 1e16).toString(16).padEnd(40, "a")), when: `${i * 2 + 1}m` };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t.id],
  );
  const holders = useMemo(() => {
    const labels = ["Liquidity pool", "Burn address", "Exchange hot wallet", "Treasury", "Team (vested)", "", "", "", "", "", "", ""];
    let pct = 14;
    return labels.map((label, i) => {
      pct = pct * (0.55 + r() * 0.35);
      return { rank: i + 1, label, addr: shortAddr("0x" + Math.floor(r() * 1e16).toString(16).padEnd(40, "c")), pct: +pct.toFixed(2) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.id]);
  const chart = useMemo(() => {
    const rr = rng(t.hue + range.length * 101);
    const out = [100];
    for (let i = 1; i < 80; i++) out.push(out[i - 1] * (1 + (rr() - 0.47) * 0.04));
    return out;
  }, [t.hue, range]);
  const project = projects.find((p) => p.tokenId === t.id);
  const chain = chainById[t.chain];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <TokenAvatar token={t} size={52} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="font-display text-xl font-extrabold sm:text-2xl">{t.name}</h1>
                {t.verified && <VerifiedBadge />}
                {t.promoted && <PromotedTag />}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-semibold text-ink">${t.symbol}</span>
                <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: chain.color }}>
                  {chain.name}
                </span>
                <button type="button" onClick={() => navigator.clipboard?.writeText(t.address)} className="inline-flex items-center gap-1 font-mono hover:text-ink">
                  {shortAddr(t.address)} <Copy className="size-3" />
                </button>
                <span>· {age(t.ageMinutes)} old</span>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4 lg:justify-end">
            <div>
              <div className="tabular font-display text-2xl font-extrabold sm:text-3xl">{price(t.price)}</div>
              <div className="flex gap-3 text-sm">
                <span>
                  1h <Change value={t.change1h} />
                </span>
                <span>
                  24h <Change value={t.change24h} />
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggle(t.id)}
                aria-label="Watchlist"
                className="grid size-11 place-items-center rounded-xl border border-line bg-surface"
              >
                <Star className={cx("size-5", has(t.id) ? "fill-brand text-brand" : "")} />
              </button>
              <Link href="/alerts" aria-label="Create alert" className="grid size-11 place-items-center rounded-xl border border-line bg-surface">
                <Bell className="size-5" />
              </Link>
              <Link href={`/compare?a=${t.id}`} className="hidden h-11 items-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold sm:inline-flex">
                Compare
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-3 border-t border-line pt-4 sm:grid-cols-4 lg:grid-cols-8">
          <Stat label="Market Cap" value={usd(t.mcap)} />
          <Stat label="FDV" value={usd(t.fdv)} />
          <Stat label="Liquidity" value={usd(t.liquidity)} sub={`${t.liquidityChange >= 0 ? "+" : ""}${t.liquidityChange.toFixed(1)}%`} tone={t.liquidityChange >= 0 ? "up" : "down"} />
          <Stat label="24h Volume" value={usd(t.volume24h)} />
          <Stat label="Holders" value={num(t.holders)} sub={`${t.holderGrowth >= 0 ? "+" : ""}${t.holderGrowth.toFixed(1)}%`} tone={t.holderGrowth >= 0 ? "up" : "down"} />
          <Stat label="Txns 24h" value={num(t.txns24h)} />
          <div className="flex items-center gap-2">
            <ScoreRing score={t.wolfScore} size={40} />
            <div className="text-[11px] leading-tight text-muted">
              WOLF
              <br />
              Score
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreRing score={audit.overall} size={40} />
            <div className="text-[11px] leading-tight text-muted">
              AI Audit
              <br />
              <RiskBadge risk={t.risk} />
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="no-scrollbar sticky top-16 z-20 -mx-4 flex gap-2 overflow-x-auto bg-bg/90 px-4 py-2 backdrop-blur lg:mx-0 lg:px-0">
        {tabs.map((x) => (
          <Chip key={x} active={current === x} onClick={() => setTab(x)}>
            {x}
          </Chip>
        ))}
      </div>

      {current === "Overview" && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader title="Price" />
            <AreaChart data={chart} height={220} color={t.change24h >= 0 ? "var(--up)" : "var(--down)"} />
            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
              <PressureBar buy={t.buys} sell={t.sells} labels={["Buyers", "Sellers"]} />
              <PressureBar buy={50 + t.whaleActivity / 4} sell={50} labels={["Whale in", "Whale out"]} />
              <PressureBar buy={50 + t.smartMoney / 3} sell={60} labels={["Smart in", "Smart out"]} />
            </div>
          </Card>
          <div className="space-y-4 sm:space-y-5">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <ScoreRing score={audit.overall} size={56} stroke={5} />
                <div>
                  <div className="font-display font-bold">WOLF AI Audit</div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <LpBadge status={t.lp} />
                    <span className="text-xs text-muted">
                      Tax {t.buyTax}/{t.sellTax}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted">{audit.summary}</p>
              <button type="button" onClick={() => setTab("AI Audit")} className="mt-3 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">
                Open full audit
              </button>
            </Card>
            <Card>
              <CardHeader title="Latest intelligence" />
              <div className="px-2 pb-2">
                {feed.slice(0, 4).map((a) => (
                  <AlertRow key={a.id} a={{ ...a, tokenId: t.id, body: a.body.replace(/\$[A-Z]+/, `$${t.symbol}`) }} compact />
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {current === "Chart" && (
        <Card>
          <div className="flex gap-1 p-3">
            {["1H", "4H", "24H", "7D", "30D"].map((x) => (
              <Chip key={x} active={range === x} onClick={() => setRange(x)}>
                {x}
              </Chip>
            ))}
          </div>
          <AreaChart data={chart} height={340} color={t.change24h >= 0 ? "var(--up)" : "var(--down)"} />
          <p className="p-3 text-[11px] text-muted">Chart is informational. WOLF does not offer trading.</p>
        </Card>
      )}

      {current === "Transactions" && (
        <Card className="overflow-hidden">
          <CardHeader title="Recent transactions" />
          <ul>
            {txs.map((x, i) => (
              <li key={i} className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-sm">
                <span className={cx("w-10 text-xs font-bold", x.buy ? "text-up" : "text-down")}>{x.buy ? "BUY" : "SELL"}</span>
                <span className="tabular flex-1 font-semibold">{usd(x.v)}</span>
                <span className="tabular hidden w-28 text-right text-muted sm:block">{num(x.amount)}</span>
                <span className={cx("w-28 truncate text-right font-mono text-xs", x.wallet.startsWith("@") ? "font-sans font-semibold text-accent" : "text-muted")}>{x.wallet}</span>
                <span className="w-9 text-right text-xs text-muted">{x.when}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {current === "Holders" && (
        <Card className="overflow-hidden">
          <CardHeader title={`Top holders · ${num(t.holders)} total`} />
          <ul>
            {holders.map((h) => (
              <li key={h.rank} className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-sm">
                <span className="w-6 text-xs text-muted">{h.rank}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-xs">{h.addr}</span>
                  {h.label && <span className="rounded bg-surface-3 px-1.5 py-px text-[10px] font-bold text-muted">{h.label}</span>}
                </span>
                <span className="hidden w-32 sm:block">
                  <span className="block h-1.5 rounded-full bg-surface-3">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, h.pct * 6)}%` }} />
                  </span>
                </span>
                <span className="tabular w-14 text-right font-semibold">{h.pct}%</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {current === "Whales" && (
        <Card>
          <CardHeader title="Whale activity" action="Whale radar" href="/whales" />
          <div className="px-2 pb-2">
            {feed
              .filter((a) => a.kind === "whale")
              .slice(0, 8)
              .map((a) => (
                <AlertRow key={a.id} a={{ ...a, tokenId: t.id, body: a.body.replace(/\$[A-Z]+/, `$${t.symbol}`) }} />
              ))}
          </div>
        </Card>
      )}

      {current === "Smart Money" && (
        <Card>
          <CardHeader title="Smart-money wallets interacting" action="All wallets" href="/smart-money" />
          <ul>
            {smartWallets.slice(0, 6).map((w, i) => (
              <li key={w.label} className="flex items-center gap-3 border-t border-line px-4 py-3 text-sm">
                <Link href={`/wallet?address=${w.label}`} className="flex-1 font-semibold text-accent">
                  {w.label}
                </Link>
                <span className={cx("text-xs font-bold", i % 3 === 2 ? "text-down" : "text-up")}>{i % 3 === 2 ? "Reduced" : "Accumulated"}</span>
                <span className="tabular w-20 text-right font-semibold">{usd(w.recent[0].usd)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {current === "AI Audit" && <AuditReport token={t} compact />}

      {current === "Social" && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
          {[
            ["Mentions (24h)", num(200 + t.social * 87), "+34%"],
            ["Unique accounts", num(80 + t.social * 21), "+12%"],
            ["Influencer mentions", String(Math.round(t.social / 9)), "+3"],
          ].map(([l, v, d]) => (
            <Card key={l} className="p-4">
              <Stat label={l} value={v} sub={d} tone="up" />
            </Card>
          ))}
          <Card className="sm:col-span-3">
            <CardHeader title="Social signal classification" />
            <ul className="space-y-2 px-4 pb-4 text-sm">
              <li className="flex gap-2">
                <span className="rounded bg-up-soft px-1.5 text-[10px] font-bold text-up">VERIFIED DATA</span> Holder count grew {t.holderGrowth.toFixed(1)}% (on-chain).
              </li>
              <li className="flex gap-2">
                <span className="rounded bg-warn-soft px-1.5 text-[10px] font-bold text-warn">SOCIAL CLAIM</span> “Tier-1 exchange listing next week” — from project X account.
              </li>
              <li className="flex gap-2">
                <span className="rounded bg-surface-3 px-1.5 text-[10px] font-bold text-muted">UNVERIFIED</span> Partnership rumor circulating in Telegram groups.
              </li>
            </ul>
          </Card>
        </div>
      )}

      {current === "Project" && (
        <Card className="p-4 sm:p-5">
          {project ? (
            <>
              <p className="text-sm">{project.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.verifications.map((v) => (
                  <span key={v.label} className={cx("rounded-full px-3 py-1 text-xs font-semibold", v.done ? "bg-up-soft text-up" : "bg-surface-3 text-muted")}>
                    {v.done ? "✓" : "○"} {v.label}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {[
                  [Globe, project.website],
                  [Send, "Telegram"],
                  [Share2, "X"],
                ].map(([Icon, l]) => {
                  const I = Icon as typeof Globe;
                  return (
                    <span key={l as string} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2">
                      <I className="size-4" /> {l as string} <ExternalLink className="size-3 text-muted" />
                    </span>
                  );
                })}
              </div>
              <p className="mt-4 text-[11px] text-muted">Verification states what was checked. It is not a guarantee of the project or token.</p>
            </>
          ) : (
            <p className="text-sm text-muted">
              This project has not created a WOLF profile yet. Developers can claim it from the{" "}
              <Link href="/developer" className="font-semibold text-accent">
                Developer Hub
              </Link>
              .
            </p>
          )}
        </Card>
      )}

      {current === "Alerts" && (
        <Card className="p-4">
          <h2 className="font-display font-bold">Alerts for ${t.symbol}</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {["Whale buys / sells", "Developer wallet movement", "Liquidity removal", "Audit score change", "Tax change", "Top-holder selling"].map((x, i) => (
              <label key={x} className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm">
                {x}
                <input type="checkbox" defaultChecked={i < 3} className="size-4 accent-[var(--brand)]" />
              </label>
            ))}
          </div>
          <Link href="/alerts" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white">
            Manage delivery (Telegram, email, push)
          </Link>
        </Card>
      )}
    </div>
  );
}
