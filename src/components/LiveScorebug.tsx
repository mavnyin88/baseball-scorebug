"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { LinescoreResponse } from "@/lib/mlb/types";

interface Props {
  gamePk: number;
  homeName: string;
  awayName: string;
  homeAbbr: string;
  awayAbbr: string;
  initialLinescore: LinescoreResponse;
  /** Whether the game is currently live — controls polling. */
  isLive: boolean;
  /** Poll interval in ms when the page is visible. Default 5s. */
  pollMs?: number;
}

/**
 * Client component that renders the scorebug and polls /api/game/[gamePk]/linescore
 * every `pollMs` while the tab is visible and the game is live. Hydrates from
 * `initialLinescore` so the first paint is instant and SEO-friendly.
 *
 * Phase 3 will replace polling with an SSE subscription; the rendering surface
 * stays the same.
 */
export function LiveScorebug({
  gamePk,
  homeName,
  awayName,
  homeAbbr,
  awayAbbr,
  initialLinescore,
  isLive,
  pollMs = 5_000,
}: Props) {
  const [data, setData] = useState<LinescoreResponse>(initialLinescore);
  const visibleRef = useRef(true);

  useEffect(() => {
    if (!isLive) return;

    const onVis = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);
    visibleRef.current = document.visibilityState === "visible";

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      if (!visibleRef.current) {
        timer = setTimeout(tick, pollMs);
        return;
      }
      try {
        const res = await fetch(`/api/game/${gamePk}/linescore`, { cache: "no-store" });
        if (res.ok) {
          const next = (await res.json()) as LinescoreResponse;
          if (!cancelled) setData(next);
        }
      } catch {
        // Swallow — next tick will retry. UX: show last good state.
      } finally {
        if (!cancelled) timer = setTimeout(tick, pollMs);
      }
    };

    // Fire first tick immediately so users see activity right away.
    timer = setTimeout(tick, 0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [gamePk, isLive, pollMs]);

  const home = data.teams?.home;
  const away = data.teams?.away;
  const inningState = data.inningState ?? data.inningHalf ?? "";

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold text-white">
          {awayName} <span className="text-zinc-500">@</span> {homeName}
        </h1>
        {isLive && (
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-red-400">
            <span className="size-2 rounded-full bg-red-500 animate-pulse" />
            Live
          </span>
        )}
      </header>

      <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 rounded-lg bg-surface p-5 border border-white/10 max-w-[23rem]">
        {/* Scores */}
        <div className="flex flex-col justify-center gap-3">
          <ScoreRow abbr={awayAbbr} runs={away?.runs} />
          <ScoreRow abbr={homeAbbr} runs={home?.runs} />
        </div>

        {/* Bases + count */}
        <div className="flex flex-col items-center justify-center gap-2">
          <BasesDiamond
            first={!!data.offense?.first?.id}
            second={!!data.offense?.second?.id}
            third={!!data.offense?.third?.id}
          />
          <Count balls={data.balls ?? 0} strikes={data.strikes ?? 0} />
        </div>

        {/* Inning + outs */}
        <div className="flex flex-col items-end justify-around">
          <div className="flex items-center gap-1.5">
            <InningArrow state={inningState} />
            <p className="text-md">{data.currentInningOrdinal ?? "—"}</p>
          </div>
          <Outs outs={data.outs ?? 0} />
        </div>
      </div>

    </div>
  );
}

const ScoreRow = memo(function ScoreRow({
  abbr,
  runs,
}: {
  abbr: string;
  runs: number | undefined;
}) {
  return (
    <div className="flex items-center justify-between text-2xl mr-9">
      <span className="text-base text-zinc-300 min-w-[3rem]">{abbr}</span>
      <span className="font-bold tabular-nums">{runs ?? 0}</span>
    </div>
  );
});

const Count = memo(function Count({ balls, strikes }: { balls: number; strikes: number }) {
  return (
    <p className="text-md">
      <span>{balls}</span>
      <span className="mx-1 text-zinc-500">-</span>
      <span>{strikes}</span>
    </p>
  );
});

const Outs = memo(function Outs({ outs }: { outs: number }) {
  return (
    <div className="flex gap-1.5">
      {[0, 1].map((i) => (
        <span
          key={i}
          className={`size-4 rounded-full border-2 border-white ${
            outs > i ? "bg-white" : "bg-transparent"
          }`}
        />
      ))}
    </div>
  );
});

const BasesDiamond = memo(function BasesDiamond({
  first,
  second,
  third,
}: {
  first: boolean;
  second: boolean;
  third: boolean;
}) {
  const onCls = "fill-white stroke-white";
  const offCls = "fill-transparent stroke-zinc-500";
  return (
    <svg width="60" height="40" viewBox="-4 -4 66 48" aria-label="Bases">
      <rect
        x="22"
        y="2"
        width="16"
        height="16"
        strokeWidth="2"
        transform="rotate(45 30 10)"
        className={second ? onCls : offCls}
      />
      <rect
        x="6"
        y="22"
        width="16"
        height="16"
        strokeWidth="2"
        transform="rotate(45 14 30)"
        className={third ? onCls : offCls}
      />
      <rect
        x="38"
        y="22"
        width="16"
        height="16"
        strokeWidth="2"
        transform="rotate(45 46 30)"
        className={first ? onCls : offCls}
      />
    </svg>
  );
});

const InningArrow = memo(function InningArrow({ state }: { state: string }) {
  if (state === "Top") {
    return (
      <svg width="12" height="10" viewBox="0 0 200 150" aria-label="Top inning">
        <polygon points="100,20 30,120 170,120" fill="currentColor" />
      </svg>
    );
  }
  if (state === "Bottom") {
    return (
      <svg width="12" height="10" viewBox="0 0 200 150" aria-label="Bottom inning">
        <polygon points="100,130 30,30 170,30" fill="currentColor" />
      </svg>
    );
  }
  return <span className="text-[11px] text-zinc-400">Mid</span>;
});
