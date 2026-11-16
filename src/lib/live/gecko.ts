import { hashString, type ChainId, type Narrative, type Token } from "@/lib/data";
import { GECKO_NETWORK, tokenKey } from "./config";
import { getJson, num } from "./http";

const BASE = "https://api.geckoterminal.com/api/v2";
const HEADERS = { accept: "application/json;version=20230302" };

interface GtPool {
  id: string;
  attributes: {
    address: string;
    name: string;
    pool_created_at: string | null;
    fdv_usd: string | null;
    market_cap_usd: string | null;
    base_token_price_usd: string | null;
    reserve_in_usd: string | null;
    price_change_percentage: Record<string, string | null>;
    transactions: Record<string, { buys: number; sells: number; buyers: number; sellers: number }>;
    volume_usd: Record<string, string | null>;
  };
  relationships: {
    base_token: { data: { id: string } };
    dex?: { data: { id: string } };
  };
}
interface GtToken {
  id: string;
  attributes: { address: string; name: string; symbol: string; image_url: string | null; coingecko_coin_id?: string | null };
}
interface GtList {
  data: GtPool[];
  included?: (GtToken | { id: string; type: string; attributes: Record<string, unknown> })[];
}

const KEYWORDS: [Narrative, RegExp][] = [
  ["AI", /\b(ai|gpt|agent|agents|neural|llm|intelligence|bot)\b|^ai|ai$/i],
  ["RWA", /\b(rwa|gold|real estate|bond|treasury|tokenized)\b/i],
  ["DePIN", /\b(depin|compute|render|node|nodes|bandwidth|sensor)\b/i],
  ["Gaming", /\b(game|games|gaming|play|arena|quest|nft|metaverse)\b/i],
  ["DeFi", /\b(swap|finance|lend|yield|stake|staking|dex|vault|protocol|dao)\b|fi$/i],
  ["Social", /\b(social|chat|friend|friends|creator|fan|fans)\b/i],
  ["Infra", /\b(chain|layer|bridge|oracle|network|rollup)\b/i],
];
/** Narrative is inferred from the token name and symbol. Everything else defaults to Memes. */
export function classify(name: string, symbol: string): Narrative {
  const text = `${name} ${symbol}`;
  for (const [n, re] of KEYWORDS) if (re.test(text)) return n;
  return "Memes";
}

const chainOf = (net: string): ChainId | null => {
  const hit = (Object.entries(GECKO_NETWORK) as [ChainId, string][]).find(([, v]) => v === net);
  return hit ? hit[0] : null;
};

/** Rebuilds a coarse real price path from the change percentages the API reports. */
function sparkFrom(price: number, pc: Record<string, string | null>): number[] {
  const pts: number[] = [];
  for (const k of ["h24", "h6", "h1", "m30", "m15", "m5"]) {
    const c = num(pc[k], NaN);
    pts.push(Number.isFinite(c) ? price / (1 + c / 100) : NaN);
  }
  pts.push(price);
  const clean = pts.filter((v) => Number.isFinite(v) && v > 0);
  return clean.length >= 3 ? clean : [price, price, price];
}

export function poolToToken(pool: GtPool, tokens: Map<string, GtToken>): Token | null {
  const baseId = pool.relationships.base_token.data.id;
  const net = baseId.split("_")[0];
  const chain = chainOf(net);
  const tok = tokens.get(baseId);
  if (!chain || !tok) return null;
  const a = pool.attributes;
  const price = num(a.base_token_price_usd);
  if (price <= 0) return null;
  const liquidity = num(a.reserve_in_usd);
  const t24 = a.transactions.h24 ?? { buys: 0, sells: 0, buyers: 0, sellers: 0 };
  const t1 = a.transactions.h1 ?? { buys: 0, sells: 0, buyers: 0, sellers: 0 };
  const v24 = num(a.volume_usd.h24);
  const v1 = num(a.volume_usd.h1);
  const hourlyAvgVol = v24 / 24;
  const tradersAvg = (t24.buyers + t24.sellers) / 24;
  const created = a.pool_created_at ? Date.parse(a.pool_created_at) : NaN;
  const symbol = (tok.attributes.symbol || "?").replace(/^\$/, "");
  const name = tok.attributes.name || symbol;
  const fdv = num(a.fdv_usd);
  const mcap = num(a.market_cap_usd) || fdv;
  return {
    id: tokenKey(chain, tok.attributes.address),
    name,
    symbol,
    chain,
    address: tok.attributes.address,
    price,
    change1h: num(a.price_change_percentage.h1),
    change24h: num(a.price_change_percentage.h24),
    liquidity,
    liquidityChange: 0,
    volume24h: v24,
    volumeChange: hourlyAvgVol > 0 ? (v1 / hourlyAvgVol - 1) * 100 : 0,
    mcap,
    fdv: fdv || mcap,
    txns24h: t24.buys + t24.sells,
    buys: t24.buys,
    sells: t24.sells,
    holders: 0,
    holderGrowth: 0,
    traderGrowth: tradersAvg > 0 ? ((t1.buyers + t1.sellers) / tradersAvg - 1) * 100 : 0,
    ageMinutes: Number.isFinite(created) ? Math.max(1, (Date.now() - created) / 60000) : 60 * 24 * 365,
    // Filled in by the security scan:
    risk: "Medium",
    wolfScore: 0,
    auditScore: 0,
    verified: false,
    promoted: false,
    narrative: classify(name, symbol),
    lp: "UNKNOWN",
    buyTax: 0,
    sellTax: 0,
    whaleActivity: 0,
    smartMoney: 0,
    social: 0,
    spark: sparkFrom(price, a.price_change_percentage),
    hue: hashString(tok.attributes.address) % 360,
    live: true,
    image: tok.attributes.image_url && !tok.attributes.image_url.includes("missing") ? tok.attributes.image_url : undefined,
    pool: a.address,
    dex: pool.relationships.dex?.data.id,
  };
}

