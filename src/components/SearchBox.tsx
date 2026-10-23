"use client";

import { Search, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { tokens } from "@/lib/data";
import { price } from "@/lib/format";
import { Change, ChainDot, TokenAvatar, cx } from "./ui";

export function looksLikeAddress(q: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(q) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q) || /^(EQ|UQ)[\w-]{46}$/.test(q);
}

export function SearchBox({ autoFocus, onDone, className }: { autoFocus?: boolean; onDone?: () => void; className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const query = q.trim();
  const results = useMemo(() => {
    if (!query) return [];
    const s = query.toLowerCase();
    return tokens
      .filter((t) => t.symbol.toLowerCase().includes(s) || t.name.toLowerCase().includes(s) || t.address.toLowerCase() === s)
      .slice(0, 6);
  }, [query]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    if (results[0]) router.push(`/token/${results[0].id}`);
    else if (looksLikeAddress(query)) router.push(`/audit?address=${encodeURIComponent(query)}`);
    else return;
    setQ("");
    setOpen(false);
    onDone?.();
  };

  return (
    <form onSubmit={submit} className={cx("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
      <input
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search token, symbol or contract address…"
        className="h-11 w-full rounded-full border border-line bg-surface pr-10 pl-11 text-sm outline-none placeholder:text-muted focus:border-gold"
        aria-label="Search tokens"
      />
      {q && (
        <button type="button" onClick={() => setQ("")} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted" aria-label="Clear">
          <X className="size-4" />
        </button>
      )}
      {open && query && (
        <div className="card absolute inset-x-0 top-full z-50 mt-2 overflow-hidden p-1">
          {results.map((t) => (
            <Link
              key={t.id}
              href={`/token/${t.id}`}
              onClick={() => {
                setQ("");
                onDone?.();
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2"
            >
              <TokenAvatar token={t} size={30} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {t.symbol} <ChainDot chain={t.chain} label />
                </div>
                <div className="truncate text-xs text-muted">{t.name}</div>
              </div>
              <div className="text-right text-xs">
                <div className="tabular font-semibold">{price(t.price)}</div>
                <Change value={t.change24h} />
              </div>
            </Link>
          ))}
          {results.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted">
              {looksLikeAddress(query) ? (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald" /> Press Enter to run a WOLF AI Audit on this contract.
                </span>
              ) : (
                "No tokens found. Paste a contract address to audit it."
              )}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
