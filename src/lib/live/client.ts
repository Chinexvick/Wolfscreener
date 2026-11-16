"use client";

import { useEffect, useState } from "react";
import { feed as demoFeed, tokens as demoTokens, type FeedAlert, type Token } from "@/lib/data";
import { deriveFeed } from "./feed";
import type { Market, WhaleMove } from "./tokens";

export type Status = "loading" | "live" | "demo";

const cache = new Map<string, { at: number; data: Market }>();
const TTL = 45_000;

async function load(url: string): Promise<Market | null> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = (await r.json()) as Market;
    cache.set(url, { at: Date.now(), data });
    return data;
  } catch {
    return null;
  }
}

function useMarket(url: string, refreshMs: number): { tokens: Token[]; status: Status; updated: number | null } {
  const [state, setState] = useState<{ tokens: Token[]; status: Status; updated: number | null }>(() => {
    const hit = cache.get(url);
    return hit ? { tokens: hit.data.tokens, status: hit.data.source === "live" ? "live" : "demo", updated: hit.data.updated } : { tokens: [], status: "loading", updated: null };
  });

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const m = await load(url);
      if (!alive) return;
      if (m) setState({ tokens: m.tokens, status: m.source === "live" ? "live" : "demo", updated: m.updated });
      else setState((s) => (s.tokens.length ? s : { tokens: demoTokens, status: "demo", updated: null }));
    };
    run();
    const id = setInterval(run, refreshMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [url, refreshMs]);

  return state;
}

/** Live trending tokens across all chains (falls back to demo data if the APIs are down). */
export const useTokenList = () => useMarket("/api/tokens", 60_000);
/** Newly created pools across all chains. */
export const useNewPairs = () => useMarket("/api/new-pairs", 45_000);

export function useWhales(): { moves: WhaleMove[]; loading: boolean } {
  const [state, setState] = useState<{ moves: WhaleMove[]; loading: boolean }>({ moves: [], loading: true });
  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const r = await fetch("/api/whales");
        const d = (await r.json()) as { moves: WhaleMove[] };
        if (alive) setState({ moves: d.moves ?? [], loading: false });
      } catch {
        if (alive) setState((s) => ({ ...s, loading: false }));
      }
    };
    run();
    const id = setInterval(run, 90_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return state;
}

/** Alerts derived from live data. Falls back to the sample feed while on demo data. */
export function useFeed(): { feed: FeedAlert[]; loading: boolean; status: Status; updated: number | null } {
  const m = useTokenList();
  const w = useWhales();
  return {
    feed: m.status === "live" ? deriveFeed(m.tokens, w.moves) : m.status === "demo" ? demoFeed : [],
    loading: m.status === "loading",
    status: m.status,
    updated: m.updated,
  };
}
