"use client";

import { Check, Crown, Gift, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Bar, Card, CardHeader, cx } from "@/components/ui";
import { brand } from "@/lib/brand";
import { LEVELS, XP, summarize, useActivity, type ActivityKind } from "@/lib/activity";

const earn: { kind: ActivityKind; label: string }[] = [
  { kind: "watch", label: "Add a token to your watchlist" },
  { kind: "audit", label: "Open a token's AI audit" },
  { kind: "alert", label: "Create an alert rule" },
  { kind: "wallet", label: "Connect a wallet (read-only)" },
  { kind: "brief", label: "Read the daily brief" },
  { kind: "compare", label: "Compare two tokens" },
  { kind: "follow", label: "Save or follow a wallet" },
  { kind: "share", label: "Share an alert" },
  { kind: "token", label: "Visit a token page (once per token)" },
];

const quests: { title: string; kind: ActivityKind; total: number; href: string; blurb: string }[] = [
  { title: "Build a watchlist", kind: "watch", total: 3, href: "/screener", blurb: "Watch 3 tokens from the screener." },
  { title: "Read 3 audits", kind: "audit", total: 3, href: "/screener", blurb: "Open the AI Audit tab on three tokens." },
  { title: "Set up monitoring", kind: "alert", total: 2, href: "/alerts", blurb: "Create two alert rules." },
  { title: "Connect a wallet", kind: "wallet", total: 1, href: "/wallet", blurb: "Connect read-only to see your holdings." },
  { title: "Daily briefing", kind: "brief", total: 1, href: "/brief", blurb: "Read today's brief." },
  { title: "Side by side", kind: "compare", total: 2, href: "/compare", blurb: "Compare two pairs of tokens." },
  { title: "Follow smart money", kind: "follow", total: 2, href: "/smart-money", blurb: "Follow two wallets." },
];

export function RewardsClient() {
  const events = useActivity();
  const { xp, level, next, count } = summarize(events);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="space-y-4 sm:space-y-6">
        <Card className="overflow-hidden">
          <div className="relative bg-[#0b0712] p-5 text-white">
            <img src={brand.promo} alt="" className="absolute inset-0 h-full w-full object-cover object-top opacity-40" />
            <div className="relative">
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-violet-300 uppercase">
                <Crown className="size-4" /> Your level
              </div>
              <div className="mt-1 font-display text-3xl font-extrabold">{level.name}</div>
              <div className="mt-1 text-sm text-white/80">
                {xp.toLocaleString()} XP {next && <>· {(next.xp - xp).toLocaleString()} XP to {next.name}</>}
              </div>
              {next && (
                <div className="mt-3">
                  <Bar value={((xp - level.xp) / (next.xp - level.xp)) * 100} color="var(--brand)" />
                </div>
              )}
            </div>
          </div>
          <ol className="grid grid-cols-4 text-center">
            {LEVELS.map((l) => (
              <li key={l.name} className={cx("border-t border-line p-3", xp >= l.xp ? "text-ink" : "text-muted")}>
                <div className="text-sm font-bold">{l.name}</div>
                <div className="text-[11px]">{l.xp.toLocaleString()} XP</div>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <CardHeader icon={<Gift className="size-4 text-brand" />} title="Ways to earn" />
          <ul className="px-4 pb-4 text-sm">
            {earn.map(({ kind, label }) => (
              <li key={kind} className="flex items-center justify-between gap-3 border-t border-line py-2 first:border-t-0">
                <span className="flex items-center gap-2">
                  {count(kind) > 0 && <Check className="size-4 text-up" />}
                  {label}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  <b className="text-accent">+{XP[kind]} XP</b> · ×{count(kind)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="flex gap-3 p-4 text-sm">
          <ShieldAlert className="size-5 shrink-0 text-warn" />
          <p className="text-muted">XP is based only on actions you take in the app, counted once each. Cash rewards and partner quests will need accounts and are not part of this test build.</p>
        </Card>
      </div>
      <Card>
        <CardHeader title="WOLF Quests" />
        <ul className="space-y-3 px-4 pb-4">
          {quests.map((q) => {
            const done = Math.min(count(q.kind), q.total);
            const complete = done >= q.total;
            return (
              <li key={q.title} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">{q.title}</div>
                    <div className="text-xs text-muted">{q.blurb}</div>
                  </div>
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-ink">+{XP[q.kind] * q.total} XP</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Bar value={(done / q.total) * 100} color="var(--brand)" />
                  <span className="text-xs font-semibold whitespace-nowrap text-muted">
                    {done}/{q.total}
                  </span>
                  {complete ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-up/15 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-up">
                      <Check className="size-3.5" /> Done
                    </span>
                  ) : (
                    <Link href={q.href} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-bold whitespace-nowrap text-bg">
                      {done ? "Continue" : "Start"}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
