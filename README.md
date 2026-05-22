# mlb-scorebug-next

Live MLB scorebug as a Next.js 15 app — server-rendered, edge-cached, with a single upstream fan-out for live updates.

This is a rewrite of [mlb-scorebug](../mlb-scorebug) (Vite SPA) into a full-stack Next.js app, motivated by:

- **API hygiene** — the original SPA hit `statsapi.mlb.com` directly from every browser. This version proxies all upstream calls through Next route handlers with a shared KV cache, so N concurrent viewers = 1 upstream call.
- **SEO + monetization** — server-rendered game pages with per-game metadata and OG images are crawlable and viable for ads.
- **Realtime UX** — SSE fan-out from a single background warmer replaces per-client polling.

## Stack

- Next.js 15 (App Router, RSC, Turbopack)
- React 19, TypeScript (strict + `noUncheckedIndexedAccess`)
- Tailwind v4
- TanStack Query (client-side live streams + fallbacks)
- Zod (boundary validation for MLB responses)
- Vercel KV / Upstash Redis (cache + pub-sub) — wired in Phase 1
- Vercel hosting; the warmer is pinged on a 1-min schedule by [cron-job.org](https://cron-job.org) (external because Vercel Hobby caps crons at 1/day)
- SSE endpoint will likely live on Cloudflare Workers (Phase 3)

## Status

Phase 0 — scaffold complete. See [docs/PLAN.md](docs/PLAN.md) for the full roadmap.

## Local dev

```sh
pnpm install
cp .env.example .env.local   # fill in once KV is provisioned
pnpm dev
```

Then open http://localhost:3000.

## Scheduled warmer

`/api/internal/warm` refreshes today's schedule and every live game's linescore. It must be pinged once a minute in production. Setup:

1. Set `CRON_SECRET` (any random string, e.g. `openssl rand -hex 32`) in Vercel → Project → Settings → Environment Variables.
2. In [cron-job.org](https://cron-job.org), create a job:
   - **URL:** `https://<your-domain>/api/internal/warm`
   - **Schedule:** every 1 minute
   - **Headers:** `Authorization: Bearer <same CRON_SECRET>`
3. Confirm execution log shows `200` and the response body reports `liveGames` / `refreshed`.

## Layout

```
src/
  app/                 # routes (RSC by default)
  lib/
    mlb/               # upstream client + typed wrappers (swappable)
    cache/             # KV wrapper + stale-while-revalidate
```
