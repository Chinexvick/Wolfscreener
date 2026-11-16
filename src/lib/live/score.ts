import type { Audit, Category, Check, CheckStatus, Risk, Token } from "@/lib/data";
import { chainById } from "@/lib/data";
import { explorerAddressUrl } from "./config";
import type { Security } from "./security";
import { shortAddr } from "@/lib/format";

const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)));

/** Number of risky contract findings, used for the list view and comparisons. */
export function contractFlagCount(s: Security): number {
  return [
    s.honeypot,
    s.cannotBuy,
    s.cannotSellAll,
    s.openSource === false,
    s.proxy,
    s.mintable,
    s.freezable,
    s.hiddenOwner,
    s.canTakeBackOwnership,
    s.selfDestruct,
    s.externalCall,
    s.blacklist,
    s.pausable,
    s.taxModifiable,
    (s.sellTax ?? 0) > 10 || (s.buyTax ?? 0) > 10,
  ].filter(Boolean).length;
}

/** Top-10 share excluding liquidity pools, burn addresses and locked wallets. */
export function adjustedTop(s: Security, n: number): number {
  const lpAddrs = new Set(s.lp.holders.map((h) => h.address.toLowerCase()));
  const rows = s.holders.filter(
    (h) => !h.locked && !/dead|burn/i.test(h.tag + h.address) && !lpAddrs.has(h.address.toLowerCase()) && !/pancake|uniswap|raydium|sushi|pool|pair/i.test(h.tag),
  );
  return Math.round(rows.slice(0, n).reduce((a, h) => a + h.percent, 0) * 10) / 10;
}

export interface Score {
  overall: number;
  risk: Risk;
  categories: Category[];
}

function market(t: Token): { score: number; pos: string[]; neg: string[] } {
  const pos: string[] = [];
  const neg: string[] = [];
  let score = 60;
  const turnover = t.liquidity > 0 ? t.volume24h / t.liquidity : 0;
  if (turnover >= 0.2 && turnover <= 6) {
    score += 15;
    pos.push(`Healthy volume-to-liquidity ratio (${turnover.toFixed(1)}x)`);
  } else if (turnover > 12) {
    score -= 15;
    neg.push(`Very high volume vs liquidity (${turnover.toFixed(0)}x) can signal wash trading`);
  } else if (turnover < 0.05) {
    score -= 10;
    neg.push("Very little trading versus liquidity");
  }
  const ratio = t.buys / Math.max(1, t.sells);
  if (ratio > 0.6 && ratio < 1.7) {
    score += 10;
    pos.push("Balanced buy and sell activity");
  } else {
    score -= 10;
    neg.push(ratio >= 1.7 ? "Buys heavily outnumber sells" : "Sells heavily outnumber buys");
  }
  if (t.txns24h > 500) {
    score += 10;
    pos.push(`${t.txns24h.toLocaleString("en-US")} transactions in 24h`);
  } else if (t.txns24h < 50) {
    score -= 10;
    neg.push("Fewer than 50 transactions in 24h");
  }
  if (t.ageMinutes < 60 * 6) {
    score -= 10;
    neg.push("Pool is less than 6 hours old");
  }
  return { score: clamp(score), pos, neg };
}

