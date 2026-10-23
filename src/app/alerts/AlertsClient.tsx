"use client";

import { Plus, Send, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card, CardHeader, Chip, cx } from "@/components/ui";
import { AlertRow } from "@/components/widgets";
import { alertMeta, feed, tokens, type AlertKind } from "@/lib/data";

const triggers = [
  "Whale buy",
  "Whale sell",
  "Developer movement",
  "Liquidity change",
  "Liquidity removal",
  "Volume surge",
  "Holder growth",
  "Top-holder selling",
  "New wallet accumulation",
  "Contract change",
  "Tax change",
  "Minting",
  "Burning",
  "Smart-money activity",
  "Audit score change",
  "Risk score change",
];
const channels = ["In-app", "Push", "Telegram", "Email"];

interface Rule {
  token: string;
  trigger: string;
  threshold: string;
  channels: string[];
}

export function AlertsClient() {
  const [rules, setRules] = useState<Rule[]>([
    { token: tokens[0].id, trigger: "Liquidity removal", threshold: "$50K", channels: ["In-app", "Telegram"] },
    { token: tokens[1].id, trigger: "Developer movement", threshold: "1% supply", channels: ["Push"] },
  ]);
  const [draft, setDraft] = useState<Rule>({ token: tokens[2].id, trigger: triggers[0], threshold: "$100K", channels: ["In-app"] });
  const [kind, setKind] = useState<AlertKind | "all">("all");
  const [shared, setShared] = useState<string | null>(null);

  const sample = feed[0];
  const shareText = `🐋 WOLF ALERT\n${sample.body}\nView wallet activity on WOLF.`;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4 sm:space-y-6">
        <Card className="p-4">
          <h2 className="mb-3 font-display text-[15px] font-bold">Create alert</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select value={draft.token} onChange={(e) => setDraft({ ...draft, token: e.target.value })} className="h-10 rounded-xl border border-line bg-surface-2 px-3 text-sm">
              {tokens.map((t) => (
                <option key={t.id} value={t.id}>
                  ${t.symbol}
                </option>
              ))}
            </select>
            <select value={draft.trigger} onChange={(e) => setDraft({ ...draft, trigger: e.target.value })} className="h-10 rounded-xl border border-line bg-surface-2 px-3 text-sm">
              {triggers.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <input
              value={draft.threshold}
              onChange={(e) => setDraft({ ...draft, threshold: e.target.value })}
              placeholder="Threshold"
              className="h-10 rounded-xl border border-line bg-surface-2 px-3 text-sm"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {channels.map((c) => (
              <Chip
                key={c}
                active={draft.channels.includes(c)}
                onClick={() => setDraft({ ...draft, channels: draft.channels.includes(c) ? draft.channels.filter((x) => x !== c) : [...draft.channels, c] })}
              >
                {c}
              </Chip>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRules([...rules, draft])}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white sm:w-auto sm:px-5"
          >
            <Plus className="size-4" /> Add alert
          </button>
        </Card>

        <Card>
          <CardHeader title={`Your alerts (${rules.length})`} />
          <ul>
            {rules.map((r, i) => {
              const t = tokens.find((x) => x.id === r.token)!;
              return (
                <li key={i} className="flex items-center gap-3 border-t border-line px-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">
                      ${t.symbol} · {r.trigger}
                    </div>
                    <div className="text-xs text-muted">
                      ≥ {r.threshold} · {r.channels.join(", ")}
                    </div>
                  </div>
                  <button type="button" onClick={() => setRules(rules.filter((_, k) => k !== i))} aria-label="Delete alert" className="text-muted hover:text-down">
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
            {["X", "Telegram", "WOLF Community"].map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => {
                  navigator.clipboard?.writeText(shareText + "\nhttps://wolfscreener.app");
                  setShared(c);
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-xs font-semibold hover:border-brand/60"
              >
                <Send className="size-3.5" /> {c}
              </button>
            ))}
          </div>
          {shared && <p className="mt-2 text-xs text-up">Copied with a link back to WOLF — ready to post on {shared}.</p>}
        </Card>
      </div>

      <Card>
        <CardHeader title="Alert inbox" />
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
        <div className={cx("px-2 pb-2")}>
          {feed
            .filter((a) => kind === "all" || a.kind === kind)
            .slice(0, 20)
            .map((a) => (
              <AlertRow key={a.id} a={a} />
            ))}
        </div>
      </Card>
    </div>
  );
}
