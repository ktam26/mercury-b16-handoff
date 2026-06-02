#!/usr/bin/env tsx
/**
 * Tournament Scraper for Downtown Super Cup - Spring 2026
 * Fetches standings and game results from GotSport event 49449
 * Updates tournament.json with current data
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const RESULTS_URL = 'https://system.gotsport.com/org_event/events/49449/results?group=475814';
const DATA_DIR = join(__dirname, '..', 'data');
const TOURNAMENT_FILE = join(DATA_DIR, 'tournament.json');

// Team name mapping: GotSport name patterns → tournament.json shortName
const TEAM_NAME_MAP: Record<string, string> = {
  'almaden': 'Mercury',
  'mercury': 'Mercury',
  'solano': 'Solano Surf',
  'surf': 'Solano Surf',
  'madera': 'Madera United',
  'united': 'Madera United',
  'toro': 'Madera United',
  'east san jose': 'ESJFC',
  'esjfc': 'ESJFC',
};

interface StandingsEntry {
  team: string;
  fullName: string;
  w: number;
  l: number;
  t: number;
  gf: number;
  ga: number;
  pts: number;
  isUs?: boolean;
}

interface HeadToHeadResult {
  team1: string;
  team2: string;
  score: string; // "X-Y" format where X is team1's score
}

/**
 * Normalize team name to match tournament.json format
 */
function normalizeTeamName(gotsportName: string): string {
  const lower = gotsportName.toLowerCase();

  for (const [pattern, shortName] of Object.entries(TEAM_NAME_MAP)) {
    if (lower.includes(pattern)) {
      return shortName;
    }
  }

  // Fallback: return first meaningful part
  console.warn(`Unknown team name: ${gotsportName}`);
  return gotsportName.split(' ').slice(0, 2).join(' ');
}

/**
 * Parse standings table from HTML
 */
function parseStandings($: cheerio.CheerioAPI): StandingsEntry[] {
  const standings: StandingsEntry[] = [];

  // Find the first tabpanel (only Bracket A)
  const tabpanelSelector = 'div[role="tabpanel"]';
  const tabpanel = $(tabpanelSelector).first();
  if (tabpanel.length === 0) {
    console.warn(`⚠️  WARNING: Selector "${tabpanelSelector}" matched 0 elements on ${RESULTS_URL}`);
  }

  // Get the standings table (first table in tabpanel)
  const standingsTable = tabpanel.find('table').first();
  if (standingsTable.length === 0) {
    console.warn(`⚠️  WARNING: No standings table found inside tabpanel on ${RESULTS_URL}`);
  }

  const rows = standingsTable.find('tbody tr');
  if (rows.length === 0) {
    console.warn(`⚠️  WARNING: Standings table has 0 rows on ${RESULTS_URL}`);
  }

  rows.each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 10) return;

    const fullName = cells.eq(1).text().trim();
    if (!fullName) {
      console.warn('⚠️  WARNING: Standings row missing team name, skipping');
      return;
    }
    const shortName = normalizeTeamName(fullName);

    standings.push({
      team: shortName,
      fullName: fullName,
      w: parseInt(cells.eq(3).text()) || 0,
      l: parseInt(cells.eq(4).text()) || 0,
      t: parseInt(cells.eq(5).text()) || 0,
      gf: parseInt(cells.eq(6).text()) || 0,
      ga: parseInt(cells.eq(7).text()) || 0,
      pts: parseInt(cells.eq(9).text()) || 0,
      ...(shortName === 'Mercury' ? { isUs: true } : {}),
    });
  });

  return standings;
}

/**
 * Parse head-to-head matrix for game results
 */
