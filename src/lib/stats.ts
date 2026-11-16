export function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Volume-weighted average with each value clamped, so one extreme pump cannot dominate. */
export function clampedWeighted(items: { value: number; weight: number }[], lo = -100, hi = 100): number {
  const w = items.reduce((a, i) => a + i.weight, 0);
  return w > 0 ? items.reduce((a, i) => a + Math.max(lo, Math.min(hi, i.value)) * i.weight, 0) / w : 0;
}
