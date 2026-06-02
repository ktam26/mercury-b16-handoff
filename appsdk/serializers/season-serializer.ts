/**
 * Season data serializer for MCP tools
 */

import { readFileSync } from 'fs';
import { join, resolve } from 'path';

const PROJECT_ROOT = __dirname.includes('dist')
  ? resolve(__dirname, '..', '..', '..')
  : resolve(__dirname, '..', '..');

interface SeasonGame {
  id: string;
  type?: string;
  result: {
    us: number;
    them: number;
  } | null;
}

const SEASONS = [
  { id: 'spring-2026', label: 'Spring 2026', dataFile: 'data/games.json' },
  { id: 'fall-2025', label: 'Fall 2025', dataFile: 'data/seasons/fall-2025.json' },
];

/**
 * Load games for a specific season
 */
function loadSeasonGames(seasonId: string): SeasonGame[] {
  const season = SEASONS.find(s => s.id === seasonId);
  if (!season) return [];
  const filePath = join(PROJECT_ROOT, season.dataFile);
  const data = readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Format available seasons for tool output
 */
export function serializeSeasons() {
  const lines = SEASONS.map(s => `- ${s.id}: ${s.label} (${s.dataFile})`);
  return {
    content: `Available seasons (${SEASONS.length}):\n${lines.join('\n')}`
  };
}

/**
 * Compute and format season record for tool output
 * Filters to competitive (non-scrimmage) games with results, same logic as lib/stats-utils.js
 */
export function serializeSeasonRecord(seasonId?: string) {
  const targetId = seasonId ?? SEASONS[0].id;
  const season = SEASONS.find(s => s.id === targetId);
  if (!season) {
    return { content: `Season not found: ${targetId}. Available: ${SEASONS.map(s => s.id).join(', ')}` };
  }

  const games = loadSeasonGames(targetId);

  // Filter to competitive games with results (same as getCompetitiveGames + getSeasonRecord)
  const competitive = games.filter(g => g.result && (g as any).type !== 'scrimmage');

  const wins = competitive.filter(g => g.result!.us > g.result!.them).length;
  const losses = competitive.filter(g => g.result!.us < g.result!.them).length;
  const ties = competitive.filter(g => g.result!.us === g.result!.them).length;
  const totalGames = wins + losses + ties;

  const goalsFor = competitive.reduce((sum, g) => sum + g.result!.us, 0);
  const goalsAgainst = competitive.reduce((sum, g) => sum + g.result!.them, 0);
  const goalDiff = goalsFor - goalsAgainst;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

  return {
    content: `${season.label} Record: ${wins}-${losses}-${ties} (${totalGames} competitive games). Goals: ${goalsFor} for, ${goalsAgainst} against (${goalDiff >= 0 ? '+' : ''}${goalDiff} GD). Win rate: ${winRate}%.`
  };
}
