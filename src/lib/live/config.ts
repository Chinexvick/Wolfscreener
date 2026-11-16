import type { ChainId } from "@/lib/data";

// Public, key-free data sources are used by default. When production API keys
// are added later they are read from these environment variables.
export const DATA_MODE = (process.env.WOLF_DATA_MODE ?? "public") as "public" | "demo";

export const GECKO_NETWORK: Record<ChainId, string> = {
  eth: "eth",
  bsc: "bsc",
  sol: "solana",
  base: "base",
  ton: "ton",
  arb: "arbitrum",
  polygon: "polygon_pos",
  avax: "avax",
  sui: "sui-network",
};

export const GOPLUS_CHAIN_ID: Partial<Record<ChainId, string>> = {
  eth: "1",
  bsc: "56",
  base: "8453",
  arb: "42161",
  polygon: "137",
  avax: "43114",
};

export const EXPLORER: Record<ChainId, string> = {
  eth: "https://etherscan.io",
  bsc: "https://bscscan.com",
  sol: "https://solscan.io",
  base: "https://basescan.org",
  ton: "https://tonviewer.com",
  arb: "https://arbiscan.io",
  polygon: "https://polygonscan.com",
  avax: "https://snowtrace.io",
  sui: "https://suiscan.xyz/mainnet",
};

export function explorerAddressUrl(chain: ChainId, address: string): string {
  const base = EXPLORER[chain];
  if (chain === "sol") return `${base}/account/${address}`;
  if (chain === "sui") return `${base}/object/${address}`;
  if (chain === "ton") return `${base}/${address}`;
  return `${base}/address/${address}`;
}

export const isEvm = (c: ChainId) => c in GOPLUS_CHAIN_ID;

/** Tokens are addressed as `<chain>-<address>`. Demo tokens use plain symbols. */
export function tokenKey(chain: ChainId, address: string): string {
  return `${chain}-${isEvm(chain) || chain === "ton" ? address.toLowerCase() : address}`;
}

const CHAIN_IDS = ["eth", "bsc", "sol", "base", "ton", "arb", "polygon", "avax", "sui"];

export function parseTokenKey(key: string): { chain: ChainId; address: string } | null {
  const i = key.indexOf("-");
  if (i < 0) return null;
  const chain = key.slice(0, i);
  const address = key.slice(i + 1);
  if (!CHAIN_IDS.includes(chain) || address.length < 20) return null;
  return { chain: chain as ChainId, address };
}

export function explorerTxUrl(chain: ChainId, tx: string): string | null {
  if (!tx) return null;
  const base = EXPLORER[chain];
  if (chain === "ton" || chain === "sui") return null;
  return chain === "sol" ? `${base}/tx/${tx}` : `${base}/tx/${tx}`;
}

const DEX_SLUG: Record<ChainId, string> = { eth: "ethereum", bsc: "bsc", sol: "solana", base: "base", ton: "ton", arb: "arbitrum", polygon: "polygon", avax: "avalanche", sui: "sui" };
export const dexscreenerUrl = (chain: ChainId, pool: string) => `https://dexscreener.com/${DEX_SLUG[chain]}/${pool}`;
export const geckoterminalUrl = (chain: ChainId, pool: string) => `https://www.geckoterminal.com/${GECKO_NETWORK[chain]}/pools/${pool}`;
