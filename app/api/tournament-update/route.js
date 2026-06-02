import { NextResponse } from 'next/server';

const RESULTS_URL = 'https://system.gotsport.com/org_event/events/49449/results?group=475814';

// Team name mapping (same as scraper)
const TEAM_NAME_MAP = {
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

function normalizeTeamName(name) {
  const lower = name.toLowerCase();
  for (const [pattern, shortName] of Object.entries(TEAM_NAME_MAP)) {
    if (lower.includes(pattern)) return shortName;
  }
  return name.split(' ').slice(0, 2).join(' ');
}

export async function GET() {
  try {
    // Dynamic import of cheerio (server-side only)
    const cheerio = await import('cheerio');

    const response = await fetch(RESULTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MercuryB16Bot/1.0)',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch GotSport data' },
        { status: 502 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse standings from first tabpanel
    const standings = [];
    const tabpanel = $('div[role="tabpanel"]').first();
    const standingsTable = tabpanel.find('table').first();

    standingsTable.find('tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 10) return;

      const fullName = cells.eq(1).text().trim();
      const shortName = normalizeTeamName(fullName);

      standings.push({
        team: shortName,
        fullName,
        w: parseInt(cells.eq(3).text()) || 0,
        l: parseInt(cells.eq(4).text()) || 0,
        t: parseInt(cells.eq(5).text()) || 0,
        gf: parseInt(cells.eq(6).text()) || 0,
        ga: parseInt(cells.eq(7).text()) || 0,
        pts: parseInt(cells.eq(9).text()) || 0,
        ...(shortName === 'Mercury' ? { isUs: true } : {}),
      });
    });

    // Parse head-to-head results
    const games = [];
    const h2hTable = tabpanel.find('table').eq(1);
    const headerCells = h2hTable.find('thead th');
    const teamNames = [];

    headerCells.each((i, cell) => {
      if (i > 0 && i < headerCells.length - 2) {
        teamNames.push(normalizeTeamName($(cell).text().trim()));
      }
    });

    h2hTable.find('tbody tr').each((rowIdx, row) => {
      const cells = $(row).find('td');
      const rowTeam = normalizeTeamName(cells.eq(0).text().trim());

      cells.each((colIdx, cell) => {
        if (colIdx === 0 || colIdx >= teamNames.length + 1) return;
        const score = $(cell).text().trim();
        if (score && score !== '-' && score.includes('-')) {
          const colTeam = teamNames[colIdx - 1];
          if (rowTeam !== colTeam) {
            games.push({ team1: rowTeam, team2: colTeam, score });
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      standings: { A: standings },
      games,
    });
  } catch (error) {
    console.error('Tournament update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
