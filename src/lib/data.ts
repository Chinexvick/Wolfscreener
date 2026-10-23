// Demo data layer. Every value here is generated deterministically so server
// and client renders match. Replace these builders with live indexer/API calls.

export type ChainId = "eth" | "bsc" | "sol" | "base" | "ton" | "arb" | "polygon" | "avax" | "sui";

export const chains: { id: ChainId; name: string; short: string; color: string }[] = [
  { id: "eth", name: "Ethereum", short: "ETH", color: "#627eea" },
  { id: "bsc", name: "BNB Chain", short: "BSC", color: "#f0b90b" },
  { id: "sol", name: "Solana", short: "SOL", color: "#9945ff" },
  { id: "base", name: "Base", short: "BASE", color: "#0052ff" },
  { id: "ton", name: "TON", short: "TON", color: "#0098ea" },
  { id: "arb", name: "Arbitrum", short: "ARB", color: "#28a0f0" },
  { id: "polygon", name: "Polygon", short: "POL", color: "#8247e5" },
  { id: "avax", name: "Avalanche", short: "AVAX", color: "#e84142" },
  { id: "sui", name: "Sui", short: "SUI", color: "#4da2ff" },
];

export const chainById = Object.fromEntries(chains.map((c) => [c.id, c])) as Record<
  ChainId,
  (typeof chains)[number]
>;

export type Risk = "Low" | "Medium" | "High";
export type LpStatus = "LOCKED" | "BURNED" | "UNLOCKED" | "UNKNOWN";
export type Narrative = "AI" | "RWA" | "DePIN" | "DeFi" | "Gaming" | "Memes" | "Infra" | "Social";

export const narratives: Narrative[] = ["AI", "Memes", "DeFi", "RWA", "DePIN", "Gaming", "Infra", "Social"];

