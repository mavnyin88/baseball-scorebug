"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mlb-favorite-team";
const RED = "#C91422";

export function PinnedCardShell({
  awayName,
  homeName,
  children,
}: {
  awayName: string;
  homeName: string;
  children: React.ReactNode;
}) {
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const check = () => {
      const fav = localStorage.getItem(STORAGE_KEY);
      setIsPinned(fav === awayName || fav === homeName);
    };
    check();
    window.addEventListener("favorite-changed", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("favorite-changed", check);
      window.removeEventListener("storage", check);
    };
  }, [awayName, homeName]);

  return (
    <div
      className="rounded-lg"
      style={{
        order: isPinned ? -1 : 0,
        background: isPinned
          ? "linear-gradient(135deg, #1a0608 0%, #0f1830 100%)"
          : "var(--surface)",
        boxShadow: isPinned
          ? `0 0 0 1px ${RED}55, 0 4px 24px ${RED}22`
          : "none",
        transition: "background 350ms ease, box-shadow 350ms ease",
      }}
    >
      {children}
    </div>
  );
}