export function scoreToken(t: Token, s: Security | null): Score {
  const cats: Category[] = [];
  const add = (key: string, label: string, weight: number, score: number | null, pos: string[], risks: string[], evidence: string, unavailable?: string) =>
    cats.push({ key, label, weight, score, positives: pos, risks, evidence, unavailable });

  const m = market(t);
  const liqBase = t.liquidity >= 1e6 ? 95 : t.liquidity >= 2.5e5 ? 85 : t.liquidity >= 1e5 ? 72 : t.liquidity >= 25e3 ? 52 : t.liquidity >= 5e3 ? 32 : 15;
  const lpStatus = s?.lp.status ?? "UNKNOWN";

  if (s) {
    const c: string[] = [];
    const p: string[] = [];
    let contract = 100;
    const hit = (cond: boolean, pen: number, risk: string, good?: string) => {
      if (cond) {
        contract -= pen;
        c.push(risk);
      } else if (good) p.push(good);
    };
    hit(s.honeypot, 60, "Honeypot detected: tokens may not be sellable");
    hit(s.cannotSellAll, 25, "Cannot sell the full balance");
    hit(s.cannotBuy, 40, "Buying is blocked");
    hit(s.openSource === false, 30, "Contract source is not verified", s.openSource ? "Source code is verified" : undefined);
    hit(s.proxy, 12, "Upgradeable proxy contract: logic can change");
    hit(s.mintable, 15, s.kind === "solana" ? "Mint authority is active: supply can increase" : "Owner can mint new tokens", "Supply cannot be minted");
    hit(s.freezable, 15, "Freeze authority is active: accounts can be frozen");
    hit(s.hiddenOwner, 15, "Hidden owner detected");
    hit(s.canTakeBackOwnership, 20, "Ownership can be taken back after renouncing");
    hit(s.selfDestruct, 15, "Contract can self-destruct");
    hit(s.externalCall, 8, "Makes external calls to other contracts");
    hit(s.blacklist, 10, "Can blacklist wallets");
    hit(s.pausable, 10, "Transfers can be paused");
    if (s.kind === "evm" && s.ownerAddress === null) p.push("Ownership renounced");
    else if (s.kind === "evm") {
      contract -= 8;
      c.push("Owner wallet retains admin privileges");
    }
    add("contract", "Contract Security", 20, clamp(contract), p, c, `GoPlus contract scan · ${s.kind === "solana" ? "Solana token authorities" : "EVM contract flags"}`);

    const lpPos: string[] = [];
    const lpRisk: string[] = [];
    let liq = liqBase;
    if (lpStatus === "LOCKED" || lpStatus === "BURNED") {
      liq += 5;
      lpPos.push(lpStatus === "BURNED" ? `${s.lp.burnedPct}% of LP burned` : `${s.lp.lockedPct + s.lp.burnedPct}% of LP locked or burned`);
    } else if (lpStatus === "UNLOCKED") {
      liq -= 25;
      lpRisk.push(`${s.lp.unlockedPct}% of LP is unlocked and can be withdrawn`);
    } else if (s.kind === "evm") {
      liq -= 5;
      lpRisk.push("LP ownership could not be determined");
    }
    if (t.liquidity >= 1e5) lpPos.push(`$${Math.round(t.liquidity / 1000).toLocaleString("en-US")}K liquidity`);
    else lpRisk.push(`Low liquidity ($${Math.round(t.liquidity).toLocaleString("en-US")})`);
    add("liquidity", "Liquidity", 18, clamp(liq), lpPos, lpRisk, `Pool reserve ${t.liquidity > 0 ? "$" + Math.round(t.liquidity).toLocaleString("en-US") : "n/a"} · LP holders from GoPlus`);

    if (s.holders.length) {
      const top1 = adjustedTop(s, 1);
      const top10 = adjustedTop(s, 10);
      const score = top10 < 20 ? 90 : top10 < 35 ? 75 : top10 < 50 ? 55 : top10 < 70 ? 35 : 15;
      add("holders", "Holder Distribution", 14, score, top10 < 35 ? [`Top 10 holders own ${top10}% (excluding LP and burn)`] : [], top10 >= 35 ? [`Top 10 holders own ${top10}% (excluding LP and burn)`] : [], `${s.holderCount ? s.holderCount.toLocaleString("en-US") + " holders" : "Top holders"} from GoPlus`);
      const wscore = top1 > 20 ? 20 : top1 > 10 ? 45 : top1 > 5 ? 65 : 88;
      add("whale", "Whale Risk", 8, wscore, top1 <= 5 ? [`Largest holder owns ${top1}%`] : [], top1 > 5 ? [`Largest non-LP holder owns ${top1}%`] : [], "Largest holders from GoPlus");
    } else {
      add("holders", "Holder Distribution", 14, null, [], [], "", "Holder list not returned for this token");
      add("whale", "Whale Risk", 8, null, [], [], "", "Holder list not returned for this token");
    }

    const dev = Math.max(s.creatorPercent, s.ownerPercent);
    if (s.creatorAddress || s.kind === "evm") {
      const score = dev > 30 ? 20 : dev > 15 ? 45 : dev > 5 ? 65 : 88;
      add("dev", "Developer Activity", 10, score, dev <= 5 ? [`Deployer holds ${dev.toFixed(1)}% of supply`] : [], dev > 5 ? [`Deployer or owner holds ${dev.toFixed(1)}% of supply`] : [], "Creator and owner balances from GoPlus. Wallet movement history needs an indexer.");
    } else {
      add("dev", "Developer Activity", 10, null, [], [], "", "Creator data not available for this token");
    }

    const burnPct = s.holders.filter((h) => /dead|burn/i.test(h.tag + h.address)).reduce((a, h) => a + h.percent, 0);
    add("supply", "Token Supply", 8, s.mintable ? 35 : 88, s.mintable ? [] : ["Fixed supply: no mint authority"].concat(burnPct > 1 ? [`${burnPct.toFixed(1)}% already burned`] : []), s.mintable ? ["Supply can be increased by the owner"] : [], "Mint and burn status from GoPlus");

    const tax = Math.max(s.buyTax ?? 0, s.sellTax ?? 0, s.transferTax ?? 0);
    const taxScore = s.honeypot ? 0 : clamp(100 - tax * 4 - (s.taxModifiable ? 20 : 0));
    add(
      "tax",
      "Tax Structure",
      8,
      s.kind === "solana" && s.buyTax === null ? (s.taxModifiable ? 60 : 90) : taxScore,
      tax <= 5 ? [s.kind === "solana" ? "No transfer fee detected" : `Taxes at or below 5% (buy ${s.buyTax ?? 0}%, sell ${s.sellTax ?? 0}%)`] : [],
      [...(tax > 5 ? [`High tax: buy ${s.buyTax ?? 0}%, sell ${s.sellTax ?? 0}%`] : []), ...(s.taxModifiable ? ["Tax or slippage can be modified by the owner"] : [])],
      "Measured taxes from GoPlus simulation",
    );
  } else {
    add("contract", "Contract Security", 20, null, [], [], "", "No contract scanner covers this chain yet");
    add("liquidity", "Liquidity", 18, clamp(liqBase), t.liquidity >= 1e5 ? [`$${Math.round(t.liquidity / 1000).toLocaleString("en-US")}K liquidity`] : [], t.liquidity < 1e5 ? ["Low liquidity"] : [], "Pool reserve from GeckoTerminal. LP lock data unavailable on this chain.");
    for (const [k, l, w] of [["holders", "Holder Distribution", 14], ["whale", "Whale Risk", 8], ["dev", "Developer Activity", 10], ["supply", "Token Supply", 8], ["tax", "Tax Structure", 8]] as const)
      add(k, l, w, null, [], [], "", "No contract scanner covers this chain yet");
  }

  add("market", "Market Activity", 10, m.score, m.pos, m.neg, "Volume, transactions and age from GeckoTerminal");
  add("project", "Project Information", 4, null, [], [], "", "Needs a project profile or social verification");
  add("social", "Social / Community", 0, null, [], [], "", "Needs a social data source (X API)");

  const live = cats.filter((c) => c.score !== null && c.weight > 0);
  const wsum = live.reduce((a, c) => a + c.weight, 0) || 1;
  let overall = clamp(live.reduce((a, c) => a + (c.score as number) * c.weight, 0) / wsum);
  if (s?.honeypot || s?.cannotBuy) overall = Math.min(overall, 15);
  else if (s?.cannotSellAll) overall = Math.min(overall, 35);
  // Without a contract scan the score is capped: it only reflects market behaviour.
  if (!s) overall = Math.min(overall, 60);
  const risk: Risk = overall >= 72 ? "Low" : overall >= 52 ? "Medium" : "High";
  return { overall, risk, categories: cats };
}

