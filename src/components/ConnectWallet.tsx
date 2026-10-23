"use client";

import { Eye, ShieldCheck, Wallet, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cx } from "./ui";

export function ConnectWallet({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [addr, setAddr] = useState("");
  const router = useRouter();

  const track = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addr.trim()) return;
    router.push(`/wallet?address=${encodeURIComponent(addr.trim())}`);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx(
          "inline-flex items-center gap-2 rounded-full bg-brand font-semibold text-white shadow-sm transition hover:brightness-105",
          compact ? "h-10 gap-1.5 px-2.5 text-[11px]" : "h-11 px-5 text-sm",
        )}
      >
        <Wallet className={compact ? "size-3.5" : "size-4"} />
        Connect Wallet
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal
                className="card w-full max-w-md rounded-b-none p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Connect a wallet</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-muted">
                <X className="size-5" />
              </button>
            </div>
            <div className="mb-4 flex gap-3 rounded-xl bg-accent-soft p-3 text-sm text-accent">
              <Eye className="mt-0.5 size-4 shrink-0" />
              <p>
                <b>Read-only.</b> WOLF reads public on-chain data to build your portfolio intelligence. We never ask you to sign
                transactions and there is no trading on WOLF.
              </p>
            </div>
            <form onSubmit={track} className="space-y-3">
              <label className="block text-xs font-semibold text-muted" htmlFor="wallet-addr">
                Wallet address or label
              </label>
              <input
                id="wallet-addr"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder="0x… / Solana address / @WolfAlpha"
                className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm outline-none focus:border-brand"
              />
              <button type="submit" className="h-11 w-full rounded-xl bg-brand text-sm font-bold text-white">
                Track wallet
              </button>
            </form>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted">
              <ShieldCheck className="size-4 text-accent" /> Browser-extension connect (read-only) is coming soon.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
