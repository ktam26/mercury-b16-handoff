#!/usr/bin/env tsx
/**
 * GotSport Data Scraper - Enhanced Version
 * Fetches league results and team schedule from GotSport
 * Detects changes and updates local data files
 * AUTO-POPULATES opponent records from standings data
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { PDFParse } from 'pdf-parse';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// GotSport IDs live in config/gotsport.json (single source of truth, updated each season).
// See NEW_SEASON.md for how to find eventId / teamId / groupId in your schedule URL.
const gotsport = JSON.parse(
  readFileSync(join(__dirname, '..', 'config', 'gotsport.json'), 'utf-8')
) as { eventId: string; teamId: string; groupId: string };
const { eventId, teamId, groupId } = gotsport;

const RESULTS_URL = `https://system.gotsport.com/org_event/events/${eventId}/results?group=${groupId}`;
const TEAM_SCHEDULE_URL = `https://system.gotsport.com/org_event/events/${eventId}/schedules?team=${teamId}`;
const SCHEDULE_PDF_URL = `https://system.gotsport.com/org_event/events/${eventId}/schedule_pdf.pdf?group_id=${groupId}`;
const DATA_DIR = join(__dirname, '..', 'data');
const GAMES_FILE = join(DATA_DIR, 'games.json');
const CHANGES_LOG = join(DATA_DIR, 'gotsport-changes.json');

interface StandingsEntry {
  position: number;
  team: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface Match {
  matchNumber: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  location: string;
  division: string;
  status?: string;
}

interface ScrapedData {
  timestamp: string;
  standings: StandingsEntry[];
  schedule: Match[];
  leagueSchedule?: Match[];
}

// Map of GotSport name substrings → opponent logo paths
const OPPONENT_LOGO_MAP: [string, string][] = [
  ['hollister', '/images/logos/hollister-tremors.webp'],
  ['monterey surf', '/images/logos/monterey-surf.png'],
  ['ecfc', '/images/logos/salinas-ecfc.png'],
  ['monterey county soccer', '/images/logos/salinas-ecfc.png'],
  ['pv united', '/images/logos/pv-united.jpg'],
  ['pajaro valley', '/images/logos/pv-united.jpg'],
  ['santa cruz united', '/images/logos/santa-cruz-united.png'],
  ['santa cruz.*shark', '/images/logos/sc-sharks.webp'],
  ['ov toros', '/images/logos/ov-toros.avif'],
  ['real salinas', '/images/logos/real-salinas.png'],
  ['audax', '/images/logos/audax.png'],
];

function getOpponentLogo(rawName: string): string {
  const lower = rawName.toLowerCase();
  for (const [pattern, logo] of OPPONENT_LOGO_MAP) {
    if (pattern.includes('*')) {
      // Regex pattern
      if (new RegExp(pattern).test(lower)) return logo;
    } else {
      if (lower.includes(pattern)) return logo;
    }
  }
  return '/images/logos/mercury-b16.png'; // fallback
}

interface OpponentRecentResult {
  date: string;
  opponent: string;
  result: 'W' | 'L' | 'D';
  score: string;
}

interface ExistingGame {
  id: string;
  date: string;
  time: string;
  opponent: string;
  matchNumber?: string;
  opponentRecord?: string;
  opponentRecentResults?: OpponentRecentResult[];
  result?: {
    us: number;
    them: number;
    goalScorers?: string[];
    assists?: string[];
  } | null;
  type?: string;
  mercuryRecord?: string;
  [key: string]: unknown; // Allow other properties
}

interface ChangeLog {
  timestamp: string;
  changes: string[];
}

async function scrapeStandings(): Promise<StandingsEntry[]> {
  console.log('🔍 Scraping standings...');

  try {
    const response = await axios.get(RESULTS_URL);

    if (response.status !== 200) {
      console.error(`❌ HTTP ${response.status} fetching standings from ${RESULTS_URL}`);
      throw new Error(`HTTP ${response.status} from ${RESULTS_URL}`);
    }

    const $ = cheerio.load(response.data);

    const standings: StandingsEntry[] = [];

    // Find the standings table - it's the first table on the page
    const tableSelector = 'table';
    const tableEl = $(tableSelector).first();
    if (tableEl.length === 0) {
      console.warn(`⚠️  WARNING: Selector "${tableSelector}" matched 0 elements on ${RESULTS_URL}`);
    }

    const rowSelector = 'tbody tr';
    const rows = tableEl.find(rowSelector);
    if (rows.length === 0) {
      console.warn(`⚠️  WARNING: Selector "${tableSelector} ${rowSelector}" matched 0 rows on ${RESULTS_URL}`);
    }

    rows.each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 10) return;

      const team = $(cells[1]).text().trim();
      if (!team) {
        console.warn('⚠️  WARNING: Standings row missing team name, skipping');
        return;
      }

      const entry: StandingsEntry = {
        position: parseInt($(cells[0]).text().trim()) || 0,
        team,
        matchesPlayed: parseInt($(cells[2]).text().trim()) || 0,
        wins: parseInt($(cells[3]).text().trim()) || 0,
        losses: parseInt($(cells[4]).text().trim()) || 0,
        draws: parseInt($(cells[5]).text().trim()) || 0,
        goalsFor: parseInt($(cells[6]).text().trim()) || 0,
        goalsAgainst: parseInt($(cells[7]).text().trim()) || 0,
        goalDifference: parseInt($(cells[8]).text().trim()) || 0,
        points: parseInt($(cells[9]).text().trim()) || 0,
      };

      standings.push(entry);
    });

    console.log(`✅ Scraped ${standings.length} teams from standings`);
    return standings;

  } catch (error: unknown) {
    const axiosErr = error as { response?: { status: number }; message?: string };
    const status = axiosErr?.response?.status ? ` (HTTP ${axiosErr.response.status})` : '';
    console.error(`❌ Error scraping standings from ${RESULTS_URL}${status}:`, axiosErr?.message || error);
    throw error;
  }
}

// --- PDF schedule parsing -------------------------------------------------
// GotSport migrated the schedule page's table CSS classes and the old HTML
// selectors broke (see scripts/scrape-gotsport.ts history). The PDF export is
// a stabler data source: one request returns the entire league schedule.

const MONTH_MAP: Record<string, string> = {
  jan: '01', january: '01', feb: '02', february: '02',
  mar: '03', march: '03', apr: '04', april: '04', may: '05',
  jun: '06', june: '06', jul: '07', july: '07',
  aug: '08', august: '08', sep: '09', september: '09',
  oct: '10', october: '10', nov: '11', november: '11',
  dec: '12', december: '12',
};
const SHORT_MONTH = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PDF_DATE_HEADER = /^(?:Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day,\s+(\w+)\s+(\d+),\s+(\d+)$/;
const PDF_MATCH_START = /^(\d{4,7})\s+(.*)$/;
const PDF_FOOTER = /^(?:\d+\s+of\s+\d+|--\s*\d+\s+of\s+\d+\s*--)$/;
const PDF_HEADER_COLS = /^#\s*\t?Time\s*\t?Home\s+Team/;
const PDF_TZ = /(?:PDT|PST|EDT|EST|CDT|CST|MDT|MST|UTC|GMT)/;
const PDF_SCORE_TOKEN = /^(\d+\s*-\s*\d+|-)$/;

type ScoreInfo =
  | { mode: 'standard'; score: string; away: string; inlineLocation: string }
  | { mode: 'compact'; home: string; score: string; away: string; inlineLocation: string };

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

// PDF text extraction breaks hyphenated team names across lines ("Pre-\nAcademy");
// rejoin them so we get "Pre-Academy" not "Pre- Academy".
function fixHyphenation(s: string): string {
  return s.replace(/(\w)-\s+(?=[A-Za-z])/g, '$1-');
}

// Whitespace-stripped lowercase — used for fuzzy substring matching of team
// names against PDF-extracted text where wraps may insert spurious spaces.
function normTeam(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '');
}

function formatPdfDate(monthName: string, day: string, year: string): string {
  const m = MONTH_MAP[monthName.toLowerCase()];
  if (!m) return `${monthName} ${day}, ${year}`;
  return `${SHORT_MONTH[+m]} ${day.padStart(2, '0')}, ${year}`;
}

function tryParseScoreLine(line: string): ScoreInfo | null {
  const parts = line.split('\t').map(p => p.trim()).filter(p => p !== '');
  if (parts.length >= 2 && PDF_SCORE_TOKEN.test(parts[0])) {
    return { mode: 'standard', score: parts[0], away: parts[1], inlineLocation: parts.slice(2).join(' ') };
  }
  if (parts.length >= 3 && PDF_SCORE_TOKEN.test(parts[1])) {
    return {
      mode: 'compact',
      home: parts[0],
      score: parts[1],
      away: parts[2],
      inlineLocation: parts.slice(3).join(' '),
    };
  }
  // Space-separated score (no tab) — e.g. "14 - 2 Cupertino FC..."
  const m = line.match(/^(\d+\s*-\s*\d+)\s+(\S.*)$/);
  if (m) return { mode: 'standard', score: m[1], away: m[2], inlineLocation: '' };
  return null;
}

function parseSchedulePdfText(text: string, knownTeams: string[]): Match[] {
  // Replace non-breaking spaces, preserve tabs as column separators.
  const lines = text.split('\n').map(l => l.replace(/ /g, ' '));
  const knownNorm = knownTeams.map(normTeam).filter(Boolean);
  const matches: Match[] = [];
  let currentDate = '';
  let i = 0;

  const isTerminator = (t: string): boolean =>
    PDF_MATCH_START.test(t) ||
    PDF_DATE_HEADER.test(t) ||
    /^Bracket\b/i.test(t) ||
    PDF_FOOTER.test(t) ||
    PDF_HEADER_COLS.test(t);

  while (i < lines.length) {
    const line = lines[i].trim();

    const dm = line.match(PDF_DATE_HEADER);
    if (dm) { currentDate = formatPdfDate(dm[1], dm[2], dm[3]); i++; continue; }

    const mm = line.match(PDF_MATCH_START);
    if (!mm) { i++; continue; }

    const matchNumber = mm[1];
    let timeStr = mm[2].trim();
    i++;

    // Absorb wrapped time / timezone fragments ("AM", "PDT", "AM PDT", "10:30")
    while (i < lines.length) {
      const l = lines[i].trim();
      const isFrag =
        new RegExp(`^${PDF_TZ.source}$`).test(l) ||
        /^(AM|PM)$/.test(l) ||
        new RegExp(`^(AM|PM)\\s+${PDF_TZ.source}$`).test(l) ||
        /^\d{1,2}:\d{2}$/.test(l) ||
        new RegExp(`^\\d{1,2}:\\d{2}\\s+(AM|PM)(\\s+${PDF_TZ.source})?$`).test(l);
      if (isFrag) { timeStr += ' ' + l; i++; } else break;
    }
    timeStr = normalizeSpaces(timeStr);

    const homeParts: string[] = [];
    let scoreInfo: ScoreInfo | null = null;
    while (i < lines.length) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (trimmed === '') { i++; continue; }
      if (isTerminator(trimmed)) break;
      const parsed = tryParseScoreLine(raw);
      if (parsed) { scoreInfo = parsed; i++; break; }
      homeParts.push(trimmed);
      i++;
    }
    if (!scoreInfo) continue;

    const inlineLocation = scoreInfo.inlineLocation || '';
    if (scoreInfo.mode === 'compact') homeParts.push(scoreInfo.home);

    const rest: string[] = [];
    while (i < lines.length) {
      const trimmed = lines[i].trim();
      if (isTerminator(trimmed)) break;
      if (trimmed === '') { i++; continue; }
      rest.push(trimmed);
      i++;
    }

    // Split rest into away-continuation + location. Find the SMALLEST j where
    // (awayStart + rest[0..j]) contains a full known team name — once matched,
    // any further lines are location.
    const awayParts: string[] = [scoreInfo.away];
    let splitAt = -1;
    if (knownNorm.length > 0) {
      for (let j = 0; j <= rest.length; j++) {
        const candidate = normTeam([scoreInfo.away, ...rest.slice(0, j)].join(' '));
        if (knownNorm.some(t => candidate.includes(t))) { splitAt = j; break; }
      }
    }
    if (splitAt === -1) splitAt = rest.length >= 2 ? 1 : 0;
    awayParts.push(...rest.slice(0, splitAt));
    const locationParts = rest.slice(splitAt);
    if (inlineLocation) locationParts.unshift(inlineLocation);

    const score = scoreInfo.score.replace(/\s+/g, ' ');
    matches.push({
      matchNumber,
      date: currentDate,
      time: timeStr,
      homeTeam: fixHyphenation(normalizeSpaces(homeParts.join(' '))),
      awayTeam: fixHyphenation(normalizeSpaces(awayParts.join(' '))),
      score,
      location: normalizeSpaces(locationParts.join(' ')),
      division: '',
      status: score.trim() === '-' ? 'Scheduled' : 'Completed',
    });
  }

  return matches;
}

async function scrapeSchedulePdf(standings: StandingsEntry[]): Promise<Match[]> {
  console.log(`📄 Scraping schedule PDF from ${SCHEDULE_PDF_URL}...`);

  try {
    const response = await axios.get(SCHEDULE_PDF_URL, {
      responseType: 'arraybuffer',
      headers: { Accept: 'application/pdf' },
    });

    if (response.status !== 200) {
      console.error(`❌ HTTP ${response.status} fetching PDF from ${SCHEDULE_PDF_URL}`);
      throw new Error(`HTTP ${response.status} from ${SCHEDULE_PDF_URL}`);
    }

    const p = new PDFParse({ data: Buffer.from(response.data) });
    const r = await p.getText();
    if (!r.text || r.text.length < 100) {
      throw new Error(`PDF text extraction returned ${r.text?.length ?? 0} chars — unexpected`);
    }

    const teamNames = standings.map(s => s.team);
    const matches = parseSchedulePdfText(r.text, teamNames);
    console.log(`✅ Parsed ${matches.length} matches from PDF`);
    return matches;

  } catch (error: unknown) {
    const axiosErr = error as { response?: { status: number }; message?: string };
    const status = axiosErr?.response?.status ? ` (HTTP ${axiosErr.response.status})` : '';
    console.error(`❌ Error scraping PDF from ${SCHEDULE_PDF_URL}${status}:`, axiosErr?.message || error);
    throw error;
  }
}

function loadPreviousData(): ScrapedData | null {
  const dataFile = join(DATA_DIR, 'gotsport-data.json');

  if (!existsSync(dataFile)) {
    return null;
  }

  try {
    const content = readFileSync(dataFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading previous data:', error);
    return null;
  }
}

function loadExistingGames(): ExistingGame[] {
  if (!existsSync(GAMES_FILE)) {
    console.log('ℹ️  No existing games.json found');
    return [];
  }

  try {
    const content = readFileSync(GAMES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading games.json:', error);
    return [];
  }
}

function normalizeOpponentName(name: string): string {
  // Normalize opponent names for matching
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\b16b\b/gi, '')
    .replace(/\bfc\b/gi, '')
    .replace(/\bacademy\b/gi, '')
    .replace(/\balmaden\s*fc\s*/gi, '')
    .replace(/\bmercury\s*/gi, '')
    .replace(/\bb16\s*/gi, '')
    .replace(/\bblack\s*/gi, '')
    .trim();
}

