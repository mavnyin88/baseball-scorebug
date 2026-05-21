import { z } from "zod";

// MLB statsapi responses include many fields we don't use. Schemas below
// pick out what the UI needs and treat unknowns as opaque.

const Team = z.object({
  id: z.number(),
  name: z.string(),
  abbreviation: z.string().optional(),
  teamName: z.string().optional(),
});

const ScheduleTeamSide = z.object({
  leagueRecord: z
    .object({ wins: z.number(), losses: z.number() })
    .partial()
    .optional(),
  score: z.number().optional(),
  team: Team,
  isWinner: z.boolean().optional(),
});

const GameStatus = z.object({
  abstractGameState: z.string(),
  codedGameState: z.string().optional(),
  detailedState: z.string(),
  statusCode: z.string().optional(),
});

export const ScheduleGame = z.object({
  gamePk: z.number(),
  gameDate: z.string(),
  status: GameStatus,
  teams: z.object({ away: ScheduleTeamSide, home: ScheduleTeamSide }),
  venue: z.object({ id: z.number(), name: z.string() }).partial().optional(),
});
export type ScheduleGame = z.infer<typeof ScheduleGame>;

export const ScheduleResponse = z.object({
  totalGames: z.number().optional(),
  dates: z.array(
    z.object({
      date: z.string(),
      games: z.array(ScheduleGame),
    }),
  ),
});
export type ScheduleResponse = z.infer<typeof ScheduleResponse>;

const LinescoreSide = z.object({
  runs: z.number().optional(),
  hits: z.number().optional(),
  errors: z.number().optional(),
  leftOnBase: z.number().optional(),
});

const LinescoreInning = z.object({
  num: z.number(),
  ordinalNum: z.string().optional(),
  home: LinescoreSide.optional(),
  away: LinescoreSide.optional(),
});

const PlayerRef = z.object({
  id: z.number(),
  fullName: z.string().optional(),
  link: z.string().optional(),
}).partial();

export const LinescoreResponse = z.object({
  currentInning: z.number().optional(),
  currentInningOrdinal: z.string().optional(),
  inningHalf: z.string().optional(),
  inningState: z.string().optional(),
  isTopInning: z.boolean().optional(),
  scheduledInnings: z.number().optional(),
  balls: z.number().optional(),
  strikes: z.number().optional(),
  outs: z.number().optional(),
  innings: z.array(LinescoreInning).optional(),
  teams: z.object({ home: LinescoreSide, away: LinescoreSide }).optional(),
  offense: z
    .object({
      batter: PlayerRef.optional(),
      onDeck: PlayerRef.optional(),
      inHole: PlayerRef.optional(),
      pitcher: PlayerRef.optional(),
      first: PlayerRef.optional(),
      second: PlayerRef.optional(),
      third: PlayerRef.optional(),
    })
    .optional(),
  defense: z
    .object({
      pitcher: PlayerRef.optional(),
      catcher: PlayerRef.optional(),
    })
    .optional(),
});
export type LinescoreResponse = z.infer<typeof LinescoreResponse>;
