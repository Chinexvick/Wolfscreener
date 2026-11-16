"use client";

import { track } from "./activity";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ChainId } from "@/lib/data";

/* Read-only wallet connection. WOLF only asks the wallet for its address, network and balances.
   It never requests signatures or transactions. */

interface Eip1193 {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, handler: (...args: never[]) => void): void;
  removeListener?(event: string, handler: (...args: never[]) => void): void;
}
interface SolProvider {
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey?: { toString(): string } } | void>;
  disconnect?(): Promise<void>;
  publicKey?: { toString(): string } | null;
  on?(event: string, handler: (...args: never[]) => void): void;
}

export interface DetectedWallet {
  id: string;
  name: string;
  icon?: string;
  kind: "evm" | "solana";
  provider: Eip1193 | SolProvider;
}

export interface Account {
  kind: "evm" | "solana";
  address: string;
  walletId: string;
  walletName: string;
  icon?: string;
}

export interface NetworkInfo {
  name: string;
  symbol: string;
  chain: ChainId | null;
  testnet: boolean;
}

const NETWORKS: Record<number, NetworkInfo> = {
  1: { name: "Ethereum", symbol: "ETH", chain: "eth", testnet: false },
  56: { name: "BNB Chain", symbol: "BNB", chain: "bsc", testnet: false },
  8453: { name: "Base", symbol: "ETH", chain: "base", testnet: false },
  42161: { name: "Arbitrum", symbol: "ETH", chain: "arb", testnet: false },
  137: { name: "Polygon", symbol: "POL", chain: "polygon", testnet: false },
  43114: { name: "Avalanche", symbol: "AVAX", chain: "avax", testnet: false },
  11155111: { name: "Sepolia", symbol: "ETH", chain: null, testnet: true },
  97: { name: "BNB Testnet", symbol: "tBNB", chain: null, testnet: true },
  84532: { name: "Base Sepolia", symbol: "ETH", chain: null, testnet: true },
  421614: { name: "Arbitrum Sepolia", symbol: "ETH", chain: null, testnet: true },
  80002: { name: "Polygon Amoy", symbol: "POL", chain: null, testnet: true },
};

export const networkInfo = (chainId: number | null): NetworkInfo | null => (chainId === null ? null : (NETWORKS[chainId] ?? { name: `Chain ${chainId}`, symbol: "?", chain: null, testnet: false }));

interface WalletState {
  wallets: DetectedWallet[];
  account: Account | null;
  chainId: number | null;
  /** Native coin balance in whole units (ETH, BNB...). */
  balance: number | null;
  connecting: boolean;
  error: string | null;
  connect(w: DetectedWallet): Promise<void>;
  disconnect(): void;
  refresh(): void;
  provider: Eip1193 | null;
}

const Ctx = createContext<WalletState | null>(null);
const KEY = "wolf-wallet";