/**
 * Find opponent team in standings by matching team name
 */
function findOpponentInStandings(opponentName: string, standings: StandingsEntry[]): StandingsEntry | null {
  const normalizedOpponent = normalizeOpponentName(opponentName);
  
  // Try exact match first (case insensitive)
  let match = standings.find(team => {
    const normalizedTeam = normalizeOpponentName(team.team);
    return normalizedTeam === normalizedOpponent;
  });

  // If no exact match, try partial match
  if (!match) {
    match = standings.find(team => {
      const normalizedTeam = normalizeOpponentName(team.team);
      return normalizedTeam.includes(normalizedOpponent) || normalizedOpponent.includes(normalizedTeam);
    });
  }

  return match || null;
}

/**
 * Get opponent's record from standings data
 */
function getOpponentRecord(opponentName: string, standings: StandingsEntry[]): string | null {
  const opponent = findOpponentInStandings(opponentName, standings);
  
  if (!opponent) {
    console.log(`⚠️  Could not find opponent in standings: ${opponentName}`);
    return null;
  }

  // Return W-L-D format
  return `${opponent.wins}-${opponent.losses}-${opponent.draws}`;
}

/**
 * Find opponent's recent matches from the full schedule
 * Note: Currently limited to matches against Mercury since we only have Mercury's schedule
 * This function is prepared for when full league schedule becomes available
 */
