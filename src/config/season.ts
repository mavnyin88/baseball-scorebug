/**
 * Off-season feature flag + champion banner content.
 *
 * Toggle with the `OFFSEASON_MODE` env var (server-only — read in server
 * components and route handlers, never shipped to the client). On Vercel,
 * env var changes only apply to new deployments, so redeploy after flipping.
 *
 * When `offseason` is true:
 *   - the homepage renders the champion banner and skips the MLB schedule fetch
 *   - the cron warmer short-circuits (pause the cron-job.org job too)
 *
 * Next season: update `champion` here, then flip the env var.
 */
export interface SeasonConfig {
  offseason: boolean;
  champion: {
    name: string;
    year: number;
  };
  message: string;
}

export const season: SeasonConfig = {
  offseason: process.env.OFFSEASON_MODE === "true",
  champion: {
    name: "Milwaukee Brewers",
    year: 2026,
  },
  message: "See ya in the spring!",
};
