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
- Vercel hosting + Cron, with the SSE endpoint likely on Cloudflare Workers (Phase 3)

## Status

Phase 0 — scaffold complete. See [docs/PLAN.md](docs/PLAN.md) for the full roadmap.

## Local dev

```sh
pnpm install
cp .env.example .env.local   # fill in once KV is provisioned
pnpm dev
```

Then open http://localhost:3000.

## Layout

```
src/
  app/                 # routes (RSC by default)
  lib/
    mlb/               # upstream client + typed wrappers (swappable)
    cache/             # KV wrapper + stale-while-revalidate
```
