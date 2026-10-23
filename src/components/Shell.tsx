"use client";

import { Bell, ChevronDown, ChevronRight, Ellipsis, Menu, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { brand } from "@/lib/brand";
import { chains, type ChainId } from "@/lib/data";
import { ConnectWallet } from "./ConnectWallet";
import { isActive, mobileTabs, navGroups } from "./nav";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { cx } from "./ui";

type ChainFilter = ChainId | "all";
const ChainCtx = createContext<{ chain: ChainFilter; setChain: (c: ChainFilter) => void }>({ chain: "all", setChain: () => {} });
export const useChain = () => useContext(ChainCtx);

export function Logo({ size = 40, compact = false }: { size?: number; compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="WOLF Screener home">
      <img src={brand.logo} alt="" width={size} height={size} className="shrink-0 drop-shadow-sm" style={{ width: size, height: size }} />
      <span className="leading-none">
        <span className={cx("block font-display font-extrabold tracking-tight whitespace-nowrap", compact ? "text-[15px]" : "text-xl")}>
          <span className="text-accent">WOLF</span>
          <span className="text-ink">-SCREENER</span>
        </span>
        <span
          className={cx(
            "mt-1 block font-semibold whitespace-nowrap text-muted uppercase",
            compact ? "text-[6.5px] tracking-[0.08em]" : "text-[9px] tracking-[0.12em]",
          )}
        >
          {brand.tagline}
        </span>
      </span>
    </Link>
  );
}

function ChainSelect() {
  const { chain, setChain } = useChain();
  return (
    <label className="relative flex h-10 items-center rounded-full border border-line bg-surface pr-9 pl-4 text-sm font-semibold lg:h-11">
      <span className="sr-only">Chain</span>
      <select value={chain} onChange={(e) => setChain(e.target.value as ChainFilter)} className="appearance-none bg-transparent outline-none">
        <option value="all">All Chains</option>
        {chains.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted" />
    </label>
  );
}

function BellLink({ count }: { count?: number }) {
  return (
    <Link href="/alerts" aria-label="Alerts" className="relative grid size-10 place-items-center rounded-full border border-line bg-surface">
      <Bell className="size-[18px]" />
      {count ? (
        <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-down text-[9px] font-bold text-white">{count}</span>
      ) : (
        <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-surface bg-down" />
      )}
    </Link>
  );
}

function NavBadge({ badge, active }: { badge: "New" | number; active: boolean }) {
  if (typeof badge === "number") {
    return <span className="ml-auto grid size-5 place-items-center rounded-full bg-down text-[10px] font-bold text-white">{badge}</span>;
  }
  return (
    <span className={cx("ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold", active ? "bg-white/25 text-white" : "bg-brand text-white")}>
      {badge}
    </span>
  );
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-3.5">
      {navGroups.map((g) => (
        <div key={g.title}>
          <div className="mb-1.5 px-3 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">{g.title}</div>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cx(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition lg:py-[7px]",
                      active ? "bg-gradient-to-r from-brand to-[#a78bfa] font-semibold text-white shadow-sm" : "text-ink hover:bg-surface-3",
                    )}
                  >
                    <Icon className="size-[18px]" />
                    {label}
                    {badge !== undefined && <NavBadge badge={badge} active={active} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function JoinCard() {
  return (
    <Link
      href="/rewards"
      className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#6d28d9] p-3.5 text-white shadow-lg shadow-brand/20"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10">
        <TrendingUp className="size-6 text-violet-200" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-sm font-bold">Join 100K+ Traders</span>
        <span className="block text-[11px] text-white/70">Smarter tools. Bigger wins.</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-white/80" />
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [chain, setChain] = useState<ChainFilter>("all");
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = moreOpen ? "hidden" : "";
  }, [moreOpen]);

  const moreActive = !mobileTabs.some((t) => isActive(pathname, t.href));

  return (
    <ChainCtx.Provider value={{ chain, setChain }}>
      <div className="min-h-dvh lg:pl-[280px]">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col border-r border-line bg-surface lg:flex">
          <div className="px-5 pt-4 pb-3">
            <Logo size={46} />
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-3">
            <SideNav />
          </div>
          <div className="p-3">
            <JoinCard />
          </div>
        </aside>

        {/* Top bar */}
        <header className="border-b border-line bg-surface lg:sticky lg:top-0 lg:z-40 lg:bg-surface/85 lg:backdrop-blur-xl">
          {/* Desktop */}
          <div className="hidden h-[68px] items-center gap-3 px-6 lg:flex">
            <SearchBox className="max-w-2xl flex-1" />
            <div className="ml-auto flex items-center gap-2">
              <ChainSelect />
              <ThemeToggle />
              <BellLink count={5} />
              <ConnectWallet />
            </div>
          </div>

          {/* Mobile */}
          <div className="space-y-3 px-4 pt-4 pb-3 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <Logo size={40} compact />
              <ConnectWallet compact />
            </div>
            <SearchBox />
            <div className="flex items-center gap-2">
              <ChainSelect />
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <BellLink />
                <button
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  aria-label="Open menu"
                  className="grid size-10 place-items-center rounded-full border border-line bg-surface"
                >
                  <Menu className="size-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 pt-4 pb-28 sm:pt-6 lg:px-6 lg:pb-10">{children}</main>

        <footer className="hidden border-t border-line px-6 py-6 text-xs text-muted lg:block">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between">
            <span>© 2026 WOLF Screener · Crypto intelligence, not trading. Nothing here is financial advice.</span>
            <span className="font-semibold">The audit cannot be bought. Visibility can.</span>
          </div>
        </footer>

        {/* Mobile bottom tabs */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <ul className="grid grid-cols-5">
            {[...mobileTabs.map((t) => ({ ...t, more: false })), { href: "#", label: "More", icon: Ellipsis, more: true }].map(({ href, label, icon: Icon, more }) => {
              const active = more ? moreActive : isActive(pathname, href);
              const inner = (
                <>
                  <Icon className="size-[22px]" />
                  {label}
                  <span className={cx("mt-0.5 h-[3px] w-9 rounded-full transition", active ? "bg-brand" : "bg-transparent")} />
                </>
              );
              const cls = cx("flex w-full flex-col items-center gap-1 pt-2.5 pb-1.5 text-[11px] font-semibold", active ? "text-brand" : "text-muted");
              return (
                <li key={label}>
                  {more ? (
                    <button type="button" onClick={() => setMoreOpen(true)} className={cls}>
                      {inner}
                    </button>
                  ) : (
                    <Link href={href} className={cls}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile menu sheet */}
        {moreOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMoreOpen(false)}>
            <div
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-surface-3" />
              <div className="mb-4 flex items-center justify-between">
                <Logo size={34} compact />
                <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close menu" className="grid size-9 place-items-center rounded-full bg-surface-3">
                  <X className="size-4" />
                </button>
              </div>
              <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
                {[{ id: "all", name: "All Chains" }, ...chains].map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setChain(c.id as ChainFilter)}
                    className={cx("shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold", chain === c.id ? "border-brand bg-brand text-white" : "border-line")}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <SideNav onNavigate={() => setMoreOpen(false)} />
              <div className="mt-5">
                <JoinCard />
              </div>
            </div>
          </div>
        )}
      </div>
    </ChainCtx.Provider>
  );
}
