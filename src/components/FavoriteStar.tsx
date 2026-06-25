"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mlb-favorite-team";
const RED = "#C91422";

export function FavoriteStar({ teamName }: { teamName: string }) {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const check = () => setIsFav(localStorage.getItem(STORAGE_KEY) === teamName);
    check();
    window.addEventListener("favorite-changed", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("favorite-changed", check);
      window.removeEventListener("storage", check);
    };
  }, [teamName]);

  return (
    <span
      className="absolute -left-3.5 top-1/2 -translate-y-1/2 transition-opacity duration-300"
      style={{ opacity: isFav ? 1 : 0, pointerEvents: "none" }}
    >
      <svg width={8} height={8} viewBox="0 0 24 24" fill={RED} aria-hidden>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </span>
  );
}
