/**
 * Game utility functions for the Mercury B16 Team App
 * Native Date implementation - no external dependencies
 */

/**
 * Converts game date and time into a JavaScript Date object
 * @param {Object} game - The game object containing date and time
 * @param {string} game.date - The game date in YYYY-MM-DD format
 * @param {string} game.time - The game time in 12-hour format (e.g., "2:30 PM")
 * @returns {Date} JavaScript Date object representing the game date/time
 * @throws {Error} If game data is invalid or missing date/time
 */
export function getGameDateTime(game) {
  if (!game?.date || !game?.time) {
    throw new Error('Invalid game data: missing date or time');
  }

  return createPacificDateTime(game.date, game.time);
}

/**
 * Converts 12-hour time format to 24-hour format
 * @param {string} time12h - Time in 12-hour format (e.g., "2:30 PM")
 * @returns {string} Time in 24-hour format (e.g., "14:30:00")
 * @example
 * convertTo24Hour("2:30 PM") // Returns "14:30:00"
 * convertTo24Hour("12:00 AM") // Returns "00:00:00"
 */
export function convertTo24Hour(time12h) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }

  return `${hours}:${minutes}:00`;
}

// Always render schedule data based on the team's Pacific timezone
const PACIFIC_TIME_ZONE = 'America/Los_Angeles';

const pacificShortDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIME_ZONE,
  weekday: 'short',
  month: 'short',
  day: 'numeric'
});

const pacificLongDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIME_ZONE,
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric'
});

const pacificComponentsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

const pacificMonthDayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIME_ZONE,
  month: 'short',
  day: 'numeric',
});

const pacificDayPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIME_ZONE,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

/**
 * Formats a date string into a short, readable format
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "Sat, Sep 20")
 */
export function formatGameDate(dateString) {
  const date = createPacificDate(dateString);
  return pacificShortDateFormatter.format(date);
}

export function formatGameDateLong(dateString) {
  const date = createPacificDate(dateString);
  return pacificLongDateFormatter.format(date);
}

export function formatMonthDay(dateString) {
  const date = createPacificDate(dateString);
  return pacificMonthDayFormatter.format(date);
}

export function getDateParts(dateString) {
  const date = createPacificDate(dateString);
  const parts = pacificDayPartsFormatter.formatToParts(date);
  const out = {};
  for (const p of parts) {
    if (p.type === 'literal') continue;
    out[p.type] = p.value;
  }
  return {
    weekday: (out.weekday || '').toUpperCase(),
    month: (out.month || '').toUpperCase(),
    day: out.day || '',
  };
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function isScrimmage(game) {
  return game?.type === 'scrimmage';
}

export function getResult(game) {
  if (!game?.result) return null;
  if (game.result.us > game.result.them) return 'W';
  if (game.result.us < game.result.them) return 'L';
  return 'D';
}

export function getOpponentLogo(game) {
  if (!game?.teamLogos) return null;
  return game.homeAway === 'home' ? game.teamLogos.away : game.teamLogos.home;
}

export function getOurLogo(game) {
  if (!game?.teamLogos) return null;
  return game.homeAway === 'home' ? game.teamLogos.home : game.teamLogos.away;
}

export function getArrivalTime(gameTime) {
  // Parse the game time (e.g., "10:30 AM")
  const [time, modifier] = gameTime.split(' ');
  let [hours, minutes] = time.split(':');

  // Convert to 24-hour format
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);

  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  } else if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }

  // Subtract 30 minutes
  let arrivalHours = hours;
  let arrivalMinutes = minutes - 30;

  if (arrivalMinutes < 0) {
    arrivalMinutes += 60;
    arrivalHours -= 1;
    if (arrivalHours < 0) {
      arrivalHours = 23;
    }
  }

  // Convert back to 12-hour format
  const arrivalModifier = arrivalHours >= 12 ? 'PM' : 'AM';
  let displayHours = arrivalHours % 12;
  if (displayHours === 0) displayHours = 12;

  const displayMinutes = arrivalMinutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${arrivalModifier}`;
}

/**
 * Calculates time remaining until a game starts
 * @param {Object} game - The game object
 * @returns {Object|null} Object with days, hours, minutes until game, or null if game has passed
 * @example
 * getTimeUntilGame(nextGame) // Returns { days: 2, hours: 14, minutes: 30 }
 */
export function getTimeUntilGame(game) {
  const gameDateTime = getGameDateTime(game);
  const now = new Date();

  if (now >= gameDateTime) {
    return null;
  }

  const diff = gameDateTime - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

/**
 * Finds the next upcoming game from an array of games
 * @param {Array} games - Array of game objects
 * @returns {Object|undefined} The next upcoming game or undefined if no future games
 */
export function getNextGame(games) {
  const now = new Date();
  return games
    .filter(game => getGameDateTime(game) > now)
    .sort((a, b) => getGameDateTime(a) - getGameDateTime(b))[0];
}

export function getUpcomingGames(games, limit = 3) {
  const now = new Date();
  return games
    .filter(game => getGameDateTime(game) > now)
    .sort((a, b) => getGameDateTime(a) - getGameDateTime(b))
    .slice(0, limit);
}

export function getPastGames(games) {
  const now = new Date();
  return games
    .filter(game => getGameDateTime(game) <= now)
    .sort((a, b) => getGameDateTime(b) - getGameDateTime(a));
}

export function getGameById(games, id) {
  return games.find(game => game.id === id);
}

// Get form string from recent results (e.g., "WWLLD")
export function getFormString(recentResults) {
  if (!recentResults || recentResults.length === 0) {
    return '';
  }
  return recentResults
    .slice(-5) // Last 5 games
    .map(r => r.result.toUpperCase())
    .join('');
}

// Get badge variant/color for form letter
export function getFormBadgeVariant(result) {
  const upper = result.toUpperCase();
  if (upper === 'W') return 'success'; // green
  if (upper === 'L') return 'destructive'; // red
  return 'secondary'; // gray for draw
}

// Get readable form display with colors
export function getFormDisplay(recentResults) {
  if (!recentResults || recentResults.length === 0) {
    return { form: '', results: [] };
  }

  const last5 = recentResults.slice(-5);
  return {
    form: last5.map(r => r.result.toUpperCase()).join(''),
    results: last5
  };
}

function createPacificDate(dateString) {
  const { year, month, day } = parseDateString(dateString);
  return buildPacificDate(year, month, day, 12, 0);
}

function createPacificDateTime(dateString, timeString) {
  const { year, month, day } = parseDateString(dateString);
  const { hours, minutes } = parseTimeString(timeString);
  return buildPacificDate(year, month, day, hours, minutes);
}

function buildPacificDate(year, month, day, hours, minutes) {
  const baseUtcMillis = Date.UTC(year, month - 1, day, hours, minutes);
  if (Number.isNaN(baseUtcMillis)) {
    throw new Error(`Unable to build base UTC date for ${year}-${month}-${day} ${hours}:${minutes}`);
  }

  const baseUtcDate = new Date(baseUtcMillis);
  const parts = pacificComponentsFormatter.formatToParts(baseUtcDate);
  const componentMap = {};

  for (const part of parts) {
    if (part.type === 'literal') continue;
    componentMap[part.type] = part.value;
  }

  const tzYear = componentMap.year;
  const tzMonth = componentMap.month;
  const tzDay = componentMap.day;
  const tzHour = componentMap.hour;
  const tzMinute = componentMap.minute;
  const tzSecond = componentMap.second ?? '00';

  if ([tzYear, tzMonth, tzDay, tzHour, tzMinute, tzSecond].some(value => typeof value === 'undefined')) {
    throw new Error('Unable to determine Pacific timezone components');
  }

  const pacificAsUtcMillis = Date.UTC(
    Number(tzYear),
    Number(tzMonth) - 1,
    Number(tzDay),
    Number(tzHour),
    Number(tzMinute),
    Number(tzSecond)
  );

  const offsetMillis = pacificAsUtcMillis - baseUtcMillis;
  const result = new Date(baseUtcMillis - offsetMillis);

  if (Number.isNaN(result.getTime())) {
    throw new Error(`Unable to derive Pacific date for ${year}-${month}-${day}`);
  }

  return result;
}

function parseTimeString(time12h) {
  if (typeof time12h !== 'string') {
    throw new Error(`Invalid time value: ${time12h}`);
  }

  const time24 = convertTo24Hour(time12h);
  const [hoursStr, minutesStr] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Unable to parse time: ${time12h}`);
  }

  return { hours, minutes };
}

