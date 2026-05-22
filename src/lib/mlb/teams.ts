// MLB team-name → abbreviation lookup. Mirrors the mapping from the legacy
// Vite scorebug. Fallback for unknown teams is the first 3 chars uppercased.
const ABBR: Record<string, string> = {
  "Baltimore Orioles": "BAL",
  "Boston Red Sox": "BOS",
  "Chicago White Sox": "CWS",
  "Cleveland Guardians": "CLE",
  "Detroit Tigers": "DET",
  "Houston Astros": "HOU",
  "Kansas City Royals": "KC",
  "Los Angeles Angels": "LAA",
  "Minnesota Twins": "MIN",
  "New York Yankees": "NYY",
  "Oakland Athletics": "OAK",
  "Athletics": "ATH",
  "Seattle Mariners": "SEA",
  "Tampa Bay Rays": "TB",
  "Texas Rangers": "TEX",
  "Toronto Blue Jays": "TOR",
  "Arizona Diamondbacks": "ARI",
  "Atlanta Braves": "ATL",
  "Chicago Cubs": "CHC",
  "Cincinnati Reds": "CIN",
  "Colorado Rockies": "COL",
  "Los Angeles Dodgers": "LAD",
  "Miami Marlins": "MIA",
  "Milwaukee Brewers": "MIL",
  "New York Mets": "NYM",
  "Philadelphia Phillies": "PHI",
  "Pittsburgh Pirates": "PIT",
  "San Diego Padres": "SD",
  "San Francisco Giants": "SF",
  "St. Louis Cardinals": "STL",
  "Washington Nationals": "WSH",
};

export function teamAbbr(name: string): string {
  return ABBR[name] ?? name.slice(0, 3).toUpperCase();
}
