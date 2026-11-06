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

## Off-season toggle

After the World Series, flip the site into off-season mode: the homepage shows a champion banner above an empty "Today's games" section, and **nothing calls the MLB Stats API** (no Redis reads either).

The flag is the `OFFSEASON_MODE` env var (server-only). Banner content — champion name, year, message — lives in [`src/config/season.ts`](src/config/season.ts).

| Surface | `OFFSEASON_MODE=true` |
|---|---|
| `/` (homepage) | Banner + "No games on the schedule today."; `getSchedule()` is never called |
| `/api/internal/warm` | Returns `{ date, skipped: "offseason" }` without fetching |
| `/sitemap.xml` | Home page entry only |
| `/api/schedule` | Empty schedule `{ totalGames: 0, dates: [] }` |
| `/game/[gamePk]` | Unchanged — old links still work on demand (low traffic, cached) |

### Turning it on (after the World Series)

1. Update `champion` / `message` in `src/config/season.ts` if needed, and merge.
2. Vercel → Project → Settings → Environment Variables: set `OFFSEASON_MODE=true` (Production).
3. Redeploy — env var changes only apply to new deployments.
4. cron-job.org: **pause** (don't delete) the `/api/internal/warm` job. The warmer short-circuits anyway, so forgetting this step is harmless — it just wastes function invocations.
5. Check: `/` shows the banner; `/api/internal/warm` (with the bearer header) returns `skipped: "offseason"`.

### Turning it off (spring)

1. Vercel: delete `OFFSEASON_MODE` or set it to `false`.
2. Redeploy.
3. cron-job.org: **resume** the warmer job.
4. Check: `/` lists today's games; the cron-job.org log shows `200` with `scheduleRefreshed: true`.

Locally, add `OFFSEASON_MODE=true` to `.env.local` and restart `pnpm dev`.

## Layout

```
src/
  app/                 # routes (RSC by default)
  lib/
    mlb/               # upstream client + typed wrappers (swappable)
    cache/             # KV wrapper + stale-while-revalidate
```
