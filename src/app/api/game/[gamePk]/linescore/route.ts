import { type NextRequest, NextResponse } from "next/server";
import { getLinescore } from "@/lib/mlb/linescore";
import { handleUpstreamError, jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gamePk: string }> },
) {
  const { gamePk: raw } = await params;
  const gamePk = Number(raw);
  if (!Number.isInteger(gamePk) || gamePk <= 0) {
    return jsonError(400, "gamePk must be a positive integer");
  }

  try {
    const data = await getLinescore(gamePk);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
      },
    });
  } catch (err) {
    return handleUpstreamError(err);
  }
}
