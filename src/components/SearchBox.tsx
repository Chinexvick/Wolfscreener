"use client";

import { Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { chainById, type Token } from "@/lib/data";
import { price } from "@/lib/format";
import { Change, TokenAvatar, cx } from "./ui";

export function looksLikeAddress(q: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(q) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q) || /^(EQ|UQ)[\w-]{46}$/.test(q);
}

export function SearchBox({ autoFocus, onDone, className }: { autoFocus?: boolean; onDone?: () => void; className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Token[]>([]);
  const [busy, setBusy] = useState(false);
  const [unavail, setUnavail] = useState(false);
  const query = q.trim();

  useEffect(() => {
    if (query.length < 2) return;
    let alive = true;
    const id = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const d = (await r.json()) as { tokens: Token[]; unavailable?: boolean };
        if (alive) {
          setResults(d.tokens ?? []);
          setUnavail(!!d.unavailable);
        }
      } catch {
        if (alive) setResults([]);
      } finally {
        if (alive) setBusy(false);
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [query]);
  const shown = query.length < 2 ? [] : results;

  const done = () => {
    setQ("");
    setOpen(false);
    onDone?.();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    if (shown[0]) router.push(`/token/${shown[0].id}`);
    else if (looksLikeAddress(query)) router.push(`/audit?address=${encodeURIComponent(query)}`);
    else return;
    done();
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
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Search token, symbol or contract address…"
        className="h-11 w-full rounded-full border border-line bg-surface pr-10 pl-11 text-[13px] outline-none placeholder:text-muted focus:border-brand sm:text-sm"
        aria-label="Search tokens"
      />
      {busy ? (
        <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted" />
      ) : (
        q && (
          <button type="button" onClick={() => setQ("")} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted" aria-label="Clear">
            <X className="size-4" />
          </button>
        )
      )}
      {open && query.length >= 2 && (
        <div className="card absolute inset-x-0 top-full z-50 mt-2 max-h-[60vh] overflow-y-auto p-1">
          {shown.map((t) => (
            <Link key={t.id} href={`/token/${t.id}`} onClick={done} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2">
              <TokenAvatar token={t} size={30} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="truncate">{t.symbol}</span>
                  <span className="rounded-full px-1.5 py-px text-[9px] font-bold text-white" style={{ background: chainById[t.chain].color }}>
                    {chainById[t.chain].short}
                  </span>
                </div>
                <div className="truncate text-xs text-muted">{t.name}</div>
              </div>
              <div className="text-right text-xs">
                <div className="tabular font-semibold">{price(t.price)}</div>
                <Change value={t.change24h} />
              </div>
            </Link>
          ))}
          {!busy && shown.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted">
              {unavail
                ? "Search is busy (public data limits). Try again in a few seconds."
                : looksLikeAddress(query)
                  ? "No trading pool found for this contract. Press Enter to try the AI Audit anyway."
                  : "No tokens found. Try a symbol, name or paste a contract address."}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
