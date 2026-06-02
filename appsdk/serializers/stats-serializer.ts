/**
 * Player stats serializer for MCP tools
 */

import { readFileSync } from 'fs';
import { join, resolve } from 'path';

const PROJECT_ROOT = __dirname.includes('dist')
  ? resolve(__dirname, '..', '..', '..')
  : resolve(__dirname, '..', '..');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { calculatePlayerStats } = require(join(PROJECT_ROOT, 'lib', 'stats-calc.js'));

interface PlayerStats {
  playerId: string | null;
  playerName: string;
  number?: number;
  gamesPlayed: number;
  goals: number;
  assists: number;
  guest?: boolean;
}

function loadJSON<T>(filename: string): T {
  return JSON.parse(readFileSync(join(PROJECT_ROOT, 'data', filename), 'utf-8'));
}

export function loadStats(): PlayerStats[] {
  const games = loadJSON<unknown[]>('games.json');
  const roster = loadJSON<unknown[]>('roster.json');
  return calculatePlayerStats(games, roster);
}

function perGameAvg(value: number, games: number): string {
  return games > 0 ? (value / games).toFixed(2) : '0.00';
}

export function getPlayerStats(playerId: string, allStats?: PlayerStats[]): PlayerStats | null {
  return (allStats ?? loadStats()).find(s => s.playerId === playerId) || null;
}

export function getTopScorers(limit: number = 5, allStats?: PlayerStats[]): PlayerStats[] {
  return [...(allStats ?? loadStats())]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, limit);
}

export function getTeamStats(allStats?: PlayerStats[]) {
  const stats = allStats ?? loadStats();

  const totals = stats.reduce(
    (acc, player) => ({
      gamesPlayed: Math.max(acc.gamesPlayed, player.gamesPlayed),
      totalGoals: acc.totalGoals + player.goals,
      totalAssists: acc.totalAssists + player.assists,
      activePlayers: player.gamesPlayed > 0 ? acc.activePlayers + 1 : acc.activePlayers
    }),
    { gamesPlayed: 0, totalGoals: 0, totalAssists: 0, activePlayers: 0 }
  );

  return totals;
}

export function serializePlayerStats(playerId: string) {
  const stats = getPlayerStats(playerId);

  if (!stats) {
    return {
      content: `No stats found for player: ${playerId}`
    };
  }

  const gpg = perGameAvg(stats.goals, stats.gamesPlayed);
  const apg = perGameAvg(stats.assists, stats.gamesPlayed);
  const numStr = stats.number != null ? ` (#${stats.number})` : '';

  return {
    content: `${stats.playerName}${numStr}: ${stats.gamesPlayed} games, ${stats.goals} goals, ${stats.assists} assists (${gpg} G/G, ${apg} A/G)`
  };
}

export function serializeTeamStats() {
  const allStats = loadStats();
  const teamStats = getTeamStats(allStats);
  const topScorers = getTopScorers(5, allStats);

  return {
    content: `Team stats: ${teamStats.totalGoals} goals, ${teamStats.totalAssists} assists in ${teamStats.gamesPlayed} games. Top scorers: ${topScorers.map(p => `${p.playerName} (${p.goals}G)`).join(', ')}.`
  };
}
