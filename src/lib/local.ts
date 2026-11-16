"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Small persisted store (localStorage) shared across components and browser tabs.
const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, string>();

function read(key: string, fallback: string): string {
  try {
    cache.set(key, localStorage.getItem(key) ?? fallback);
  } catch {
    if (!cache.has(key)) cache.set(key, fallback);
  }
  return cache.get(key)!;
}

export function writeLocal<T>(key: string, value: T) {
  const str = JSON.stringify(value);
  cache.set(key, str);
  try {
    localStorage.setItem(key, str);
  } catch {}
  listeners.get(key)?.forEach((l) => l());
}

export function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(read(key, JSON.stringify(fallback))) as T;
  } catch {
    return fallback;
  }
}

export function useLocal<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const fb = JSON.stringify(fallback);
  const subscribe = useCallback(
    (cb: () => void) => {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(cb);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) cb();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        set!.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );
  const raw = useSyncExternalStore(subscribe, () => read(key, fb), () => fb);
  const value = useMemo(() => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return JSON.parse(fb) as T;
    }
  }, [raw, fb]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const cur = readLocal<T>(key, JSON.parse(fb) as T);
      writeLocal(key, typeof next === "function" ? (next as (p: T) => T)(cur) : next);
    },
    [key, fb],
  );
  return [value, set];
}
