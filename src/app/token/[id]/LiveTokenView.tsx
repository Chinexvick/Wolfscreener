"use client";

import { Bell, Copy, ExternalLink, Globe, Send, Share2, Star } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AuditReport } from "@/components/AuditReport";
import { AreaChart, PressureBar } from "@/components/charts";
import { Card, CardHeader, Change, Chip, LpBadge, RiskBadge, ScoreRing, Stat, TokenAvatar, VerifiedBadge, cx } from "@/components/ui";
import { chainById } from "@/lib/data";
import { age, num, price, shortAddr, usd } from "@/lib/format";
import { dexscreenerUrl, explorerAddressUrl, explorerTxUrl, geckoterminalUrl } from "@/lib/live/config";
import { ago } from "@/lib/live/feed";
import { buildLiveAudit } from "@/lib/live/score";
import type { TokenBundle } from "@/lib/live/tokens";
import { useWatchlist } from "@/lib/watchlist";

const tabs = ["Overview", "Chart", "Transactions", "Holders", "Whales", "AI Audit", "Project", "Alerts"] as const;
type Tab = (typeof tabs)[number];
const slug = (t: Tab) => t.toLowerCase().replace(/\s+/g, "-").replace("ai-audit", "audit");

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-semibold hover:border-brand/60">
      {children} <ExternalLink className="size-3 text-muted" />
    </a>
  );
}

