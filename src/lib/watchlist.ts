"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "wolf-watchlist";
const listeners = new Set<() => void>();
let cache: string | null = null;

function read(): string {
  try {
    cache = localStorage.getItem(KEY) ?? "[]";
  } catch {
    cache = cache ?? "[]";
  }
  return cache;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useWatchlist() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const ids: string[] = JSON.parse(raw);
  const toggle = useCallback((id: string) => {
    const cur: string[] = JSON.parse(read());
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      cache = JSON.stringify(next);
    }
    listeners.forEach((l) => l());
  }, []);
  return { ids, has: (id: string) => ids.includes(id), toggle };
}
