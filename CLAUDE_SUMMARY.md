# Project Summary — mlb-scorebug-next

This document captures the full context of the planning conversation so a new chat can resume work without losing state.

---

## Goals (owner-stated)

1. **Full rewrite** of the existing `mlb-scorebug` Vite SPA into a production-grade app.
2. **Job-interview portfolio piece** demonstrating skill in React/Next.js, GraphQL, API/backend, and embedded agentic workflows.
3. **Launch live and monetize** as a "utility" site (Google Ads or alternatives).
4. **Learn** along the way.

**Constraint:** the MLB stats API (`statsapi.mlb.com`) is third-party, undocumented, free, no SLA. Architecture must assume it can be rate-limited, broken, or replaced.

---

## Original repo (the thing being rewritten)

Location: `/Users/michael/Desktop/mlb-scorebug` (Vite + React 19 + React Router SPA).

- `src/components/Gamelist.tsx` — fetches today's schedule from MLB on mount.
- `src/pages/Scorebug.tsx` — polls linescore every 10s via `usePolling` hook.
- `src/hooks/usePolling.ts` — has exponential backoff on errors.
- `src/hooks/usePageVisibility.ts` — pauses polling when tab hidden.
- **Problem:** every browser calls `statsapi.mlb.com` directly. N viewers × redundant polls = looks like a scraper, scales badly, no SEO, no monetization surface.

---

## Key architectural decisions reached

### REST vs GraphQL
**REST is the right primary interface.** Data shape is fixed, no client variability. GraphQL added in Phase 4 (deferred) purely as a portfolio piece over the same service layer.

### SPA + custom backend vs Next.js
**Next.js (App Router).** Reasons:
- SEO + Google Ads viability require SSR
- One repo / one deploy with route handlers as the backend proxy
- Vercel edge cache + KV give server-side caching nearly for free
- Streaming + RSC pair well with live scores
- Agentic workflows fit cleanly as route handlers / server actions

Trade-off (losing the "standalone Express backend" talking point) mitigated by structuring `lib/mlb/` as a clear service module, and optionally splitting GraphQL or SSE onto a separate Cloudflare Workers service later.

### Realtime: SSE, not WebSocket
One-way push, no protocol upgrade, auto-reconnect in browser, works through every CDN. Cloudflare Workers recommended for the SSE endpoint because Vercel serverless functions cap connection duration (60s Hobby / 300s Pro).

### Fan-out pattern (the core architectural move)
A single background **cron warmer** polls MLB once per live game, writes to **Vercel KV** (Upstash Redis), and **publishes diffs** to a Redis pub/sub channel. All viewers subscribe via SSE. **N viewers = 1 upstream call.**

### Monetization stack (recommended)
Layer in this order as traffic grows:
1. Newsletter (Resend) — highest long-term value
2. Affiliate links (Fanatics, MLB.tv, StubHub, sportsbooks where legal)
3. Programmatic ads — start with **Ezoic** (no traffic minimum, higher RPMs than AdSense)
4. Paid agentic tier ($2–4/mo) — smart alerts, AI recaps, leverage-index narration
5. Embeddable widget for blogs (B2B long tail)

---

## Phase plan

User explicitly wants to execute phases **0, 1, 2, 3, 6, 7**. Phases 4 (GraphQL) and 5 (agentic features) are **deferred**.

### Phase 0 — Scaffold ✅ COMPLETE
Done in this session. See "Current state" below.

### Phase 1 — Backend proxy + shared cache (NEXT UP)
- Route handlers:
  - `GET /api/schedule?date=YYYY-MM-DD` — cache 60s in KV, `s-maxage=30` for edge
  - `GET /api/game/[gamePk]/linescore` — cache 5s in KV
  - `GET /api/game/[gamePk]` — composite (schedule + linescore + boxscore)
- Stale-while-revalidate cache pattern; versioned keys like `mlb:linescore:{gamePk}:v1`
- Vercel Cron at `*/1 * * * *` hitting `/api/internal/warm` (live games every minute, idle games every 5 min)
- Zod validation at the upstream boundary
- Rate limiting on `/api/*` (Upstash Ratelimit, ~60 req/min/IP)
- **Also: patch the existing Vite SPA** to point at the new `/api/*` proxy so upstream traffic drops the moment Phase 1 deploys. (User was asked about this at end of last turn — answer pending.)
- Estimated: 2–3 days

### Phase 2 — Migrate UI to Next.js
- Routes: `/`, `/game/[gamePk]`, `/date/[date]`, `/team/[abbr]`, dynamic `sitemap.ts`
- `generateMetadata()` with live score in title/OG
- JSON-LD `SportsEvent` structured data
- Dynamic OG images via `@vercel/og` (Twitter/Reddit virality)
- Port `GamesList` → RSC `app/page.tsx`; split `Scorebug` into RSC shell + `<LiveScorebug>` client component
- Port `App.css` → Tailwind
- Estimated: 3–4 days

### Phase 3 — Realtime via SSE
- `/api/game/[gamePk]/stream` (probably on **Cloudflare Workers**, not Vercel)
- Redis pub/sub channel `game:{gamePk}` — warmer publishes diffs when linescore changes
- `useGameStream(gamePk, initialData)` hook: merges diffs, reconnects, falls back to polling after 3 disconnects
- 20s heartbeat to keep connections alive through proxies
- Estimated: 2–3 days

