import { swr } from "@/lib/cache/kv";
import { getJson } from "./client";
import { ScheduleResponse } from "./types";

const KEY_VERSION = "v2";

export function scheduleCacheKey(date: string): string {
  return `mlb:schedule:${date}:${KEY_VERSION}`;
}

/**
 * Fetch the MLB schedule for a given date (YYYY-MM-DD).
 *
 * Cached fresh for 60s to match the 1-minute cron warmer cadence. The warmer
 * always refreshes the entry before it expires, so served reads are
 * virtually always fresh-cache hits. On a miss (cold start, warmer outage)
 * the next request fetches synchronously.
 */
export async function getSchedule(date: string): Promise<ScheduleResponse> {
  return swr(
    scheduleCacheKey(date),
    () =>
      getJson(`/schedule?sportId=1&date=${encodeURIComponent(date)}`, ScheduleResponse),
    { freshSeconds: 60, staleSeconds: 30 },
  );
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function isValidDate(date: string): boolean {
  return DATE_RE.test(date);
}
