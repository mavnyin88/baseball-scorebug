import { type NextRequest, NextResponse } from "next/server";
import { getSchedule } from "@/lib/mlb/schedule";
import { todayET } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel function timeout cap on Hobby is 60s; warm cycles fit comfortably.
export const maxDuration = 60;

/**
 * Warmer endpoint pinged by an external scheduler (cron-job.org) every
 * 30 minutes — Vercel Hobby caps native crons at once/day, so the
 * scheduler lives off-platform. The endpoint is scheduler-agnostic.
 *
 * Today this only refreshes today's ET schedule into Redis. Linescores are
 * not pre-warmed here: at a 30-min cadence the linescore cache (15s TTL)
 * would always be empty before the next warmer pass, so any pre-fetch is
 * wasted work. Linescores stay on-demand for now — first viewer per 15s
 * window pays the upstream call, rest read from cache.
 *
 * Phase 3 (SSE) needs ~10–15s linescore freshness for live updates. That
 * will be a separate fast-cadence cron path (or Vercel Pro cron) doing
 * change detection + Redis pub/sub — see docs/PLAN.md.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}` header.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const date = todayET();
  const sched = await getSchedule(date);

  // Reported for observability only; no fan-out happens here today.
  let liveGames = 0;
  for (const d of sched.dates) {
    for (const g of d.games) {
      if (g.status.abstractGameState === "Live") liveGames++;
    }
  }

  return NextResponse.json({
    date,
    totalGames: sched.totalGames ?? sched.dates.reduce((n, d) => n + d.games.length, 0),
    liveGames,
    scheduleRefreshed: true,
  });
}
