import { swr } from "@/lib/cache/kv";
import { getJson } from "./client";
import { ScheduleResponse } from "./types";

const KEY_VERSION = "v1";

export function scheduleCacheKey(date: string): string {
  return `mlb:schedule:${date}:${KEY_VERSION}`;
}

/**
 * Fetch the MLB schedule for a given date (YYYY-MM-DD).
 *
 * Cached fresh for 30 min, with a 5-min stale window. This matches the
 * cron-job.org warmer cadence (every 30 min): the warmer always refreshes
 * the entry before it expires, so served reads are virtually always
 * fresh-cache hits. On the rare miss (cold start, warmer outage) the next
 * request fetches synchronously.
 */
export async function getSchedule(date: string): Promise<ScheduleResponse> {
  return swr(
    scheduleCacheKey(date),
    () =>
      getJson(`/schedule?sportId=1&date=${encodeURIComponent(date)}`, ScheduleResponse),
    { freshSeconds: 30 * 60, staleSeconds: 5 * 60 },
  );
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function isValidDate(date: string): boolean {
  return DATE_RE.test(date);
}
