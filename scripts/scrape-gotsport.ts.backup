#!/usr/bin/env tsx
/**
 * GotSport Data Scraper
 * Fetches league results and team schedule from GotSport
 * Detects changes and updates local data files
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const RESULTS_URL = 'https://system.gotsport.com/org_event/events/44142/results?group=384051';
const SCHEDULE_URL = 'https://system.gotsport.com/org_event/events/44142/schedules?team=3231307';
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
}

interface ExistingGame {
  id: string;
  date: string;
  time: string;
  opponent: string;
  matchNumber?: string;
  result?: {
    us: number;
    them: number;
    goalScorers?: string[];
    assists?: string[];
  } | null;
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
    const $ = cheerio.load(response.data);

    const standings: StandingsEntry[] = [];

    // Find the standings table - it's the first table on the page
    $('table').first().find('tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 10) return;

      const entry: StandingsEntry = {
        position: parseInt($(cells[0]).text().trim()) || 0,
        team: $(cells[1]).text().trim(),
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

  } catch (error) {
    console.error('❌ Error scraping standings:', error);
    throw error;
  }
}

async function scrapeSchedule(): Promise<Match[]> {
  console.log('🔍 Scraping schedule...');

  try {
    const response = await axios.get(SCHEDULE_URL);
    const $ = cheerio.load(response.data);

    const matches: Match[] = [];

    // Find all tables, skip standings table (first one with 10 columns in header)
    $('table').each((_, table) => {
      // Check if this is a standings table by counting header columns
      const headerCells = $(table).find('thead tr').first().find('th, td').length;
      if (headerCells === 10) return; // Skip standings table

      // Process match table rows
      $(table).find('tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 7) return;

        // Check if first cell looks like a match number (digits only)
        const matchNumber = $(cells[0]).text().trim();
        if (!/^\d+$/.test(matchNumber)) return; // Skip if not a match number

        const timeCell = $(cells[1]).text().trim();
        const homeTeam = $(cells[2]).text().trim();
        const score = $(cells[3]).text().trim();
        const awayTeam = $(cells[4]).text().trim();
        const location = $(cells[5]).text().trim();
        const division = $(cells[6]).text().trim();

        // Extract date, time, and status from the time cell
        // Format: "Sep 07, 2025 2:15 PM PDT Scheduled" or "Sep 20, 2025 10:30 AM PDT"
        // Or just "Sep 20, 2025 10:30 AM PDT"
        const timeMatch = timeCell.match(/(\d{1,2}:\d{2}\s+[AP]M\s+[A-Z]{3})/);
        const time = timeMatch ? timeMatch[1] : '';

        // Extract date (everything before the time)
        const date = time ? timeCell.substring(0, timeCell.indexOf(time)).trim() : '';

        // Extract status (everything after the time)
        const statusText = time ? timeCell.substring(timeCell.indexOf(time) + time.length).trim() : '';
        const status = statusText || undefined;

        matches.push({
          matchNumber,
          date,
          time,
          homeTeam,
          awayTeam,
          score,
          location,
          division,
          status: status || undefined,
        });
      });
    });

    console.log(`✅ Scraped ${matches.length} matches from schedule`);
    return matches;

  } catch (error) {
    console.error('❌ Error scraping schedule:', error);
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

function updateGamesWithScores(existingGames: ExistingGame[], scrapedMatches: Match[]): {
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
      const dateMatch = match.date.match(/(\w+)\s+(\d+),\s+(\d+)/);
      if (dateMatch) {
        const monthMap: Record<string, string> = {
          Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
        };
        const [, month, day, year] = dateMatch;
        scrapedDate = `${year}-${monthMap[month]}-${day.padStart(2, '0')}`;
      }
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

        if (scrapedDate && game.date === scrapedDate) {
          return true;
        }

        // If the game already has a result, only match if dates are close (within 7 days)
        if (game.result && scrapedDate) {
          const existingDate = new Date(game.date);
          const scrapedDateObj = new Date(scrapedDate);
          const daysDiff = Math.abs((existingDate.getTime() - scrapedDateObj.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 7; // Only match if within 7 days
        }

        // If no result yet, match by opponent name (it's likely the upcoming game)
        return !game.result;
      });
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
  const ourTeam = 'Almaden FC Almaden FC Mercury B16 Black';

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
  console.log('🚀 Starting GotSport scraper...\n');

  try {
    // Scrape current data
    const [standings, schedule] = await Promise.all([
      scrapeStandings(),
      scrapeSchedule(),
    ]);

    const currentData: ScrapedData = {
      timestamp: new Date().toISOString(),
      standings,
      schedule,
    };

    // Load previous scraped data for change detection
    const previousData = loadPreviousData();

    // Detect changes in scraped data
    const scrapedChanges = detectChanges(previousData, currentData);

    // Load and update games.json with new scores (preserving manual data)
    console.log('\n🔄 Updating games.json with new scores...');
    const existingGames = loadExistingGames();
    const { games: updatedGames, updates: gameUpdates } = updateGamesWithScores(
      existingGames,
      schedule
    );

    // Combine all changes
    const allChanges = [...scrapedChanges, ...gameUpdates];

    // Log changes
    logChanges(allChanges);

    // Save updated games.json (only if there were updates)
    if (gameUpdates.length > 0) {
      writeFileSync(GAMES_FILE, JSON.stringify(updatedGames, null, 2));
      console.log(`\n💾 Updated games.json with ${gameUpdates.length} score change(s)`);
    } else {
      console.log('\n✅ No score updates needed for games.json');
    }

    // Save scraped data for future comparison
    const dataFile = join(DATA_DIR, 'gotsport-data.json');
    writeFileSync(dataFile, JSON.stringify(currentData, null, 2));
    console.log(`💾 Scraped data saved to ${dataFile}`);

    console.log('\n✅ Scraping completed successfully!');

  } catch (error) {
    console.error('\n❌ Scraping failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main, scrapeStandings, scrapeSchedule };
