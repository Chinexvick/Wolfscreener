"use client";

import { BadgeCheck, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { AreaChart, Columns } from "@/components/charts";
import { Card, CardHeader, Chip, Stat, TokenAvatar, cx } from "@/components/ui";
import { buildAudit, feed, rng, smartWallets, tokenById } from "@/lib/data";
import { num, pct, usd } from "@/lib/format";

const sections = ["Dashboard", "Promotion analytics", "Growth center", "AI assistant", "Verification"] as const;

const questions = [
  "Why did our volume fall?",
  "Which wallets accumulated our token?",
  "Which large holders sold?",
  "How did our holder count change?",
  "What happened to liquidity?",
  "Summarize our token activity this week.",
];

export function DeveloperClient() {
  const t = tokenById("nexa")!;
  const audit = buildAudit(t);
  const [tab, setTab] = useState<(typeof sections)[number]>("Dashboard");
  const [chat, setChat] = useState<{ q: string; a: string }[]>([]);
  const [input, setInput] = useState("");
  const r = rng(321);
  const holdersSeries = Array.from({ length: 30 }, (_, i) => t.holders * (0.7 + i * 0.01 + r() * 0.02));
  const weekly = Array.from({ length: 7 }, () => ({ a: 20 + r() * 80, b: 10 + r() * 60 }));

  const answer = (q: string) => {
    const s = q.toLowerCase();
    const w = smartWallets.slice(0, 3).map((x) => x.label).join(", ");
    let a = `Over the last 7 days ${t.symbol} had ${num(t.txns24h * 7)} transactions, holders changed ${pct(t.holderGrowth, 1)} and liquidity changed ${pct(t.liquidityChange, 1)}. Audit score is ${audit.overall}/100.`;
    if (s.includes("volume")) a = `24h volume is ${usd(t.volume24h)} (${pct(t.volumeChange, 0)} vs 7d average). The decline is concentrated in 3 wallets that previously drove 41% of volume; organic buyer count is stable.`;
    else if (s.includes("accumulat")) a = `Top accumulating wallets this week: ${w}. Combined they added ~${usd(t.volume24h * 0.08)}.`;
    else if (s.includes("sold") || s.includes("sell")) a = `Two holders above 0.5% of supply reduced positions: one sent 1.2% to an exchange-associated wallet (INFERRED), one distributed to 14 wallets.`;
    else if (s.includes("holder")) a = `Holder count is ${num(t.holders)}, ${pct(t.holderGrowth, 1)} this week. New holders mostly arrived after your quest campaign launch.`;
    else if (s.includes("liquidity")) a = `Liquidity is ${usd(t.liquidity)} (${pct(t.liquidityChange, 1)}). LP is ${t.lp}; ${audit.lp.events.at(-1)?.label} of ${usd(audit.lp.events.at(-1)?.amount ?? 0)} ${audit.lp.events.at(-1)?.when}.`;
    setChat((c) => [...c, { q, a }]);
    setInput("");
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="flex items-center gap-3 p-4">
        <TokenAvatar token={t} size={44} />
        <div className="flex-1">
          <div className="flex items-center gap-1.5 font-display font-bold">
            {t.name} <BadgeCheck className="size-4 text-emerald" />
          </div>
          <div className="text-xs text-muted">Managing ${t.symbol} · Project owner</div>
        </div>
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
            <Stat label="Holders" value={num(t.holders)} sub={pct(t.holderGrowth, 1)} tone="up" />
            <Stat label="24h Volume" value={usd(t.volume24h)} />
            <Stat label="Liquidity" value={usd(t.liquidity)} />
            <Stat label="Transactions" value={num(t.txns24h)} />
            <Stat label="Token page views" value="48.2K" sub="+22%" tone="up" />
            <Stat label="Followers" value="12.4K" sub="+640" tone="up" />
            <Stat label="Watchlists" value="3,912" sub="+311" tone="up" />
            <Stat label="Alert subscribers" value="1,284" sub="+97" tone="up" />
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Holder growth (30d)" />
            <AreaChart data={holdersSeries} height={180} />
          </Card>
          <Card>
            <CardHeader title="Wallet activity" />
            <div className="px-2 pb-2">
              {feed.slice(0, 4).map((a) => (
                <div key={a.id} className="border-t border-line px-2 py-2 text-xs first:border-t-0">
                  <b>{a.title}</b>
                  <div className="text-muted">{a.body.replace(/\$[A-Z]+/, `$${t.symbol}`)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "Promotion analytics" && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 lg:grid-cols-3">
          <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-5 lg:col-span-3">
            <Stat label="Impressions" value="1.21M" />
            <Stat label="Token page views" value="48.2K" />
            <Stat label="Project page views" value="19.7K" />
            <Stat label="Campaign clicks" value="22.9K" />
            <Stat label="Followers gained" value="+3,140" tone="up" />
            <Stat label="Watchlist adds" value="+1,802" tone="up" />
            <Stat label="Alert subscriptions" value="+611" tone="up" />
            <Stat label="Quest participants" value="4,420" />
            <Stat label="Community growth" value="+9.4%" tone="up" />
            <Stat label="Click → follow" value="13.7%" />
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Clicks (green) vs follows (red) — last 7 days" />
            <div className="px-4 pb-4">
              <Columns data={weekly} height={150} labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]} />
            </div>
          </Card>
          <Card className="p-4 text-sm">
            <div className="font-display font-bold">Active campaign</div>
            <p className="mt-1 text-muted">PRO package · Homepage banner + trending sponsorship · 4 days left</p>
            <p className="mt-3 rounded-xl bg-surface-2 p-3 text-xs">
              Reminder: your audit score ({audit.overall}/100) and risk data are unaffected by promotion. Placements are labeled PROMOTED.
            </p>
          </Card>
        </div>
      )}

      {tab === "Growth center" && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 md:grid-cols-2">
          {[
            ["Project profile", "Logo, description, website, socials, whitepaper, team, roadmap, tokenomics, contracts, exchanges, partnerships."],
            ["Announcements", "Post updates to your followers and token page."],
            ["Campaigns & quests", "Create educational, holder and community quests. Fund rewards."],
            ["Airdrops", "Run holder campaigns with anti-bot eligibility checks."],
            ["Community links", "Telegram, X, Discord — verified when connected."],
            ["Promotions", "Book WOLF Boost placements and track results."],
          ].map(([title, d]) => (
            <Card key={title} className="flex items-start justify-between gap-3 p-4">
              <div>
                <div className="font-display font-bold">{title}</div>
                <p className="text-sm text-muted">{d}</p>
              </div>
              <button type="button" className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">
                Manage
              </button>
            </Card>
          ))}
        </div>
      )}

      {tab === "AI assistant" && (
        <Card className="flex min-h-[420px] flex-col">
          <CardHeader icon={<Sparkles className="size-4 text-gold" />} title="WOLF AI Project Assistant" />
          <div className="flex-1 space-y-3 px-4">
            {chat.length === 0 && <p className="text-sm text-muted">Ask about your token. Answers use available platform and on-chain data.</p>}
            {chat.map((m, i) => (
              <div key={i} className="space-y-2">
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-gold px-3 py-2 text-sm text-black">{m.q}</div>
                <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-surface-2 px-3 py-2 text-sm">{m.a}</div>
              </div>
            ))}
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3">
            {questions.map((q) => (
              <button type="button" key={q} onClick={() => answer(q)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-gold/60">
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
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about your token…" className="h-11 flex-1 rounded-xl border border-line bg-surface-2 px-3 text-sm outline-none focus:border-gold" />
            <button type="submit" aria-label="Send" className="grid size-11 place-items-center rounded-xl bg-gold text-black">
              <Send className="size-4" />
            </button>
          </form>
        </Card>
      )}

      {tab === "Verification" && (
        <Card className="p-4 sm:p-5">
          <h2 className="font-display text-lg font-bold">Apply for WOLF Verified</h2>
          <p className="text-sm text-muted">Each badge states exactly what was verified. Verification never means WOLF guarantees the project or token.</p>
          <ul className="mt-4 space-y-2">
            {[
              ["Contract Verified", true],
              ["Project Information Verified", true],
              ["Social Accounts Verified", true],
              ["Team Identity Verified", false],
              ["Official Contract Verified", true],
            ].map(([l, done]) => (
              <li key={l as string} className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm">
                <span className="font-semibold">{l}</span>
                <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-bold", done ? "bg-up-soft text-up" : "bg-gold text-black")}>{done ? "Verified" : "Apply"}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
