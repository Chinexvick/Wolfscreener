"use client";

import { Bookmark, Copy, ExternalLink, Eye, RefreshCw, Search, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Donut } from "@/components/charts";
import { Card, CardHeader, Change, Stat, TokenAvatar, cx } from "@/components/ui";
import { track } from "@/lib/activity";
import { chainById, type Token } from "@/lib/data";
import { price, shortAddr, usd } from "@/lib/format";
import { useApi, useTokenList, useWhales } from "@/lib/live/client";
import { EXPLORER, explorerAddressUrl } from "@/lib/live/config";
import { useLocal } from "@/lib/local";
import { networkInfo, readTokenBalances, useWallet } from "@/lib/wallet";
import { ago } from "@/lib/live/feed";

const palette = ["#7c3aed", "#c4b5fd", "#0052ff", "#9945ff", "#e5484d", "#12a150", "#d99100", "#6b7266"];

interface Holding {
  token: Token | null;
  symbol: string;
  balance: number;
  usd: number;
}

function Connected() {
  const { account, chainId, balance, provider, refresh } = useWallet();
  const market = useTokenList();
  const native = useApi<Record<string, number>>("/api/cg/native", 120_000);
  const net = networkInfo(chainId);
  const netChain = net?.chain ?? null;
  const [raw, setRaw] = useState<{ key: string; balances: Record<string, number> } | null>(null);
  const [nonce, setNonce] = useState(0);

  const tracked = netChain
    ? market.tokens
        .filter((t) => t.chain === netChain && t.decimals !== undefined)
        .sort((x, y) => y.liquidity - x.liquidity)
        .slice(0, 40)
    : [];
  const trackedKey = tracked.map((t) => t.address).join(",");
  const ownerKey = `${account?.address}-${chainId}-${nonce}-${trackedKey}`;

  useEffect(() => {
    if (!account || account.kind !== "evm" || !provider || !tracked.length) return;
    let alive = true;
    readTokenBalances(provider, account.address, tracked.map((t) => ({ address: t.address, decimals: t.decimals ?? 18 }))).then((b) => {
      if (alive) setRaw({ key: ownerKey, balances: b });
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerKey, provider]);

  if (!account) return null;
  const loaded = raw?.key === ownerKey;
  const busy = !loaded && !!provider && tracked.length > 0;
  const balances = loaded ? raw.balances : {};
  const nativePrice = net?.chain ? (native.data?.[net.chain] ?? 0) : 0;
  const holdings: Holding[] = [
    ...(balance && balance > 0 ? [{ token: null, symbol: net?.symbol ?? "Native", balance, usd: balance * nativePrice }] : []),
    ...tracked.filter((t) => balances[t.address.toLowerCase()]).map((t) => ({ token: t, symbol: t.symbol, balance: balances[t.address.toLowerCase()], usd: balances[t.address.toLowerCase()] * t.price })),
  ].sort((a, b) => b.usd - a.usd);
  const total = holdings.reduce((a, h) => a + h.usd, 0);
  const explorer = account.kind === "evm" && net?.chain ? explorerAddressUrl(net.chain, account.address) : account.kind === "solana" ? explorerAddressUrl("sol", account.address) : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-extrabold">My wallet</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
                <Eye className="size-3" /> READ-ONLY
              </span>
              {net?.testnet && <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-bold text-warn">TESTNET</span>}
            </div>
            <button type="button" onClick={() => navigator.clipboard?.writeText(account.address)} className="mt-1 flex max-w-full items-center gap-1 font-mono text-xs text-muted">
              <span className="truncate">{account.address}</span> <Copy className="size-3 shrink-0" />
            </button>
            <div className="mt-1 text-xs text-muted">
              {account.walletName} · {account.kind === "solana" ? "Solana" : (net?.name ?? "Unknown network")}
            </div>
          </div>
          <div className="flex gap-2">
            {explorer && (
              <a href={explorer} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold">
                Explorer <ExternalLink className="size-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                refresh();
                setNonce((n) => n + 1);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold"
            >
              <RefreshCw className={cx("size-3.5", busy && "animate-spin")} /> Refresh
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
          <Stat label="Native balance" value={account.kind === "solana" ? "n/a" : balance !== null ? `${balance.toFixed(4)} ${net?.symbol}` : "n/a"} />
          <Stat label="Tracked value" value={net?.testnet || account.kind === "solana" ? "n/a" : usd(total)} />
          <Stat label="Positions" value={account.kind === "solana" ? "n/a" : holdings.length} />
          <Stat label="Network" value={account.kind === "solana" ? "Solana" : (net?.name ?? "?")} />
        </div>
      </Card>

      {account.kind === "solana" && (
        <Card className="p-4 text-sm text-muted">Solana token balances need an indexer connection, which turns on when a Helius or Birdeye key is added. Your address is connected and read-only.</Card>
      )}
      {net?.testnet && <Card className="p-4 text-sm text-muted">You are connected to a test network. Test coins have no market price, so no USD value is shown. Switch your wallet to a main network to see priced holdings.</Card>}
      {account.kind === "evm" && net && !net.chain && !net.testnet && <Card className="p-4 text-sm text-muted">{net.name} is not one of the chains WOLF tracks yet.</Card>}

      {account.kind === "evm" && net?.chain && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <CardHeader title={`Holdings on ${chainById[net.chain].name}`} />
            {busy && !holdings.length && <p className="px-4 pb-4 text-sm text-muted">Reading balances from your wallet…</p>}
            {!busy && holdings.length === 0 && <p className="px-4 pb-4 text-sm text-muted">No balance found in the coins WOLF tracks on this chain. WOLF checks the {tracked.length} most liquid tracked tokens plus the native coin.</p>}
            <ul>
              {holdings.map((h) => (
                <li key={h.symbol + (h.token?.id ?? "")} className="flex items-center gap-3 border-t border-line px-4 py-2.5">
                  {h.token ? <TokenAvatar token={h.token} size={30} /> : <span className="grid size-[30px] place-items-center rounded-full bg-brand-soft text-brand"><Wallet className="size-4" /></span>}
                  {h.token ? (
                    <Link href={`/token/${h.token.id}`} className="min-w-0 flex-1">
                      <div className="text-sm font-bold">{h.symbol}</div>
                      <div className="text-[11px] text-muted">{price(h.token.price)} · <Change value={h.token.change24h} className="text-[11px]" /></div>
                    </Link>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold">{h.symbol}</div>
                      <div className="text-[11px] text-muted">Native coin</div>
                    </div>
                  )}
                  <div className="text-right">
                    <div className="tabular text-sm font-semibold">{usd(h.usd)}</div>
                    <div className="tabular text-[11px] text-muted">{h.balance.toLocaleString("en-US", { maximumFractionDigits: 4 })}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Allocation" />
            {total > 0 ? (
              <div className="flex items-center gap-4 px-4 pb-4">
                <Donut parts={holdings.slice(0, 8).map((h, i) => ({ label: h.symbol, pct: (h.usd / total) * 100, color: palette[i % palette.length] }))} size={120} thickness={18} />
                <ul className="flex-1 space-y-1 text-xs">
                  {holdings.slice(0, 8).map((h, i) => (
                    <li key={h.symbol} className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm" style={{ background: palette[i % palette.length] }} />
                      <span className="flex-1">{h.symbol}</span>
                      <b>{((h.usd / total) * 100).toFixed(1)}%</b>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="px-4 pb-4 text-sm text-muted">Nothing to chart yet.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function Lookup({ q }: { q: string }) {
  const whales = useWhales();
  const [, setSaved] = useLocal<{ addr: string; name: string }[]>("wolf-saved-wallets", []);
  const [nick, setNick] = useState("");
  const addr = q.toLowerCase();
  const moves = whales.moves.filter((m) => m.trade.wallet.toLowerCase() === addr);
  const isEvm = /^0x[0-9a-fA-F]{40}$/.test(q);
  const chains = isEvm ? (["eth", "bsc", "base", "arb", "polygon", "avax"] as const) : (["sol"] as const);

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold">Wallet lookup</h2>
            <div className="truncate font-mono text-xs text-muted">{q}</div>
          </div>
          <div className="flex gap-2">
            <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Custom name" className="h-10 w-36 rounded-xl border border-line bg-surface-2 px-3 text-sm outline-none focus:border-brand" />
            <button
              type="button"
              onClick={() => {
                setSaved((s) => [...s.filter((x) => x.addr !== q), { addr: q, name: nick.trim() || shortAddr(q) }]);
                setNick("");
                track("follow", q);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-bold text-white"
            >
              <Bookmark className="size-4" /> Save
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {chains.map((c) => (
            <a key={c} href={explorerAddressUrl(c, q)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand/60">
              {chainById[c].name} explorer <ExternalLink className="size-3 text-muted" />
            </a>
          ))}
        </div>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader title="Activity WOLF has observed" />
        {whales.loading ? (
          <p className="px-4 pb-4 text-sm text-muted">Loading recent large trades…</p>
        ) : moves.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted">
            This wallet has no large trades in the pools WOLF is watching right now. Full portfolio lookup for any address needs an on-chain indexer key (Moralis or Helius), which turns on when keys are added. Connect your own wallet above to see
            your holdings today.
          </p>
        ) : (
          <ul>
            {moves.map((m, i) => (
              <li key={i} className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-sm">
                <span className={cx("w-10 text-xs font-bold", m.trade.kind === "buy" ? "text-up" : "text-down")}>{m.trade.kind.toUpperCase()}</span>
                <Link href={`/token/${m.token.id}`} className="flex-1 font-semibold">
                  ${m.token.symbol} <span className="text-xs font-normal text-muted">· {m.token.chain.toUpperCase()}</span>
                </Link>
                <span className="tabular font-semibold">{usd(m.trade.usd)}</span>
                <span className="w-14 text-right text-xs text-muted">{ago(m.trade.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function WalletClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { account, connecting } = useWallet();
  const q = params.get("address") ?? "";
  const [input, setInput] = useState(q);
  const [saved] = useLocal<{ addr: string; name: string }[]>("wolf-saved-wallets", []);

  return (
    <div className="space-y-4 sm:space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) router.push(`/wallet?address=${encodeURIComponent(input.trim())}`);
        }}
        className="card flex flex-col gap-2 p-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Look up any wallet address (0x… or Solana)" className="h-12 w-full rounded-xl border border-line bg-surface-2 pr-3 pl-10 font-mono text-sm outline-none focus:border-brand" />
        </div>
        <button type="submit" className="h-12 rounded-xl bg-brand px-6 text-sm font-bold text-white">
          Look up
        </button>
      </form>

      {saved.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {saved.map((s) => (
            <Link key={s.addr} href={`/wallet?address=${encodeURIComponent(s.addr)}`} className="shrink-0 rounded-full border border-brand/50 bg-brand-soft px-3.5 py-1.5 text-xs font-semibold text-brand-ink">
              ★ {s.name}
            </Link>
          ))}
        </div>
      )}

      {account && !q && <Connected />}
      {account && q && (
        <>
          <Lookup q={q} />
          <p className="text-xs text-muted">
            Showing a looked-up address. <Link href="/wallet" className="font-semibold text-accent">Back to my connected wallet</Link>
          </p>
        </>
      )}
      {!account && q && <Lookup q={q} />}
      {!account && !q && (
        <Card className="p-6 text-center">
          <Wallet className="mx-auto size-10 text-brand" />
          <h2 className="mt-2 font-display text-lg font-bold">{connecting ? "Waiting for your wallet…" : "Connect a wallet to see your holdings"}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">Use the Connect Wallet button at the top. WOLF reads your balances through your wallet and never asks you to sign or send anything. You can also look up any address above.</p>
        </Card>
      )}
      <p className="text-[11px] text-muted">
        Explorers: {Object.entries(EXPLORER).slice(0, 4).map(([c, u]) => <span key={c} className="mr-2">{u.replace("https://", "")}</span>)}
      </p>
    </div>
  );
}
