"use client";

import { readLocal, useLocal, writeLocal } from "./local";

// Real actions a user takes on this device. They drive XP, levels and quest progress.
export type ActivityKind = "watch" | "audit" | "alert" | "wallet" | "brief" | "compare" | "token" | "share" | "screen" | "follow";

export interface ActivityEvent {
  kind: ActivityKind;
  key: string;
  at: number;
}

const KEY = "wolf-activity";

export const XP: Record<ActivityKind, number> = { watch: 10, audit: 20, alert: 15, wallet: 50, brief: 20, compare: 10, token: 3, share: 25, screen: 15, follow: 10 };

/** Records an action once per (kind, key). Safe to call repeatedly. */
export function track(kind: ActivityKind, key: string) {
  const list = readLocal<ActivityEvent[]>(KEY, []);
  if (list.some((e) => e.kind === kind && e.key === key)) return;
  writeLocal(KEY, [...list, { kind, key, at: Date.now() }].slice(-500));
}

export const useActivity = () => useLocal<ActivityEvent[]>(KEY, [])[0];

export const LEVELS = [
  { name: "Wolf Cub", xp: 0 },
  { name: "Hunter", xp: 150 },
  { name: "Alpha", xp: 600 },
  { name: "Apex", xp: 2000 },
];

export function summarize(events: ActivityEvent[]) {
  const count = (k: ActivityKind) => events.filter((e) => e.kind === k).length;
  const xp = events.reduce((a, e) => a + XP[e.kind], 0);
  const idx = [...LEVELS].reverse().findIndex((l) => xp >= l.xp);
  const level = LEVELS[LEVELS.length - 1 - idx];
  const next = LEVELS[LEVELS.indexOf(level) + 1] ?? null;
  return { xp, level, next, count };
}
