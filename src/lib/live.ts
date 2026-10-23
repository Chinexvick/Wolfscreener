"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Token } from "./data";

export type LiveToken = Token & { tick?: "up" | "down" };

interface Delta {
  mult: number;
  txns: number;
  tick?: "up" | "down";
}

// Simulated streaming updates on top of the demo snapshot. Swap for a websocket feed.
export function useLiveTokens(source: Token[], intervalMs = 2500): LiveToken[] {
  const [deltas, setDeltas] = useState<Record<string, Delta>>({});
  const ids = useRef<string[]>([]);
  useEffect(() => {
    ids.current = source.map((t) => t.id);
  }, [source]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDeltas((prev) => {
        const next: Record<string, Delta> = {};
        for (const id of ids.current) {
          const d = prev[id] ?? { mult: 1, txns: 0 };
          if (Math.random() > 0.18) {
            next[id] = { ...d, tick: undefined };
            continue;
          }
          const step = (Math.random() - 0.48) * 0.012;
          next[id] = { mult: d.mult * (1 + step), txns: d.txns + Math.round(Math.random() * 6), tick: step >= 0 ? "up" : "down" };
        }
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return useMemo(
    () =>
      source.map((t) => {
        const d = deltas[t.id];
        if (!d) return t;
        return {
          ...t,
          price: t.price * d.mult,
          change24h: t.change24h + (d.mult - 1) * 100,
          volume24h: t.volume24h * (1 + Math.abs(d.mult - 1) * 0.4),
          txns24h: t.txns24h + d.txns,
          tick: d.tick,
        };
      }),
    [source, deltas],
  );
}
