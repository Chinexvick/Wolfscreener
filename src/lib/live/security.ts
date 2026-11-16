import type { ChainId, LpStatus } from "@/lib/data";
import { GOPLUS_CHAIN_ID } from "./config";
import { getJson, mapLimit, num } from "./http";

const BASE = "https://api.gopluslabs.io/api/v1";

export interface HolderRow {
  address: string;
  percent: number; // 0-100
  isContract: boolean;
  locked: boolean;
  tag: string;
}

/** One normalized security scan, built from GoPlus data for either EVM or Solana. */
export interface Security {
  kind: "evm" | "solana";
  honeypot: boolean;
  cannotBuy: boolean;
  cannotSellAll: boolean;
  buyTax: number | null; // percent
  sellTax: number | null;
  transferTax: number | null;
  openSource: boolean | null;
  proxy: boolean;
  mintable: boolean;
  freezable: boolean; // solana
  ownerAddress: string | null; // null = renounced / none
  ownerPercent: number;
  creatorAddress: string | null;
  creatorPercent: number;
  hiddenOwner: boolean;
  canTakeBackOwnership: boolean;
  selfDestruct: boolean;
  externalCall: boolean;
  blacklist: boolean;
  whitelist: boolean;
  antiWhale: boolean;
  taxModifiable: boolean;
  cooldown: boolean;
  pausable: boolean;
  holderCount: number | null;
  totalSupply: number | null;
  holders: HolderRow[];
  lp: {
    status: LpStatus;
    lockedPct: number;
    burnedPct: number;
    unlockedPct: number;
    holders: HolderRow[];
    count: number;
  };
  trusted: boolean;
  cex: string[];
  launchpad: string | null;
  tokenName: string | null;
}

const ZERO = /^(0x0{40}|0x0{39}1|1{32,44}|11111111111111111111111111111111)$/i;
const BURN = /(dead|0x0{40}$)/i;
const flag = (v: unknown) => v === "1" || v === 1 || v === true;
const pctNum = (v: unknown) => num(v) * 100; // GoPlus reports ratios (0.15 = 15%)
const taxPct = (v: unknown): number | null => {
  if (v === "" || v === undefined || v === null) return null;
  const n = num(v, NaN);
  return Number.isFinite(n) ? Math.round(n * 1000) / 10 : null;
};

type Raw = Record<string, unknown>;
const rows = (v: unknown): Raw[] => (Array.isArray(v) ? (v as Raw[]) : []);

function holderRow(r: Raw): HolderRow {
  return {
    address: String(r.address ?? r.account ?? ""),
    percent: pctNum(r.percent),
    isContract: flag(r.is_contract),
    locked: flag(r.is_locked),
    tag: String(r.tag ?? ""),
  };
}

function lpSummary(raw: Raw): Security["lp"] {
  const holders = rows(raw.lp_holders).map(holderRow);
  let locked = 0;
  let burned = 0;
  let unlocked = 0;
  for (const h of holders) {
    if (BURN.test(h.address) || /dead|burn/i.test(h.tag)) burned += h.percent;
    else if (h.locked) locked += h.percent;
    else unlocked += h.percent;
  }
  const total = locked + burned + unlocked;
  if (!holders.length || total <= 0) return { status: "UNKNOWN", lockedPct: 0, burnedPct: 0, unlockedPct: 0, holders, count: num(raw.lp_holder_count) };
  const n = (x: number) => Math.round((x / total) * 1000) / 10;
  const b = n(burned);
  const l = n(locked);
  const u = Math.max(0, Math.round((100 - b - l) * 10) / 10);
  const status: LpStatus = b >= 80 ? "BURNED" : b + l >= 70 ? "LOCKED" : u >= 50 ? "UNLOCKED" : b + l > 0 ? "LOCKED" : "UNLOCKED";
  return { status, lockedPct: l, burnedPct: b, unlockedPct: u, holders, count: num(raw.lp_holder_count) };
}

