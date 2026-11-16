"use client";

import { Check, ChevronDown, Copy, ExternalLink, Eye, LogOut, Wallet, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { networkInfo, useWallet, type DetectedWallet } from "@/lib/wallet";
import { shortAddr } from "@/lib/format";
import { cx } from "./ui";

function WalletRow({ w, onPick, busy }: { w: DetectedWallet; onPick: () => void; busy: boolean }) {
  return (
    <button type="button" onClick={onPick} disabled={busy} className="flex w-full items-center gap-3 rounded-xl border border-line px-3 py-3 text-left transition hover:border-brand/60 disabled:opacity-60">
      {w.icon ? <img src={w.icon} alt="" width={32} height={32} className="size-8 rounded-lg" /> : <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand"><Wallet className="size-4" /></span>}
      <span className="flex-1 text-sm font-semibold">{w.name}</span>
      <span className="text-xs text-muted">{w.kind === "solana" ? "Solana" : "EVM chains"}</span>
    </button>
  );
}

export function ConnectWallet({ compact }: { compact?: boolean }) {
  const { wallets, account, chainId, balance, connecting, error, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const net = networkInfo(chainId);
  const host = typeof window === "undefined" ? "" : window.location.host + window.location.pathname;

  const pick = async (w: DetectedWallet) => {
    await connect(w);
    setOpen(false);
  };

  const copy = () => {
    if (!account) return;
    navigator.clipboard?.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const trigger = account ? (
    <button
      type="button"
      onClick={() => setMenu((m) => !m)}
      aria-label="Wallet menu"
      aria-expanded={menu}
      className={cx("inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand-soft font-semibold text-brand-ink transition hover:border-brand", compact ? "h-10 px-2.5 text-[11px]" : "h-11 px-4 text-sm")}
    >
      {account.icon ? <img src={account.icon} alt="" width={20} height={20} className="size-5 rounded" /> : <span className="size-2.5 rounded-full bg-up" />}
      <span className="tabular">{shortAddr(account.address)}</span>
      <ChevronDown className="size-3.5" />
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Connect wallet"
      className={cx("inline-flex items-center gap-2 rounded-full bg-brand font-semibold text-white shadow-sm transition hover:brightness-105", compact ? "h-10 shrink-0 gap-1.5 px-3 text-xs max-[359px]:size-10 max-[359px]:justify-center max-[359px]:px-0" : "h-11 px-5 text-sm")}
    >
      <Wallet className="size-4" />
      <span className={compact ? "max-[359px]:hidden" : ""}>Connect Wallet</span>
    </button>
  );

  return (
    <div className="relative">
      {trigger}

      {account && menu && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setMenu(false)} />
          <div className="card absolute right-0 z-[56] mt-2 w-72 p-3 shadow-xl">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="size-2 rounded-full bg-up" /> Connected with {account.walletName}
            </div>
            <button type="button" onClick={copy} className="mt-2 flex w-full items-center justify-between rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs">
              <span className="truncate">{account.address}</span>
              {copied ? <Check className="size-3.5 shrink-0 text-up" /> : <Copy className="size-3.5 shrink-0 text-muted" />}
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-surface-2 p-2">
                <div className="text-muted">Network</div>
                <div className="font-semibold">{account.kind === "solana" ? "Solana" : (net?.name ?? "Unknown")}</div>
                {net?.testnet && <div className="text-[10px] font-bold text-warn">TESTNET</div>}
              </div>
              <div className="rounded-lg bg-surface-2 p-2">
                <div className="text-muted">Balance</div>
                <div className="tabular font-semibold">{balance !== null && net ? `${balance.toFixed(4)} ${net.symbol}` : "n/a"}</div>
              </div>
            </div>
            <Link href="/wallet" onClick={() => setMenu(false)} className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white">
              <Eye className="size-4" /> View my wallet
            </Link>
            <button
              type="button"
              onClick={() => {
                disconnect();
                setMenu(false);
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-sm font-semibold hover:border-down/60"
            >
              <LogOut className="size-4" /> Disconnect
            </button>
            <p className="mt-2 text-[10px] text-muted">Read-only. WOLF never requests signatures or transactions.</p>
          </div>
        </>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal aria-label="Connect wallet" className="card max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-b-none p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Connect a wallet</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-muted">
                <X className="size-5" />
              </button>
            </div>
            <div className="mb-4 flex gap-3 rounded-xl bg-accent-soft p-3 text-sm text-accent">
              <Eye className="mt-0.5 size-4 shrink-0" />
              <p>
                <b>Read-only.</b> Connecting shares your address, network and balances. WOLF never asks you to sign or send a transaction, and there is no trading on WOLF.
              </p>
            </div>

            {wallets.length > 0 ? (
              <div className="space-y-2">
                {wallets.map((w) => (
                  <WalletRow key={w.id} w={w} busy={connecting} onPick={() => pick(w)} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
                No wallet detected in this browser. Install one below, or open this site inside your wallet app.
              </div>
            )}

            {error && <p className="mt-3 rounded-lg bg-down-soft px-3 py-2 text-xs font-semibold text-down">{error}</p>}
            {connecting && <p className="mt-3 text-xs text-muted">Check your wallet to approve the connection…</p>}

            <div className="mt-5">
              <div className="mb-2 text-[11px] font-bold tracking-wide text-muted uppercase">{wallets.length ? "Other wallets" : "Get a wallet"}</div>
              <div className="grid grid-cols-1 gap-2 text-sm font-semibold sm:grid-cols-2">
                <a href={`https://metamask.app.link/dapp/${host}`} className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 hover:border-brand/60">
                  Open in MetaMask <ExternalLink className="size-3.5 text-muted" />
                </a>
                <a href={`https://phantom.app/ul/browse/${encodeURIComponent("https://" + host)}`} className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 hover:border-brand/60">
                  Open in Phantom <ExternalLink className="size-3.5 text-muted" />
                </a>
                <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 hover:border-brand/60">
                  Install MetaMask <ExternalLink className="size-3.5 text-muted" />
                </a>
                <a href="https://phantom.com/download" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 hover:border-brand/60">
                  Install Phantom <ExternalLink className="size-3.5 text-muted" />
                </a>
              </div>
              <p className="mt-3 text-[11px] text-muted">WalletConnect (scan a QR with a mobile wallet) turns on once a free WalletConnect project ID is added.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