function parseHeadToHead($: cheerio.CheerioAPI): HeadToHeadResult[] {
  const results: HeadToHeadResult[] = [];

  // Find the first tabpanel (only Bracket A)
  const tabpanel = $('div[role="tabpanel"]').first();

  // Get the head-to-head table (second table in tabpanel)
  const h2hTable = tabpanel.find('table').eq(1);
  if (h2hTable.length === 0) {
    console.warn(`⚠️  WARNING: Head-to-head table (second table in tabpanel) not found on ${RESULTS_URL}`);
    return results;
  }

  // Get team names from header row
  const headerCells = h2hTable.find('thead th');
  if (headerCells.length === 0) {
    console.warn(`⚠️  WARNING: Head-to-head table has no header cells on ${RESULTS_URL}`);
  }
  const teamNames: string[] = [];
  headerCells.each((i, cell) => {
    if (i > 0 && i < headerCells.length - 2) { // Skip "Team Name" and "Points"/"Final"
      teamNames.push(normalizeTeamName($(cell).text().trim()));
    }
  });

  // Parse each row
  const h2hRows = h2hTable.find('tbody tr');
  if (h2hRows.length === 0) {
    console.warn(`⚠️  WARNING: Head-to-head table has 0 body rows on ${RESULTS_URL}`);
  }

  h2hRows.each((rowIdx, row) => {
    const cells = $(row).find('td');
    const rowTeam = normalizeTeamName(cells.eq(0).text().trim());

    cells.each((colIdx, cell) => {
      if (colIdx === 0 || colIdx >= teamNames.length + 1) return; // Skip team name and points columns

      const score = $(cell).text().trim();
      if (score && score !== '-' && score.includes('-')) {
        const colTeam = teamNames[colIdx - 1];
        if (rowTeam !== colTeam) {
          results.push({
            team1: rowTeam,
            team2: colTeam,
            score: score,
          });
        }
      }
    });
  });

  return results;
}

/**
 * Find Mercury's game result against a specific opponent
 */
function findMercuryResult(
  results: HeadToHeadResult[],
  opponent: string,
  isHome: boolean
): { us: number; them: number } | null {
  // Normalize opponent name
  const normalizedOpponent = normalizeTeamName(opponent);

  for (const result of results) {
    const mercuryIsTeam1 = result.team1 === 'Mercury';
    const mercuryIsTeam2 = result.team2 === 'Mercury';

    if (!mercuryIsTeam1 && !mercuryIsTeam2) continue;

    const opponentMatch = mercuryIsTeam1
      ? result.team2 === normalizedOpponent
      : result.team1 === normalizedOpponent;

    if (!opponentMatch) continue;

    // Parse score
    const [score1, score2] = result.score.split('-').map(s => parseInt(s.trim()));

    if (mercuryIsTeam1) {
      return { us: score1, them: score2 };
    } else {
      return { us: score2, them: score1 };
    }
  }

  return null;
}

/**
 * Main scraper function
 */
