/**
 * Shared Zod schemas — single source of truth for data types.
 * All TypeScript types are inferred from these schemas.
 */

import { z } from 'zod';

// ── Location ────────────────────────────────────────────────────────────────

const LocationSchema = z.object({
  name: z.string(),
  field: z.string(),
  address: z.string(),
  googleMapsUrl: z.string(),
  embedUrl: z.string(),
});

// ── Recent Result (shared by mercury & opponent) ────────────────────────────

const RecentResultSchema = z.object({
  date: z.string(),
  opponent: z.string(),
  result: z.enum(['W', 'L', 'D']),
  score: z.string(),
});

// ── Game Result (null for upcoming games) ───────────────────────────────────

const GoalkeeperSchema = z.object({
  name: z.string(),
  half: z.number(),
  goalsAllowed: z.number(),
});

const TimelineEventSchema = z.object({
  minute: z.number(),
  type: z.string(),
  team: z.enum(['mercury', 'opponent']),
  scorer: z.string().optional(),
  assist: z.string().optional(),
  videoTimestamp: z.number().optional(),
});

const GameResultSchema = z.object({
  us: z.number(),
  them: z.number(),
  goalScorers: z.array(z.string()),
  assists: z.array(z.string()),
  goalkeepers: z.array(GoalkeeperSchema),
  timeline: z.array(TimelineEventSchema),
});

// ── Team Logos ───────────────────────────────────────────────────────────────

const TeamLogosSchema = z.object({
  home: z.string(),
  away: z.string(),
});

// ── Game ─────────────────────────────────────────────────────────────────────

export const GameSchema = z.object({
  id: z.string(),
  date: z.string(),
  time: z.string(),
  type: z.enum(['league', 'scrimmage']),
  opponent: z.string(),
  matchNumber: z.string().optional(), // only present for league games
  mercuryRecord: z.string(),
  opponentRecord: z.string(),
  opponentGoals: z.string(),
  mercuryRecentResults: z.array(RecentResultSchema),
  opponentRecentResults: z.array(RecentResultSchema),
  location: LocationSchema,
  homeAway: z.enum(['home', 'away']),
  jersey: z.string(),
  socks: z.string(),
  result: GameResultSchema.nullable(),
  teamLogos: TeamLogosSchema,
  weatherUrl: z.string().nullable(),
  gotsportUrl: z.string().nullable(),
  photoAlbumUrl: z.string().nullable(),
  videoUrl: z.string().nullable(),
});

export type Game = z.infer<typeof GameSchema>;

// ── Roster Player ────────────────────────────────────────────────────────────

export const RosterPlayerSchema = z.object({
  id: z.string(),
  number: z.number().optional(), // guest players may not have a number
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  // NOTE: birthdate and usClubId are stored in the JSON but should NOT be
  // exposed via MCP or any public API — they are sensitive/PII.
  birthdate: z.string().optional(),
  usClubId: z.string().optional(),
  guest: z.boolean().optional(), // true for guest players
});

export type RosterPlayer = z.infer<typeof RosterPlayerSchema>;

// ── Player Stats ─────────────────────────────────────────────────────────────

export const PlayerStatsSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  number: z.number().optional(), // guest players may not have a number
  gamesPlayed: z.number(),
  goals: z.number(),
  assists: z.number(),
  guest: z.boolean().optional(),
});

export type PlayerStats = z.infer<typeof PlayerStatsSchema>;

// ── Team Info ────────────────────────────────────────────────────────────────

const TeamColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
});

const TeamLinksSchema = z.object({
  gotsportSchedule: z.string(),
  gotsportStandings: z.string(),
});

export const TeamInfoSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  ageGroup: z.string(),
  colors: TeamColorsSchema,
  links: TeamLinksSchema,
});

export type TeamInfo = z.infer<typeof TeamInfoSchema>;