const w = () => window as unknown as Record<string, unknown> & { ethereum?: Eip1193 & { isMetaMask?: boolean; isRabby?: boolean; isCoinbaseWallet?: boolean } };

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Eip1193 | null>(null);
  const active = useRef<DetectedWallet | null>(null);
  const restored = useRef(false);

  // Discover installed wallets (EIP-6963 for EVM, injected objects for Solana).
  useEffect(() => {
    const found = new Map<string, DetectedWallet>();
    const push = () => setWallets([...found.values()]);
    const onAnnounce = (e: Event) => {
      const d = (e as CustomEvent<{ info: { uuid: string; name: string; icon: string; rdns?: string }; provider: Eip1193 }>).detail;
      if (!d?.info) return;
      found.set(`evm:${d.info.rdns ?? d.info.uuid}`, { id: `evm:${d.info.rdns ?? d.info.uuid}`, name: d.info.name, icon: d.info.icon, kind: "evm", provider: d.provider });
      push();
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const scan = () => {
      const win = w();
      const eth = win.ethereum;
      if (eth && ![...found.values()].some((x) => x.kind === "evm")) {
        found.set("evm:injected", { id: "evm:injected", name: eth.isMetaMask ? "MetaMask" : eth.isRabby ? "Rabby" : eth.isCoinbaseWallet ? "Coinbase Wallet" : "Browser wallet", kind: "evm", provider: eth });
      }
      const phantom = (win.phantom as { solana?: SolProvider & { isPhantom?: boolean } } | undefined)?.solana;
      if (phantom?.isPhantom) found.set("sol:phantom", { id: "sol:phantom", name: "Phantom (Solana)", kind: "solana", provider: phantom });
      const solflare = win.solflare as (SolProvider & { isSolflare?: boolean }) | undefined;
      if (solflare?.isSolflare) found.set("sol:solflare", { id: "sol:solflare", name: "Solflare (Solana)", kind: "solana", provider: solflare });
      push();
    };
    const t1 = setTimeout(scan, 250);
    const t2 = setTimeout(scan, 1200);
    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const readEvm = useCallback(async (p: Eip1193, address: string) => {
    try {
      const [cid, bal] = await Promise.all([p.request({ method: "eth_chainId" }), p.request({ method: "eth_getBalance", params: [address, "latest"] })]);
      setChainId(parseInt(String(cid), 16));
      setBalance(Number(BigInt(String(bal))) / 1e18);
    } catch {
      setBalance(null);
    }
  }, []);

  const accept = useCallback(
    async (wallet: DetectedWallet, address: string) => {
      active.current = wallet;
      track("wallet", "connect");
      setProvider(wallet.kind === "evm" ? (wallet.provider as Eip1193) : null);
      setAccount({ kind: wallet.kind, address, walletId: wallet.id, walletName: wallet.name, icon: wallet.icon });
      try {
        localStorage.setItem(KEY, wallet.id);
      } catch {}
      if (wallet.kind === "evm") await readEvm(wallet.provider as Eip1193, address);
      else {
        setChainId(null);
        setBalance(null);
      }
    },
    [readEvm],
  );

  const connect = useCallback(
    async (wallet: DetectedWallet) => {
      setConnecting(true);
      setError(null);
      try {
        if (wallet.kind === "evm") {
          const accounts = (await (wallet.provider as Eip1193).request({ method: "eth_requestAccounts" })) as string[];
          if (!accounts?.[0]) throw new Error("No account was shared.");
          await accept(wallet, accounts[0]);
        } else {
          const res = await (wallet.provider as SolProvider).connect();
          const key = res && "publicKey" in res && res.publicKey ? res.publicKey.toString() : (wallet.provider as SolProvider).publicKey?.toString();
          if (!key) throw new Error("No account was shared.");
          await accept(wallet, key);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Connection was cancelled.";
        setError(/reject|denied|cancel/i.test(msg) ? "Connection request was declined in the wallet." : msg);
      } finally {
        setConnecting(false);
      }
    },
    [accept],
  );

  const disconnect = useCallback(() => {
    const cur = active.current;
    active.current = null;
    setProvider(null);
    setAccount(null);
    setChainId(null);
    setBalance(null);
    try {
      localStorage.removeItem(KEY);
    } catch {}
    if (cur?.kind === "solana") (cur.provider as SolProvider).disconnect?.().catch(() => {});
  }, []);

  // Silently restore a previous connection (no wallet prompt).
  useEffect(() => {
    if (restored.current || !wallets.length) return;
    let id: string | null = null;
    try {
      id = localStorage.getItem(KEY);
    } catch {}
    if (!id) {
      restored.current = true;
      return;
    }
    const wallet = wallets.find((x) => x.id === id);
    if (!wallet) return;
    restored.current = true;
    (async () => {
      try {
        if (wallet.kind === "evm") {
          const accounts = (await (wallet.provider as Eip1193).request({ method: "eth_accounts" })) as string[];
          if (accounts?.[0]) await accept(wallet, accounts[0]);
        } else {
          const res = await (wallet.provider as SolProvider).connect({ onlyIfTrusted: true });
          const key = res && "publicKey" in res && res.publicKey ? res.publicKey.toString() : null;
          if (key) await accept(wallet, key);
        }
      } catch {
        /* not trusted anymore: stay disconnected */
      }
    })();
  }, [wallets, accept]);

  // Follow account and network changes made inside the wallet.
  useEffect(() => {
    const wallet = active.current;
    if (!account || !wallet) return;
    if (wallet.kind === "evm") {
      const p = wallet.provider as Eip1193;
      const onAccounts = (accs: string[]) => (accs?.[0] ? void accept(wallet, accs[0]) : disconnect());
      const onChain = () => void readEvm(p, account.address);
      p.on?.("accountsChanged", onAccounts as never);
      p.on?.("chainChanged", onChain as never);
      return () => {
        p.removeListener?.("accountsChanged", onAccounts as never);
        p.removeListener?.("chainChanged", onChain as never);
      };
    }
    const sp = wallet.provider as SolProvider;
    const onDisc = () => disconnect();
    sp.on?.("disconnect", onDisc as never);
  }, [account, accept, disconnect, readEvm]);

  const refresh = useCallback(() => {
    const wallet = active.current;
    if (wallet?.kind === "evm" && account) void readEvm(wallet.provider as Eip1193, account.address);
  }, [account, readEvm]);

  const value = useMemo<WalletState>(
    () => ({ wallets, account, chainId, balance, connecting, error, connect, disconnect, refresh, provider }),
    [wallets, account, chainId, balance, connecting, error, connect, disconnect, refresh, provider],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet(): WalletState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWallet must be used inside WalletProvider");
  return v;
}

/** Reads ERC-20 balances through the connected wallet's own network connection (read-only). */
export async function readTokenBalances(provider: Eip1193, owner: string, tokens: { address: string; decimals: number }[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const data = "0x70a08231" + owner.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(6, tokens.length) }, async () => {
      while (next < tokens.length) {
        const t = tokens[next++];
        try {
          const hex = (await provider.request({ method: "eth_call", params: [{ to: t.address, data }, "latest"] })) as string;
          const raw = BigInt(hex && hex !== "0x" ? hex : "0x0");
          if (raw > BigInt(0)) out[t.address.toLowerCase()] = Number(raw) / 10 ** t.decimals;
        } catch {
          /* token not on this network or call failed */
        }
      }
    }),
  );
  return out;
}
