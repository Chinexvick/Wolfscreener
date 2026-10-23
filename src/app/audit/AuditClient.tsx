"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuditReport } from "@/components/AuditReport";
import { looksLikeAddress } from "@/components/SearchBox";
import { TokenAvatar } from "@/components/ui";
import { tokenFromAddress, tokens, type Token } from "@/lib/data";

const steps = ["Reading contract source", "Checking permissions & owner functions", "Simulating buy / sell", "Tracing LP & lockers", "Mapping developer wallets", "Scoring"];

export function AuditClient() {
  const params = useSearchParams();
  const router = useRouter();
  const address = params.get("address") ?? "";
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

  const token = address ? tokenFromAddress(address) : null;

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
        {!address && (
          <div className="mt-3">
            <div className="mb-2 text-xs text-muted">Try a sample:</div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {tokens.slice(0, 6).map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => router.push(`/audit?address=${t.address}`)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand/60"
                >
                  <TokenAvatar token={t} size={20} /> {t.symbol}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {token && <AuditRun key={address} token={token} />}

      {!address && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
          {[
            ["Not a honeypot checker", "Contract permissions, LP, supply, holders, developer wallets, whales and taxes — scored with evidence."],
            ["Continuously updated", "After an audit, WOLF keeps monitoring and explains every score change."],
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

function AuditRun({ token }: { token: Token }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s >= steps.length ? s : s + 1)), 350);
    return () => clearInterval(id);
  }, []);

  if (step >= steps.length) return <AuditReport token={token} />;
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
