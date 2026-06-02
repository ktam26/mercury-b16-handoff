/**
 * TypeScript types for the MCP server.
 *
 * These mirror the Zod schemas in lib/schemas.ts (the single source of truth).
 * They are defined here separately because the appsdk tsconfig rootDir is
 * scoped to appsdk/ and cannot import from lib/.
 */

export interface Game {
  id: string;
  date: string;
  time: string;
  type: 'league' | 'scrimmage';
  opponent: string;
  matchNumber?: string;
  mercuryRecord: string;
  opponentRecord: string;
  opponentGoals: string;
  mercuryRecentResults: Array<{
    date: string;
    opponent: string;
    result: 'W' | 'L' | 'D';
    score: string;
  }>;
  opponentRecentResults: Array<{
    date: string;
    opponent: string;
    result: 'W' | 'L' | 'D';
    score: string;
  }>;
  location: {
    name: string;
    field: string;
    address: string;
    googleMapsUrl: string;
    embedUrl: string;
  };
  homeAway: 'home' | 'away';
  jersey: string;
  socks: string;
  result: {
    us: number;
    them: number;
    goalScorers: string[];
    assists: string[];
    goalkeepers: Array<{
      name: string;
      half: number;
      goalsAllowed: number;
    }>;
    timeline: Array<{
      minute: number;
      type: string;
      team: 'mercury' | 'opponent';
      scorer?: string;
      assist?: string;
      videoTimestamp?: number;
    }>;
  } | null;
  teamLogos: {
    home: string;
    away: string;
  };
  weatherUrl: string | null;
  gotsportUrl: string | null;
  photoAlbumUrl: string | null;
  videoUrl: string | null;
}

export interface RosterPlayer {
  id: string;
  number?: number;
  firstName: string;
  lastName: string;
  fullName: string;
  guest?: boolean;
}

/** Backward-compatible alias */
export type Player = RosterPlayer;

export interface PlayerStats {
  playerId: string;
  playerName: string;
  number?: number;
  gamesPlayed: number;
  goals: number;
  assists: number;
  guest?: boolean;
}

export interface TeamInfo {
  name: string;
  shortName: string;
  ageGroup: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  links: {
    gotsportSchedule: string;
    gotsportStandings: string;
  };
}
