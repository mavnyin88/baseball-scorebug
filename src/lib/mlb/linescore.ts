import { swr } from "@/lib/cache/kv";
import { getJson } from "./client";
import { LinescoreResponse } from "./types";

const KEY_VERSION = "v1";

export function linescoreCacheKey(gamePk: number): string {
  return `mlb:linescore:${gamePk}:${KEY_VERSION}`;
}

/**
 * Fetch the linescore for a game. Cached for 5s with a 10s stale window —
 * the warmer keeps live games hot; ad-hoc requests still pay at most one
 * upstream hit every 5s per game.
 */
export async function getLinescore(gamePk: number): Promise<LinescoreResponse> {
  return swr(
    linescoreCacheKey(gamePk),
    () => getJson(`/game/${gamePk}/linescore`, LinescoreResponse),
    { freshSeconds: 5, staleSeconds: 10 },
  );
}
