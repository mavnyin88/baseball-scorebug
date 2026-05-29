import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getLinescore } from "@/lib/mlb/linescore";
import { getSchedule } from "@/lib/mlb/schedule";
import { todayET } from "@/lib/http";
import { teamAbbr } from "@/lib/mlb/teams";
import { LiveScorebug } from "@/components/LiveScorebug";
import type { ScheduleGame } from "@/lib/mlb/types";

interface Params {
  params: Promise<{ gamePk: string }>;
}

// Re-render initial HTML at most every 5s. Live values still come from the
// client-side poll; this just keeps the SSR payload fresh for new visitors.
export const revalidate = 5;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { gamePk: raw } = await params;
  const gamePk = Number(raw);
  if (!Number.isInteger(gamePk) || gamePk <= 0) return {};

  const game = await findGame(gamePk);
  if (!game) return { title: `Game ${gamePk}` };

  const away = game.teams.away;
  const home = game.teams.home;
  const score =
    away.score !== undefined && home.score !== undefined
      ? ` (${teamAbbr(away.team.name)} ${away.score} – ${home.score} ${teamAbbr(home.team.name)})`
      : "";
  const state = game.status.detailedState;
  const title = `${away.team.name} @ ${home.team.name}${score} — ${state}`;
  const description = `Live scorebug for ${away.team.name} vs ${home.team.name}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/game/${gamePk}`,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Baseball Scorebug" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function GamePage({ params }: Params) {
  const { gamePk: raw } = await params;
  const gamePk = Number(raw);
  if (!Number.isInteger(gamePk) || gamePk <= 0) notFound();

  const [game, linescore] = await Promise.all([
    findGame(gamePk),
    getLinescore(gamePk),
  ]);

  if (!game) notFound();

  const isLive = game.status.abstractGameState === "Live";

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <Link
        href="/"
        className="inline-block mb-6 text-sm hover:text-blue-200 transition-colors"
      >
        ← All games
      </Link>

      <LiveScorebug
        gamePk={gamePk}
        homeName={game.teams.home.team.name}
        awayName={game.teams.away.team.name}
        homeAbbr={teamAbbr(game.teams.home.team.name)}
        awayAbbr={teamAbbr(game.teams.away.team.name)}
        initialLinescore={linescore}
        isLive={isLive}
      />

      {!isLive && (
        <p className="mt-4 text-sm text-zinc-400">
          {game.status.detailedState}
          {game.gameDate ? ` · ${formatLocalTime(game.gameDate)}` : ""}
        </p>
      )}
    </div>
  );
}

async function findGame(gamePk: number): Promise<ScheduleGame | null> {
  const today = todayET();
  const yest = shiftDate(today, -1);
  const [t, y] = await Promise.all([getSchedule(today), getSchedule(yest)]);
  for (const sched of [t, y]) {
    for (const d of sched.dates) {
      for (const g of d.games) if (g.gamePk === gamePk) return g;
    }
  }
  return null;
}

function shiftDate(yyyyMmDd: string, days: number): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function formatLocalTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
