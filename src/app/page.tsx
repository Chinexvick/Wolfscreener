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
import { AuditHero } from "@/components/AuditHero";

const quick = [
  { href: "/screener", label: "Top Gainers", icon: TrendingUp, primary: true },
  { href: "/new-pairs", label: "New Pairs", icon: Sparkles },
  { href: "/audit", label: "AI Audit", icon: ShieldCheck },
  { href: "/whales", label: "Whales", icon: Fish },
  { href: "/smart-money", label: "Smart Money", icon: Brain },
  { href: "/radar", label: "Radar", icon: Zap },
];

function QuickActions() {
  return (
    <div className="card p-4 sm:p-5">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {quick.map(({ href, label, icon: Icon, primary }) => (
          <Link
            key={href}
            href={href}
            className={
              primary
                ? "inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-[#6d28d9] px-4 py-2.5 text-sm font-bold text-white shadow-sm"
                : "inline-flex shrink-0 items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-brand/60"
            }
          >
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </div>
    </div>
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
          <AuditHero />
          <QuickActions />
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
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
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
