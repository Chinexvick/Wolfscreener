"use client";

import { Bell, BellRing, Plus, Send, Share2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardHeader, Chip } from "@/components/ui";
import { AlertRow } from "@/components/widgets";
import { DataBadge } from "@/components/TokenTable";
import { Avatar } from "@/components/Avatar";
import { TRIGGERS, clearAlertEvents, evaluate, markAlertsSeen, triggerLabel, useAlertEvents, useAlertRules, type Trigger } from "@/lib/alerts";
import { alertMeta, type AlertKind } from "@/lib/data";
import { track } from "@/lib/activity";
import { useFeed, useTokenList, useWhales } from "@/lib/live/client";
import { ago } from "@/lib/live/feed";

type Perm = "granted" | "denied" | "default" | "unsupported";
const permission = (): Perm => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);

export function AlertsClient() {
  const market = useTokenList();
  const whales = useWhales();
  const { feed, status, updated, loading } = useFeed();
  const { rules, add, remove } = useAlertRules();
  const { events } = useAlertEvents();
  const tokens = [...market.tokens].sort((a, b) => b.liquidity - a.liquidity).slice(0, 80);

  const [tokenId, setTokenId] = useState("");
  const [trigger, setTrigger] = useState<Trigger>("price");
  const [value, setValue] = useState<string>("5");
  const [push, setPush] = useState(false);
  const [perm, setPerm] = useState<Perm>("default");
  const [kind, setKind] = useState<AlertKind | "all">("all");
  const [shared, setShared] = useState<string | null>(null);

  // Opening the page marks everything as seen.
  useEffect(() => {
    markAlertsSeen();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPerm(permission());
  }, [events.length]);

  const selected = tokenId || tokens[0]?.id || "";
  const def = TRIGGERS.find((t) => t.id === trigger)!;

  async function togglePush() {
    if (push) return setPush(false);
    if (perm === "unsupported") return;
    const p = perm === "granted" ? "granted" : await Notification.requestPermission();
    setPerm(p);
    setPush(p === "granted");
  }

  function create() {
    const t = tokens.find((x) => x.id === selected);
    const n = Number(value);
    if (!t || !Number.isFinite(n)) return;
    add({ tokenId: t.id, symbol: t.symbol, image: t.image, trigger, threshold: n, push });
  }

  const latest = events[0];
  const shareText = latest ? `🐺 WOLF ALERT\n$${latest.symbol}: ${latest.body}` : (feed[0] ? `🐺 WOLF ALERT\n${feed[0].body}` : "🐺 Tracking on-chain risk with WOLF Screener.");
  const url = typeof window === "undefined" ? "https://wolf-screener-zeta.vercel.app" : window.location.origin;
  const share = (where: string) => {
    const text = encodeURIComponent(shareText);
    const link = encodeURIComponent(url);
    if (where === "X") window.open(`https://twitter.com/intent/tweet?text=${text}&url=${link}`, "_blank", "noopener");
    else if (where === "Telegram") window.open(`https://t.me/share/url?url=${link}&text=${text}`, "_blank", "noopener");
    else navigator.clipboard?.writeText(`${shareText}\n${url}`);
    setShared(where);
    track("share", `alert:${where}`);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4 sm:space-y-6">
        <Card className="p-4">
          <h2 className="mb-3 font-display text-[15px] font-bold">Create alert</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select aria-label="Token" value={selected} onChange={(e) => setTokenId(e.target.value)} className="h-10 rounded-xl border border-line bg-surface-2 px-3 text-sm">
              {tokens.map((t) => (
                <option key={t.id} value={t.id}>
                  ${t.symbol}
                </option>
              ))}
            </select>
            <select
              aria-label="Trigger"
              value={trigger}
              onChange={(e) => {
                const next = e.target.value as Trigger;
                setTrigger(next);
                setValue(String(TRIGGERS.find((t) => t.id === next)?.def ?? 0));
              }}
              className="h-10 rounded-xl border border-line bg-surface-2 px-3 text-sm"
            >
              {TRIGGERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 text-sm">
              <input
                aria-label="Threshold"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              <span className="shrink-0 text-xs text-muted">{def.unit}</span>
            </label>
          </div>
          <p className="mt-2 text-xs text-muted">{def.help}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip active>In-app</Chip>
            <Chip active={push} onClick={togglePush}>
              {perm === "denied" ? "Push blocked in browser" : perm === "unsupported" ? "Push unavailable" : "Browser push"}
            </Chip>
            <Chip>Telegram · needs account</Chip>
            <Chip>Email · needs account</Chip>
          </div>
          <button type="button" onClick={create} disabled={!selected} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white disabled:opacity-50 sm:w-auto sm:px-5">
            <Plus className="size-4" /> Add alert
          </button>
        </Card>

        <Card>
          <CardHeader title={`Your alerts (${rules.length})`} />
          {rules.length === 0 && <p className="px-4 pb-4 text-sm text-muted">No alert rules yet. Rules are checked against live data every minute while WOLF is open, and stored on this device.</p>}
          <ul>
            {rules.map((r) => {
              const res = evaluate(r, market.tokens, whales.moves);
              return (
                <li key={r.id} className="flex items-center gap-3 border-t border-line px-4 py-3 text-sm">
                  <Avatar symbol={r.symbol} hue={(r.symbol.charCodeAt(0) * 37) % 360} image={r.image} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">
                      ${r.symbol} · {triggerLabel(r.trigger)}
                    </div>
                    <div className="text-xs text-muted">
                      {r.trigger === "wallet" ? `wallet ${r.wallet?.slice(0, 6)}…${r.wallet?.slice(-4)}` : `${r.trigger === "price" || r.trigger === "volume" || r.trigger === "tax" ? "≥ " : ""}${r.threshold.toLocaleString()} ${TRIGGERS.find((x) => x.id === r.trigger)?.unit ?? ""}`}
                      {r.push ? " · push" : ""}
                    </div>
                  </div>
                  <div className={`shrink-0 text-right text-xs font-semibold ${res?.firing ? "text-down" : "text-muted"}`}>{res ? res.current : "waiting for data"}</div>
                  <button type="button" onClick={() => remove(r.id)} aria-label="Delete alert" className="-m-2.5 p-2.5 text-muted hover:text-down">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 flex items-center gap-2 font-display text-[15px] font-bold">
            <Share2 className="size-4 text-accent" /> Share an alert
          </h2>
          <pre className="rounded-xl bg-surface-2 p-3 font-sans text-sm whitespace-pre-wrap">{shareText}</pre>
          <div className="mt-3 flex gap-2">
            {["X", "Telegram", "Copy"].map((c) => (
              <button type="button" key={c} onClick={() => share(c)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-xs font-semibold hover:border-brand/60">
                <Send className="size-3.5" /> {c}
              </button>
            ))}
          </div>
          {shared && <p className="mt-2 text-xs text-up">{shared === "Copy" ? "Copied to clipboard." : `Opened ${shared} with your message.`}</p>}
        </Card>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader title="Triggered alerts" />
          {events.length > 0 && (
            <button type="button" onClick={clearAlertEvents} className="-mt-2 mb-1 px-4 text-xs font-semibold text-muted hover:text-ink">
              Clear all
            </button>
          )}
          <div className="px-2 pb-2">
            {events.length === 0 && (
              <p className="flex items-start gap-2 px-2 pb-2 text-sm text-muted">
                <BellRing className="mt-0.5 size-4 shrink-0" /> Nothing has fired yet. When a rule matches live market data it shows up here, in a toast and as a badge on the bell.
              </p>
            )}
            {events.slice(0, 30).map((e) => (
              <div key={e.id} className="flex items-start gap-3 rounded-xl px-2 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Bell className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{e.title}</div>
                  <div className="text-xs text-muted">{e.body}</div>
                </div>
                <span className="shrink-0 text-[11px] text-muted">{ago(e.at)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Live market feed" />
          <div className="-mt-1 px-4 pb-2">
            <DataBadge status={status} updated={updated} />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
            <Chip active={kind === "all"} onClick={() => setKind("all")}>
              All
            </Chip>
            {(Object.keys(alertMeta) as AlertKind[]).map((k) => (
              <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
                {alertMeta[k].emoji} {alertMeta[k].label}
              </Chip>
            ))}
          </div>
          <div className="px-2 pb-2">
            {loading && <div className="h-24 animate-pulse rounded-xl bg-surface-3" />}
            {!loading && feed.filter((a) => kind === "all" || a.kind === kind).length === 0 && <p className="px-2 pb-2 text-sm text-muted">Nothing in this category right now.</p>}
            {feed
              .filter((a) => kind === "all" || a.kind === kind)
              .slice(0, 20)
              .map((a) => (
                <AlertRow key={a.id} a={a} />
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
