import { cacheLife } from "next/cache";
import { chains, tokens as demoTokens, type ChainId, type Token } from "@/lib/data";
import { DATA_MODE, isEvm, parseTokenKey, tokenKey } from "./config";
import { UpstreamError, fetchOhlcv, fetchPoolsStrict, fetchTokenInfo, fetchTokenPool, fetchTrades, type Candle, type Trade, type TokenInfo } from "./gecko";
import { applySecurity } from "./score";
import { fetchDexLogos } from "./logos";
import { fetchSecurity, type Security } from "./security";
import { getJson, mapLimit } from "./http";

export interface Market {
  tokens: Token[];
  source: "live" | "demo";
  updated: number;
}

const ALL: ChainId[] = chains.map((c) => c.id);
const SCAN_PER_CHAIN = 10;

/** One token's security scan, cached on its own because contract flags change slowly. */
async function scanOne(chain: ChainId, address: string): Promise<Security | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
  const m = await fetchSecurity(chain, [address]);
  return m.get(isEvm(chain) ? address.toLowerCase() : address) ?? null;
}

async function enrich(list: Token[]): Promise<Token[]> {
  const byChain = new Map<ChainId, Token[]>();
  for (const t of list) byChain.set(t.chain, [...(byChain.get(t.chain) ?? []), t]);
  const out: Token[] = [];
  await Promise.all(
    [...byChain.entries()].map(async ([chain, ts]) => {
      // Scan the most liquid tokens on each chain; the rest get a market-only score.
      const sorted = [...ts].sort((a, b) => b.liquidity - a.liquidity);
      const scanned = await mapLimit(sorted.slice(0, SCAN_PER_CHAIN), 5, (t) => scanOne(chain, t.address));
      sorted.forEach((t, i) => out.push(applySecurity(t, i < scanned.length ? scanned[i] : null)));
    }),
  );
  return out;
}

/**
 * One chain's pools, cached on its own. A failed request throws, which makes the
 * cache skip this entry so the next visitor retries instead of seeing an empty chain.
 */
async function chainPools(chain: ChainId, kind: "trending_pools" | "new_pools"): Promise<Token[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 1800 });
  let list = await fetchPoolsStrict(chain, kind);
  if (list === null) throw new Error(`pools unavailable: ${chain}`);
  // Some chains have no trending list: fall back to their most active pools.
  if (list.length < 5 && kind === "trending_pools") list = [...list, ...((await fetchPoolsStrict(chain, "pools")) ?? [])];
  // Tokens with no logo on GeckoTerminal: ask DexScreener, which has logos for many newer tokens.
  const noLogo = list.filter((t) => !t.image).map((t) => t.address);
  if (noLogo.length) {
    const found = await fetchDexLogos(chain, noLogo);
    list = list.map((t) => (t.image ? t : { ...t, image: found[t.address.toLowerCase()] }));
  }
  return list;
}

async function load(kind: "trending_pools" | "new_pools"): Promise<Market> {
  if (DATA_MODE === "demo") return { tokens: demoTokens, source: "demo", updated: Date.now() };
  // Three at a time keeps us under the public 30-requests-a-minute limit.
  const results = await mapLimit(ALL, 3, async (c) => {
    try {
      return await chainPools(c, kind);
    } catch {
      return [] as Token[];
    }
  });
  const flat = results.flat();
  if (flat.length < 8) return { tokens: demoTokens, source: "demo", updated: Date.now() };
  return { tokens: await enrich(flat), source: "live", updated: Date.now() };
}

// Not cached as a whole: the parts above are, so a chain that failed gets retried on the next request.
export async function getMarket(): Promise<Market> {
  return load("trending_pools");
}

export async function getNewPairs(): Promise<Market> {
  return load("new_pools");
}

export interface TokenBundle {
  token: Token;
  security: Security | null;
  candles: Candle[];
  trades: Trade[];
  info: TokenInfo | null;
}

export async function getTokenBundle(key: string): Promise<TokenBundle | null> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 900 });
  const p = parseTokenKey(key);
  if (!p) return null;
  const base = await fetchTokenPool(p.chain, p.address);
  if (!base) return null;
  const [sec, candles, trades, info] = await Promise.all([
    fetchSecurity(p.chain, [base.address]),
    base.pool ? fetchOhlcv(p.chain, base.pool, "hour", 1, 96) : Promise.resolve([]),
    base.pool ? fetchTrades(p.chain, base.pool) : Promise.resolve([]),
    fetchTokenInfo(p.chain, base.address),
  ]);
  const security = sec.get(isEvm(p.chain) ? base.address.toLowerCase() : base.address) ?? null;
  return { token: applySecurity(base, security), security, candles, trades, info };
}

/** Finds tokens by contract address on any supported chain, or by name via search. */
export async function searchTokens(q: string): Promise<Token[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 900 });
  const query = q.trim();
  if (query.length < 2) return [];
  const evmAddr = /^0x[0-9a-fA-F]{40}$/.test(query);
  const solAddr = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query);
  if (evmAddr || solAddr) {
    const order: ChainId[] = evmAddr ? ["eth", "bsc", "base", "arb", "polygon", "avax"] : ["sol"];
    const res = await Promise.allSettled(order.map((c) => fetchTokenPool(c, query)));
    const found = res.flatMap((r) => (r.status === "fulfilled" && r.value ? [r.value] : []));
    // Nothing found while some chains failed: throw so a possibly wrong "not found" is never cached.
    if (!found.length && res.some((r) => r.status === "rejected")) throw new UpstreamError("search unavailable");
    return found.sort((a, b) => b.liquidity - a.liquidity);
  }
  const d = await getJson<{ data?: unknown[]; included?: unknown[] }>(
    `https://api.geckoterminal.com/api/v2/search/pools?query=${encodeURIComponent(query)}&include=base_token&page=1`,
    { accept: "application/json;version=20230302" },
  );
  if (!d) throw new UpstreamError("search unavailable");
  if (!d.data) return [];
  const { parsePools } = await import("./gecko");
  return parsePools(d as Parameters<typeof parsePools>[0]).slice(0, 8);
}

export interface WhaleMove {
  token: Token;
  trade: Trade;
}

export async function getWhales(): Promise<WhaleMove[]> {
  "use cache";
  cacheLife({ stale: 45, revalidate: 90, expire: 900 });
  const market = await getMarket();
  if (market.source !== "live") return [];
  const top = [...market.tokens].filter((t) => t.pool).sort((a, b) => b.volume24h - a.volume24h).slice(0, 8);
  const all = await Promise.all(top.map(async (t) => (await fetchTrades(t.chain, t.pool!)).map((trade) => ({ token: t, trade }))));
  return all
    .flat()
    .filter((m) => m.trade.usd >= Math.max(5000, m.token.liquidity * 0.004))
    .sort((a, b) => b.trade.at - a.trade.at)
    .slice(0, 30);
}

export { tokenKey };
