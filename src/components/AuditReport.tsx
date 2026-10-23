"use client";

import {
  ArrowDown,
  Bell,
  ChevronDown,
  CircleCheck,
  CircleMinus,
  CircleX,
  Coins,
  Copy,
  Download,
  Droplets,
  Fish,
  GitBranch,
  Info,
  PieChart,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useState } from "react";
import { buildAudit, chainById, feed, type Audit, type CheckStatus, type Token } from "@/lib/data";
import { shortAddr, usd } from "@/lib/format";
import { AreaChart, Donut } from "./charts";
import { Bar, Card, CardHeader, ConfidenceTag, LpBadge, RiskBadge, ScoreRing, TokenAvatar, VerifiedBadge, cx, scoreColor } from "./ui";
import { AlertRow } from "./widgets";

const statusIcon: Record<CheckStatus, React.ReactNode> = {
  pass: <CircleCheck className="size-4 text-up" />,
  warn: <TriangleAlert className="size-4 text-warn" />,
  fail: <CircleX className="size-4 text-down" />,
  na: <CircleMinus className="size-4 text-muted" />,
};

function Checklist({ items }: { items: Audit["contract"] }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((c) => (
        <li key={c.label} className="flex gap-3 px-4 py-2.5">
          <span className="mt-0.5">{statusIcon[c.status]}</span>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{c.label}</div>
            <div className="text-xs text-muted">{c.detail}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CategoryRow({ c }: { c: Audit["categories"][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border-t border-line first:border-t-0">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3 text-left" aria-expanded={open}>
        <span className="w-36 shrink-0 text-sm font-semibold sm:w-44">{c.label}</span>
        <span className="flex-1">
          <Bar value={c.score} color={scoreColor(c.score)} />
        </span>
        <span className="tabular w-8 text-right text-sm font-bold">{c.score}</span>
        <ChevronDown className={cx("size-4 text-muted transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid gap-3 px-4 pb-4 text-xs sm:grid-cols-2">
          <div className="rounded-xl bg-up-soft/60 p-3">
            <div className="mb-1 font-bold text-up">Positive indicators</div>
            <ul className="list-inside list-disc space-y-0.5">{c.positives.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div className="rounded-xl bg-down-soft/60 p-3">
            <div className="mb-1 font-bold text-down">Risk indicators</div>
            {c.risks.length ? <ul className="list-inside list-disc space-y-0.5">{c.risks.map((p) => <li key={p}>{p}</li>)}</ul> : <p>None detected.</p>}
          </div>
          <p className="text-muted sm:col-span-2">
            Weight {c.weight}% of overall score · Evidence: {c.evidence}
          </p>
        </div>
      )}
    </li>
  );
}

function WalletGraph({ a }: { a: Audit }) {
  const byId = Object.fromEntries(a.nodes.map((n) => [n.id, n]));
  // Main movement path from funding source down to the exchange.
  const path = ["n1", "n0", "n2", "n6", "n7", "n8"];
  const side = ["n3", "n4", "n5"];
  const edgeTo = (to: string) => a.edges.find((e) => e.to === to);
  const Node = ({ id }: { id: string }) => {
    const n = byId[id];
    return (
      <div className={cx("rounded-xl border bg-surface p-3", n.confidence === "CONFIRMED" ? "border-line" : "border-dashed border-warn/60")}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold">{n.role}</span>
          <ConfidenceTag c={n.confidence} />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted">
          <span className="font-mono">{shortAddr(n.address)}</span>
          {n.holdingPct > 0 && <span>{n.holdingPct}% supply</span>}
        </div>
      </div>
    );
  };
  return (
    <div className="grid gap-6 p-4 pt-0 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
      <div>
        <div className="mb-2 text-xs font-bold text-muted uppercase">Movement path</div>
        {path.map((id, i) => {
          const e = i > 0 ? edgeTo(id) : undefined;
          return (
            <div key={id}>
              {i > 0 && (
                <div className="flex items-center gap-2 py-1 pl-5 text-[11px] text-muted">
                  <ArrowDown className="size-4 text-brand" />
                  <span className="font-semibold text-ink">{e?.amount}</span> · {e?.when}
                </div>
              )}
              <Node id={id} />
            </div>
          );
        })}
      </div>
      <div>
        <div className="mb-2 text-xs font-bold text-muted uppercase">Other linked wallets</div>
        <div className="space-y-2">
          {side.map((id) => {
            const e = edgeTo(id);
            return (
              <div key={id}>
                <div className="mb-1 text-[11px] text-muted">
                  from {byId[e?.from ?? "n0"].role} · <span className="font-semibold text-ink">{e?.amount}</span> · {e?.when}
                </div>
                <Node id={id} />
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-xl bg-surface-2 p-3 text-xs text-muted">
          <b className="text-ink">CONFIRMED</b> = ownership proven on-chain (deployer, contract-assigned roles, LP mint).{" "}
          <b className="text-ink">INFERRED</b> = possible association from funding and transfer patterns. WOLF never claims two wallets belong to the
          same person without sufficient evidence.
        </div>
      </div>
    </div>
  );
}

export function AuditReport({ token, compact }: { token: Token; compact?: boolean }) {
  const a = buildAudit(token);
  const [monitoring, setMonitoring] = useState(false);
  const tokenAlerts = feed.filter((f) => f.tokenId === token.id || f.kind === "whale").slice(0, 3);
  const prev = a.history[a.history.length - 2];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Score header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-[#5b21b6] to-[#0b0712] p-4 text-white sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {!compact && (
              <div className="flex items-center gap-3 sm:w-64">
                <TokenAvatar token={token} size={48} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-display text-xl font-bold">
                    {token.name} {token.verified && <VerifiedBadge className="text-violet-300" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    ${token.symbol} · {chainById[token.chain].name}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(token.address)}
                    className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-white/70 hover:text-white"
                  >
                    {shortAddr(token.address)} <Copy className="size-3" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-1 items-center gap-4">
              <div className="rounded-full bg-surface p-1.5">
                <ScoreRing score={a.overall} size={92} stroke={8} label="WOLF AI Audit Score" />
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-[0.14em] text-violet-300 uppercase">WOLF AI Audit Score</div>
                <div className="font-display text-3xl font-extrabold">
                  {a.overall}
                  <span className="text-lg text-white/60">/100</span>
                </div>
                <div className="text-xs text-white/70">
                  Updated {a.updated} · {prev.score !== a.overall && <>was {prev.score} yesterday</>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-col">
              <button
                type="button"
                onClick={() => setMonitoring((m) => !m)}
                className={cx("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold", monitoring ? "bg-white text-accent" : "bg-brand text-white")}
              >
                <Bell className="size-4" /> {monitoring ? "Monitoring on" : "Monitor token"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold"
              >
                <Download className="size-4" /> Full report
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <RiskBadge risk={token.risk} />
            <LpBadge status={a.lp.status} />
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
              Buy {token.buyTax}% · Sell {token.sellTax}%
            </span>
            <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-white/80">
              <ShieldCheck className="size-3.5 text-violet-300" /> This audit cannot be bought.
            </span>
          </div>
        </div>
        <div className="flex gap-3 p-4">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-brand" />
          <div>
            <div className="text-xs font-bold text-muted uppercase">AI summary</div>
            <p className="text-sm">{a.summary}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader icon={<PieChart className="size-4 text-accent" />} title="Score breakdown" />
          <p className="-mt-2 px-4 pb-2 text-xs text-muted">Tap a category to see evidence. Weighted methodology, documented inputs.</p>
          <ul>{a.categories.map((c) => <CategoryRow key={c.key} c={c} />)}</ul>
        </Card>

        <Card>
          <CardHeader icon={<Info className="size-4 text-accent" />} title="Audit history — why it changed" />
          <div className="px-4">
            <AreaChart data={a.history.map((h) => h.score)} height={90} color={scoreColor(a.overall)} />
          </div>
          <ul className="divide-y divide-line">
            {[...a.history].reverse().map((h, i, arr) => {
              const before = arr[i + 1]?.score;
              const d = before === undefined ? 0 : h.score - before;
              return (
                <li key={h.day} className="flex gap-3 px-4 py-2.5">
                  <span className="w-9 text-xs font-semibold text-muted">{h.day}</span>
                  <span className="tabular w-14 text-sm font-bold">
                    {h.score}
                    {d !== 0 && <span className={cx("ml-1 text-[11px]", d > 0 ? "text-up" : "text-down")}>{d > 0 ? `+${d}` : d}</span>}
                  </span>
                  <span className="flex-1 text-xs text-muted">{h.reason}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<ShieldCheck className="size-4 text-accent" />} title="Contract audit" />
          <Checklist items={a.contract} />
        </Card>
        <div className="space-y-4 sm:space-y-5">
          <Card>
            <CardHeader icon={<Coins className="size-4 text-brand" />} title="Sellability & tax analysis" />
            <Checklist items={a.sellability} />
          </Card>
          <Card>
            <CardHeader icon={<Droplets className="size-4 text-accent" />} title="Liquidity & LP audit" />
            <div className="space-y-3 px-4 pb-4">
              <div className="flex items-center justify-between">
                <LpBadge status={a.lp.status} />
                <span className="text-xs text-muted">
                  Provider <b className="text-ink">{a.lp.provider}</b> · Unlock <b className="text-ink">{a.lp.unlock}</b>
                </span>
              </div>
              {(
                [
                  ["Locked", a.lp.lockedPct, "var(--up)"],
                  ["Burned", a.lp.burnedPct, "var(--accent)"],
                  ["Unlocked", a.lp.unlockedPct, "var(--down)"],
                ] as const
              ).map(([l, v, c]) => (
                <div key={l} className="flex items-center gap-3 text-xs">
                  <span className="w-16 font-semibold">{l}</span>
                  <Bar value={v} color={c} />
                  <span className="tabular w-12 text-right">{v}%</span>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-2 p-3 text-xs">
                <div>
                  <div className="text-muted">Initial liquidity</div>
                  <div className="font-bold">{usd(a.lp.initial)}</div>
                </div>
                <div>
                  <div className="text-muted">Current liquidity</div>
                  <div className="font-bold">{usd(token.liquidity)}</div>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs">
                {a.lp.events.map((e, i) => (
                  <li key={i} className="flex justify-between">
                    <span className={e.type === "add" ? "text-up" : "text-down"}>
                      {e.type === "add" ? "＋" : "−"} {e.label}
                    </span>
                    <span>
                      <b>{usd(e.amount)}</b> <span className="text-muted">· {e.when}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader icon={<GitBranch className="size-4 text-accent" />} title="Developer wallet movement graph" />
        <WalletGraph a={a} />
        <div className="border-t border-line px-4 py-3">
          <div className="mb-2 text-xs font-bold text-muted uppercase">Developer wallet monitoring</div>
          <ul className="space-y-2">
            {a.devActivity.map((d) => (
              <li key={d.text} className="flex items-start justify-between gap-3 text-sm">
                <span>{d.text}</span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <ConfidenceTag c={d.confidence} />
                  <span className="text-[11px] text-muted">{d.when}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader icon={<PieChart className="size-4 text-brand" />} title="Token distribution" />
          <div className="flex flex-col items-center gap-4 px-4 pb-4 sm:flex-row lg:flex-col xl:flex-row">
            <Donut parts={a.distribution} size={140} center={<span className="text-xs font-bold text-muted">Supply</span>} />
            <ul className="w-full space-y-1.5 text-xs">
              {a.distribution.map((d) => (
                <li key={d.label} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                  <span className="flex-1">{d.label}</span>
                  <b className="tabular">{d.pct}%</b>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        <Card>
          <CardHeader icon={<Coins className="size-4 text-accent" />} title="Supply audit" />
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 px-4 text-xs">
            {a.supply.map((s) => (
              <div key={s.label}>
                <dt className="text-muted">{s.label}</dt>
                <dd className="font-bold">{s.value}</dd>
              </div>
            ))}
          </dl>
          <p className="m-4 rounded-xl bg-surface-2 p-3 text-xs">{a.supplyNote}</p>
        </Card>
        <Card>
          <CardHeader icon={<Users className="size-4 text-accent" />} title="Holder concentration" />
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted">
                <th className="px-4 py-1 text-left font-semibold">Tier</th>
                <th className="px-2 text-right font-semibold">Raw</th>
                <th className="px-4 text-right font-semibold">Adjusted</th>
              </tr>
            </thead>
            <tbody>
              {a.concentration.map((c) => (
                <tr key={c.tier} className="border-t border-line">
                  <td className="px-4 py-2 font-semibold">{c.tier}</td>
                  <td className="tabular px-2 text-right text-muted">{c.raw}%</td>
                  <td className="tabular px-4 text-right font-bold">{c.adjusted}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-4 text-[11px] text-muted">Adjusted excludes burn, LP, exchange, known-contract, team and treasury wallets (shown separately in distribution).</p>
        </Card>
      </div>

      <Card>
        <CardHeader icon={<Fish className="size-4 text-brand" />} title="Whale risk analysis" action="Whale radar" href="/whales" />
        <div className="px-2 pb-2">
          {tokenAlerts.map((x) => (
            <AlertRow key={x.id} a={x} />
          ))}
        </div>
      </Card>

      <p className="text-center text-[11px] text-muted">
        Data sources: chain RPC, block explorer verified source, DEX pair contracts, LP lockers, transaction simulation, WOLF wallet labels. Scores
        are computed from documented, measurable inputs and are never influenced by paid promotion. Not financial advice.
      </p>
    </div>
  );
}

