import { swr } from "@/lib/cache/kv";
import { getJson } from "./client";
import { ScheduleResponse } from "./types";

const KEY_VERSION = "v1";

export function scheduleCacheKey(date: string): string {
  return `mlb:schedule:${date}:${KEY_VERSION}`;
}

/**
 * Fetch the MLB schedule for a given date (YYYY-MM-DD). Cached for 60s
 * with a 120s stale window.
 */
export async function getSchedule(date: string): Promise<ScheduleResponse> {
  return swr(
    scheduleCacheKey(date),
    () =>
      getJson(`/schedule?sportId=1&date=${encodeURIComponent(date)}`, ScheduleResponse),
    { freshSeconds: 60, staleSeconds: 120 },
  );
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function isValidDate(date: string): boolean {
  return DATE_RE.test(date);
}
