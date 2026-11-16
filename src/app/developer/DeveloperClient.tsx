"use client";

import { Check, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AreaChart } from "@/components/charts";
import { Card, CardHeader, Chip, Stat, TokenAvatar, cx } from "@/components/ui";
import { DataBadge } from "@/components/TokenTable";
import type { Token } from "@/lib/data";
import { num, pct, usd } from "@/lib/format";
import { useTokenList, useWhales } from "@/lib/live/client";
import { useLocal } from "@/lib/local";

const sections = ["Dashboard", "Growth center", "AI assistant", "Verification"] as const;

const questions = [
  "Why did volume move?",
  "Which large wallets traded it?",
  "What happened to liquidity?",
  "How risky does the contract look?",
  "Summarize this token's activity.",
];

const growth = [
  ["Project profile", "Logo, description, website, socials, whitepaper, team, roadmap, tokenomics and contracts."],
  ["Announcements", "Post updates to your followers and token page."],
  ["Campaigns & quests", "Create educational, holder and community quests."],
  ["Airdrops", "Run holder campaigns with anti-bot eligibility checks."],
  ["Community links", "Telegram, X and Discord — verified once connected."],
  ["Promotions", "WOLF Boost placements. Paid placements never change audit or risk scores."],
];

const badges = ["Contract Verified", "Project Information Verified", "Social Accounts Verified", "Team Identity Verified", "Official Contract Verified"];