function parseDateString(dateString) {
  if (typeof dateString !== 'string') {
    throw new Error(`Invalid date value: ${dateString}`);
  }

  const parts = dateString.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  const [year, month, day] = parts.map(Number);
  if ([year, month, day].some(Number.isNaN)) {
    throw new Error(`Invalid date components: ${dateString}`);
  }

  return { year, month, day };
}

/**
 * Returns a short, display-friendly version of a team name
 * Applies custom mappings for known teams and falls back to the first two words
 * @param {string} name - Full team name
 * @returns {string} Short display name
 */
export function getShortTeamName(name) {
  if (!name) {
    return '';
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return '';
  }

  const normalized = trimmed.toLowerCase();

  // --- Spring 2026 opponents (order matters — first match wins) ---
  if (normalized.includes('hollister') && normalized.includes('tremors')) {
    return 'Hollister Tremors';
  }

  if (normalized.includes('monterey surf')) {
    return 'Monterey Surf';
  }

  if (normalized.includes('ecfc') || normalized.includes('monterey county soccer')) {
    return 'Salinas ECFC';
  }

  if (normalized.includes('pv united') || normalized.includes('pajaro valley')) {
    return 'PV United';
  }

  if (normalized.includes('santa cruz united')) {
    return 'Santa Cruz United';
  }

  if (normalized.includes('santa cruz') && normalized.includes('shark')) {
    return 'SC Sharks';
  }

  if (normalized.includes('ov toros')) {
    return 'OV Toros';
  }

  if (normalized.includes('real salinas')) {
    return 'Real Salinas';
  }

  // --- Fall 2025 / general mappings ---
  if (normalized.includes('esjfc') || normalized.includes('east san jose')) {
    return 'ESJFC';
  }

  if (normalized.includes('mercury') && normalized.includes('black')) {
    return 'AFC';
  }

  if (normalized.includes('mercury') && normalized.includes('blue')) {
    return 'Mercury Blue';
  }

  if (normalized.includes('mercury')) {
    return 'AFC';
  }

  if (normalized.includes('solano')) {
    return 'Solano Surf';
  }

  if (normalized.includes('madera')) {
    return 'Madera United';
  }

  const words = trimmed.split(/\s+/);
  if (words.length <= 2) {
    return trimmed;
  }

  return words.slice(0, 2).join(' ');
}
