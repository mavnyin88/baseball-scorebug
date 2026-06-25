import { getSchedule } from "@/lib/mlb/schedule";
import { todayET } from "@/lib/http";
import { GamesGrid } from "@/components/GamesGrid";
import { FavoriteBar } from "@/components/FavoriteBar";

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
        <>
          <FavoriteBar />
          <GamesGrid games={games} />
        </>
      )}
    </div>
  );
}
