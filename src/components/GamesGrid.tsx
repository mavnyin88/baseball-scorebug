import Link from "next/link";
import { teamAbbr } from "@/lib/mlb/teams";
import type { ScheduleGame } from "@/lib/mlb/types";
import { PinnedCardShell } from "./PinnedCardShell";
import { FavoriteStar } from "./FavoriteStar";

export function GamesGrid({ games }: { games: ScheduleGame[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {games.map((g) => (
        <PinnedCardShell
          key={g.gamePk}
          awayName={g.teams.away.team.name}
          homeName={g.teams.home.team.name}
        >
          <GameCard game={g} />
        </PinnedCardShell>
      ))}
    </div>
  );
}

function GameCard({ game }: { game: ScheduleGame }) {
  const away = game.teams.away;
  const home = game.teams.home;
  const statusLabel = getStatusLabel(game);

  return (
    <Link
      href={`/game/${game.gamePk}`}
      className="block rounded-lg p-5 text-white hover:ring-1 hover:ring-white/25 hover:shadow-xl hover:shadow-black/40 transition-all duration-200"
    >
      <div className="flex flex-col gap-2">
        <TeamRow side={away} />
        <TeamRow side={home} />
      </div>
      <div
        className={`mt-3 pt-3 border-t border-white/10 text-center text-xs font-semibold tracking-wide ${
          statusLabel === "LIVE"
            ? "text-red-400"
            : statusLabel === "Final"
            ? "text-zinc-300"
            : "text-amber-300"
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
    <div className="relative flex items-center justify-between text-sm">
      <FavoriteStar teamName={side.team.name} />
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

function getStatusLabel(game: ScheduleGame): string {
  if (game.status.detailedState === "Postponed") return "Postponed";
  const s = game.status.abstractGameState;
  if (s === "Live") return "LIVE";
  if (s === "Final") return "Final";
  return formatGameTime(game.gameDate);
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