export function DeveloperClient() {
  const market = useTokenList();
  const { moves } = useWhales();
  const list = [...market.tokens].sort((a, b) => b.liquidity - a.liquidity).slice(0, 80);
  const [pick, setPick] = useState("");
  const t: Token | undefined = list.find((x) => x.id === pick) ?? list[0];
  const [tab, setTab] = useState<(typeof sections)[number]>("Dashboard");
  const [chat, setChat] = useState<{ q: string; a: string }[]>([]);
  const [input, setInput] = useState("");
  const [applied, setApplied] = useLocal<string[]>("wolf-dev-applied", []);
  const [notes, setNotes] = useLocal<Record<string, string>>("wolf-dev-notes", {});

  if (!t) return <div className="card h-64 animate-pulse" />;

  const mine = moves.filter((m) => m.token.id === t.id);

  const answer = (q: string) => {
    const s = q.toLowerCase();
    let a = `${t.name} ($${t.symbol}) trades at ${t.price < 1 ? `$${t.price.toPrecision(3)}` : usd(t.price)}, ${pct(t.change24h, 1)} in 24h, with ${usd(t.volume24h)} volume and ${usd(t.liquidity)} liquidity. Audit score: ${t.auditScore}/100.`;
    if (s.includes("volume")) a = `24h volume is ${usd(t.volume24h)}. The last hour runs ${pct(t.volumeChange, 0)} versus its 24h hourly average, across ${num(t.txns24h)} transactions (${num(t.buys)} buys, ${num(t.sells)} sells).`;
    else if (s.includes("wallet") || s.includes("large")) {
      const top = [...mine].sort((x, y) => y.trade.usd - x.trade.usd).slice(0, 3);
      a = top.length ? `Largest recent trades: ${top.map((m) => `${m.trade.kind === "buy" ? "bought" : "sold"} ${usd(m.trade.usd)}`).join(", ")}.` : "No large trades on this token in the latest sample of high-volume pools.";
    } else if (s.includes("liquidity")) a = `Liquidity is ${usd(t.liquidity)} (${pct(t.liquidityChange, 1)} versus the 24h level). LP status: ${t.lp}.`;
    else if (s.includes("risk") || s.includes("contract"))
      a = t.scanned
        ? `Contract scan found ${t.contractFlags ?? 0} risky flag(s). Buy tax ${t.buyTax}%, sell tax ${t.sellTax}%. Top-10 holders (excluding LP/burn): ${t.top10Pct ?? "n/a"}%. Overall audit ${t.auditScore}/100.`
        : "This chain is not covered by the contract scanner yet, so only market-based checks apply.";
    setChat((c) => [...c, { q, a }]);
    setInput("");
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <TokenAvatar token={t} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display font-bold">{t.name}</div>
          <div className="text-xs text-muted">Analyzing ${t.symbol} with live data</div>
        </div>
        <select aria-label="Token" value={t.id} onChange={(e) => setPick(e.target.value)} className="h-10 rounded-xl border border-line bg-surface-2 px-3 text-sm">
          {list.map((x) => (
            <option key={x.id} value={x.id}>
              ${x.symbol}
            </option>
          ))}
        </select>
        <DataBadge status={market.status} updated={market.updated} />
      </Card>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {sections.map((s) => (
          <Chip key={s} active={tab === s} onClick={() => setTab(s)}>
            {s}
          </Chip>
        ))}
      </div>

      {tab === "Dashboard" && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 lg:grid-cols-3">
          <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 lg:col-span-3">
            <Stat label="24h Volume" value={usd(t.volume24h)} sub={pct(t.volumeChange, 0)} tone={t.volumeChange >= 0 ? "up" : "down"} />
            <Stat label="Liquidity" value={usd(t.liquidity)} sub={pct(t.liquidityChange, 1)} tone={t.liquidityChange >= 0 ? "up" : "down"} />
            <Stat label="Transactions" value={num(t.txns24h)} />
            <Stat label="Audit score" value={`${t.auditScore}/100`} />
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Price (7d)" />
            {t.spark.length > 1 ? <AreaChart data={t.spark} height={180} color={t.change24h >= 0 ? "var(--up)" : "var(--down)"} /> : <p className="px-4 pb-4 text-sm text-muted">No price history yet.</p>}
          </Card>
          <Card>
            <CardHeader title="Large trades" />
            <div className="px-2 pb-2">
              {mine.length === 0 && <p className="px-2 pb-2 text-xs text-muted">No large trades on this token in the latest sample.</p>}
              {mine.slice(0, 5).map((m) => (
                <div key={m.trade.tx} className="border-t border-line px-2 py-2 text-xs first:border-t-0">
                  <b className={m.trade.kind === "buy" ? "text-up" : "text-down"}>{m.trade.kind === "buy" ? "Buy" : "Sell"}</b> {usd(m.trade.usd)}
                </div>
              ))}
            </div>
          </Card>
          <p className="text-xs text-muted lg:col-span-3">
            Followers, page views and campaign analytics need accounts and a database. See <Link href="/boost" className="font-semibold text-accent">WOLF Boost</Link> for what will be measured.
          </p>
        </div>
      )}

      {tab === "Growth center" && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 md:grid-cols-2">
          {growth.map(([title, d]) => (
            <Card key={title} className="space-y-2 p-4">
              <div className="font-display font-bold">{title}</div>
              <p className="text-sm text-muted">{d}</p>
              <textarea
                aria-label={`${title} draft`}
                value={notes[`${t.id}:${title}`] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [`${t.id}:${title}`]: e.target.value }))}
                placeholder="Draft saved on this device"
                rows={2}
                className="w-full resize-none rounded-xl border border-line bg-surface-2 p-2.5 text-sm outline-none focus:border-brand"
              />
            </Card>
          ))}
          <p className="text-xs text-muted md:col-span-2">Drafts are stored in this browser. Publishing to followers needs project accounts, which are not part of this test build.</p>
        </div>
      )}

      {tab === "AI assistant" && (
        <Card className="flex min-h-[420px] flex-col">
          <CardHeader icon={<Sparkles className="size-4 text-brand" />} title="WOLF Project Assistant" />
          <div className="flex-1 space-y-3 px-4">
            {chat.length === 0 && <p className="text-sm text-muted">Pick a question. Answers are generated from the live numbers above, not from a language model.</p>}
            {chat.map((m, i) => (
              <div key={i} className="space-y-2">
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-sm text-white">{m.q}</div>
                <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-surface-2 px-3 py-2 text-sm">{m.a}</div>
              </div>
            ))}
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3">
            {questions.map((q) => (
              <button type="button" key={q} onClick={() => answer(q)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand/60">
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) answer(input.trim());
            }}
            className="flex gap-2 p-4"
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about volume, liquidity, risk or wallets…" className="h-11 flex-1 rounded-xl border border-line bg-surface-2 px-3 text-sm outline-none focus:border-brand" />
            <button type="submit" aria-label="Send" className="grid size-11 place-items-center rounded-xl bg-brand text-white">
              <Send className="size-4" />
            </button>
          </form>
        </Card>
      )}

      {tab === "Verification" && (
        <Card className="p-4 sm:p-5">
          <h2 className="font-display text-lg font-bold">Apply for WOLF Verified</h2>
          <p className="text-sm text-muted">Each badge states exactly what was verified. Verification never means WOLF guarantees the project or token. Applications are saved on this device until review accounts exist.</p>
          <ul className="mt-4 space-y-2">
            {badges.map((l) => {
              const key = `${t.id}:${l}`;
              const on = applied.includes(key);
              return (
                <li key={l} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 text-sm">
                  <span className="font-semibold">{l}</span>
                  <button
                    type="button"
                    onClick={() => setApplied((a) => (a.includes(key) ? a.filter((x) => x !== key) : [...a, key]))}
                    className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", on ? "bg-up-soft text-up" : "bg-brand text-white")}
                  >
                    {on && <Check className="size-3" />} {on ? "Applied" : "Apply"}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
