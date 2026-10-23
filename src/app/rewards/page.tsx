import { Crown, Gift, ShieldAlert, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { Bar, Card, CardHeader, PageHeader, TokenAvatar, cx } from "@/components/ui";
import { levels, quests, tokenById } from "@/lib/data";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Rewards & Quests" };

const xp = 2340;

const earn = [
  ["Follow verified projects", "+10 XP"],
  ["Follow useful wallets", "+10 XP"],
  ["Create a public watchlist", "+40 XP"],
  ["Share an alert that gets views", "+25 XP"],
  ["Complete educational quests", "+60–300 XP"],
  ["Report suspicious activity (verified)", "+300 XP"],
  ["Referrals (verified humans)", "+150 XP"],
];

export default function RewardsPage() {
  const current = [...levels].reverse().find((l) => xp >= l.xp)!;
  const next = levels[levels.indexOf(current) + 1];
  return (
    <>
      <PageHeader icon={<Trophy className="size-7 text-gold" />} title="WOLF Rewards" subtitle="Earn XP for legitimate participation and learning — not for trading performance." />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="space-y-4 sm:space-y-6">
          <Card className="overflow-hidden">
            <div className="relative bg-[#0c1a10] p-5 text-white">
              <img src={brand.promo} alt="" className="absolute inset-0 h-full w-full object-cover object-top opacity-40" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-gold uppercase">
                  <Crown className="size-4" /> Your level
                </div>
                <div className="mt-1 font-display text-3xl font-extrabold">{current.name}</div>
                <div className="mt-1 text-sm text-white/80">
                  {xp.toLocaleString()} XP {next && <>· {(next.xp - xp).toLocaleString()} XP to {next.name}</>}
                </div>
                {next && (
                  <div className="mt-3">
                    <Bar value={((xp - current.xp) / (next.xp - current.xp)) * 100} color="var(--gold)" />
                  </div>
                )}
              </div>
            </div>
            <ol className="grid grid-cols-4 text-center">
              {levels.map((l) => (
                <li key={l.name} className={cx("border-t border-line p-3", xp >= l.xp ? "text-ink" : "text-muted")}>
                  <div className="text-sm font-bold">{l.name}</div>
                  <div className="text-[11px]">{l.xp.toLocaleString()} XP</div>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <CardHeader icon={<Gift className="size-4 text-gold" />} title="Ways to earn" />
            <ul className="px-4 pb-4 text-sm">
              {earn.map(([a, b]) => (
                <li key={a} className="flex justify-between border-t border-line py-2 first:border-t-0">
                  <span>{a}</span>
                  <b className="text-emerald">{b}</b>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="flex gap-3 p-4 text-sm">
            <ShieldAlert className="size-5 shrink-0 text-warn" />
            <p className="text-muted">
              Anti-abuse: bot farming, fake accounts, spam, fake engagement, self-referrals and automated reward manipulation are detected and
              forfeit rewards.
            </p>
          </Card>
        </div>
        <Card>
          <CardHeader title="WOLF Quests" />
          <ul className="space-y-3 px-4 pb-4">
            {quests.map((q) => {
              const t = tokenById(q.project);
              return (
                <li key={q.title} className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-3">
                    {t && <TokenAvatar token={t} size={36} />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold">{q.title}</div>
                      <div className="text-xs text-muted">
                        {t?.name ?? "WOLF"} · Reward: {q.reward}
                      </div>
                    </div>
                    <span className="rounded-full bg-gold-soft px-2.5 py-1 text-xs font-bold text-gold-ink">+{q.xp} XP</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Bar value={(q.done / q.total) * 100} color="var(--gold)" />
                    <span className="text-xs font-semibold whitespace-nowrap text-muted">
                      {q.done}/{q.total}
                    </span>
                    <button type="button" className="rounded-lg bg-ink px-3 py-1.5 text-xs font-bold whitespace-nowrap text-bg">
                      {q.done ? "Continue" : "Start"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
