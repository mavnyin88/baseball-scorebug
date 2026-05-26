import Link from "next/link";
import { getSchedule } from "@/lib/mlb/schedule";
import { todayET } from "@/lib/http";
import { teamAbbr } from "@/lib/mlb/teams";
import type { ScheduleGame } from "@/lib/mlb/types";

// RSC. Refetched at most every 30s by Next's data cache; the underlying
// MLB call is debounced by our own KV cache (30-min fresh window).
export const revalidate = 30;

export default async function Home() {
  const date = todayET();
  const sched = await getSchedule(date);
  const games = sched.dates.flatMap((d) => d.games);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-white">Today&apos;s games</h1>
        <p className="text-sm text-zinc-400">{date}</p>
      </div>

      {games.length === 0 ? (
        <p className="text-zinc-400">No games on the schedule today.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((g) => (
            <GameCard key={g.gamePk} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function getStatusLabel(game: ScheduleGame): string {
  if (game.status.detailedState === "Postponed") {
    return "Postponed";
  }
  const status = game.status.abstractGameState;
  if (status === "Live") {
    return "LIVE";
  }
  if (status === "Final") {
    return "Final";
  }
  return formatGameTime(game.gameDate);
}

function GameCard({ game }: { game: ScheduleGame }) {
  const away = game.teams.away;
  const home = game.teams.home;
  const statusLabel = getStatusLabel(game);

  return (
    <Link
      href={`/game/${game.gamePk}`}
      className="block rounded-lg bg-surface p-5 text-white shadow-md hover:-translate-y-1 hover:shadow-xl transition-all"
    >
      <div className="flex flex-col gap-2">
        <TeamRow side={away} />
        <TeamRow side={home} />
      </div>
      <div
        className={`mt-3 pt-3 border-t border-white/10 text-center text-xs font-semibold tracking-wide ${
          statusLabel === "LIVE" ? "text-red-400" : statusLabel === "Final" ? "text-zinc-300" : "text-amber-300"
        }`}
      >
        {statusLabel}
      </div>
    </Link>
  );
}

function TeamRow({ side }: { side: ScheduleGame["teams"]["away"] }) {
  const rec = side.leagueRecord;
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-zinc-200/80 w-9">
          {teamAbbr(side.team.name)}
        </span>
        <span className="font-medium">{side.team.name}</span>
      </div>
      <div className="flex items-center gap-3">
        {rec && (
          <span className="text-[11px] rounded bg-white/15 px-1.5 py-0.5 text-zinc-100">
            {rec.wins}-{rec.losses}
          </span>
        )}
        {side.score !== undefined && (
          <span className="font-mono font-bold w-6 text-right">{side.score}</span>
        )}
      </div>
    </div>
  );
}

function formatGameTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
