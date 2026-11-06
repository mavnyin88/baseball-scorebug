import type { SeasonConfig } from "@/config/season";

/**
 * Off-season hero shown on the homepage when `season.offseason` is true.
 * Pure server component — no data fetching, no client JS.
 */
export function ChampionBanner({
  champion,
  message,
}: Pick<SeasonConfig, "champion" | "message">) {
  return (
    <section
      aria-label={`${champion.year} World Series Champions`}
      className="mb-10 overflow-hidden rounded-xl border border-[#ffc52f]/30 bg-gradient-to-br from-[#12284b] via-[#0f1830] to-[#12284b] px-6 py-10 text-center shadow-xl shadow-black/40 sm:px-10 sm:py-14"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ffc52f]">
        {champion.year} World Series Champions
      </p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
        Congratulations, {champion.name}!
      </h2>
      <div className="mx-auto mt-5 h-px w-24 bg-[#ffc52f]/60" />
      <p className="mt-5 text-lg text-zinc-200 sm:text-xl">{message}</p>
    </section>
  );
}
