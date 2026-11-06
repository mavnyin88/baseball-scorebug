import { getSchedule } from "@/lib/mlb/schedule";
import { todayET } from "@/lib/http";
import { season } from "@/config/season";
import { GamesGrid } from "@/components/GamesGrid";
import { FavoriteBar } from "@/components/FavoriteBar";
import { ChampionBanner } from "@/components/ChampionBanner";

export const revalidate = 30;

function TodayHeader({ date }: { date: string }) {
  return (
    <div className="mb-6 flex items-baseline justify-between">
      <h1 className="text-2xl font-bold text-white">Today&apos;s games</h1>
      <p className="text-sm text-zinc-400">{date}</p>
    </div>
  );
}

function NoGames() {
  return <p className="text-zinc-400">No games on the schedule today.</p>;
}


export default async function Home() {
  const date = todayET();

  // Off-season: return before getSchedule() is ever reached, so no Redis read
  // and no MLB Stats API call happens for this render.
  if (season.offseason) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-8">
        <ChampionBanner champion={season.champion} message={season.message} />
        <TodayHeader date={date} />
        <NoGames />
      </div>
    );
  }

  const sched = await getSchedule(date);
  const games = sched.dates.flatMap((d) => d.games);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <TodayHeader date={date} />

      {games.length === 0 ? (
        <NoGames />
      ) : (
        <>
          <FavoriteBar />
          <GamesGrid games={games} />
        </>
      )}
    </div>
  );
}