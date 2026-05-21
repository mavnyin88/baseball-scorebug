import { type NextRequest, NextResponse } from "next/server";
import { getLinescore } from "@/lib/mlb/linescore";
import { getSchedule } from "@/lib/mlb/schedule";
import { handleUpstreamError, jsonError, todayET } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Composite endpoint: schedule entry for the requesting day + live linescore.
 * Schedule lookups try today's ET date first, then yesterday's (covers
 * late-night Pacific games crossing midnight ET).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gamePk: string }> },
) {
  const { gamePk: raw } = await params;
  const gamePk = Number(raw);
  if (!Number.isInteger(gamePk) || gamePk <= 0) {
    return jsonError(400, "gamePk must be a positive integer");
  }

  const today = req.nextUrl.searchParams.get("date") ?? todayET();
  const yesterday = shiftDate(today, -1);

  try {
    const [linescore, todaySched, yestSched] = await Promise.all([
      getLinescore(gamePk),
      getSchedule(today),
      getSchedule(yesterday),
    ]);

    const game =
      findGame(todaySched, gamePk) ?? findGame(yestSched, gamePk) ?? null;
    if (!game) {
      return jsonError(404, `gamePk ${gamePk} not found on ${today} or ${yesterday}`);
    }

    return NextResponse.json(
      { game, linescore },
      {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
        },
      },
    );
  } catch (err) {
    return handleUpstreamError(err);
  }
}

function findGame(sched: Awaited<ReturnType<typeof getSchedule>>, gamePk: number) {
  for (const d of sched.dates) {
    for (const g of d.games) if (g.gamePk === gamePk) return g;
  }
  return null;
}

function shiftDate(yyyyMmDd: string, days: number): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