async function scrapeTournament() {
  console.log('Fetching tournament data from GotSport...');
  console.log(`URL: ${RESULTS_URL}`);

  try {
    const response = await axios.get(RESULTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MercuryB16Bot/1.0)',
      },
    });

    if (response.status !== 200) {
      console.error(`❌ HTTP ${response.status} fetching tournament from ${RESULTS_URL}`);
      throw new Error(`HTTP ${response.status} from ${RESULTS_URL}`);
    }

    const $ = cheerio.load(response.data);

    // Parse standings for Bracket A
    console.log('\nParsing Bracket A standings...');
    const bracketA = parseStandings($);
    console.log(`Found ${bracketA.length} teams in Bracket A`);

    // --- Count validation for standings ---
    if (bracketA.length === 0) {
      console.error('❌ Scraped 0 teams from standings. This likely indicates a selector or page change.');
      process.exit(1);
    }
    if (bracketA.length > 20) {
      console.warn(`⚠️  WARNING: Scraped ${bracketA.length} teams — unexpectedly high for a tournament bracket.`);
    }

    // Parse head-to-head results
    console.log('\nParsing head-to-head results...');
    const bracketAResults = parseHeadToHead($);
    console.log(`Found ${bracketAResults.length} results in Bracket A`);

    if (bracketAResults.length > 20) {
      console.warn(`⚠️  WARNING: Scraped ${bracketAResults.length} head-to-head results — unexpectedly high for a tournament bracket.`);
    }

    // Load existing tournament.json
    const tournamentData = JSON.parse(readFileSync(TOURNAMENT_FILE, 'utf-8'));

    // --- Validate standings entries have expected fields ---
    let validationWarnings = 0;
    for (const entry of bracketA) {
      const missing: string[] = [];
      if (!entry.team) missing.push('team');
      if (!entry.fullName) missing.push('fullName');
      if (missing.length > 0) {
        console.warn(`⚠️  WARNING: Standings entry missing fields: ${missing.join(', ')} — ${JSON.stringify(entry)}`);
        validationWarnings++;
      }
    }

    // Update standings
    tournamentData.standings.A = bracketA.map(entry => ({
      team: entry.team,
      fullName: entry.fullName,
      w: entry.w,
      l: entry.l,
      t: entry.t,
      gf: entry.gf,
      ga: entry.ga,
      pts: entry.pts,
      ...(entry.team === 'Mercury' ? { isUs: true } : {}),
    }));

    // Update Mercury game results
    console.log('\nUpdating Mercury game results...');
    let gamesWithResults = 0;
    let gamesUpcoming = 0;
    for (const game of tournamentData.mercuryGames) {
      if (game.conditional) continue; // Skip championship game

      const result = findMercuryResult(
        bracketAResults,
        game.opponent,
        game.homeAway === 'home'
      );

      if (result) {
        game.result = result;
        gamesWithResults++;
        console.log(`  Game vs ${game.opponentShort}: ${result.us}-${result.them}`);
      } else if (!game.result) {
        gamesUpcoming++;
        console.log(`  Game vs ${game.opponentShort}: Not yet played`);
      } else {
        gamesWithResults++;
      }
    }

    // Update bracket game results
    console.log('\nUpdating bracket game results...');

    for (const game of tournamentData.brackets.A.games) {
      const homeTeam = normalizeTeamName(game.homeTeam);
      const awayTeam = normalizeTeamName(game.awayTeam);

      // Find matching result
      for (const result of bracketAResults) {
        if ((result.team1 === homeTeam && result.team2 === awayTeam) ||
            (result.team1 === awayTeam && result.team2 === homeTeam)) {

          // Determine score from home team perspective
          if (result.team1 === homeTeam) {
            game.result = result.score;
          } else {
            const [s1, s2] = result.score.split('-').map(s => parseInt(s.trim()));
            game.result = `${s2}-${s1}`;
          }
          break;
        }
      }
    }

    // --- Dry-run: print summary and exit without writing ---
    if (DRY_RUN) {
      console.log('\n--- DRY RUN SUMMARY ---');
      console.log(`Standings: ${bracketA.length} teams scraped`);
      console.log(`Head-to-head results: ${bracketAResults.length}`);
      console.log(`Mercury games: ${gamesWithResults} with results, ${gamesUpcoming} upcoming`);
      if (validationWarnings > 0) {
        console.log(`Validation warnings: ${validationWarnings}`);
      }
      console.log('\nStandings that would be written:');
      bracketA.forEach((t, i) => console.log(`  ${i + 1}. ${t.team} (${t.w}-${t.l}-${t.t}) ${t.pts} pts`));
      console.log('\nNo files were written.');
      process.exit(0);
    }

    // Write updated tournament.json
    writeFileSync(TOURNAMENT_FILE, JSON.stringify(tournamentData, null, 2) + '\n');
    console.log('\n✅ Tournament data updated successfully!');

    // Print summary
    console.log('\n--- Summary ---');
    console.log('Bracket A standings:');
    bracketA.forEach((t, i) => console.log(`  ${i + 1}. ${t.team} (${t.w}-${t.l}-${t.t}) ${t.pts} pts`));
    console.log(`\nScraped ${bracketA.length} teams, ${bracketAResults.length} head-to-head results`);
    console.log(`Mercury games: ${gamesWithResults} with results, ${gamesUpcoming} upcoming`);
    if (validationWarnings > 0) {
      console.log(`Validation warnings: ${validationWarnings}`);
    }

  } catch (error: unknown) {
    const axiosErr = error as { response?: { status: number }; message?: string };
    const status = axiosErr?.response?.status ? ` (HTTP ${axiosErr.response.status})` : '';
    console.error(`❌ Error scraping tournament from ${RESULTS_URL}${status}:`, axiosErr?.message || error);
    process.exit(1);
  }
}

// CLI flags
const DRY_RUN = process.argv.includes('--dry-run');

// Run scraper
if (DRY_RUN) {
  console.log('🏜️  DRY RUN MODE — no files will be written.\n');
}
scrapeTournament();
