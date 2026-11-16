import { cacheLife } from "next/cache";
import { getJson, num } from "./http";

// Works key-free. A free CoinGecko Demo API key (COINGECKO_API_KEY) raises the rate limit.
const BASE = "https://api.coingecko.com/api/v3";
const headers = (): Record<string, string> => (process.env.COINGECKO_API_KEY ? { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY } : {});

async function cg<T>(path: string): Promise<T> {
  const d = await getJson<T>(`${BASE}${path}`, headers());
  // Throwing makes the cache skip this result, so a rate-limit blip is never stored.
  if (d === null) throw new Error(`coingecko unavailable: ${path}`);
  return d;
}

export interface GlobalStats {
  marketCap: number;
  marketCapChange24h: number;
  volume24h: number;
  btcDominance: number;
  ethDominance: number;
  coins: number;
  markets: number;
}

export async function getGlobalStats(): Promise<GlobalStats> {
  "use cache";
  cacheLife({ stale: 120, revalidate: 300, expire: 1800 });
  const d = await cg<{ data: Record<string, unknown> }>("/global");
  const x = d.data as { total_market_cap: Record<string, number>; total_volume: Record<string, number>; market_cap_percentage: Record<string, number>; market_cap_change_percentage_24h_usd: number; active_cryptocurrencies: number; markets: number };
  return {
    marketCap: num(x.total_market_cap.usd),
    marketCapChange24h: num(x.market_cap_change_percentage_24h_usd),
    volume24h: num(x.total_volume.usd),
    btcDominance: num(x.market_cap_percentage.btc),
    ethDominance: num(x.market_cap_percentage.eth),
    coins: num(x.active_cryptocurrencies),
    markets: num(x.markets),
  };
}

export interface Category {
  id: string;
  name: string;
  marketCap: number;
  change24h: number;
  volume24h: number;
  topCoins: string[];
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 });
  const d = await cg<{ id: string; name: string; market_cap: number | null; market_cap_change_24h: number | null; volume_24h: number | null; top_3_coins: string[] }[]>("/coins/categories?order=market_cap_desc");
  return d
    .filter((c) => c.market_cap && c.market_cap > 1e8)
    .slice(0, 60)
    .map((c) => ({ id: c.id, name: c.name, marketCap: num(c.market_cap), change24h: num(c.market_cap_change_24h), volume24h: num(c.volume_24h), topCoins: c.top_3_coins ?? [] }));
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  marketCap: number;
  rank: number | null;
  change24h: number;
  change7d: number;
  volume24h: number;
  spark: number[];
}

export async function getTopCoins(category: string, page: number): Promise<Coin[]> {
  "use cache";
  cacheLife({ stale: 90, revalidate: 180, expire: 1800 });
  const q = new URLSearchParams({ vs_currency: "usd", order: "market_cap_desc", per_page: "50", page: String(page), sparkline: "true", price_change_percentage: "24h,7d" });
  if (category) q.set("category", category);
  const d = await cg<Record<string, unknown>[]>(`/coins/markets?${q}`);
  return d.map((c) => ({
    id: String(c.id),
    symbol: String(c.symbol).toUpperCase(),
    name: String(c.name),
    image: String(c.image),
    price: num(c.current_price),
    marketCap: num(c.market_cap),
    rank: typeof c.market_cap_rank === "number" ? c.market_cap_rank : null,
    change24h: num(c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h),
    change7d: num(c.price_change_percentage_7d_in_currency),
    volume24h: num(c.total_volume),
    spark: ((c.sparkline_in_7d as { price?: number[] } | undefined)?.price ?? []).filter((_, i) => i % 6 === 0),
  }));
}

export interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  rank: number | null;
  price: number | null;
  change24h: number | null;
}

export async function getTrending(): Promise<TrendingCoin[]> {
  "use cache";
  cacheLife({ stale: 90, revalidate: 180, expire: 1800 });
  const d = await cg<{ coins: { item: { id: string; symbol: string; name: string; large?: string; thumb: string; market_cap_rank: number | null; data?: { price?: number; price_change_percentage_24h?: { usd?: number } } } }[] }>("/search/trending");
  return d.coins.map(({ item }) => ({
    id: item.id,
    symbol: item.symbol.toUpperCase(),
    name: item.name,
    image: item.large ?? item.thumb,
    rank: item.market_cap_rank,
    price: typeof item.data?.price === "number" ? item.data.price : null,
    change24h: typeof item.data?.price_change_percentage_24h?.usd === "number" ? item.data.price_change_percentage_24h.usd : null,
  }));
}

const NATIVE_IDS = { eth: "ethereum", bsc: "binancecoin", base: "ethereum", arb: "ethereum", polygon: "polygon-ecosystem-token", avax: "avalanche-2", sol: "solana" } as const;

/** USD prices of each supported chain's native coin. */
export async function getNativePrices(): Promise<Record<string, number>> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 900 });
  const ids = [...new Set(Object.values(NATIVE_IDS))].join(",");
  const d = await cg<Record<string, { usd?: number }>>(`/simple/price?ids=${ids}&vs_currencies=usd`);
  const out: Record<string, number> = {};
  for (const [chain, id] of Object.entries(NATIVE_IDS)) out[chain] = num(d[id]?.usd);
  return out;
}