export function LiveTokenView({ bundle }: { bundle: TokenBundle }) {
  const { token: t, security: sec, candles, trades, info } = bundle;
  const params = useSearchParams();
  const router = useRouter();
  const current = tabs.find((x) => slug(x) === params.get("tab")) ?? "Overview";
  const setTab = (x: Tab) => router.replace(`/token/${t.id}${x === "Overview" ? "" : `?tab=${slug(x)}`}`, { scroll: false });
  const { has, toggle } = useWatchlist();
  const audit = useMemo(() => buildLiveAudit(t, sec), [t, sec]);
  const [range, setRange] = useState(48);
  const chain = chainById[t.chain];
  const closes = useMemo(() => candles.slice(-range).map((c) => c.c), [candles, range]);
  const lpAddrs = new Set((sec?.lp.holders ?? []).map((h) => h.address.toLowerCase()));
  const threshold = Math.max(5000, t.liquidity * 0.004);
  const big = trades.filter((x) => x.usd >= threshold);
  const bigList = (big.length ? big : [...trades].sort((a, b) => b.usd - a.usd).slice(0, 5)).slice(0, 12);
  const buyUsd = trades.filter((x) => x.kind === "buy").reduce((a, x) => a + x.usd, 0);
  const sellUsd = trades.filter((x) => x.kind === "sell").reduce((a, x) => a + x.usd, 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <TokenAvatar token={t} size={52} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="font-display text-xl font-extrabold sm:text-2xl">{t.name}</h1>
                {t.verified && <VerifiedBadge />}
                <span className="rounded-full bg-up-soft px-2 py-0.5 text-[10px] font-bold text-up">LIVE</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-semibold text-ink">${t.symbol}</span>
                <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: chain.color }}>
                  {chain.name}
                </span>
                <button type="button" onClick={() => navigator.clipboard?.writeText(t.address)} className="-my-2 inline-flex items-center gap-1 py-2 font-mono hover:text-ink">
                  {shortAddr(t.address)} <Copy className="size-3" />
                </button>
                <span>· pool {age(t.ageMinutes)} old</span>
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
              <button type="button" onClick={() => toggle(t.id)} aria-label="Watchlist" className="grid size-11 place-items-center rounded-xl border border-line bg-surface">
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
          <Stat label="Liquidity" value={usd(t.liquidity)} />
          <Stat label="24h Volume" value={usd(t.volume24h)} />
          <Stat label="Holders" value={t.holders ? num(t.holders) : "n/a"} />
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

      <div className="no-scrollbar sticky top-0 z-20 -mx-4 flex gap-2 overflow-x-auto bg-bg/90 px-4 py-2 backdrop-blur lg:top-[68px] lg:mx-0 lg:px-0">
        {tabs.map((x) => (
          <Chip key={x} active={current === x} onClick={() => setTab(x)}>
            {x}
          </Chip>
        ))}
      </div>

      {current === "Overview" && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader title="Price (last 48h)" />
            {closes.length > 2 ? <AreaChart data={candles.slice(-48).map((c) => c.c)} height={220} color={t.change24h >= 0 ? "var(--up)" : "var(--down)"} /> : <p className="px-4 pb-4 text-sm text-muted">Price history is not available for this pool yet.</p>}
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <PressureBar buy={t.buys} sell={t.sells} labels={["Buys 24h", "Sells 24h"]} />
              {buyUsd + sellUsd > 0 && <PressureBar buy={buyUsd} sell={sellUsd} labels={["Recent buys", "Recent sells"]} />}
            </div>
          </Card>
          <div className="space-y-4 sm:space-y-5">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <ScoreRing score={audit.overall} size={56} stroke={5} />
                <div>
                  <div className="font-display font-bold">WOLF AI Audit</div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
              <CardHeader title="Latest trades" />
              <ul className="px-2 pb-2">
                {trades.slice(0, 6).map((x, i) => (
                  <li key={i} className="flex items-center gap-3 px-2 py-2 text-sm">
                    <span className={cx("w-10 text-xs font-bold", x.kind === "buy" ? "text-up" : "text-down")}>{x.kind.toUpperCase()}</span>
                    <span className="tabular flex-1 font-semibold">{usd(x.usd)}</span>
                    <span className="text-xs text-muted">{ago(x.at)}</span>
                  </li>
                ))}
                {trades.length === 0 && <li className="px-2 py-2 text-sm text-muted">No recent trades returned.</li>}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {current === "Chart" && (
        <Card>
          <div className="flex flex-wrap items-center gap-2 p-3">
            {[[24, "1D"], [48, "2D"], [96, "4D"]].map(([n, l]) => (
              <Chip key={l} active={range === n} onClick={() => setRange(n as number)}>
                {l}
              </Chip>
            ))}
            {t.pool && (
              <span className="ml-auto flex gap-2">
                <Ext href={dexscreenerUrl(t.chain, t.pool)}>DexScreener</Ext>
                <Ext href={geckoterminalUrl(t.chain, t.pool)}>GeckoTerminal</Ext>
              </span>
            )}
          </div>
          {closes.length > 2 ? <AreaChart data={closes} height={340} color={closes[closes.length - 1] >= closes[0] ? "var(--up)" : "var(--down)"} /> : <p className="px-4 pb-4 text-sm text-muted">No candles returned for this pool.</p>}
          <p className="p-3 text-[11px] text-muted">Hourly closes from GeckoTerminal. This chart is informational. WOLF does not offer trading.</p>
        </Card>
      )}

      {current === "Transactions" && (
        <Card className="overflow-hidden">
          <CardHeader title={`Recent transactions · ${trades.length}`} />
          <ul>
            {trades.slice(0, 50).map((x, i) => {
              const link = explorerTxUrl(t.chain, x.tx);
              return (
                <li key={i} className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-sm">
                  <span className={cx("w-10 text-xs font-bold", x.kind === "buy" ? "text-up" : "text-down")}>{x.kind.toUpperCase()}</span>
                  <span className="tabular flex-1 font-semibold">{usd(x.usd)}</span>
                  <span className="tabular hidden w-28 text-right text-muted sm:block">{num(x.amount)}</span>
                  <a href={explorerAddressUrl(t.chain, x.wallet)} target="_blank" rel="noreferrer" className="w-28 truncate text-right font-mono text-xs text-muted hover:text-ink">
                    {shortAddr(x.wallet)}
                  </a>
                  {link ? (
                    <a href={link} target="_blank" rel="noreferrer" className="w-14 text-right text-xs text-accent hover:underline">
                      {ago(x.at)}
                    </a>
                  ) : (
                    <span className="w-14 text-right text-xs text-muted">{ago(x.at)}</span>
                  )}
                </li>
              );
            })}
            {trades.length === 0 && <li className="border-t border-line p-6 text-center text-sm text-muted">No recent trades returned for this pool.</li>}
          </ul>
        </Card>
      )}

      {current === "Holders" && (
        <Card className="overflow-hidden">
          <CardHeader title={`Top holders${sec?.holderCount ? ` · ${sec.holderCount.toLocaleString("en-US")} total` : ""}`} />
          {!sec || sec.holders.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-muted">{sec ? "The scanner returned no holder list for this token." : `Holder data is not available on ${chain.name} yet.`}</p>
          ) : (
            <ul>
              {sec.holders.map((h, i) => {
                const tag = lpAddrs.has(h.address.toLowerCase()) ? "Liquidity pool" : /dead|burn/i.test(h.address + h.tag) ? "Burn address" : h.locked ? "Locked" : h.tag || (h.isContract ? "Contract" : "");
                return (
                  <li key={h.address} className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-sm">
                    <span className="w-6 text-xs text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <a href={explorerAddressUrl(t.chain, h.address)} target="_blank" rel="noreferrer" className="block truncate font-mono text-xs hover:text-accent">
                        {shortAddr(h.address)}
                      </a>
                      {tag && <span className="rounded bg-surface-3 px-1.5 py-px text-[10px] font-bold text-muted">{tag}</span>}
                    </span>
                    <span className="hidden w-32 sm:block">
                      <span className="block h-1.5 rounded-full bg-surface-3">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, h.percent * 2)}%` }} />
                      </span>
                    </span>
                    <span className="tabular w-16 text-right font-semibold">{h.percent.toFixed(2)}%</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {current === "Whales" && (
        <Card>
          <CardHeader title="Large trades" action="Whale radar" href="/whales" />
          <p className="px-4 pb-2 text-xs text-muted">{big.length ? `Trades of ${usd(threshold)} or more in the latest window.` : "No trade crossed the large-trade threshold. Showing the biggest recent trades instead."}</p>
          <ul className="px-2 pb-2">
            {bigList.map((x, i) => (
              <li key={i} className="flex items-center gap-3 px-2 py-2.5 text-sm">
                <span className={cx("w-10 text-xs font-bold", x.kind === "buy" ? "text-up" : "text-down")}>{x.kind.toUpperCase()}</span>
                <span className="tabular flex-1 font-semibold">{usd(x.usd)}</span>
                <a href={explorerAddressUrl(t.chain, x.wallet)} target="_blank" rel="noreferrer" className="font-mono text-xs text-muted hover:text-ink">
                  {shortAddr(x.wallet)}
                </a>
                <span className="w-14 text-right text-xs text-muted">{ago(x.at)}</span>
              </li>
            ))}
            {bigList.length === 0 && <li className="px-2 py-2 text-sm text-muted">No trades returned.</li>}
          </ul>
        </Card>
      )}

      {current === "AI Audit" && (
        <AuditReport
          token={t}
          compact
          audit={audit}
          whales={
            <ul>
              {bigList.slice(0, 5).map((x, i) => (
                <li key={i} className="flex items-center gap-3 px-2 py-2 text-sm">
                  <span className={cx("w-10 text-xs font-bold", x.kind === "buy" ? "text-up" : "text-down")}>{x.kind.toUpperCase()}</span>
                  <span className="tabular flex-1 font-semibold">{usd(x.usd)}</span>
                  <span className="text-xs text-muted">{ago(x.at)}</span>
                </li>
              ))}
              {bigList.length === 0 && <li className="px-2 py-2 text-sm text-muted">No trades returned.</li>}
            </ul>
          }
        />
      )}

      {current === "Project" && (
        <Card className="p-4 sm:p-5">
          {info?.description ? <p className="text-sm">{info.description}</p> : <p className="text-sm text-muted">No project description is published for this token.</p>}
          {info && info.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {info.categories.slice(0, 8).map((c) => (
                <span key={c} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-ink">
                  {c}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {info?.websites.slice(0, 2).map((w) => (
              <Ext key={w} href={w}>
                <Globe className="size-4" /> {w.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </Ext>
            ))}
            {info?.twitter && (
              <Ext href={`https://x.com/${info.twitter}`}>
                <Share2 className="size-4" /> @{info.twitter}
              </Ext>
            )}
            {info?.telegram && (
              <Ext href={`https://t.me/${info.telegram}`}>
                <Send className="size-4" /> Telegram
              </Ext>
            )}
            {info?.discord && <Ext href={info.discord}>Discord</Ext>}
            {info?.coingeckoId && <Ext href={`https://www.coingecko.com/en/coins/${info.coingeckoId}`}>CoinGecko</Ext>}
            <Ext href={explorerAddressUrl(t.chain, t.address)}>Explorer</Ext>
          </div>
          <p className="mt-4 text-[11px] text-muted">
            {info?.gtScore != null ? `GeckoTerminal trust score ${info.gtScore.toFixed(0)}/100. ` : ""}Project details come from public listings and are not verified by WOLF. Social activity metrics need a social data source and are not shown yet.
          </p>
        </Card>
      )}

      {current === "Alerts" && (
        <Card className="p-4">
          <h2 className="font-display font-bold">Alerts for ${t.symbol}</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {["Large buys / sells", "Volume surge", "Liquidity removal", "Audit score change", "Tax change", "Top-holder selling"].map((x, i) => (
              <label key={x} className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm">
                {x}
                <input type="checkbox" defaultChecked={i < 3} className="size-4 accent-[var(--brand)]" />
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Delivery by push, Telegram and email turns on when accounts are connected.</p>
        </Card>
      )}
    </div>
  );
}