### Phase 6 — Monetization + growth
- Submit sitemap to Google Search Console + Bing
- 5–10 evergreen articles in `/blog` (utility sites without content rank poorly)
- Ezoic integration (preferred over AdSense for this profile)
- Newsletter via Resend (weekly "Yesterday in MLB" auto-generated from boxscore data)
- Affiliate links: Fanatics (team pages), MLB.tv (live games), StubHub (game pages), sportsbooks (geo-gated server-side)
- `<NoAds />` wrapper from day one for the future paid tier
- Estimated: ~1 week then ongoing

### Phase 7 — Polish for interviews
- README with architecture diagram (Excalidraw → PNG)
- "Decisions and trade-offs" section — highest-signal artifact for recruiters
- Zod schemas validating MLB responses (production-mindset signal)
- Playwright e2e (load list → click game → see live update)
- Unit tests on cache + diff logic
- Blog post: "How I went from 6,000 redundant requests/minute to 1"
- Loom demo + live demo link
- Estimated: 3–4 days

---

## Cost estimates (USD/mo)

| Scenario | Traffic | Cost |
|---|---|---|
| A — Pre-launch | <1k visits/day | ~$1 (just the domain) |
| B — Growing | ~10k visits/day | ~$35–65 (Vercel Pro $20 + CF Workers $5 + Plausible $9 + small extras) |
| C — Scaled | ~100k visits/day | ~$130–325 (Vercel bandwidth is the dominant cost) |

**Cost notes:**
- Cache hit rate (95%+ on linescore) is what keeps costs flat as traffic grows.
- Vercel bandwidth is the silent killer — at scale, put Cloudflare in front of Vercel or migrate to CF Pages.
- MLB API is free but if blocked, fallback to ESPN hidden API or paid provider (SportRadar starts free for dev, ~$500+/mo commercial).

**Revenue break-even (rough):**
- AdSense ~$2–5 RPM → 50k pageviews ≈ $100–250 (covers Scenario B)
- Ezoic 2–3× that
- Scenario C with decent ad density: $500–1500/mo gross

---

## Current state (end of session)

### Repo: `/Users/michael/Desktop/mlb-scorebug-next`
- Single fresh repo, sibling to the original on Desktop
- Git initialized on `main`, one commit: "chore: phase 0 scaffold"
- **Not yet pushed** to GitHub

### What's installed
- Next.js 16.2.6 (App Router, RSC, Turbopack — same patterns as 15)
- React 19.2.4, React DOM 19.2.4
- TypeScript 5.9.3, strict mode + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`
- Tailwind v4 (`@tailwindcss/postcss` 4.3.0)
- ESLint 9 (eslint-config-next 16.2.6)
- `@tanstack/react-query` 5.100.11 + devtools
- `zod` 4.4.3
- pnpm 11.1.3 (enabled via corepack; node v24.14.0)

### File layout
```
mlb-scorebug-next/
├── .env.example           # KV + CRON_SECRET placeholders
├── .github/workflows/ci.yml   # pnpm install + lint + build on push/PR
├── .gitignore             # standard, with !.env.example exception
├── README.md              # overview, stack, status, local dev
├── docs/PLAN.md           # roadmap mirror
├── pnpm-workspace.yaml    # allowBuilds: sharp + unrs-resolver
├── tsconfig.json          # strict++
├── eslint.config.mjs
├── next.config.ts
├── postcss.config.mjs
├── public/                # default Next assets
└── src/
    ├── app/               # default Next scaffold (page.tsx, layout.tsx, globals.css)
    └── lib/
        ├── mlb/
        │   ├── client.ts      # stub — raw HTTP client (Phase 1)
        │   ├── schedule.ts    # stub — typed wrapper + cache (Phase 1)
        │   ├── linescore.ts   # stub — typed wrapper + cache (Phase 1)
        │   └── types.ts       # stub — Zod schemas (Phase 1)
        └── cache/
            └── kv.ts          # stub — KV wrapper + SWR (Phase 1)
```

### Verified
- `pnpm lint` ✅
- `pnpm build` ✅ (builds `/` and `/_not-found` as static)

### Pending owner actions (cannot be done by Claude)
1. Register domain on Cloudflare Registrar. Suggestions: `scorebug.live`, `inningwatch.com`, `livescorebug.app`. Avoid "mlb" trademark.
2. Create GitHub repo `mlb-scorebug-next`, push: `git remote add origin <url> && git push -u origin main`
3. Import into Vercel for auto-deploy
4. Provision Vercel KV (Storage → Create → KV) — auto-populates env vars matching `.env.example`

### Skipped per owner request
- Analytics (Plausible / PostHog) — add later
- Sentry / error tracking — add later

---

## Open thread to resume on

End of last assistant message:

> Ready for Phase 1 (proxy + cache) whenever you are. Want me to also patch the current Vite SPA to point at the new `/api/*` proxy as part of Phase 1, so you can cut upstream traffic the moment it deploys?

**Owner has not yet answered.** Phase 1 is the next chunk of work either way; the open question is just whether to also modify the legacy Vite repo at `/Users/michael/Desktop/mlb-scorebug` as part of it.

---

## Useful context for a new chat

- Owner is "Michael." Working directory in original session was `/Users/michael/Desktop/mlb-scorebug`. New repo is sibling at `/Users/michael/Desktop/mlb-scorebug-next`.
- pnpm is the chosen package manager (via corepack).
- No code has been written yet beyond stubs and config — Phase 1 is greenfield implementation against the stubs already in place.
- The plan deliberately defers GraphQL (Phase 4) and agentic features (Phase 5). Don't reintroduce them unless asked.
- The original Vite app remains live as the current product; do not delete it.