function getOpponentRecentResults(
  opponentName: string,
  gameDate: string,
  allMatches: Match[],
  maxResults: number = 3
): OpponentRecentResult[] {
  const results: OpponentRecentResult[] = [];
  const normalizedOpponent = normalizeOpponentName(opponentName);
  
  // Convert game date to Date object for comparison
  const gameDateObj = new Date(gameDate);
  
  // Find all matches involving the opponent BEFORE the Mercury game
  const opponentMatches = allMatches
    .filter(match => {
      // Check if opponent is involved in this match
      const isHome = normalizeOpponentName(match.homeTeam).includes(normalizedOpponent) ||
                     normalizedOpponent.includes(normalizeOpponentName(match.homeTeam));
      const isAway = normalizeOpponentName(match.awayTeam).includes(normalizedOpponent) ||
                     normalizedOpponent.includes(normalizeOpponentName(match.awayTeam));
      
      if (!isHome && !isAway) return false;

      // Only include matches with scores
      if (!match.score || match.score === '-') return false;

      // Convert match date to Date object
      const matchDate = convertGotSportDateToISO(match.date);
      if (!matchDate) return false;
      
      const matchDateObj = new Date(matchDate);
      
      // Only include matches BEFORE the Mercury game
      return matchDateObj < gameDateObj;
    })
    .sort((a, b) => {
      // Sort by date descending (most recent first)
      const dateA = new Date(convertGotSportDateToISO(a.date) || '');
      const dateB = new Date(convertGotSportDateToISO(b.date) || '');
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, maxResults);

  // Convert to OpponentRecentResult format
  opponentMatches.forEach(match => {
    const isHome = normalizeOpponentName(match.homeTeam).includes(normalizedOpponent) ||
                   normalizedOpponent.includes(normalizeOpponentName(match.homeTeam));
    
    const scoreMatch = match.score.match(/(\d+)\s*-\s*(\d+)/);
    if (!scoreMatch) return;

    const homeScore = parseInt(scoreMatch[1]);
    const awayScore = parseInt(scoreMatch[2]);
    
    const opponentScore = isHome ? homeScore : awayScore;
    const otherScore = isHome ? awayScore : homeScore;
    
    let result: 'W' | 'L' | 'D';
    if (opponentScore > otherScore) result = 'W';
    else if (opponentScore < otherScore) result = 'L';
    else result = 'D';

    const otherTeam = isHome ? match.awayTeam : match.homeTeam;
    
    results.push({
      date: convertGotSportDateToISO(match.date) || match.date,
      opponent: otherTeam,
      result,
      score: `${opponentScore}-${otherScore}`
    });
  });

  return results;
}

/**
 * Convert GotSport date format to ISO date
 */
function convertGotSportDateToISO(gotSportDate: string): string | null {
  // Accepts "Sep 07, 2025" or "September 07, 2025" -> "2025-09-07"
  const dateMatch = gotSportDate.match(/(\w+)\s+(\d+),\s+(\d+)/);
  if (!dateMatch) return null;

  const [, month, day, year] = dateMatch;
  const m = MONTH_MAP[month.toLowerCase()];
  if (!m) return null;
  return `${year}-${m}-${day.padStart(2, '0')}`;
}

/**
 * Create a new game entry from a scraped match.
 * Returns a fully-populated object matching the complete games.json schema.
 */
function createNewGameEntry(
  match: Match,
  existingGames: ExistingGame[],
  standings: StandingsEntry[]
): ExistingGame | null {
  const isMercuryHome = match.homeTeam.includes('Almaden');
  const isMercuryAway = match.awayTeam.includes('Almaden');

  if (!isMercuryHome && !isMercuryAway) return null;

  const isHome = isMercuryHome;
  const opponentFull = isHome ? match.awayTeam : match.homeTeam;
  const opponentSimple = opponentFull;

  // Sequential ID: next after highest existing
  const maxId = existingGames.reduce((max, g) => {
    const num = parseInt(g.id.replace('game-', ''), 10);
    return num > max ? num : max;
  }, 0);
  const nextId = `game-${String(maxId + 1).padStart(3, '0')}`;

  // Convert date/time
  const isoDate = convertGotSportDateToISO(match.date) || match.date;
  const time = match.time ? match.time.replace(/\s+(PDT|PST)$/, '') : '';

  // Opponent record from standings
  const opponentRecord = getOpponentRecord(opponentFull, standings) || '';

  // Opponent recent results
  const opponentRecentResults = getOpponentRecentResults(opponentFull, isoDate, [], 3);

  return {
    id: nextId,
    date: isoDate,
    time,
    type: 'league',
    opponent: opponentSimple,
    matchNumber: match.matchNumber,
    mercuryRecord: '',
    opponentRecord,
    opponentGoals: '',
    mercuryRecentResults: [],
    opponentRecentResults,
    location: {
      name: match.location || '',
      field: '',
      address: '',
      googleMapsUrl: '',
      embedUrl: '',
    },
    homeAway: isHome ? 'home' : 'away',
    jersey: isHome ? 'black' : 'white',
    socks: isHome ? 'black' : 'white',
    result: null,
    teamLogos: {
      home: isHome ? '/images/logos/mercury-b16.png' : getOpponentLogo(opponentFull),
      away: isHome ? getOpponentLogo(opponentFull) : '/images/logos/mercury-b16.png',
    },
    weatherUrl: null,
    gotsportUrl: TEAM_SCHEDULE_URL,
    photoAlbumUrl: null,
  };
}

function updateGamesWithScores(
  existingGames: ExistingGame[],
  scrapedMatches: Match[],
  standings: StandingsEntry[]
): {
  games: ExistingGame[];
  updates: string[];
} {
  const updates: string[] = [];
  const updatedGames = [...existingGames];

  scrapedMatches.forEach(match => {
    const isHome = match.homeTeam.includes('Almaden');
    const matchNumber = match.matchNumber?.trim();

    // Try to find matching game in existing games
    const normalizedScrapedOpponent = normalizeOpponentName(
      isHome ? match.awayTeam : match.homeTeam
    );

    // Convert scraped date for matching
    let scrapedDate = '';
    if (match.date) {
      scrapedDate = convertGotSportDateToISO(match.date) || '';
    }

    // Prefer matching by recorded match number
    let gameIndex = -1;
    if (matchNumber) {
      gameIndex = updatedGames.findIndex(game => game.matchNumber === matchNumber);
    }

    // Find matching game by opponent name AND date proximity
    // This prevents matching completed games when there's a rematch
    if (gameIndex === -1) {
      gameIndex = updatedGames.findIndex(game => {
        const normalizedExistingOpponent = normalizeOpponentName(game.opponent);
        const opponentMatches = normalizedExistingOpponent.includes(normalizedScrapedOpponent) ||
                                normalizedScrapedOpponent.includes(normalizedExistingOpponent);

        if (!opponentMatches) return false;

        if (game.matchNumber && matchNumber) {
          return game.matchNumber === matchNumber;
        }

        // The scraped match date must be on or before today's date to be considered for an update
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for consistent comparison
        const scrapedDateObj = new Date(scrapedDate);
        if (scrapedDateObj > today) {
          return false; // Don't match future scraped dates
        }

        // If the game in games.json is in the future, don't match it
        const gameDateObj = new Date(game.date);
        if (gameDateObj > today) {
          return false; // Never match future games
        }

        // Match if dates are identical
        if (scrapedDate && game.date === scrapedDate) {
          return true;
        }

        // For games without a result, allow matching within a 7-day window
        // This handles minor date discrepancies or games rescheduled by a few days
        if (!game.result && scrapedDate) {
          const daysDiff = Math.abs((gameDateObj.getTime() - scrapedDateObj.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 7;
        }

        // No other conditions should result in a match
        return false;
      });
    }

    if (gameIndex === -1) {
      // Auto-create: only for Mercury matches with no existing matchNumber
      const involvesMercury = match.homeTeam.includes('Almaden') || match.awayTeam.includes('Almaden');
      const alreadyExists = matchNumber && updatedGames.some(g => g.matchNumber === matchNumber);

      if (involvesMercury && !alreadyExists) {
        const newGame = createNewGameEntry(match, updatedGames, standings);
        if (newGame) {
          updatedGames.push(newGame);
          updates.push(
            `🆕 Auto-created game: ${newGame.opponent} on ${newGame.date} (${newGame.id})`
          );
        }
      }
      return; // Skip the update logic below
    }

    if (gameIndex !== -1) {
      const game = updatedGames[gameIndex];
      let updatedGame: ExistingGame = { ...game };
      let hasChanges = false;

      // Store match number for future runs
      if (matchNumber && updatedGame.matchNumber !== matchNumber) {
        updatedGame.matchNumber = matchNumber;
        hasChanges = true;
      }

      // AUTO-POPULATE OPPONENT RECORD from standings
      const opponentRecord = getOpponentRecord(game.opponent, standings);
      if (opponentRecord && updatedGame.opponentRecord !== opponentRecord) {
        const oldRecord = updatedGame.opponentRecord || 'none';
        updatedGame.opponentRecord = opponentRecord;
        updates.push(
          `📊 Opponent record updated for ${game.opponent}: ${oldRecord} → ${opponentRecord}`
        );
        hasChanges = true;
      }

      // AUTO-POPULATE OPPONENT RECENT RESULTS
      // Note: Limited to matches we have in our schedule (matches involving Mercury)
      // When full league schedule is available, this will show all opponent matches
      const opponentRecentResults = getOpponentRecentResults(
        game.opponent,
        game.date,
        scrapedMatches,
        3
      );
      
      // Only update if we have results and they're different
      if (opponentRecentResults.length > 0) {
        const existingResults = updatedGame.opponentRecentResults || [];
        const resultsChanged = JSON.stringify(existingResults) !== JSON.stringify(opponentRecentResults);
        
        if (resultsChanged) {
          updatedGame.opponentRecentResults = opponentRecentResults;
          updates.push(
            `📊 Opponent recent results updated for ${game.opponent} (${opponentRecentResults.length} matches)`
          );
          hasChanges = true;
        }
      }

      const hasRecordedResult =
        typeof updatedGame.result?.us === 'number' && typeof updatedGame.result?.them === 'number';

      if (hasRecordedResult) {
        if (hasChanges) {
          updatedGames[gameIndex] = updatedGame;
        }
        return;
      }

      // Convert scraped time format "2:15 PM PDT" to "2:15 PM"
      const scrapedTime = match.time ? match.time.replace(/\s+(PDT|PST)$/, '') : '';

      // Check for date/time changes
      if (scrapedDate && scrapedDate !== game.date) {
        updates.push(
          `⚽ ${game.opponent} rescheduled: ${game.date} → ${scrapedDate}`
        );
        updatedGame = {
          ...updatedGame,
          date: scrapedDate,
        };
        hasChanges = true;
      }

      if (scrapedTime && scrapedTime !== game.time) {
        updates.push(
          `⚽ ${game.opponent} time changed: ${game.time} → ${scrapedTime}`
        );
        updatedGame = {
          ...updatedGame,
          time: scrapedTime,
        };
        hasChanges = true;
      }

      // Update score if available
      if (match.score !== '-' && match.score) {
        const scoreMatch = match.score.match(/(\d+)\s*-\s*(\d+)/);
        if (scoreMatch) {
          // FINAL SAFETY CHECK: Never apply scores to future games
          const gameDate = new Date(updatedGame.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (gameDate > today) {
            console.log(`⚠️  Skipping future game: ${game.opponent} on ${updatedGame.date}`);
            return; // Don't apply score to future games
          }

          const mercuryScore = isHome ? parseInt(scoreMatch[1]) : parseInt(scoreMatch[2]);
          const opponentScore = isHome ? parseInt(scoreMatch[2]) : parseInt(scoreMatch[1]);

          // Only update if result doesn't exist or has changed
          if (!game.result || game.result.us !== mercuryScore || game.result.them !== opponentScore) {
            const oldResult = game.result ? `${game.result.us}-${game.result.them}` : 'no result';

            // Preserve goal scorers and assists if they exist
            updatedGame = {
              ...updatedGame,
              result: {
                us: mercuryScore,
                them: opponentScore,
                goalScorers: game.result?.goalScorers || [],
                assists: game.result?.assists || [],
              },
            };

            updates.push(
              `⚽ Score updated for ${game.opponent}: ${oldResult} → ${mercuryScore}-${opponentScore}`
            );
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        updatedGames[gameIndex] = updatedGame;
      }
    }
  });

  // Post-loop: Enrich all league games with Mercury's record from standings
  const mercuryStanding = standings.find(t => t.team.includes('Almaden'));
  if (mercuryStanding) {
    const mercuryRecord = `${mercuryStanding.wins}-${mercuryStanding.losses}-${mercuryStanding.draws}`;
    updatedGames.forEach(game => {
      if (game.type === 'league' && game.mercuryRecord !== mercuryRecord) {
        game.mercuryRecord = mercuryRecord;
      }
    });
  }

  // Post-loop: Sort games chronologically
  updatedGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return { games: updatedGames, updates };
}

function detectChanges(previous: ScrapedData | null, current: ScrapedData): string[] {
  const changes: string[] = [];

  if (!previous) {
    changes.push('Initial data capture');
    return changes;
  }

  // Check standings changes
  const prevStandings = previous.standings;
  const currStandings = current.standings;

  // Find our team's position for special highlighting
  const ourTeam = currStandings.find(t => t.team.includes('Almaden'))?.team || '';

  currStandings.forEach((curr) => {
    const prev = prevStandings.find(p => p.team === curr.team);

    if (!prev) {
      changes.push(`New team added: ${curr.team}`);
      return;
    }

    if (prev.position !== curr.position) {
      const emoji = curr.team === ourTeam ? '⚽ ' : '';
      changes.push(`${emoji}${curr.team} moved from position ${prev.position} to ${curr.position}`);
    }

    if (prev.points !== curr.points) {
      const emoji = curr.team === ourTeam ? '⚽ ' : '';
      changes.push(`${emoji}${curr.team} points changed: ${prev.points} → ${curr.points}`);
    }

    if (prev.wins !== curr.wins || prev.losses !== curr.losses || prev.draws !== curr.draws) {
      const emoji = curr.team === ourTeam ? '⚽ ' : '';
      changes.push(`${emoji}${curr.team} record updated: ${curr.wins}W-${curr.losses}L-${curr.draws}D (was ${prev.wins}W-${prev.losses}L-${prev.draws}D)`);
    }
  });

  // Check schedule changes
  const prevSchedule = previous.schedule;
  const currSchedule = current.schedule;

  currSchedule.forEach(curr => {
    const prev = prevSchedule.find(p => p.matchNumber === curr.matchNumber);

    if (!prev) {
      changes.push(`⚽ New match scheduled: ${curr.homeTeam} vs ${curr.awayTeam} on ${curr.date}`);
      return;
    }

    if (prev.score !== curr.score && curr.score !== '-') {
      changes.push(`⚽ Score updated for match ${curr.matchNumber}: ${curr.homeTeam} ${curr.score} ${curr.awayTeam}`);
    }

    if (prev.date !== curr.date || prev.time !== curr.time) {
      changes.push(`⚽ Match ${curr.matchNumber} rescheduled: ${prev.date} ${prev.time} → ${curr.date} ${curr.time}`);
    }

    if (prev.location !== curr.location) {
      changes.push(`⚽ Match ${curr.matchNumber} location changed: ${prev.location} → ${curr.location}`);
    }

    if (prev.status !== curr.status && curr.status) {
      changes.push(`⚽ Match ${curr.matchNumber} status: ${curr.status}`);
    }
  });

  return changes;
}

function logChanges(changes: string[]) {
  if (changes.length === 0) {
    console.log('✅ No changes detected');
    return;
  }

  console.log(`\n📝 Detected ${changes.length} change${changes.length > 1 ? 's' : ''}:`);
  changes.forEach(change => console.log(`  - ${change}`));

  // Load existing change log
  let changeLog: ChangeLog[] = [];
  if (existsSync(CHANGES_LOG)) {
    try {
      const content = readFileSync(CHANGES_LOG, 'utf-8');
      changeLog = JSON.parse(content);
    } catch (error) {
      console.error('Error loading change log:', error);
    }
  }

  // Add new changes
  changeLog.push({
    timestamp: new Date().toISOString(),
    changes,
  });

  // Keep only last 100 change entries
  if (changeLog.length > 100) {
    changeLog = changeLog.slice(-100);
  }

  // Save change log
  writeFileSync(CHANGES_LOG, JSON.stringify(changeLog, null, 2));
  console.log(`\n💾 Changes logged to ${CHANGES_LOG}`);
}

async function main() {
  console.log('🚀 Starting GotSport scraper (Enhanced with auto opponent data)...\n');

  try {
    // Standings come from the HTML results page (its first-table selector still works).
    // Schedule comes from the league PDF export — one request for all teams, immune to
    // HTML CSS-class changes that broke the previous scraper.
    const standings = await scrapeStandings();
    const leagueSchedule = await scrapeSchedulePdf(standings);

    // Mercury's schedule is just the subset of the league schedule where we play.
    const schedule = leagueSchedule.filter(m =>
      m.homeTeam.includes('Almaden') || m.awayTeam.includes('Almaden')
    );
    console.log(`✅ Filtered ${schedule.length} Mercury matches from league schedule`);

    // --- Count validation ---
    if (schedule.length === 0) {
      console.error('❌ Scraped 0 Mercury matches from schedule. This likely indicates a PDF layout change or team-name drift in the standings.');
      process.exit(1);
    }
    if (schedule.length > 50) {
      console.warn(`⚠️  WARNING: Scraped ${schedule.length} matches — unexpectedly high for a league schedule.`);
    }

    const currentData: ScrapedData = {
      timestamp: new Date().toISOString(),
      standings,
      schedule,
      ...(leagueSchedule.length > 0 && { leagueSchedule }),
    };

    // Load previous scraped data for change detection
    const previousData = loadPreviousData();

    // Detect changes in scraped data
    const scrapedChanges = detectChanges(previousData, currentData);

    // Load and update games.json with new scores AND opponent data
    console.log('\n🔄 Updating games.json with scores and opponent data...');
    const existingGames = loadExistingGames();
    const { games: updatedGames, updates: gameUpdates } = updateGamesWithScores(
      existingGames,
      schedule,
      standings
    );

    // --- Validate scraped data before writing ---
    // Check that every game has critical fields
    let validationWarnings = 0;
    for (const game of updatedGames) {
      const missing: string[] = [];
      if (!game.id) missing.push('id');
      if (!game.date) missing.push('date');
      if (!game.opponent) missing.push('opponent');
      if (missing.length > 0) {
        console.warn(`⚠️  WARNING: Game ${game.id || '(unknown)'} missing fields: ${missing.join(', ')}`);
        validationWarnings++;
      }
    }

    if (updatedGames.length === 0) {
      console.error('❌ Updated games array is empty — refusing to write empty games.json');
      process.exit(1);
    }

    // Combine all changes
    const allChanges = [...scrapedChanges, ...gameUpdates];

    // --- Dry-run: print summary and exit without writing ---
    if (DRY_RUN) {
      console.log('\n--- DRY RUN SUMMARY ---');
      console.log(`Standings: ${standings.length} teams scraped`);
      console.log(`Mercury Schedule: ${schedule.length} matches scraped`);
      const withResults = schedule.filter(m => m.score !== '-').length;
      const upcoming = schedule.filter(m => m.score === '-').length;
      console.log(`  ${withResults} completed, ${upcoming} upcoming`);
      console.log(`League Schedule: ${leagueSchedule.length} matches scraped`);
      console.log(`Games.json: ${updatedGames.length} total games (${existingGames.length} existing)`);
      console.log(`Changes that would be applied: ${allChanges.length}`);
      allChanges.forEach(c => console.log(`  - ${c}`));
      if (validationWarnings > 0) {
        console.log(`Validation warnings: ${validationWarnings}`);
      }
      console.log('\nNo files were written.');
      process.exit(0);
    }

    // Log changes (only in non-dry-run mode)
    logChanges(allChanges);

    // Save updated games.json if there were updates or structure changes
    const gamesChanged = gameUpdates.length > 0 ||
      updatedGames.length !== existingGames.length;
    if (gamesChanged) {
      writeFileSync(GAMES_FILE, JSON.stringify(updatedGames, null, 2));
      console.log(`\n💾 Updated games.json with ${gameUpdates.length} change(s)`);
    } else {
      console.log('\n✅ No updates needed for games.json');
    }

    // Save scraped data for future comparison
    const dataFile = join(DATA_DIR, 'gotsport-data.json');
    writeFileSync(dataFile, JSON.stringify(currentData, null, 2));
    console.log(`💾 Scraped data saved to ${dataFile}`);

    // --- End-of-run summary ---
    const withResults = schedule.filter(m => m.score !== '-').length;
    const upcoming = schedule.filter(m => m.score === '-').length;
    console.log(`\n--- SUMMARY ---`);
    console.log(`Scraped ${schedule.length} games: ${withResults} had results, ${upcoming} upcoming`);
    if (validationWarnings > 0) {
      console.log(`Validation warnings: ${validationWarnings}`);
    }

    console.log('\n✅ Scraping completed successfully!');
    console.log('\nℹ️  Note: Opponent recent results are limited to matches in our schedule.');
    console.log('   For full opponent match history, the league-wide schedule would be needed.');

  } catch (error) {
    console.error('\n❌ Scraping failed:', error);
    process.exit(1);
  }
}

// CLI flags
const DRY_RUN = process.argv.includes('--dry-run');

// Run if called directly
if (require.main === module) {
  if (DRY_RUN) {
    console.log('🏜️  DRY RUN MODE — no files will be written.\n');
  }
  main();
}

export { main, scrapeStandings, scrapeSchedulePdf, parseSchedulePdfText };