export interface Token {
  id: string;
  name: string;
  symbol: string;
  chain: ChainId;
  address: string;
  price: number;
  change1h: number;
  change24h: number;
  liquidity: number;
  liquidityChange: number;
  volume24h: number;
  volumeChange: number;
  mcap: number;
  fdv: number;
  txns24h: number;
  buys: number;
  sells: number;
  holders: number;
  holderGrowth: number;
  ageMinutes: number;
  risk: Risk;
  wolfScore: number;
  auditScore: number;
  verified: boolean;
  promoted: boolean;
  narrative: Narrative;
  lp: LpStatus;
  buyTax: number;
  sellTax: number;
  whaleActivity: number;
  smartMoney: number;
  social: number;
  spark: number[];
  hue: number;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hexAddr(r: () => number, sol = false): string {
  if (sol) {
    const a = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    return Array.from({ length: 44 }, () => a[Math.floor(r() * a.length)]).join("");
  }
  return "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(r() * 16)]).join("");
}

const seeds: [string, string, Narrative][] = [
  ["Lunar Fang", "LFANG", "Memes"],
  ["Nexa Mind", "NEXA", "AI"],
  ["Howl Protocol", "HOWL", "DeFi"],
  ["Ember Pup", "EMBER", "Memes"],
  ["Terra Vault", "TVLT", "RWA"],
  ["Gridnode", "GRID", "DePIN"],
  ["Pixel Pack", "PXPK", "Gaming"],
  ["Synapse Labs", "SYNL", "AI"],
  ["Moon Moth", "MOTH", "Memes"],
  ["Orbit Lend", "ORBL", "DeFi"],
  ["Cinder Cat", "CNDR", "Memes"],
  ["Forge Layer", "FRGE", "Infra"],
  ["Aurum Bond", "AURB", "RWA"],
  ["Kite Social", "KITE", "Social"],
  ["Volt Mesh", "VOLT", "DePIN"],
  ["Quest Realm", "QRLM", "Gaming"],
  ["Pebble Frog", "PBFG", "Memes"],
  ["Cortex Grid", "CRTX", "AI"],
  ["Tidal Swap", "TIDL", "DeFi"],
  ["Ironbark", "BARK", "Infra"],
  ["Snow Owl", "SNOWL", "Memes"],
  ["Helix Data", "HLXD", "AI"],
  ["Mint Harbor", "MHRB", "RWA"],
  ["Echo Chamber", "ECHO", "Social"],
  ["Dusk Runner", "DUSK", "Gaming"],
  ["Sparkplug", "SPRK", "DePIN"],
  ["Bubble Bear", "BUBR", "Memes"],
  ["Prism Yield", "PRSM", "DeFi"],
  ["Atlas Compute", "ATLC", "AI"],
  ["Rocket Roo", "ROO", "Memes"],
  ["Granite Chain", "GRNT", "Infra"],
  ["Lantern Fi", "LNTN", "DeFi"],
  ["Mango Monk", "MNGO", "Memes"],
  ["Signal Hive", "HIVE", "Social"],
  ["Basalt Estate", "BSLT", "RWA"],
  ["Nova Arena", "NOVA", "Gaming"],
  ["Wisp Agent", "WISP", "AI"],
  ["Cobalt Relay", "CBLT", "Infra"],
  ["Jelly Jet", "JLLY", "Memes"],
  ["Sable Pool", "SABL", "DeFi"],
];

function buildTokens(): Token[] {
  return seeds.map(([name, symbol, narrative], i) => {
    const r = mulberry32(1000 + i * 7919);
    const chain = chains[Math.floor(r() * chains.length)].id;
    const young = i % 4 === 3;
    const mcap = young ? 20_000 + r() * 900_000 : 1_000_000 + Math.pow(r(), 2) * 900_000_000;
    const supply = Math.pow(10, 6 + Math.floor(r() * 7));
    const p = mcap / supply;
    const liquidity = mcap * (0.04 + r() * 0.18);
    const volume24h = liquidity * (0.3 + r() * 4);
    const auditScore = Math.round(30 + r() * 66);
    const risk: Risk = auditScore >= 72 ? "Low" : auditScore >= 52 ? "Medium" : "High";
    const lpRoll = r();
    const lp: LpStatus =
      auditScore > 70 ? (lpRoll > 0.4 ? "LOCKED" : "BURNED") : lpRoll > 0.7 ? "UNLOCKED" : lpRoll > 0.5 ? "UNKNOWN" : "LOCKED";
    const txns = Math.round(volume24h / (300 + r() * 900));
    const buyShare = 0.38 + r() * 0.28;
    let v = 50;
    const spark = Array.from({ length: 32 }, () => (v = Math.max(5, v + (r() - 0.45) * 9)));
    return {
      id: symbol.toLowerCase(),
      name,
      symbol,
      chain,
      address: hexAddr(r, chain === "sol"),
      price: p,
      change1h: (r() - 0.4) * 12,
      change24h: (r() - 0.3) * 140,
      liquidity,
      liquidityChange: (r() - 0.45) * 40,
      volume24h,
      volumeChange: (r() - 0.3) * 300,
      mcap,
      fdv: mcap * (1 + r() * 1.5),
      txns24h: txns,
      buys: Math.round(txns * buyShare),
      sells: Math.round(txns * (1 - buyShare)),
      holders: Math.round(young ? 80 + r() * 3000 : 2000 + r() * 180_000),
      holderGrowth: (r() - 0.2) * 30,
      ageMinutes: young ? 3 + r() * 1400 : 2000 + r() * 900_000,
      risk,
      wolfScore: Math.round(Math.min(98, auditScore * 0.6 + r() * 40)),
      auditScore,
      verified: auditScore > 66 && r() > 0.35,
      promoted: i === 4 || i === 13 || i === 25,
      narrative,
      lp,
      buyTax: r() > 0.6 ? Math.round(r() * 6) : 0,
      sellTax: r() > 0.55 ? Math.round(r() * (risk === "High" ? 18 : 6)) : 0,
      whaleActivity: Math.round(r() * 100),
      smartMoney: Math.round(r() * 100),
      social: Math.round(r() * 100),
      spark,
      hue: Math.floor(r() * 360),
    };
  });
}

export const tokens: Token[] = buildTokens();
export const tokenById = (id: string) => tokens.find((t) => t.id === id.toLowerCase());

// ---------------------------------------------------------------- audit

export type CheckStatus = "pass" | "warn" | "fail" | "na";

export interface Check {
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface Category {
  key: string;
  label: string;
  score: number;
  weight: number;
  positives: string[];
  risks: string[];
  evidence: string;
}

export type Confidence = "CONFIRMED" | "INFERRED";

export interface WalletNode {
  id: string;
  role: string;
  address: string;
  confidence: Confidence;
  holdingPct: number;
}

export interface WalletEdge {
  from: string;
  to: string;
  amount: string;
  when: string;
}

export interface Audit {
  token: Token;
  overall: number;
  updated: string;
  categories: Category[];
  contract: Check[];
  sellability: Check[];
  lp: {
    status: LpStatus;
    lockedPct: number;
    burnedPct: number;
    unlockedPct: number;
    provider: string;
    unlock: string;
    initial: number;
    events: { label: string; amount: number; when: string; type: "add" | "remove" }[];
  };
  supply: { label: string; value: string }[];
  supplyNote: string;
  distribution: { label: string; pct: number; color: string }[];
  concentration: { tier: string; raw: number; adjusted: number }[];
  nodes: WalletNode[];
  edges: WalletEdge[];
  devActivity: { text: string; when: string; confidence: Confidence }[];
  history: { day: string; score: number; reason: string }[];
  summary: string;
}

const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];

export function buildAudit(token: Token): Audit {
  const r = mulberry32(hashString(token.address));
  const s = token.auditScore;
  const good = (bias: number) => r() * 100 < s + bias;

  const contract: Check[] = [
    { label: "Source code verified", status: good(25) ? "pass" : "fail", detail: "Source matches deployed bytecode on the chain explorer." },
    { label: "Ownership", status: good(5) ? "pass" : "warn", detail: good(0) ? "Ownership renounced to the zero address." : "Owner wallet retains admin privileges." },
    { label: "Mint function", status: good(10) ? "pass" : "fail", detail: "Checks whether new supply can be created after launch." },
    { label: "Pause trading", status: good(15) ? "pass" : "warn", detail: "Owner-controlled switch that can halt transfers." },
    { label: "Blacklist", status: good(10) ? "pass" : "fail", detail: "Ability to block specific wallets from transferring." },
    { label: "Whitelist / trading gate", status: good(20) ? "pass" : "warn", detail: "Restricts who can trade during or after launch." },
    { label: "Max transaction / wallet", status: good(20) ? "pass" : "warn", detail: "Limits on transfer size and wallet balance." },
    { label: "Tax modification", status: good(5) ? "pass" : "fail", detail: "Whether buy/sell tax can be changed after launch." },
    { label: "Proxy / upgradeable", status: good(15) ? "pass" : "warn", detail: "Upgradeable contracts can change logic later." },
    { label: "Hidden owner functions", status: good(30) ? "pass" : "fail", detail: "Admin-only functions not exposed in the standard interface." },
    { label: "Anti-bot mechanism", status: r() > 0.5 ? "na" : "pass", detail: "Launch protection logic and whether it can be re-enabled." },
  ];

  const sellability: Check[] = [
    { label: "Buy simulation", status: "pass", detail: "Simulated buy succeeded." },
    { label: "Sell simulation", status: s > 40 ? "pass" : "fail", detail: s > 40 ? "Simulated sell succeeded at expected output." : "Simulated sell reverted — tokens may not be sellable." },
    { label: "Transfer between wallets", status: good(20) ? "pass" : "warn", detail: "Wallet-to-wallet transfer simulation." },
    { label: `Buy tax ${token.buyTax}%`, status: token.buyTax <= 5 ? "pass" : "warn", detail: "Measured from simulation, not from documentation." },
    { label: `Sell tax ${token.sellTax}%`, status: token.sellTax <= 5 ? "pass" : token.sellTax <= 10 ? "warn" : "fail", detail: "Measured from simulation, not from documentation." },
    { label: "Dynamic tax", status: good(10) ? "pass" : "warn", detail: "Whether tax varies by time, size or wallet." },
  ];

  const lockedPct = token.lp === "LOCKED" ? 70 + r() * 30 : token.lp === "BURNED" ? 0 : r() * 20;
  const burnedPct = token.lp === "BURNED" ? 90 + r() * 10 : r() * 10;
  const unlockedPct = Math.max(0, 100 - lockedPct - burnedPct);

  const roles = ["Deployer", "Funding wallet", "Team wallet", "Treasury", "Marketing", "LP wallet", "Dev wallet A", "Dev wallet B", "Exchange deposit"];
  const nodes: WalletNode[] = roles.map((role, i) => ({
    id: `n${i}`,
    role,
    address: hexAddr(r, token.chain === "sol"),
    confidence: i < 4 || role === "LP wallet" ? "CONFIRMED" : "INFERRED",
    holdingPct: role === "Exchange deposit" ? 0 : +(r() * (i === 0 ? 4 : 8)).toFixed(2),
  }));
  const edges: WalletEdge[] = [
    { from: "n1", to: "n0", amount: `${(2 + r() * 20).toFixed(1)} ${chainById[token.chain].short}`, when: "launch −2d" },
    { from: "n0", to: "n2", amount: `${num(r() * 9e7)} ${token.symbol}`, when: "launch" },
    { from: "n0", to: "n3", amount: `${num(r() * 9e7)} ${token.symbol}`, when: "launch" },
    { from: "n0", to: "n5", amount: "LP seed", when: "launch" },
    { from: "n3", to: "n4", amount: `${num(r() * 2e7)} ${token.symbol}`, when: "6d ago" },
    { from: "n2", to: "n6", amount: `${num(r() * 1e7)} ${token.symbol}`, when: "3d ago" },
    { from: "n6", to: "n7", amount: `${num(r() * 9e6)} ${token.symbol}`, when: "20h ago" },
    { from: "n7", to: "n8", amount: `${num(r() * 5e6)} ${token.symbol}`, when: "2h ago" },
  ];

  const distRaw = [
    ["Liquidity pool", 8 + r() * 20, "#7c3aed"],
    ["Burn address", r() * 25, "#6b7266"],
    ["Team / deployer", 2 + r() * 14, "#e5484d"],
    ["Treasury", r() * 12, "#c4b5fd"],
    ["Marketing", r() * 5, "#d99100"],
    ["Exchanges", r() * 15, "#0052ff"],
    ["Community", 20 + r() * 40, "#12a150"],
    ["Unknown wallets", 2 + r() * 10, "#9945ff"],
  ] as const;
  const total = distRaw.reduce((a, d) => a + d[1], 0);
  const distribution = distRaw.map(([label, v, color]) => ({ label, pct: +((v / total) * 100).toFixed(1), color }));

  const top1 = 3 + r() * (100 - s) * 0.3;
  const concentration = [1, 5, 10, 20, 50, 100].map((n, i) => {
    const raw = Math.min(97, top1 * Math.pow(n, 0.55 - i * 0.01) + i * 2);
    return { tier: `Top ${n}`, raw: +raw.toFixed(1), adjusted: +(raw * (0.45 + r() * 0.2)).toFixed(1) };
  });

  const weights = [16, 14, 12, 12, 10, 8, 8, 8, 6, 6];
  const catDefs: [string, string, string[], string[]][] = [
    ["contract", "Contract Security", ["Source verified", "No hidden mint path"], ["Owner retains pause()"]],
    ["liquidity", "Liquidity", ["Liquidity depth above $250K", "LP majority locked"], ["Lock expires within 90 days"]],
    ["holders", "Holder Distribution", ["Holder count growing", "No single non-contract wallet > 5%"], ["Top 10 adjusted above 30%"]],
    ["dev", "Developer Activity", ["No dev sells in 7 days"], ["Dev-associated wallet moved supply to exchange"]],
    ["supply", "Token Supply", ["Fixed max supply", "Burns verified on-chain"], ["Unlock scheduled this month"]],
    ["tax", "Tax Structure", ["Taxes ≤ 5%"], ["Owner can change tax"]],
    ["whale", "Whale Risk", ["Whales net accumulating"], ["Large holder sent 1.8% to exchange"]],
    ["market", "Market Activity", ["Organic buyer/seller mix", "Volume consistent with liquidity"], ["Volume spike from few wallets"]],
    ["project", "Project Information", ["Website and docs reachable"], ["Team identity not verified"]],
    ["social", "Social / Community", ["Growing mentions from distinct accounts"], ["Mention spike from new accounts"]],
  ];
  const categories: Category[] = catDefs.map(([key, label, pos, risks], i) => {
    const score = Math.round(Math.max(8, Math.min(99, s + (r() - 0.5) * 40)));
    return {
      key,
      label,
      score,
      weight: weights[i],
      positives: score > 45 ? pos : pos.slice(0, 1),
      risks: score < 80 ? risks : [],
      evidence: `${3 + Math.floor(r() * 9)} on-chain data points · last checked ${1 + Math.floor(r() * 9)}m ago`,
    };
  });
  // Calibrate category scores so the weighted total matches the token's indexed audit score.
  const raw = categories.reduce((a, c) => a + c.score * c.weight, 0) / 100;
  for (const c of categories) c.score = Math.round(Math.max(5, Math.min(99, c.score + (s - raw))));
  const overall = s;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let hs = Math.min(99, overall + 10 + Math.floor(r() * 8));
  const reasons = [
    "Liquidity increased 12% from new LP additions.",
    "Developer-associated wallet transferred 2.1% of circulating supply.",
    "Top-holder concentration decreased as holder count grew.",
    "Liquidity decreased 15% after a large LP removal.",
    "No material changes. Contract permissions unchanged.",
    "Whale wallets net accumulated 1.4% of supply.",
    "Sell tax measured unchanged; LP lock extended 90 days.",
  ];
  const history = days.map((day, i) => {
    if (i === days.length - 1) hs = overall;
    else if (i > 0) hs = Math.max(10, Math.min(99, hs + Math.round((r() - 0.62) * 10)));
    return { day, score: hs, reason: reasons[(i + Math.floor(r() * 3)) % reasons.length] };
  });

  const ticker = token.symbol;
  return {
    token,
    overall,
    updated: "2 min ago",
    categories,
    contract,
    sellability,
    lp: {
      status: token.lp,
      lockedPct: +lockedPct.toFixed(1),
      burnedPct: +burnedPct.toFixed(1),
      unlockedPct: +unlockedPct.toFixed(1),
      provider: token.lp === "LOCKED" ? pick(r, ["UNCX", "Team.Finance", "PinkLock", "Streamflow"]) : token.lp === "BURNED" ? "Dead address" : "—",
      unlock: token.lp === "LOCKED" ? `${30 + Math.floor(r() * 300)} days` : "—",
      initial: token.liquidity * (0.4 + r() * 0.7),
      events: [
        { label: "LP added", amount: token.liquidity * 0.4, when: "launch", type: "add" },
        { label: "LP added", amount: token.liquidity * 0.15, when: "5d ago", type: "add" },
        { label: "LP removed", amount: token.liquidity * 0.08, when: "1d ago", type: "remove" },
        { label: "LP added", amount: token.liquidity * 0.05, when: "3h ago", type: "add" },
      ],
    },
    supply: [
      { label: "Total supply", value: num(token.fdv / token.price) },
      { label: "Circulating", value: num(token.mcap / token.price) },
      { label: "Max supply", value: good(10) ? num(token.fdv / token.price) : "Uncapped" },
      { label: "Burned", value: `${(r() * 30).toFixed(1)}%` },
      { label: "Mint authority", value: good(10) ? "Revoked" : "Active (owner)" },
      { label: "Next unlock", value: r() > 0.5 ? `${Math.floor(r() * 60)}d · ${(r() * 4).toFixed(1)}%` : "None scheduled" },
    ],
    supplyNote: good(10)
      ? `Supply of ${ticker} is fixed. Mint authority is revoked, so no wallet can create new tokens.`
      : `The owner wallet can still mint new ${ticker}. Supply could increase without notice — this is the largest supply risk.`,
    distribution,
    concentration,
    nodes,
    edges,
    devActivity: [
      { text: `Dev wallet B sent ${num(r() * 5e6)} ${ticker} to an exchange-associated deposit wallet`, when: "2h ago", confidence: "INFERRED" },
      { text: `Treasury transferred ${num(r() * 2e7)} ${ticker} to the marketing wallet`, when: "6d ago", confidence: "CONFIRMED" },
      { text: `Deployer funded by a wallet that also funded 3 earlier token launches`, when: "launch", confidence: "INFERRED" },
    ],
    history,
    summary:
      overall >= 72
        ? `${token.name} shows a healthy profile: verified source, ${token.lp.toLowerCase()} liquidity and broad holder distribution. Main thing to watch: developer-associated wallets moving supply toward exchanges.`
        : overall >= 52
          ? `${token.name} has mixed signals. The contract is readable but the owner keeps meaningful permissions, and ${token.lp === "LOCKED" ? "the LP lock is finite" : "LP status needs attention"}. Review the risk items before deciding.`
          : `${token.name} carries several measurable risks: owner-controlled permissions${token.lp === "UNLOCKED" || token.lp === "UNKNOWN" ? `, ${token.lp.toLowerCase()} liquidity` : ""} and concentrated holdings. Treat any claims about this token with caution.`,
  };
}

function num(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

// ---------------------------------------------------------------- feeds

export type AlertKind = "whale" | "liquidity" | "dev" | "smart" | "volume" | "audit" | "holders";

export interface FeedAlert {
  id: string;
  kind: AlertKind;
  title: string;
  body: string;
  tokenId: string;
  when: string;
  usd?: number;
}

export const alertMeta: Record<AlertKind, { label: string; emoji: string; tone: "up" | "down" | "warn" | "brand" }> = {
  whale: { label: "Whale", emoji: "🐋", tone: "brand" },
  liquidity: { label: "Liquidity", emoji: "💧", tone: "down" },
  dev: { label: "Developer", emoji: "🛠️", tone: "warn" },
  smart: { label: "Smart Money", emoji: "🧠", tone: "up" },
  volume: { label: "Volume", emoji: "📈", tone: "up" },
  audit: { label: "Audit", emoji: "🛡️", tone: "warn" },
  holders: { label: "Holders", emoji: "👥", tone: "up" },
};

export const walletLabels = ["@WolfAlpha", "@WhaleHunter", "@SmartMoneyBenin", "@NightOwl", "@ApexFlow", "@IronHands", "@QuietWhale", "@DeltaPack"];

function buildFeed(): FeedAlert[] {
  const r = mulberry32(42);
  const out: FeedAlert[] = [];
  const kinds: AlertKind[] = ["whale", "whale", "smart", "liquidity", "dev", "volume", "audit", "holders", "whale", "smart"];
  for (let i = 0; i < 36; i++) {
    const t = tokens[Math.floor(r() * tokens.length)];
    const kind = kinds[Math.floor(r() * kinds.length)];
    const v = Math.round((40 + r() * 600) * 1000);
    const who = walletLabels[Math.floor(r() * walletLabels.length)];
    const when = `${1 + i * 3 + Math.floor(r() * 3)}m ago`;
    const texts: Record<AlertKind, [string, string]> = {
      whale: r() > 0.5 ? ["Whale accumulation", `${who} accumulated $${num(v)} of $${t.symbol} over 6h.`] : ["Whale transfer", `Wallet ${hexAddr(r).slice(0, 8)}… moved $${num(v)} of $${t.symbol} to an exchange-associated wallet.`],
      liquidity: ["Liquidity removed", `$${num(v / 3)} liquidity removed from $${t.symbol} within the last 20 minutes.`],
      dev: ["Developer movement", `Developer-associated wallet transferred ${(r() * 8).toFixed(1)}M $${t.symbol} to a new wallet.`],
      smart: ["Smart money buy", `${who} opened a $${num(v / 2)} position in $${t.symbol}.`],
      volume: ["Volume surge", `$${t.symbol} 1h volume up ${Math.round(150 + r() * 600)}% vs 24h average.`],
      audit: ["Audit score change", `$${t.symbol} audit score ${t.auditScore + 9} → ${t.auditScore}: liquidity −15%, dev wallet moved 3.2% of supply.`],
      holders: ["Holder growth", `$${t.symbol} added ${Math.round(200 + r() * 3000)} holders in 24h.`],
    };
    out.push({ id: `a${i}`, kind, title: texts[kind][0], body: texts[kind][1], tokenId: t.id, when, usd: v });
  }
  return out;
}

export const feed: FeedAlert[] = buildFeed();

export interface SmartWallet {
  label: string;
  address: string;
  chain: ChainId;
  pnl30d: number;
  winRate: number;
  trades30d: number;
  topHolding: string;
  value: number;
  followers: number;
  recent: { tokenId: string; side: "Bought" | "Sold"; usd: number; when: string }[];
}

export const smartWallets: SmartWallet[] = walletLabels.map((label, i) => {
  const r = mulberry32(500 + i * 31);
  return {
    label,
    address: hexAddr(r),
    chain: chains[Math.floor(r() * 4)].id,
    pnl30d: (r() - 0.2) * 900_000,
    winRate: 35 + r() * 45,
    trades30d: Math.round(20 + r() * 300),
    topHolding: tokens[Math.floor(r() * tokens.length)].symbol,
    value: 100_000 + r() * 9_000_000,
    followers: Math.round(r() * 24_000),
    recent: Array.from({ length: 5 }, (_, k) => ({
      tokenId: tokens[Math.floor(r() * tokens.length)].id,
      side: r() > 0.4 ? ("Bought" as const) : ("Sold" as const),
      usd: Math.round(5_000 + r() * 400_000),
      when: `${1 + k * 4 + Math.floor(r() * 4)}h ago`,
    })),
  };
});

export interface Project {
  tokenId: string;
  description: string;
  verifications: { label: string; done: boolean }[];
  followers: number;
  website: string;
}

export const projects: Project[] = tokens
  .filter((t) => t.auditScore > 50)
  .slice(0, 12)
  .map((t, i) => {
    const r = mulberry32(900 + i);
    return {
      tokenId: t.id,
      description: `${t.name} is building in ${t.narrative}. ${pick(r, [
        "Mainnet live with an active developer community.",
        "Public roadmap with quarterly delivery updates.",
        "Audited contracts and an open-source SDK.",
        "Community-governed treasury and transparent tokenomics.",
      ])}`,
      verifications: [
        { label: "Contract", done: true },
        { label: "Project info", done: t.verified || r() > 0.4 },
        { label: "Socials", done: t.verified || r() > 0.5 },
        { label: "Team identity", done: t.verified && r() > 0.5 },
        { label: "Official contract", done: t.verified },
      ],
      followers: Math.round(500 + r() * 60_000),
      website: `${t.id}.xyz`,
    };
  });

export const boostPackages = [
  { name: "Starter", blurb: "Basic visibility for new launches.", features: ["Featured in New Projects (24h)", "PROMOTED tag on token page", "Basic impressions report"] },
  { name: "Growth", blurb: "More exposure with analytics.", features: ["Everything in Starter", "Trending sponsorship slot (3d)", "Sponsored announcement", "Campaign analytics"] },
  { name: "Pro", blurb: "Large multi-placement campaign.", features: ["Everything in Growth", "Homepage banner (7d)", "Narrative promotion", "Quest campaign with funded rewards"], popular: true },
  { name: "Enterprise", blurb: "Large-scale marketing & analytics.", features: ["Everything in Pro", "Custom placements", "Dedicated campaign manager", "Advanced conversion analytics"] },
];

export const levels = [
  { name: "Wolf Cub", xp: 0 },
  { name: "Hunter", xp: 1500 },
  { name: "Alpha", xp: 6000 },
  { name: "Apex", xp: 20000 },
];

export const quests = [
  { project: "nexa", title: "Learn how Nexa Mind agents work", xp: 120, reward: "25 NEXA pool", done: 3, total: 4 },
  { project: "grid", title: "Read the Gridnode tokenomics", xp: 80, reward: "XP only", done: 1, total: 2 },
  { project: "howl", title: "Follow Howl Protocol + set a liquidity alert", xp: 60, reward: "XP only", done: 0, total: 2 },
  { project: "tvlt", title: "Terra Vault RWA basics (3 lessons)", xp: 200, reward: "$500 pool", done: 0, total: 3 },
  { project: "kite", title: "Report a suspicious contract (verified)", xp: 300, reward: "XP + badge", done: 0, total: 1 },
];

// Builds a placeholder token profile for a contract that is not in the index yet.
export function tokenFromAddress(address: string): Token {
  const known = tokens.find((t) => t.address.toLowerCase() === address.toLowerCase());
  if (known) return known;
  const base = tokens[hashString(address) % tokens.length];
  const sym = address.replace(/^0x/, "").slice(0, 4).toUpperCase();
  const isSol = !address.startsWith("0x");
  return {
    ...base,
    id: base.id,
    name: `Unlisted ${sym}`,
    symbol: sym,
    address,
    chain: isSol ? "sol" : base.chain === "sol" ? "eth" : base.chain,
    verified: false,
    promoted: false,
    hue: hashString(address) % 360,
  };
}
export const rng = mulberry32;
