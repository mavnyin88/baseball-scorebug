import { type NextRequest, NextResponse } from "next/server";
import { getSchedule } from "@/lib/mlb/schedule";
import { getLinescore } from "@/lib/mlb/linescore";
import { todayET } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel cron caps at 60s; warm cycles should comfortably fit.
export const maxDuration = 60;

/**
 * Warmer endpoint hit by Vercel Cron once per minute. Refreshes the schedule
 * for today's ET date, then refreshes linescores for every game that is
 * currently live. Idle games are not refreshed here — they piggyback on the
 * 5-minute schedule cache via `getSchedule`.
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
