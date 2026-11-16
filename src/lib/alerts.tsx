"use client";

import { Bell, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "./activity";
import type { Token } from "./data";
import { usd } from "./format";
import { useTokenList, useWhales } from "./live/client";
import { ago } from "./live/feed";
import type { WhaleMove } from "./live/tokens";
import { readLocal, useLocal, writeLocal } from "./local";

export type Trigger = "price" | "volume" | "whale" | "liquidity" | "audit" | "flags" | "tax" | "wallet";

export interface AlertRule {
  id: string;
  tokenId: string;
  symbol: string;
  image?: string;
  trigger: Trigger;
  threshold: number;
  wallet?: string;
  push: boolean;
  createdAt: number;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  tokenId: string;
  symbol: string;
  title: string;
  body: string;
  at: number;
}

export const TRIGGERS: { id: Trigger; label: string; unit: string; def: number; help: string }[] = [
  { id: "price", label: "Price moves", unit: "% in 1h", def: 5, help: "Fires when the 1-hour price change reaches this size, up or down." },
  { id: "volume", label: "Volume surge", unit: "% above avg", def: 150, help: "1-hour volume versus the 24-hour hourly average." },
  { id: "whale", label: "Large trade", unit: "USD", def: 25000, help: "A single buy or sell of at least this size on a high-volume pool." },
  { id: "liquidity", label: "Liquidity drops below", unit: "USD", def: 100000, help: "Pool liquidity falls to or below this level." },
  { id: "audit", label: "Audit score drops to", unit: "/100", def: 50, help: "The live audit score falls to or below this value." },
  { id: "flags", label: "Contract flags reach", unit: "flags", def: 3, help: "Number of risky contract findings reaches this count." },
  { id: "tax", label: "Sell tax rises above", unit: "%", def: 10, help: "Measured sell tax goes above this level." },
];

const RULES = "wolf-alert-rules";
const EVENTS = "wolf-alert-events";
const FIRED = "wolf-alert-fired";
const SEEN = "wolf-alerts-seen";
const COOLDOWN = 30 * 60 * 1000;

export const triggerLabel = (t: Trigger) => (t === "wallet" ? "Followed wallet trades" : (TRIGGERS.find((x) => x.id === t)?.label ?? t));

export function useAlertRules() {
  const [rules, setRules] = useLocal<AlertRule[]>(RULES, []);
  const add = useCallback(
    (r: Omit<AlertRule, "id" | "createdAt">) => {
      setRules((cur) => (cur.some((x) => x.tokenId === r.tokenId && x.trigger === r.trigger && x.wallet === r.wallet) ? cur : [...cur, { ...r, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, createdAt: Date.now() }]));
      track("alert", `${r.tokenId}:${r.trigger}`);
    },
    [setRules],
  );
  const remove = useCallback((id: string) => setRules((cur) => cur.filter((x) => x.id !== id)), [setRules]);
  return { rules, add, remove };
}

/** Turns on the three monitoring rules for a token: audit score, contract flags and large trades. */
export function monitorToken(t: Pick<Token, "id" | "symbol" | "image" | "auditScore" | "contractFlags">) {
  const cur = readLocal<AlertRule[]>(RULES, []);
  const mk = (trigger: Trigger, threshold: number): AlertRule => ({ id: `${t.id}:${trigger}`, tokenId: t.id, symbol: t.symbol, image: t.image, trigger, threshold, push: true, createdAt: Date.now() });
  const wanted = [mk("audit", Math.max(5, t.auditScore - 5)), mk("flags", (t.contractFlags ?? 0) + 1), mk("whale", 25000)];
  const next = [...cur.filter((r) => !wanted.some((w) => w.tokenId === r.tokenId && w.trigger === r.trigger)), ...wanted];
  writeLocal(RULES, next);
  track("alert", `${t.id}:monitor`);
}
export function unmonitorToken(tokenId: string) {
  writeLocal(
    RULES,
    readLocal<AlertRule[]>(RULES, []).filter((r) => !(r.tokenId === tokenId && ["audit", "flags", "whale"].includes(r.trigger))),
  );
}
export const useMonitoring = (tokenId: string) => useAlertRules().rules.filter((r) => r.tokenId === tokenId && ["audit", "flags", "whale"].includes(r.trigger)).length >= 3;

export function useAlertEvents() {
  const [events] = useLocal<AlertEvent[]>(EVENTS, []);
  const [seen] = useLocal<number>(SEEN, 0);
  return { events, unseen: events.filter((e) => e.at > seen).length };
}
export const markAlertsSeen = () => writeLocal(SEEN, Date.now());
export const clearAlertEvents = () => writeLocal(EVENTS, []);

/** What a rule looks like right now, and whether it is firing. */
export function evaluate(rule: AlertRule, tokens: Token[], moves: WhaleMove[]): { current: string; firing: boolean; body: string } | null {
  const t = tokens.find((x) => x.id === rule.tokenId);
  const s = `$${rule.symbol}`;
  if (rule.trigger === "whale" || rule.trigger === "wallet") {
    const mine = moves.filter((m) => m.token.id === rule.tokenId && (rule.trigger === "whale" ? m.trade.usd >= rule.threshold : m.trade.wallet.toLowerCase() === rule.wallet?.toLowerCase()));
    const top = mine[0];
    return { current: mine.length ? `${mine.length} matching trade${mine.length > 1 ? "s" : ""}` : "none right now", firing: mine.length > 0, body: top ? `${s}: ${top.trade.kind === "buy" ? "bought" : "sold"} ${usd(top.trade.usd)} just now.` : "" };
  }
  if (!t) return null;
  switch (rule.trigger) {
    case "price":
      return { current: `${t.change1h >= 0 ? "+" : ""}${t.change1h.toFixed(1)}% (1h)`, firing: Math.abs(t.change1h) >= rule.threshold, body: `${s} moved ${t.change1h >= 0 ? "+" : ""}${t.change1h.toFixed(1)}% in the last hour.` };
    case "volume":
      return { current: `${t.volumeChange >= 0 ? "+" : ""}${t.volumeChange.toFixed(0)}% vs avg`, firing: t.volumeChange >= rule.threshold, body: `${s} 1h volume is ${t.volumeChange.toFixed(0)}% above its 24h average.` };
    case "liquidity":
      return { current: usd(t.liquidity), firing: t.liquidity <= rule.threshold, body: `${s} liquidity is down to ${usd(t.liquidity)}.` };
    case "audit":
      return { current: t.scanned ? `${t.auditScore}/100` : "not scanned", firing: !!t.scanned && t.auditScore <= rule.threshold, body: `${s} audit score fell to ${t.auditScore}/100.` };
    case "flags":
      return { current: t.contractFlags === undefined ? "not scanned" : `${t.contractFlags} flags`, firing: (t.contractFlags ?? 0) >= rule.threshold, body: `${s} now shows ${t.contractFlags} risky contract flags.` };
    case "tax":
      return { current: `${t.sellTax}% sell tax`, firing: t.sellTax > rule.threshold, body: `${s} sell tax is ${t.sellTax}%.` };
  }
}

/** Runs every rule against fresh data, records events, and notifies. Mount once. */
export function AlertEngine() {
  const market = useTokenList();
  const whales = useWhales();
  const [rules] = useLocal<AlertRule[]>(RULES, []);
  const [toast, setToast] = useState<AlertEvent | null>(null);
  const ready = market.status === "live";

  useEffect(() => {
    if (!ready || !rules.length) return;
    const fired = readLocal<Record<string, number>>(FIRED, {});
    const now = Date.now();
    const out: AlertEvent[] = [];
    for (const rule of rules) {
      if ((rule.trigger === "whale" || rule.trigger === "wallet") && whales.loading) continue;
      const r = evaluate(rule, market.tokens, whales.moves);
      if (!r?.firing) continue;
      if (rule.trigger === "whale" || rule.trigger === "wallet") {
        for (const m of whales.moves.filter((x) => x.token.id === rule.tokenId && (rule.trigger === "whale" ? x.trade.usd >= rule.threshold : x.trade.wallet.toLowerCase() === rule.wallet?.toLowerCase()))) {
          const k = `${rule.id}:${m.trade.tx}`;
          if (fired[k]) continue;
          fired[k] = now;
          out.push({ id: k, ruleId: rule.id, tokenId: rule.tokenId, symbol: rule.symbol, title: rule.trigger === "wallet" ? "Followed wallet traded" : "Large trade", body: `$${rule.symbol}: ${m.trade.kind === "buy" ? "bought" : "sold"} ${usd(m.trade.usd)}.`, at: m.trade.at });
        }
      } else if (!fired[rule.id] || now - fired[rule.id] > COOLDOWN) {
        fired[rule.id] = now;
        out.push({ id: `${rule.id}:${now}`, ruleId: rule.id, tokenId: rule.tokenId, symbol: rule.symbol, title: triggerLabel(rule.trigger), body: r.body, at: now });
      }
    }
    if (!out.length) return;
    writeLocal(FIRED, fired);
    writeLocal(EVENTS, [...out, ...readLocal<AlertEvent[]>(EVENTS, [])].slice(0, 100));
    for (const e of out.slice(0, 3)) {
      const rule = rules.find((x) => x.id === e.ruleId);
      if (rule?.push && typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(`WOLF · ${e.title}`, { body: e.body, icon: rule.image });
    }
    // Show the newest event as an in-app toast.
    queueMicrotask(() => setToast(out[0]));
  }, [ready, market.tokens, whales.moves, whales.loading, rules]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!toast) return;
    timer.current = setTimeout(() => setToast(null), 7000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast]);

  if (!toast) return null;
  return (
    <div className="fixed top-20 right-4 z-[70] w-[min(22rem,calc(100vw-2rem))]" role="status">
      <Link href="/alerts" onClick={() => setToast(null)} className="card flex items-start gap-3 p-3.5 shadow-xl">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Bell className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">{toast.title}</span>
          <span className="block text-xs text-muted">{toast.body}</span>
          <span className="block text-[10px] text-muted">{ago(toast.at)}</span>
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={(e) => {
            e.preventDefault();
            setToast(null);
          }}
          className="text-muted"
        >
          <X className="size-4" />
        </button>
      </Link>
    </div>
  );
}
