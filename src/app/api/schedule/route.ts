import { type NextRequest, NextResponse } from "next/server";
import { getSchedule, isValidDate } from "@/lib/mlb/schedule";
import { handleUpstreamError, jsonError, todayET } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ?? todayET();
  if (!isValidDate(date)) {
    return jsonError(400, "date must be YYYY-MM-DD");
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