export function parsePools(list: GtList | null): Token[] {
  if (!list?.data) return [];
  const toks = new Map<string, GtToken>();
  for (const inc of list.included ?? []) if ((inc as { type?: string }).type === "token") toks.set(inc.id, inc as GtToken);
  const out = new Map<string, Token>();
  for (const p of list.data) {
    const t = poolToToken(p, toks);
    if (!t) continue;
    const prev = out.get(t.id);
    if (!prev || t.liquidity > prev.liquidity) out.set(t.id, t);
  }
  return [...out.values()];
}

/** Returns null when the request itself failed (rate limit or outage), so callers can avoid caching a failure. */
export async function fetchPoolsStrict(chain: ChainId, kind: "trending_pools" | "new_pools" | "pools", page = 1): Promise<Token[] | null> {
  const net = GECKO_NETWORK[chain];
  const list = await getJson<GtList>(`${BASE}/networks/${net}/${kind}?include=base_token&page=${page}`, HEADERS);
  return list ? parsePools(list) : null;
}

export async function fetchPools(chain: ChainId, kind: "trending_pools" | "new_pools" | "pools", page = 1): Promise<Token[]> {
  return (await fetchPoolsStrict(chain, kind, page)) ?? [];
}

export class UpstreamError extends Error {}

/** Returns null when the token has no pool. Throws UpstreamError when the request itself failed. */
export async function fetchTokenPool(chain: ChainId, address: string): Promise<Token | null> {
  const net = GECKO_NETWORK[chain];
  const list = await getJson<GtList>(`${BASE}/networks/${net}/tokens/${address}/pools?include=base_token&page=1`, HEADERS);
  if (list === null) throw new UpstreamError(`token pools unavailable: ${chain}`);
  if (!list.data?.length) return null;
  // The endpoint returns pools for this token; use those where it is the base asset.
  const tokens = parsePools({ data: list.data.filter((p) => p.relationships.base_token.data.id.toLowerCase().endsWith(address.toLowerCase())), included: list.included });
  return tokens[0] ?? parsePools(list)[0] ?? null;
}

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}
export async function fetchOhlcv(chain: ChainId, pool: string, timeframe: "minute" | "hour" | "day", aggregate: number, limit: number): Promise<Candle[]> {
  const net = GECKO_NETWORK[chain];
  const d = await getJson<{ data?: { attributes?: { ohlcv_list?: number[][] } } }>(
    `${BASE}/networks/${net}/pools/${pool}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}&currency=usd`,
    HEADERS,
  );
  const rows = d?.data?.attributes?.ohlcv_list ?? [];
  return rows.map(([t, o, h, l, c, v]) => ({ t: t * 1000, o, h, l, c, v })).sort((a, b) => a.t - b.t);
}

export interface Trade {
  kind: "buy" | "sell";
  usd: number;
  amount: number;
  wallet: string;
  at: number;
  tx: string;
}
export async function fetchTrades(chain: ChainId, pool: string): Promise<Trade[]> {
  const net = GECKO_NETWORK[chain];
  const d = await getJson<{ data?: { attributes: Record<string, string> }[] }>(`${BASE}/networks/${net}/pools/${pool}/trades`, HEADERS);
  return (d?.data ?? []).map((r) => {
    const a = r.attributes;
    return {
      kind: a.kind === "sell" ? "sell" : "buy",
      usd: num(a.volume_in_usd),
      amount: num(a.kind === "sell" ? a.from_token_amount : a.to_token_amount),
      wallet: a.tx_from_address ?? "",
      at: Date.parse(a.block_timestamp),
      tx: a.tx_hash ?? "",
    } satisfies Trade;
  });
}

export interface TokenInfo {
  description: string | null;
  websites: string[];
  twitter: string | null;
  telegram: string | null;
  discord: string | null;
  coingeckoId: string | null;
  gtScore: number | null;
  categories: string[];
}
export async function fetchTokenInfo(chain: ChainId, address: string): Promise<TokenInfo | null> {
  const net = GECKO_NETWORK[chain];
  const d = await getJson<{ data?: { attributes: Record<string, unknown> } }>(`${BASE}/networks/${net}/tokens/${address}/info`, HEADERS);
  const a = d?.data?.attributes;
  if (!a) return null;
  const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]).filter(Boolean) : []);
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    description: str(a.description),
    websites: arr(a.websites),
    twitter: str(a.twitter_handle),
    telegram: str(a.telegram_handle),
    discord: str(a.discord_url),
    coingeckoId: str(a.coingecko_coin_id),
    gtScore: typeof a.gt_score === "number" ? a.gt_score : null,
    categories: arr(a.categories),
  };
}
