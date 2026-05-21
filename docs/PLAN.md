# Roadmap

## Phase 0 — Scaffold (done)
- Next.js 15 + TS strict + Tailwind v4 + App Router (`src/` layout, `@/*` alias)
- TanStack Query + Zod
- `lib/mlb/` and `lib/cache/` placeholders
- GitHub Actions CI (lint + build)
- `.env.example` for KV + cron secret

## Phase 1 — Backend proxy + shared cache
- Route handlers: `/api/schedule`, `/api/game/[gamePk]/linescore`, `/api/game/[gamePk]`
- Stale-while-revalidate in KV with versioned keys
- Vercel Cron warmer hitting `/api/internal/warm` every minute for live games
- Zod validation at the upstream boundary
- Rate limiting on `/api/*`
- Point the existing SPA at the new proxy to cut upstream traffic immediately

## Phase 2 — Migrate UI to Next
- `/`, `/game/[gamePk]`, `/date/[date]`, `/team/[abbr]`
- `generateMetadata` per page, JSON-LD `SportsEvent`, dynamic OG images
- `sitemap.ts` for the season

## Phase 3 — Realtime via SSE
- `/api/game/[gamePk]/stream` on Cloudflare Workers (long-lived connections)
- Redis pub/sub fan-out from the warmer
- `useGameStream` client hook with reconnect + polling fallback

## Phase 6 — Monetization + growth
- Sitemap submitted, internal linking, evergreen blog content
- Ezoic or AdSense, newsletter via Resend, affiliate links

## Phase 7 — Polish for interviews
- Architecture diagram, decisions/trade-offs section in README
- Playwright e2e + unit tests on cache/diff
- Loom demo + blog post

(Phases 4 and 5 — GraphQL layer and agentic features — deferred.)
