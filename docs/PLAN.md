# Roadmap

Full context for this plan lives in [`CLAUDE_SUMMARY.md`](../CLAUDE_SUMMARY.md) at the repo root.

## Phase 0 — Scaffold ✅ complete
- Next.js 16 (App Router, RSC, Turbopack), React 19, TS strict + `noUncheckedIndexedAccess`
- Tailwind v4, `src/` layout, `@/*` alias, pnpm via corepack
- TanStack Query + Zod installed
- `lib/mlb/` and `lib/cache/` stubs for Phase 1 to fill in
- GitHub Actions CI (lint + build)
- `.env.example` with KV + cron secret placeholders

## Phase 1 — Backend proxy + shared cache (next up)
- Route handlers:
  - `GET /api/schedule?date=YYYY-MM-DD` — cache 60s in KV, `s-maxage=30` on the edge
  - `GET /api/game/[gamePk]/linescore` — cache 5s in KV
  - `GET /api/game/[gamePk]` — composite (schedule + linescore + boxscore)
- Stale-while-revalidate against KV with versioned keys (`mlb:linescore:{gamePk}:v1`)
- Vercel Cron at `*/1 * * * *` hitting `/api/internal/warm`
  - Live games refreshed every minute, idle games every 5 min
  - Protected via `CRON_SECRET`
- Zod validation at the upstream boundary so schema drift fails loud
- Rate limiting on `/api/*` (Upstash Ratelimit, ~60 req/min/IP)
- Patch the existing Vite SPA at `/Users/michael/Desktop/mlb-scorebug` to point at the new `/api/*` proxy so upstream traffic drops the moment Phase 1 deploys
- **Estimate:** 2–3 days

## Phase 2 — Migrate UI to Next.js
- Routes: `/`, `/game/[gamePk]`, `/date/[date]`, `/team/[abbr]`
- Dynamic `sitemap.ts` for the season — submitted to Google Search Console
- `generateMetadata()` per page with the live score in title/OG
- JSON-LD `SportsEvent` structured data for rich results
- Dynamic OG images via `@vercel/og` (Twitter/Reddit virality)
- Port `GamesList` → RSC `app/page.tsx`
- Split `Scorebug` into RSC shell + `<LiveScorebug>` client component (takes initial cached state as prop, subscribes for updates)
- Port `App.css` → Tailwind
- **Estimate:** 3–4 days

## Phase 3 — Realtime via SSE
- `/api/game/[gamePk]/stream` endpoint — likely deployed on **Cloudflare Workers** (long-lived connections, no Vercel function duration cap)
- Warmer compares fresh linescore against cached version; on change, publishes diff to Redis pub/sub channel `game:{gamePk}` and updates KV
- `useGameStream(gamePk, initialData)` client hook:
  - Wraps `EventSource`
  - Merges diffs into local state
  - 20s heartbeat to survive proxy timeouts
  - Falls back to polling after 3 consecutive disconnects
- Decision (SSE vs WebSocket, Vercel vs Workers) documented in README for interview readiness
- **Estimate:** 2–3 days

<!--
## Phase 4 — GraphQL layer (DEFERRED)

Purely a portfolio piece — adds no production value over REST for this dataset.
Wrap the same service layer (`lib/mlb/*`) so REST and GraphQL stay in sync.

- `/api/graphql` endpoint (Apollo Server or GraphQL Yoga in a route handler)
- Schema: `Game`, `Linescore`, `Team`, `Play`, `BoxScore`
- Subscriptions over WebSocket (or graphql-sse) for live updates — reuses the
  same Redis pub/sub fan-out from Phase 3
- DataLoader for batching (mostly cosmetic at this data size, but signals intent)
- Document the trade-offs vs REST in README — interview talking point
- Estimate: 3–4 days
-->

<!--
## Phase 5 — Agentic features (DEFERRED)

The differentiator vs every other free scoreboard, and the basis for a paid tier.

- Server actions calling Claude (Anthropic SDK) over cached boxscore / play-by-play
- Features:
  - "Explain this game in 3 sentences" on-demand recap
  - Per-play plain-English narration ("Why did that count as a hit?")
  - Smart alerts worker: agent runs every minute, evaluates leverage index
    + score differential + inning, decides whether to push a notification
    ("9th inning, tying run at the plate, leverage > 2.5 — notify")
  - Win-probability narration as the game state changes
- Cache LLM outputs by game-state hash so cost is per state-change, not per user
- Gate behind a paid tier from day one ($2–4/mo) — LLM costs outpace ad RPM otherwise
- Prompt caching on the Anthropic API to keep per-call cost down
- Estimate: 1 week+
-->

## Phase 6 — Monetization + growth
- Submit sitemap to Google Search Console + Bing Webmaster Tools
- Internal linking: game pages link to both team pages; team pages link to recent + upcoming
- 5–10 evergreen articles in `/blog` ("How to read a scorebug," "What is leverage index," etc.) — utility sites without content rank poorly long-term
- Lighthouse 95+ mobile baseline before ads land
- **Ads:** Ezoic (no traffic minimum, higher RPMs than AdSense) over AdSense. 1 ad in games list, 1 below the scorebug — never above
- `<NoAds />` wrapper from day one so the future paid tier slots in without a refactor
- Newsletter via Resend (weekly "Yesterday in MLB" auto-generated from boxscore data)
- Affiliate links: Fanatics (team pages), MLB.tv (live games), StubHub (game pages), sportsbooks (geo-gated server-side)
- Launch posts: r/baseball, r/sabermetrics, HN Show, Product Hunt
- **Estimate:** ~1 week then ongoing

## Phase 7 — Polish for interviews
- Architecture diagram (Excalidraw → PNG) — browser → Vercel edge → route handlers → KV → MLB, with CF Workers SSE called out
- "Decisions and trade-offs" section in README — *the* highest-signal artifact for recruiters
- "What I'd do next" section in README — shows self-awareness
- Strict TS, no `any`, service layer cleanly separated from routes
- Zod schemas validating MLB responses at the boundary
- Playwright e2e: load list → click game → see live update
- Unit tests on cache + diff logic
- Blog post on the site: "How I went from 6,000 redundant requests/minute to 1"
- Loom demo + live demo link in README
- **Estimate:** 3–4 days
