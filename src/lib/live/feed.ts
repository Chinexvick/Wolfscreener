import type { FeedAlert, Token } from "@/lib/data";
import { shortAddr, usd } from "@/lib/format";
import type { WhaleMove } from "./tokens";

const snap = (t: Token) => ({ id: t.id, symbol: t.symbol, image: t.image, hue: t.hue });

export function ago(ms: number): string {
  const m = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

const ORDER: Record<FeedAlert["kind"], number> = { whale: 0, audit: 1, volume: 2, holders: 3, liquidity: 4, dev: 5, smart: 6 };

/** Turns real market and security data into alerts. Every alert is computed from a measurable condition. */
export function deriveFeed(tokens: Token[], moves: WhaleMove[] = []): FeedAlert[] {
  const out: FeedAlert[] = [];
  for (const m of moves.slice(0, 12)) {
    const t = m.token;
    out.push({
      id: `w-${m.trade.tx}`,
      kind: "whale",
      title: m.trade.kind === "buy" ? "Large buy" : "Large sell",
      body: `${shortAddr(m.trade.wallet)} ${m.trade.kind === "buy" ? "bought" : "sold"} ${usd(m.trade.usd)} of $${t.symbol} on ${t.chain.toUpperCase()}.`,
      tokenId: t.id,
      when: ago(m.trade.at),
      usd: m.trade.usd,
      token: snap(t),
    });
  }
  const liquid = tokens.filter((t) => t.liquidity >= 25_000);
  for (const t of [...liquid].sort((a, b) => b.volumeChange - a.volumeChange).slice(0, 5)) {
    if (t.volumeChange < 120) continue;
    out.push({
      id: `v-${t.id}`,
      kind: "volume",
      title: "Volume surge",
      body: `$${t.symbol} 1h volume is ${t.volumeChange.toFixed(0)}% above its 24h hourly average (${usd(t.volume24h)} over 24h).`,
      tokenId: t.id,
      when: "now",
      token: snap(t),
    });
  }
  for (const t of liquid.filter((x) => x.ageMinutes < 360).sort((a, b) => b.liquidity - a.liquidity).slice(0, 4)) {
    out.push({
      id: `n-${t.id}`,
      kind: "holders",
      title: "New pool",
      body: `$${t.symbol} launched ${Math.round(t.ageMinutes)} minutes ago with ${usd(t.liquidity)} liquidity on ${t.chain.toUpperCase()}.`,
      tokenId: t.id,
      when: `${Math.max(1, Math.round(t.ageMinutes))}m ago`,
      token: snap(t),
    });
  }
  for (const t of tokens.filter((x) => x.scanned && x.liquidity >= 10_000)) {
    const reasons: string[] = [];
    if ((t.sellTax ?? 0) > 10) reasons.push(`${t.sellTax}% sell tax`);
    if (t.lp === "UNLOCKED") reasons.push("LP unlocked");
    if ((t.contractFlags ?? 0) >= 3) reasons.push(`${t.contractFlags} contract flags`);
    if (t.auditScore <= 35) reasons.push(`audit score ${t.auditScore}`);
    if (reasons.length >= 2 || t.auditScore <= 25) {
      out.push({ id: `r-${t.id}`, kind: "audit", title: "Risk flags", body: `$${t.symbol}: ${reasons.join(", ")}.`, tokenId: t.id, when: "now", token: snap(t) });
    }
  }
  return out.sort((a, b) => ORDER[a.kind] - ORDER[b.kind]).slice(0, 40);
}
