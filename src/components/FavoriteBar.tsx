"use client";

import { useState, useSyncExternalStore } from "react";
import { teamAbbr, ALL_TEAMS } from "@/lib/mlb/teams";

const STORAGE_KEY = "mlb-favorite-team";
const RED = "#C91422";

function dispatch() {
  window.dispatchEvent(new Event("favorite-changed"));
}

function subscribe(callback: () => void) {
  window.addEventListener("favorite-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("favorite-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

const StarIcon = ({ size = 10, color = RED }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

function TeamChip({ name, abbr, onPick }: { name: string; abbr: string; onPick: (n: string) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onPick(name)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="team-chip relative w-12 py-1.5 rounded text-xs font-bold font-mono tracking-wider transition-all duration-150 cursor-pointer text-center"
      style={{
        backgroundColor: hovered ? `${RED}22` : "rgba(255,255,255,0.08)",
        color: hovered ? "#fff" : "#a1a1aa",
      }}
    >
      {/* Star centered as overlay, doesn't affect layout */}
      <span
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-150"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        <StarIcon size={13} color={RED} />
      </span>
      <span className={`transition-opacity duration-150 ${hovered ? "opacity-0" : "opacity-100"}`}>
        {abbr}
      </span>
    </button>
  );
}

export function FavoriteBar() {
  const favorite = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  function pick(teamName: string) {
    localStorage.setItem(STORAGE_KEY, teamName);
    dispatch();
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    dispatch();
  }

  if (!mounted) {
    return (
      <div className="mb-8 w-full h-52 sm:h-44 lg:h-36 rounded-xl border border-white/10 bg-surface animate-pulse" />
    );
  }

  if (favorite) {
    return (
      <div className="mb-5 flex items-center gap-2 text-xs text-white/40">
        <span>
          Pinned:{" "}
          <span className="text-white/80 font-semibold">{teamAbbr(favorite)}</span>
        </span>
        <button onClick={clear} className="underline hover:text-white transition-colors">
          change
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-xl border border-white/10 bg-surface p-5">
      <div className="flex items-center gap-1 mb-3">
        <p className="text-sm font-bold tracking-wide text-white">Star your favorite team</p>
      </div>
      <div className="flex flex-wrap gap-2 team-chips-row">
        {ALL_TEAMS.map((t) => (
          <TeamChip key={t.name} name={t.name} abbr={t.abbr} onPick={pick} />
        ))}
      </div>
    </div>
  );
}
