import { type NextRequest, NextResponse } from "next/server";
import { getSchedule, isValidDate } from "@/lib/mlb/schedule";
import { handleUpstreamError, jsonError, todayET } from "@/lib/http";
import { season } from "@/config/season";
import type { ScheduleResponse } from "@/lib/mlb/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ?? todayET();
  if (!isValidDate(date)) {
    return jsonError(400, "date must be YYYY-MM-DD");
  }

  // Off-season: answer with an empty schedule (same shape as MLB's) instead
  // of calling upstream. Long cache — nothing changes until the flag flips.
  if (season.offseason) {
    const empty: ScheduleResponse = { totalGames: 0, dates: [] };
    return NextResponse.json(empty, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  try {
    const data = await getSchedule(date);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    return handleUpstreamError(err);
  }
}
