# WOLF Screener

**Advanced crypto intelligence, token discovery, AI audit, on-chain intelligence and project growth platform.**

WOLF Screener helps users **discover → research → audit → track → monitor → receive alerts → make their own decisions**, and helps project developers **list → verify → analyze → promote → grow**.

> WOLF Screener is **not a trading app**. There is no buy/sell, swap, order placement or trading terminal. Wallet connections are read-only.

## Core principle

**The audit cannot be bought. Visibility can.** Paid WOLF Boost placements are always labeled `PROMOTED` / `SPONSORED` and never change audit scores, risk scores, contract analysis, security findings, organic rankings, holder data or liquidity data.

## Features

| Area | Route | Highlights |
| --- | --- | --- |
| Home | `/` | Live token table, market overview, gainers, new pairs, AI insights, alerts, breakout & narrative radar, audited/verified/promoted projects |
| Screener | `/screener` | 9 chains, 17 range filters + risk/verified, presets, saved custom screens |
| WOLF AI Audit | `/audit` | Contract, sellability/tax, LP (locked/burned/unlocked/unknown), developer-wallet graph with CONFIRMED vs INFERRED links, distribution, supply, holder concentration (raw vs adjusted), whale risk, explainable score breakdown and history |
| Token page | `/token/[id]` | Overview, chart, transactions, holders, whales, smart money, AI audit, social (verified vs claim vs unverified), project, alerts |
| New Pairs | `/new-pairs` | 5m–24h windows, initial vs current liquidity, LP status, tax, audit status |
| Whales / Smart Money | `/whales`, `/smart-money` | Real-time whale feed, net flow, followable wallets with P&L where calculable |
| Wallet Intelligence | `/wallet` | Holdings, allocation, chain exposure, activity patterns, saved wallets with custom names, `@username` labels |
| Radar / Flow / Narratives | `/radar`, `/flow`, `/narratives` | Unusual-activity detection, buy/sell/liquidity/whale/holder/exchange flow, sector tracking |
| Token Battles | `/compare` | Side-by-side data, no artificial winner |
| Watchlist / Alerts / Brief | `/watchlist`, `/alerts`, `/brief` | Personal watchlist, alert rules with delivery channels, alert sharing, daily brief |
| Rewards | `/rewards` | XP levels (Wolf Cub → Hunter → Alpha → Apex), quests, anti-abuse |
| Projects / Boost / Developer Hub | `/projects`, `/boost`, `/developer` | Verification badges, Boost packages, project dashboard, promotion analytics, growth center, project assistant |
| Admin | `/admin` | Review queues and management areas |

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Cache Components) + React 19
- Tailwind CSS v4 with design tokens in `src/app/globals.css` (light + dark themes)
- `lucide-react` icons, hand-rolled SVG charts (no chart dependency)
- Mobile-first layout: bottom tab bar, bottom sheets, card lists on small screens; sidebar + tables on desktop

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Project structure

```
src/
  app/                 routes (one folder per page)
  components/
    Shell.tsx          sidebar, top bar, mobile tabs, chain context
    TokenTable.tsx     live screener table / mobile cards
    AuditReport.tsx    full WOLF AI Audit report
    widgets.tsx        homepage cards
    charts.tsx         area, donut, pressure and column charts
    ui.tsx             shared primitives (badges, score rings, cards)
  lib/
    data.ts            data layer (tokens, audits, feeds, wallets, projects)
    live.ts            streaming price/txn updates
    watchlist.ts       persisted watchlist
    format.ts          number/price formatting
    brand.ts           logo and banner artwork
```

## Data layer

The app runs on free, key-free public APIs by default (`src/lib/live/`):

| Source | Used for |
| --- | --- |
| [GeckoTerminal](https://www.geckoterminal.com/dex-api) | Trending and new pools on 9 chains, prices, market cap, FDV, volume, buy/sell counts, token logos, hourly candles, recent trades, project info |
| [CoinGecko](https://www.coingecko.com/en/api) | Global market stats, sector categories, trending coins, project listings, native-coin prices. Works key-free; set `COINGECKO_API_KEY` (free demo key) for higher limits |
| [DexScreener](https://dexscreener.com) | Logo fallback for tokens GeckoTerminal has no image for |
| [GoPlus Security](https://gopluslabs.io) | Contract flags, honeypot simulation, buy/sell tax, mint and owner permissions, LP lock status, top holders, deployer (EVM chains and Solana) |

How it fits together:

- `gecko.ts` and `security.ts` call the APIs and normalize the responses.
- `score.ts` turns the raw security scan into the explainable audit score. Every category lists its evidence, and categories with no data are left out instead of guessed.
- `tokens.ts` holds the cached server functions. Pools are cached per chain and scans per token, so a failed request is never cached and is retried on the next visit.
- `app/api/*` exposes `tokens`, `new-pairs`, `search` and `whales` to the client hooks in `client.ts`.
- If the public APIs are unreachable the UI falls back to the bundled sample data (`src/lib/data.ts`) and shows a **SAMPLE DATA** badge.

Public limits are strict (GeckoTerminal allows about 30 requests a minute), which is why responses are cached. Paid keys lift this: copy `.env.example` to `.env.local` and set `WOLF_DATA_MODE`.

Working on this device, with no account: wallet connect (read-only, EVM and Solana browsers wallets), watchlist, alert rules checked against live data every minute with an in-app toast, bell badge and optional browser notification, share to X or Telegram, saved wallets, rewards and XP from real actions.

Still sample data, because they need accounts or paid providers: the admin console, named wallet labels, social metrics and email/Telegram delivery. These are labeled in the UI.

Testnets: market-data APIs do not index testnet tokens, so tokens on Sepolia or BSC testnet will not be found by search or audit. Mainnet data is used for the test environment.

## Brand assets

Logo and banners are referenced from `src/lib/brand.ts`. To self-host them, place `logo.png`, `hero.png` and `promo.png` in `public/brand/` and point the paths there.

## Disclaimer

WOLF Screener provides informational market intelligence only. Nothing on the platform is financial advice.