function evm(raw: Raw): Security {
  const owner = String(raw.owner_address ?? "");
  const cex = (raw.is_in_cex as { cex_list?: string[] } | undefined)?.cex_list ?? [];
  return {
    kind: "evm",
    honeypot: flag(raw.is_honeypot),
    cannotBuy: flag(raw.cannot_buy),
    cannotSellAll: flag(raw.cannot_sell_all),
    buyTax: taxPct(raw.buy_tax),
    sellTax: taxPct(raw.sell_tax),
    transferTax: taxPct(raw.transfer_tax),
    openSource: raw.is_open_source === undefined ? null : flag(raw.is_open_source),
    proxy: flag(raw.is_proxy),
    mintable: flag(raw.is_mintable),
    freezable: false,
    ownerAddress: !owner || ZERO.test(owner) ? null : owner,
    ownerPercent: pctNum(raw.owner_percent),
    creatorAddress: raw.creator_address ? String(raw.creator_address) : null,
    creatorPercent: pctNum(raw.creator_percent),
    hiddenOwner: flag(raw.hidden_owner),
    canTakeBackOwnership: flag(raw.can_take_back_ownership),
    selfDestruct: flag(raw.selfdestruct),
    externalCall: flag(raw.external_call),
    blacklist: flag(raw.is_blacklisted),
    whitelist: flag(raw.is_whitelisted),
    antiWhale: flag(raw.is_anti_whale),
    taxModifiable: flag(raw.slippage_modifiable) || flag(raw.personal_slippage_modifiable),
    cooldown: flag(raw.trading_cooldown),
    pausable: flag(raw.transfer_pausable),
    holderCount: raw.holder_count !== undefined ? num(raw.holder_count) : null,
    totalSupply: raw.total_supply !== undefined ? num(raw.total_supply) : null,
    holders: rows(raw.holders).map(holderRow),
    lp: lpSummary(raw),
    trusted: flag(raw.trust_list),
    cex,
    launchpad: (raw.launchpad_token as { launchpad_name?: string } | undefined)?.launchpad_name ?? null,
    tokenName: raw.token_name ? String(raw.token_name) : null,
  };
}

function solana(raw: Raw): Security {
  const st = (k: string) => flag((raw[k] as { status?: unknown } | undefined)?.status);
  const meta = raw.metadata as { name?: string } | undefined;
  return {
    kind: "solana",
    honeypot: false,
    cannotBuy: false,
    cannotSellAll: false,
    buyTax: null,
    sellTax: null,
    transferTax: raw.transfer_fee && Object.keys(raw.transfer_fee as object).length ? 1 : 0,
    openSource: null,
    proxy: false,
    mintable: st("mintable"),
    freezable: st("freezable"),
    ownerAddress: null,
    ownerPercent: 0,
    creatorAddress: rows(raw.creators)[0]?.address ? String(rows(raw.creators)[0].address) : null,
    creatorPercent: 0,
    hiddenOwner: false,
    canTakeBackOwnership: false,
    selfDestruct: false,
    externalCall: false,
    blacklist: false,
    whitelist: false,
    antiWhale: false,
    taxModifiable: st("transfer_fee_upgradable"),
    cooldown: false,
    pausable: st("freezable"),
    holderCount: raw.holder_count !== undefined ? num(raw.holder_count) : null,
    totalSupply: raw.total_supply !== undefined ? num(raw.total_supply) : null,
    holders: rows(raw.holders).map(holderRow),
    lp: { status: "UNKNOWN", lockedPct: 0, burnedPct: 0, unlockedPct: 0, holders: [], count: 0 },
    trusted: flag(raw.trusted_token),
    cex: [],
    launchpad: null,
    tokenName: meta?.name ?? null,
  };
}

/**
 * Scans tokens one address per request (the free tier returns a single result per call).
 * Keyed by lower-cased address for EVM and by the original address for Solana.
 */
export async function fetchSecurity(chain: ChainId, addresses: string[]): Promise<Map<string, Security>> {
  const unique = [...new Set(addresses)];
  const out = new Map<string, Security>();
  if (!unique.length) return out;
  if (chain === "sol") {
    await mapLimit(unique, 6, async (addr) => {
      const d = await getJson<{ result?: Record<string, Raw> }>(`${BASE}/solana/token_security?contract_addresses=${addr}`);
      const raw = d?.result?.[addr];
      if (raw && typeof raw === "object") out.set(addr, solana(raw));
    });
    return out;
  }
  const id = GOPLUS_CHAIN_ID[chain];
  if (!id) return out;
  await mapLimit(unique, 6, async (addr) => {
    const d = await getJson<{ result?: Record<string, Raw> }>(`${BASE}/token_security/${id}?contract_addresses=${addr}`);
    const raw = d?.result?.[addr.toLowerCase()];
    if (raw && typeof raw === "object" && Object.keys(raw).length) out.set(addr.toLowerCase(), evm(raw));
  });
  return out;
}
