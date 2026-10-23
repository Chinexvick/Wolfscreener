import {
  Bell,
  Brain,
  Fish,
  Flame,
  House,
  LayoutDashboard,
  Megaphone,
  Newspaper,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Wallet,
  Waves,
  Layers,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Discover",
    items: [
      { href: "/", label: "Home", icon: House },
      { href: "/screener", label: "Screener", icon: ScanSearch },
      { href: "/new-pairs", label: "New Pairs", icon: Sparkles },
      { href: "/radar", label: "Radar", icon: Radar },
      { href: "/narratives", label: "Narratives", icon: Layers },
      { href: "/compare", label: "Token Battles", icon: Swords },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/audit", label: "AI Audit", icon: ShieldCheck },
      { href: "/whales", label: "Whales", icon: Fish },
      { href: "/smart-money", label: "Smart Money", icon: Brain },
      { href: "/wallet", label: "Wallet Intel", icon: Wallet },
      { href: "/flow", label: "Flow", icon: Waves },
    ],
  },
  {
    title: "You",
    items: [
      { href: "/watchlist", label: "Watchlist", icon: Star },
      { href: "/alerts", label: "Alerts", icon: Bell },
      { href: "/brief", label: "Daily Brief", icon: Newspaper },
      { href: "/rewards", label: "Rewards & Quests", icon: Trophy },
    ],
  },
  {
    title: "Projects",
    items: [
      { href: "/projects", label: "Projects", icon: Flame },
      { href: "/boost", label: "WOLF Boost", icon: Megaphone },
      { href: "/developer", label: "Developer Hub", icon: LayoutDashboard },
    ],
  },
];

export const mobileTabs: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/screener", label: "Screener", icon: ScanSearch },
  { href: "/audit", label: "AI Audit", icon: ShieldCheck },
  { href: "/whales", label: "Whales", icon: Fish },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
