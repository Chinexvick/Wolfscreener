import type { ChainId } from "@/lib/data";
import { getJson } from "./http";

const DEX_CHAIN: Record<ChainId, string> = { eth: "ethereum", bsc: "bsc", sol: "solana", base: "base", ton: "ton", arb: "arbitrum", polygon: "polygon", avax: "avalanche", sui: "sui" };

interface DexPair {
  baseToken?: { address?: string };
  info?: { imageUrl?: string };
}

/** Logos DexScreener has for these tokens (up to 30 per call). Keyed by lower-cased address. */
export async function fetchDexLogos(chain: ChainId, addresses: string[]): Promise<Record<string, string>> {
  const list = addresses.slice(0, 30);
  if (!list.length) return {};
  const pairs = await getJson<DexPair[]>(`https://api.dexscreener.com/tokens/v1/${DEX_CHAIN[chain]}/${list.join(",")}`);
  const out: Record<string, string> = {};
  for (const p of pairs ?? []) {
    const a = p.baseToken?.address?.toLowerCase();
    const img = p.info?.imageUrl;
    if (a && img && !out[a]) out[a] = img;
  }
  return out;
}
