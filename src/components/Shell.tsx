"use client";

import { Bell, ChevronDown, Ellipsis, Search, X } from "lucide-react";
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

export function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="WOLF Screener home">
      <img src={brand.logo} alt="" width={size} height={size} className="shrink-0 drop-shadow-sm" style={{ width: size, height: size }} />
      {withText && (
        <span className="leading-none">
          <span className="block font-display text-lg font-extrabold tracking-tight whitespace-nowrap">
            <span className="text-accent">WOLF</span>
            <span className="text-ink">-SCREENER</span>
          </span>
          <span className="mt-1 block text-[8.5px] font-semibold tracking-[0.12em] whitespace-nowrap text-muted uppercase">{brand.tagline}</span>
        </span>
      )}
    </Link>
  );
}

function ChainSelect() {
  const { chain, setChain } = useChain();
  return (
    <label className="relative hidden h-11 items-center rounded-full border border-line bg-surface pr-9 pl-4 text-sm font-semibold md:flex">
      <span className="sr-only">Chain</span>
      <select
        value={chain}
        onChange={(e) => setChain(e.target.value as ChainFilter)}
        className="appearance-none bg-transparent outline-none"
      >
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

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-5">
      {navGroups.map((g) => (
        <div key={g.title}>
          <div className="mb-1.5 px-3 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">{g.title}</div>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cx(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active ? "bg-brand font-semibold text-white shadow-sm" : "text-ink hover:bg-surface-3",
                    )}
                  >
                    <Icon className="size-[18px]" />
                    {label}
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

function PromoCard() {
  return (
    <Link href="/rewards" className="relative block overflow-hidden rounded-2xl bg-[#0b0712] text-white">
      <img src={brand.promo} alt="" className="h-56 w-full object-cover object-top" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 pt-16">
        <div className="font-display text-lg font-extrabold text-violet-300">Join the Pack</div>
        <p className="text-xs text-white/80">Earn XP from Cub to Apex. Smarter research, better decisions.</p>
        <span className="mt-3 inline-flex rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">Start earning →</span>
      </div>
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [chain, setChain] = useState<ChainFilter>("all");
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = moreOpen || searchOpen ? "hidden" : "";
  }, [moreOpen, searchOpen]);

  const moreActive = !mobileTabs.some((t) => isActive(pathname, t.href));

  return (
    <ChainCtx.Provider value={{ chain, setChain }}>
      <div className="min-h-dvh lg:pl-[248px]">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-surface lg:flex">
          <div className="px-5 pt-5 pb-4">
            <Logo />
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
            <SideNav />
            <div className="mt-6 px-1">
              <PromoCard />
            </div>
          </div>
        </aside>

        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
            <div className="lg:hidden">
              <Logo size={34} withText={false} />
            </div>
            <div className="min-w-0 flex-1 lg:hidden">
              <span className="font-display text-[15px] font-extrabold tracking-tight whitespace-nowrap">
                <span className="text-accent">WOLF</span>-SCREENER
              </span>
            </div>
            <SearchBox className="hidden max-w-xl flex-1 lg:block" />
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="grid size-10 place-items-center rounded-full border border-line bg-surface lg:hidden"
              >
                <Search className="size-[18px]" />
              </button>
              <ChainSelect />
              <ThemeToggle />
              <Link
                href="/alerts"
                aria-label="Alerts"
                className="relative hidden size-10 place-items-center rounded-full border border-line bg-surface sm:grid"
              >
                <Bell className="size-[18px]" />
                <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-down text-[9px] font-bold text-white">3</span>
              </Link>
              <span className="hidden sm:block">
                <ConnectWallet />
              </span>
              <span className="sm:hidden">
                <ConnectWallet compact />
              </span>
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
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <ul className="grid grid-cols-5">
            {mobileTabs.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link href={href} className={cx("flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold", active ? "text-ink" : "text-muted")}>
                    <span className={cx("grid h-7 w-12 place-items-center rounded-full transition", active && "bg-brand text-white")}>
                      <Icon className="size-[18px]" />
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className={cx("flex w-full flex-col items-center gap-1 py-2.5 text-[10px] font-semibold", moreActive ? "text-ink" : "text-muted")}
              >
                <span className={cx("grid h-7 w-12 place-items-center rounded-full", moreActive && "bg-brand text-white")}>
                  <Ellipsis className="size-[18px]" />
                </span>
                More
              </button>
            </li>
          </ul>
        </nav>

        {/* Mobile "More" sheet */}
        {moreOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMoreOpen(false)}>
            <div
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-surface-3" />
              <div className="mb-4 flex items-center justify-between">
                <Logo size={32} />
                <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close menu" className="grid size-9 place-items-center rounded-full bg-surface-3">
                  <X className="size-4" />
                </button>
              </div>
              <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
                {[{ id: "all", name: "All Chains" }, ...chains].map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setChain(c.id as ChainFilter)}
                    className={cx(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
                      chain === c.id ? "border-brand bg-brand text-white" : "border-line",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <SideNav onNavigate={() => setMoreOpen(false)} />
              <div className="mt-5">
                <PromoCard />
              </div>
            </div>
          </div>
        )}

        {/* Mobile search overlay */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 bg-bg/95 p-4 backdrop-blur-xl lg:hidden">
            <div className="flex items-center gap-2">
              <SearchBox autoFocus className="flex-1" onDone={() => setSearchOpen(false)} />
              <button type="button" onClick={() => setSearchOpen(false)} className="px-2 text-sm font-semibold text-muted">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </ChainCtx.Provider>
  );
}
