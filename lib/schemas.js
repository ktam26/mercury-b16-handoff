"use strict";
/**
 * Shared Zod schemas — single source of truth for data types.
 * All TypeScript types are inferred from these schemas.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamInfoSchema = exports.PlayerStatsSchema = exports.RosterPlayerSchema = exports.GameSchema = void 0;
const zod_1 = require("zod");
// ── Location ────────────────────────────────────────────────────────────────
const LocationSchema = zod_1.z.object({
    name: zod_1.z.string(),
    field: zod_1.z.string(),
    address: zod_1.z.string(),
    googleMapsUrl: zod_1.z.string(),
    embedUrl: zod_1.z.string(),
});
// ── Recent Result (shared by mercury & opponent) ────────────────────────────
const RecentResultSchema = zod_1.z.object({
    date: zod_1.z.string(),
    opponent: zod_1.z.string(),
    result: zod_1.z.enum(['W', 'L', 'D']),
    score: zod_1.z.string(),
});
// ── Game Result (null for upcoming games) ───────────────────────────────────
const GoalkeeperSchema = zod_1.z.object({
    name: zod_1.z.string(),
    half: zod_1.z.number(),
    goalsAllowed: zod_1.z.number(),
});
const TimelineEventSchema = zod_1.z.object({
    minute: zod_1.z.number(),
    type: zod_1.z.string(),
    team: zod_1.z.enum(['mercury', 'opponent']),
    scorer: zod_1.z.string().optional(),
    assist: zod_1.z.string().optional(),
    videoTimestamp: zod_1.z.number().optional(),
});
const GameResultSchema = zod_1.z.object({
    us: zod_1.z.number(),
    them: zod_1.z.number(),
    goalScorers: zod_1.z.array(zod_1.z.string()),
    assists: zod_1.z.array(zod_1.z.string()),
    goalkeepers: zod_1.z.array(GoalkeeperSchema),
    timeline: zod_1.z.array(TimelineEventSchema),
});
// ── Team Logos ───────────────────────────────────────────────────────────────
const TeamLogosSchema = zod_1.z.object({
    home: zod_1.z.string(),
    away: zod_1.z.string(),
});
// ── Game ─────────────────────────────────────────────────────────────────────
exports.GameSchema = zod_1.z.object({
    id: zod_1.z.string(),
    date: zod_1.z.string(),
    time: zod_1.z.string(),
    type: zod_1.z.enum(['league', 'scrimmage']),
    opponent: zod_1.z.string(),
    matchNumber: zod_1.z.string().optional(), // only present for league games
    mercuryRecord: zod_1.z.string(),
    opponentRecord: zod_1.z.string(),
    opponentGoals: zod_1.z.string(),
    mercuryRecentResults: zod_1.z.array(RecentResultSchema),
    opponentRecentResults: zod_1.z.array(RecentResultSchema),
    location: LocationSchema,
    homeAway: zod_1.z.enum(['home', 'away']),
    jersey: zod_1.z.string(),
    socks: zod_1.z.string(),
    result: GameResultSchema.nullable(),
    teamLogos: TeamLogosSchema,
    weatherUrl: zod_1.z.string().nullable(),
    gotsportUrl: zod_1.z.string().nullable(),
    photoAlbumUrl: zod_1.z.string().nullable(),
    videoUrl: zod_1.z.string().nullable(),
});
// ── Roster Player ────────────────────────────────────────────────────────────
exports.RosterPlayerSchema = zod_1.z.object({
    id: zod_1.z.string(),
    number: zod_1.z.number().optional(), // guest players may not have a number
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    fullName: zod_1.z.string(),
    // NOTE: birthdate and usClubId are stored in the JSON but should NOT be
    // exposed via MCP or any public API — they are sensitive/PII.
    birthdate: zod_1.z.string().optional(),
    usClubId: zod_1.z.string().optional(),
    guest: zod_1.z.boolean().optional(), // true for guest players
});
// ── Player Stats ─────────────────────────────────────────────────────────────
exports.PlayerStatsSchema = zod_1.z.object({
    playerId: zod_1.z.string(),
    playerName: zod_1.z.string(),
    number: zod_1.z.number().optional(), // guest players may not have a number
    gamesPlayed: zod_1.z.number(),
    goals: zod_1.z.number(),
    assists: zod_1.z.number(),
    guest: zod_1.z.boolean().optional(),
});
// ── Team Info ────────────────────────────────────────────────────────────────
const TeamColorsSchema = zod_1.z.object({
    primary: zod_1.z.string(),
    secondary: zod_1.z.string(),
    accent: zod_1.z.string(),
});
const TeamLinksSchema = zod_1.z.object({
    gotsportSchedule: zod_1.z.string(),
    gotsportStandings: zod_1.z.string(),
});
exports.TeamInfoSchema = zod_1.z.object({
    name: zod_1.z.string(),
    shortName: zod_1.z.string(),
    ageGroup: zod_1.z.string(),
    colors: TeamColorsSchema,
    links: TeamLinksSchema,
});
