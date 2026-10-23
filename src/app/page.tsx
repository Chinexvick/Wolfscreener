import { Brain, Fish, GraduationCap, Radar, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { TokenTable } from "@/components/TokenTable";
import {
  AiInsights,
  AlertFeed,
  BreakoutRadar,
  CommunityActivity,
  MarketOverview,
  NarrativeMini,
  NewPairsMini,
  PromotedProjects,
  RecentlyAudited,
  TopGainers,
  VerifiedProjects,
} from "@/components/widgets";
import { brand } from "@/lib/brand";

const quick = [
  { href: "/screener", label: "Top Gainers", icon: TrendingUp, primary: true },
  { href: "/new-pairs", label: "New Pairs", icon: Sparkles },
  { href: "/audit", label: "AI Audit", icon: ShieldCheck },
  { href: "/whales", label: "Whales", icon: Fish },
  { href: "/smart-money", label: "Smart Money", icon: Brain },
  { href: "/radar", label: "Radar", icon: Zap },
];

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-[#fdf6e3] dark:bg-[#141a12]">
      <img
        src={brand.hero}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[78%_center] opacity-95 dark:opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#fdf6e3] via-[#fdf6e3]/85 to-transparent sm:via-[#fdf6e3]/70 dark:from-[#0b0f0c] dark:via-[#0b0f0c]/85" />
      <div className="relative px-5 py-6 sm:px-8 sm:py-9">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-[11px] font-semibold backdrop-blur">
          <span className="live-dot size-2 rounded-full bg-up" /> Live data · 9 chains
        </div>
        <h1 className="mt-3 max-w-[15ch] font-display text-[28px] leading-[1.05] font-extrabold tracking-tight sm:max-w-xl sm:text-5xl">
          <span className="text-emerald">See everything.</span>
          <br />
          Before everyone.
        </h1>
        <p className="mt-2 max-w-[30ch] text-sm text-ink/75 sm:max-w-md sm:text-base">
          Discover, audit and track tokens with on-chain intelligence. No trading — just the truth about every token.
        </p>
        <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
          {quick.map(({ href, label, icon: Icon, primary }) => (
            <Link
              key={href}
              href={href}
              className={
                primary
                  ? "inline-flex shrink-0 items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-black shadow-sm"
                  : "inline-flex shrink-0 items-center gap-2 rounded-xl border border-line bg-surface/90 px-4 py-2.5 text-sm font-semibold backdrop-blur hover:border-gold/60"
              }
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const pillars = [
  { icon: Radar, title: "Real-time data", text: "Streaming on-chain activity across chains" },
  { icon: Sparkles, title: "AI-powered insights", text: "Clear explanations, not just numbers" },
  { icon: ShieldCheck, title: "Explainable audits", text: "Every score shows its evidence" },
  { icon: GraduationCap, title: "Learn & earn", text: "Quests and XP for real participation" },
];

export default function Home() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4 sm:space-y-6">
          <Hero />
          <TokenTable />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <MarketOverview />
          <TopGainers />
          <NewPairsMini />
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        <AiInsights />
        <AlertFeed />
        <div className="space-y-4 sm:space-y-6 md:col-span-2 xl:col-span-1">
          <BreakoutRadar />
          <PromotedProjects />
        </div>
        <NarrativeMini />
        <RecentlyAudited />
        <div className="space-y-4 sm:space-y-6 md:col-span-2 xl:col-span-1">
          <VerifiedProjects />
          <CommunityActivity />
        </div>
      </div>

      <div className="card grid grid-cols-2 gap-4 p-4 lg:grid-cols-4">
        {pillars.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold-ink">
              <Icon className="size-5" />
            </span>
            <div>
              <div className="text-sm font-bold">{title}</div>
              <div className="text-xs text-muted">{text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
