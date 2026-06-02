/**
 * Roster data serializer for MCP tools
 */

import { readFileSync } from 'fs';
import { join, resolve } from 'path';

const PROJECT_ROOT = __dirname.includes('dist')
  ? resolve(__dirname, '..', '..', '..')
  : resolve(__dirname, '..', '..');

interface RosterPlayer {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
  fullName: string;
  guest?: boolean;
}

/**
 * Load roster from JSON
 */
export function loadRoster(): RosterPlayer[] {
  const rosterPath = join(PROJECT_ROOT, 'data', 'roster.json');
  const rosterData = readFileSync(rosterPath, 'utf-8');
  return JSON.parse(rosterData);
}

/**
 * Get player by ID
 */
export function getPlayerById(playerId: string, roster?: RosterPlayer[]): RosterPlayer | null {
  return (roster ?? loadRoster()).find(p => p.id === playerId) || null;
}

/**
 * Format roster for tool output
 */
export function serializeRoster() {
  const roster = loadRoster();

  const players = roster.map(player => ({
    id: player.id,
    name: player.fullName,
    number: player.number,
  })).sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

  return {
    content: `Roster: ${players.length} players. ${players.map(p => `#${p.number} ${p.name}`).join(', ')}.`
  };
}

/**
 * Format individual player info
 */
export function serializePlayer(playerId: string) {
  const player = getPlayerById(playerId);

  if (!player) {
    return {
      content: `Player not found: ${playerId}`
    };
  }

  return {
    content: `${player.fullName} (#${player.number})`
  };
}