/** Copies the scan results onto the list-view token. */
export function applySecurity(t: Token, s: Security | null): Token {
  const sc = scoreToken(t, s);
  return {
    ...t,
    auditScore: sc.overall,
    wolfScore: Math.round(Math.min(98, sc.overall * 0.8 + Math.min(20, Math.log10(Math.max(1, t.volume24h)) * 2))),
    risk: sc.risk,
    lp: s?.lp.status ?? "UNKNOWN",
    buyTax: s?.buyTax ?? 0,
    sellTax: s?.sellTax ?? 0,
    holders: s?.holderCount ?? 0,
    verified: !!s?.trusted,
    contractFlags: s ? contractFlagCount(s) : undefined,
    top10Pct: s?.holders.length ? adjustedTop(s, 10) : undefined,
    scanned: !!s,
  };
}

const st = (ok: boolean, bad: CheckStatus = "fail"): CheckStatus => (ok ? "pass" : bad);

export function buildLiveAudit(t: Token, s: Security | null): Audit {
  const sc = scoreToken(t, s);
  const chain = chainById[t.chain];
  const contract: Check[] = [];
  const sell: Check[] = [];
  if (s) {
    contract.push(
      { label: "Source code verified", status: s.openSource === null ? "na" : st(s.openSource), detail: s.openSource === null ? "Not applicable to this chain." : s.openSource ? "Source is published and verified." : "Source is not verified, so behaviour cannot be reviewed." },
      { label: s.kind === "solana" ? "Mint authority" : "Mint function", status: st(!s.mintable), detail: s.mintable ? "New supply can be created after launch." : "No mint authority: supply is fixed." },
      { label: "Ownership", status: s.kind === "solana" ? "na" : s.ownerAddress === null ? "pass" : "warn", detail: s.kind === "solana" ? "Solana tokens use authorities, shown separately." : s.ownerAddress === null ? "Ownership renounced." : `Owner ${shortAddr(s.ownerAddress)} retains admin privileges.` },
      { label: "Hidden owner / take-back", status: st(!s.hiddenOwner && !s.canTakeBackOwnership), detail: "Checks for ownership that can be reclaimed after renouncing." },
      { label: s.kind === "solana" ? "Freeze authority" : "Pause trading", status: st(!s.pausable, "warn"), detail: s.pausable ? "Transfers can be halted." : "No pause or freeze control found." },
      { label: "Blacklist", status: st(!s.blacklist), detail: "Ability to block specific wallets." },
      { label: "Whitelist / trading gate", status: st(!s.whitelist, "warn"), detail: "Restricts who can trade." },
      { label: "Anti-whale limits", status: s.antiWhale ? "warn" : "pass", detail: s.antiWhale ? "Max transaction or wallet limits exist." : "No transaction or wallet limits." },
      { label: "Proxy / upgradeable", status: st(!s.proxy, "warn"), detail: "Upgradeable contracts can change logic later." },
      { label: "Self-destruct / external calls", status: st(!s.selfDestruct && !s.externalCall, "warn"), detail: "Risky patterns that can alter behaviour." },
    );
    sell.push(
      { label: "Honeypot simulation", status: st(!s.honeypot), detail: s.honeypot ? "Simulation shows tokens may not be sellable." : "Simulated buy and sell completed." },
      { label: "Can sell full balance", status: st(!s.cannotSellAll), detail: "Some tokens block selling your entire holding." },
      { label: `Buy tax ${s.buyTax ?? "n/a"}${s.buyTax !== null ? "%" : ""}`, status: s.buyTax === null ? "na" : s.buyTax <= 5 ? "pass" : s.buyTax <= 10 ? "warn" : "fail", detail: "Measured from simulation." },
      { label: `Sell tax ${s.sellTax ?? "n/a"}${s.sellTax !== null ? "%" : ""}`, status: s.sellTax === null ? "na" : s.sellTax <= 5 ? "pass" : s.sellTax <= 10 ? "warn" : "fail", detail: "Measured from simulation." },
      { label: "Tax can be changed", status: st(!s.taxModifiable, "warn"), detail: "Whether the owner can modify slippage or tax." },
      { label: "Trading cooldown", status: st(!s.cooldown, "warn"), detail: "Cooldowns can slow repeated trades." },
    );
  } else {
    contract.push({ label: "Contract scan", status: "na", detail: `No contract scanner covers ${chain.name} yet. Market data below is still live.` });
    sell.push({ label: "Sellability", status: "na", detail: `Honeypot simulation is not available on ${chain.name} yet.` });
  }

  const holders = s?.holders ?? [];
  const lp = s?.lp;
  const lpAddrs = new Set((lp?.holders ?? []).map((h) => h.address.toLowerCase()));
  const burn = holders.filter((h) => /dead|burn/i.test(h.tag + h.address)).reduce((a, h) => a + h.percent, 0);
  const creator = s?.creatorPercent ?? 0;
  const lpHeld = holders.filter((h) => lpAddrs.has(h.address.toLowerCase()) || /pancake|uniswap|raydium|sushi|pool|pair/i.test(h.tag)).reduce((a, h) => a + h.percent, 0);
  const known = burn + creator + lpHeld;
  const rest = holders.filter((h) => !lpAddrs.has(h.address.toLowerCase()) && !/dead|burn|pancake|uniswap|raydium/i.test(h.tag + h.address)).reduce((a, h) => a + h.percent, 0);
  const dist = holders.length
    ? [
        { label: "Liquidity pool", pct: lpHeld, color: "#7c3aed" },
        { label: "Burn address", pct: burn, color: "#6b7266" },
        { label: "Deployer", pct: creator, color: "#e5484d" },
        { label: "Other top holders", pct: Math.max(0, rest - creator), color: "#a78bfa" },
        { label: "Everyone else", pct: Math.max(0, 100 - known - Math.max(0, rest - creator)), color: "#12a150" },
      ].map((d) => ({ ...d, pct: Math.round(d.pct * 10) / 10 })).filter((d) => d.pct > 0)
    : [];

  const concentration = holders.length
    ? [1, 5, 10].map((n) => ({ tier: `Top ${n}`, raw: Math.round(holders.slice(0, n).reduce((a, h) => a + h.percent, 0) * 10) / 10, adjusted: adjustedTop(s!, n) }))
    : [];

  const nodes: Audit["nodes"] = [];
  if (s?.creatorAddress) nodes.push({ id: "creator", role: "Deployer", address: s.creatorAddress, confidence: "CONFIRMED", holdingPct: Math.round(creator * 100) / 100 });
  if (s?.ownerAddress && s.ownerAddress !== s.creatorAddress) nodes.push({ id: "owner", role: "Contract owner", address: s.ownerAddress, confidence: "CONFIRMED", holdingPct: Math.round(s.ownerPercent * 100) / 100 });
  for (const h of (lp?.holders ?? []).slice(0, 3)) nodes.push({ id: `lp-${h.address}`, role: /dead|null|burn|^0x0{40}$/i.test(h.address + h.tag) ? "LP burned" : h.locked ? "LP locker" : "LP holder", address: h.address, confidence: "CONFIRMED", holdingPct: Math.round(h.percent * 100) / 100 });
  for (const h of holders.filter((x) => !lpAddrs.has(x.address.toLowerCase())).slice(0, 5)) nodes.push({ id: `h-${h.address}`, role: h.tag || (h.isContract ? "Contract holder" : "Top holder"), address: h.address, confidence: "CONFIRMED", holdingPct: Math.round(h.percent * 100) / 100 });

  const bad = sc.categories.filter((c) => c.score !== null && c.score < 50).map((c) => c.label.toLowerCase());
  const flags = s ? contractFlagCount(s) : 0;
  const summary = !s
    ? `${t.name} trades on ${chain.name}, where a contract scan is not available yet. The score of ${sc.overall}/100 reflects live market behaviour only and is capped for that reason.`
    : s.honeypot
      ? `${t.name} failed the honeypot simulation: tokens may not be sellable. Treat this token as unsafe.`
      : `${t.name} scores ${sc.overall}/100 from a live contract scan: ${flags} contract flag${flags === 1 ? "" : "s"}, LP ${s.lp.status.toLowerCase()}, taxes ${s.buyTax ?? 0}% buy and ${s.sellTax ?? 0}% sell${bad.length ? `. Weakest areas: ${bad.slice(0, 3).join(", ")}.` : "."}`;

  return {
    live: {
      sources: ["GeckoTerminal (market data)", s ? "GoPlus (contract security, holders, LP)" : "GoPlus coverage: not available on this chain"],
      notes: {
        lpEvents: "LP add and remove history needs an indexer. It will appear once a Moralis or Alchemy key is connected.",
        graph: "Wallet-to-wallet transfer tracing needs an indexer. The wallets below are confirmed from contract data and the holder list.",
        history: "Audit history starts from the first scan. Saved history needs the database connection.",
      },
    },
    token: t,
    overall: sc.overall,
    updated: "just now",
    categories: sc.categories,
    contract,
    sellability: sell,
    lp: {
      status: lp?.status ?? "UNKNOWN",
      lockedPct: lp?.lockedPct ?? 0,
      burnedPct: lp?.burnedPct ?? 0,
      unlockedPct: lp?.unlockedPct ?? 0,
      provider: lp?.holders.find((h) => h.locked)?.tag || (lp?.status === "BURNED" ? "Dead address" : "-"),
      unlock: "-",
      initial: 0,
      events: [],
      holders: lp?.holders,
    },
    supply: [
      { label: "Total supply", value: s?.totalSupply ? compact(s.totalSupply) : "n/a" },
      { label: "Circulating (est.)", value: t.price > 0 && t.mcap > 0 ? compact(t.mcap / t.price) : "n/a" },
      { label: "Burned in top holders", value: `${burn.toFixed(1)}%` },
      { label: s?.kind === "solana" ? "Mint authority" : "Mint function", value: s ? (s.mintable ? "Active" : "Revoked / none") : "n/a" },
      { label: "Holders", value: s?.holderCount ? s.holderCount.toLocaleString("en-US") : "n/a" },
      { label: "Launchpad", value: s?.launchpad ?? "-" },
    ],
    supplyNote: !s ? "Supply controls cannot be read on this chain yet." : s.mintable ? `New ${t.symbol} can still be minted. Supply could increase without notice.` : `No mint authority: supply of ${t.symbol} is fixed.`,
    distribution: dist,
    concentration,
    nodes,
    edges: [],
    devActivity: [],
    history: [{ day: "Now", score: sc.overall, reason: "First recorded scan" }],
    summary,
  };
}

function compact(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

export const explorerLink = (t: Token, address = t.address) => explorerAddressUrl(t.chain, address);
