import { type NextRequest, NextResponse } from "next/server";
import { getSchedule } from "@/lib/mlb/schedule";
import { getLinescore } from "@/lib/mlb/linescore";
import { todayET } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel function timeout cap on Hobby is 60s; warm cycles fit comfortably.
export const maxDuration = 60;

/**
 * Warmer endpoint pinged by an external scheduler (cron-job.org) once per
 * minute — Vercel Hobby caps native crons at once/day, so the scheduler lives
 * off-platform. The endpoint is scheduler-agnostic: any HTTP cron service
 * (QStash, GitHub Actions, Vercel Cron on Pro) can call it.
 *
 * Refreshes today's ET schedule, then refreshes every live game's linescore.
 * Idle games are not refreshed here — they piggyback on the 5-minute schedule
 * cache via `getSchedule`.
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

  const liveGamePks: number[] = [];
  for (const d of sched.dates) {
    for (const g of d.games) {
      if (g.status.abstractGameState === "Live") liveGamePks.push(g.gamePk);
    }
  }

  // Refresh linescores in parallel, but tolerate individual failures.
  const results = await Promise.allSettled(
    liveGamePks.map((pk) => getLinescore(pk)),
  );
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    date,
    liveGames: liveGamePks.length,
    refreshed: liveGamePks.length - failed,
    failed,
  });
}
