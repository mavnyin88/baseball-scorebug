import { NextResponse } from "next/server";
import { MlbApiError } from "@/lib/mlb/client";

export function jsonError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: { status, message } }, { status });
}

export function handleUpstreamError(err: unknown): NextResponse {
  if (err instanceof MlbApiError) {
    const status = err.status ?? 502;
    return jsonError(status >= 400 && status < 600 ? status : 502, err.message);
  }
  console.error("Unexpected route error:", err);
  return jsonError(500, "Internal Server Error");
}

/** Today's date in US/Eastern (MLB's day boundary) as YYYY-MM-DD. */
export function todayET(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}
