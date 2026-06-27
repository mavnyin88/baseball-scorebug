import type { LinescoreResponse } from "@/lib/mlb/types";

interface Props {
  linescore: LinescoreResponse;
  homeAbbr: string;
  awayAbbr: string;
}

const AWAY_COLOR = "#38bdf8"; // sky-400
const HOME_COLOR = "#f59e0b"; // amber-500

// SVG coordinate space. The chart scales to its container via viewBox.
const W = 400;
const H = 220;
const PAD = { top: 18, right: 14, bottom: 26, left: 26 };

interface Point {
  x: number; // inning number (0 = pre-game start)
  y: number; // cumulative runs
}

/**
 * Walks the innings in order accumulating runs for one side, stopping at the
 * first half-inning that hasn't been played yet (runs undefined). Always seeds
 * a (0, 0) start point so the line begins at the baseline.
 */
function cumulativePoints(
  innings: NonNullable<LinescoreResponse["innings"]>,
  side: "home" | "away",
): Point[] {
  const pts: Point[] = [{ x: 0, y: 0 }];
  let total = 0;
  for (const inning of innings) {
    const runs = inning[side]?.runs;
    if (typeof runs !== "number") break;
    total += runs;
    pts.push({ x: inning.num, y: total });
  }
  return pts;
}

/**
 * Run-Flow Momentum chart — dual cumulative-run lines (away vs home) across
 * innings. The shape tells the story of the game: blowout, grind, or comeback.
 * Built entirely from the linescore `innings[]` array.
 */
export function RunFlowChart({ linescore, homeAbbr, awayAbbr }: Props) {
  const innings = linescore.innings ?? [];

  const awayPts = cumulativePoints(innings, "away");
  const homePts = cumulativePoints(innings, "home");

  const awayRuns = awayPts[awayPts.length - 1]?.y ?? 0;
  const homeRuns = homePts[homePts.length - 1]?.y ?? 0;

  // No inning has been played yet — show a styled placeholder.
  if (innings.length === 0) {
    return (
      <ChartShell awayAbbr={awayAbbr} homeAbbr={homeAbbr} awayRuns={0} homeRuns={0}>
        <div className="flex h-[150px] items-center justify-center text-sm text-zinc-500">
          Run flow appears once play begins
        </div>
      </ChartShell>
    );
  }

  const maxInning = Math.max(...innings.map((i) => i.num), 1);
  const maxRuns = Math.max(awayRuns, homeRuns, 1);
  const step = maxRuns <= 6 ? 1 : maxRuns <= 12 ? 2 : 3;

  const xScale = (x: number) =>
    PAD.left + (x / maxInning) * (W - PAD.left - PAD.right);
  const yScale = (y: number) =>
    H - PAD.bottom - (y / maxRuns) * (H - PAD.top - PAD.bottom);

  const toPath = (pts: Point[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.x)} ${yScale(p.y)}`).join(" ");

  // Polygon between the two lines, shaded softly to emphasize the margin.
  const longer = awayPts.length >= homePts.length ? awayPts : homePts;
  const shorter = longer === awayPts ? homePts : awayPts;
  const areaPath =
    toPath(longer) +
    " " +
    shorter
      .slice()
      .reverse()
      .map((p) => `L ${xScale(p.x)} ${yScale(p.y)}`)
      .join(" ") +
    " Z";

  // Horizontal run gridlines.
  const gridRuns: number[] = [];
  for (let r = 0; r <= maxRuns; r += step) gridRuns.push(r);

  return (
    <ChartShell
      awayAbbr={awayAbbr}
      homeAbbr={homeAbbr}
      awayRuns={awayRuns}
      homeRuns={homeRuns}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Cumulative runs by inning. ${awayAbbr} ${awayRuns}, ${homeAbbr} ${homeRuns}.`}
      >
        {/* Run gridlines + y labels */}
        {gridRuns.map((r) => (
          <g key={`grid-${r}`}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yScale(r)}
              y2={yScale(r)}
              stroke="currentColor"
              strokeOpacity={0.08}
              className="text-white"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={yScale(r) + 3}
              textAnchor="end"
              className="fill-zinc-500"
              fontSize={9}
            >
              {r}
            </text>
          </g>
        ))}

        {/* Inning ticks */}
        {Array.from({ length: maxInning }, (_, i) => i + 1).map((n) => (
          <text
            key={`x-${n}`}
            x={xScale(n)}
            y={H - PAD.bottom + 14}
            textAnchor="middle"
            className="fill-zinc-500"
            fontSize={9}
          >
            {n}
          </text>
        ))}

        {/* Margin fill */}
        <path d={areaPath} fill="currentColor" className="text-white" fillOpacity={0.06} />

        {/* Away line + dots */}
        <path d={toPath(awayPts)} fill="none" stroke={AWAY_COLOR} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {awayPts.map((p, i) => (
          <circle key={`a-${i}`} cx={xScale(p.x)} cy={yScale(p.y)} r={2.5} fill={AWAY_COLOR} />
        ))}

        {/* Home line + dots */}
        <path d={toPath(homePts)} fill="none" stroke={HOME_COLOR} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {homePts.map((p, i) => (
          <circle key={`h-${i}`} cx={xScale(p.x)} cy={yScale(p.y)} r={2.5} fill={HOME_COLOR} />
        ))}
      </svg>
    </ChartShell>
  );
}

function ChartShell({
  awayAbbr,
  homeAbbr,
  awayRuns,
  homeRuns,
  children,
}: {
  awayAbbr: string;
  homeAbbr: string;
  awayRuns: number;
  homeRuns: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-white/10 bg-surface p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Run Flow
        </h2>
        <div className="flex items-center gap-3 text-xs">
          <LegendItem color={AWAY_COLOR} abbr={awayAbbr} runs={awayRuns} />
          <LegendItem color={HOME_COLOR} abbr={homeAbbr} runs={homeRuns} />
        </div>
      </div>
      {children}
    </div>
  );
}

function LegendItem({ color, abbr, runs }: { color: string; abbr: string; runs: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-zinc-300">{abbr}</span>
      <span className="font-bold tabular-nums text-white">{runs}</span>
    </span>
  );
}
