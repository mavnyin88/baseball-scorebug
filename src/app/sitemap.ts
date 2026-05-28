import type { MetadataRoute } from "next";
import { getSchedule } from "@/lib/mlb/schedule";
import { todayET } from "@/lib/http";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.baseballscorebug.com";

/**
 * Sitemap of today's games + the home page. Search engines re-crawl regularly,
 * so we don't need to enumerate the whole season — just today is enough to
 * keep current games discoverable.
 *
 * Phase 6 will expand this with /date/[date] and /team/[abbr] routes once
 * those exist.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const date = todayET();
  let games: number[] = [];
  try {
    const sched = await getSchedule(date);
    games = sched.dates.flatMap((d) => d.games.map((g) => g.gamePk));
  } catch {
    // If the schedule fetch fails, still return the home page entry.
  }

  const now = new Date();

  return [
    {
      url: `${SITE}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    ...games.map<MetadataRoute.Sitemap[number]>((gamePk) => ({
      url: `${SITE}/game/${gamePk}`,
      lastModified: now,
      changeFrequency: "always",
      priority: 0.8,
    })),
  ];
}
