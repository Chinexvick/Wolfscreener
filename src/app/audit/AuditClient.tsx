"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { looksLikeAddress } from "@/components/SearchBox";
import { TokenAvatar } from "@/components/ui";
import type { Token } from "@/lib/data";
import { useTokenList } from "@/lib/live/client";

const steps = ["Finding the token on every supported chain", "Reading contract flags and owner permissions", "Checking liquidity and LP lock status", "Reading top holders", "Scoring"];

export function AuditClient() {
  const params = useSearchParams();
  const router = useRouter();
  const address = params.get("address") ?? "";
  const market = useTokenList();
  const [input, setInput] = useState(address);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (!looksLikeAddress(v)) {
      setError("Enter a valid EVM (0x…), Solana or TON contract address.");
      return;
    }
    setError("");
    router.push(`/audit?address=${encodeURIComponent(v)}`);
  };

  const samples = [...market.tokens].filter((t) => t.scanned).sort((a, b) => b.liquidity - a.liquidity).slice(0, 8);

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="card p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste token contract address…"
            className="h-12 flex-1 rounded-xl border border-line bg-surface-2 px-4 font-mono text-sm outline-none focus:border-brand"
            aria-label="Token contract address"
          />
          <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-white">
            <ShieldCheck className="size-4" /> Run WOLF AI Audit
          </button>
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-down">{error}</p>}
        {!address && samples.length > 0 && (
          <div className="mt-3">
            <div className="mb-2 text-xs text-muted">Audit a trending token:</div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {samples.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => router.push(`/token/${t.id}?tab=audit`)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand/60"
                >
                  <TokenAvatar token={t} size={20} /> {t.symbol}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {address && <Lookup key={address} address={address} />}

      {!address && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
          {[
            ["Real contract data", "Owner permissions, mint, honeypot simulation, taxes, LP locks and top holders, read from live scans."],
            ["Explained, not just scored", "Every category shows its evidence, positives and risks. Categories with no data are left out, never guessed."],
            ["Cannot be bought", "Paid promotion never changes audit scores, risk scores or security findings."],
          ].map(([t, d]) => (
            <div key={t} className="card p-4">
              <div className="font-display font-bold">{t}</div>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function Lookup({ address }: { address: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [missing, setMissing] = useState<boolean | "busy">(false);

  useEffect(() => {
    let alive = true;
    const tick = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 700);
    (async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(address)}`);
        const d = (await r.json()) as { tokens: Token[]; unavailable?: boolean };
        if (!alive) return;
        if (d.tokens?.[0]) router.replace(`/token/${d.tokens[0].id}?tab=audit`);
        else setMissing(d.unavailable ? "busy" : true);
      } catch {
        if (alive) setMissing(true);
      } finally {
        clearInterval(tick);
      }
    })();
    return () => {
      alive = false;
      clearInterval(tick);
    };
  }, [address, router]);

  if (missing === "busy")
    return (
      <div className="card p-5 text-sm">
        <p className="font-display text-base font-bold">Market data is busy</p>
        <p className="mt-1 text-muted">The public data providers are rate limiting right now. Run the audit again in a few seconds.</p>
      </div>
    );
  if (missing)
    return (
      <div className="card p-5 text-sm">
        <p className="font-display text-base font-bold">No trading pool found</p>
        <p className="mt-1 text-muted">
          WOLF could not find this contract on Ethereum, BNB Chain, Base, Arbitrum, Polygon, Avalanche or Solana. It may be brand new with no liquidity pool yet, on an unsupported chain, or on a testnet (testnet tokens have no
          public market data).
        </p>
      </div>
    );
  return (
    <div className="card p-5">
      <ul className="space-y-2.5">
        {steps.map((s, i) => (
          <li key={s} className={i <= step ? "flex items-center gap-2 text-sm font-semibold" : "flex items-center gap-2 text-sm text-muted"}>
            {i < step ? <ShieldCheck className="size-4 text-up" /> : i === step ? <Loader2 className="size-4 animate-spin text-brand" /> : <span className="size-4" />}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
