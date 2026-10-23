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

`src/lib/data.ts` currently serves a deterministic demo dataset so every screen is fully populated. Each builder (`tokens`, `buildAudit`, `feed`, `smartWallets`, `projects`) maps 1:1 to a future API/indexer endpoint, and `useLiveTokens` is the seam for a websocket price feed. Planned integrations: chain RPCs, block-explorer verified source, DEX pair/LP data, LP lockers, transaction simulation for sellability, and wallet-label sources.

## Brand assets

Logo and banners are referenced from `src/lib/brand.ts`. To self-host them, place `logo.png`, `hero.png` and `promo.png` in `public/brand/` and point the paths there.

## Disclaimer

WOLF Screener provides informational market intelligence only. Nothing on the platform is financial advice.
