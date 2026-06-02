import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { calculatePlayerStats } from './stats-calc';

// --- Data loading helpers ---

export const DATA_DIR = join(process.cwd(), 'data');

export function loadJSON(filename) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf-8'));
}

// Request-scoped cache to avoid duplicate readFileSync calls when multiple tools run
export function createDataCache() {
  const cache = {};
  const c = {
    games: () => cache.games ??= loadJSON('games.json'),
    roster: () => cache.roster ??= loadJSON('roster.json'),
    playerStats: () => cache.playerStats ??= calculatePlayerStats(c.games(), c.roster()),
    albums: () => cache.albums ??= loadJSON('albums.json'),
    tournaments: () => {
      if (!cache.tournaments) {
        const dir = join(DATA_DIR, 'tournaments');
        cache.tournaments = readdirSync(dir).filter(f => f.endsWith('.json')).map(f =>
          JSON.parse(readFileSync(join(dir, f), 'utf-8'))
        );
      }
      return cache.tournaments;
    },
    leagueData: () => cache.leagueData ??= loadJSON('gotsport-data.json'),
    seasonGames: (seasonId) => {
      const key = `season-${seasonId}`;
      if (!cache[key]) {
        const seasons = { 'spring-2026': 'games.json', 'fall-2025': 'seasons/fall-2025.json' };
        const file = seasons[seasonId];
        if (!file) return null;
        cache[key] = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'));
      }
      return cache[key];
    },
  };
  return c;
}

// --- Tool execution functions ---

export function outcome(us, them) {
  return us > them ? 'W' : us < them ? 'L' : 'D';
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDateLong(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatGoalClips(game) {
  if (!game.videoUrl || !game.result?.timeline) return null;
  const clips = game.result.timeline.filter(
    e => e.team === 'mercury' && e.type === 'goal' && e.videoTimestamp
  );
  if (clips.length === 0) return null;
  const lines = clips.map(e => {
    const assist = e.assist ? ` (assist: ${e.assist})` : '';
    return `- ${e.scorer} (${e.minute}')${assist}: ${game.videoUrl}&t=${e.videoTimestamp}`;
  });
  return `Goal Clips:\n${lines.join('\n')}\nFull Game: ${game.videoUrl}`;
}

export function getToolText(result) {
  return typeof result === 'object' && result?.text ? result.text : String(result);
}

export function getToolCard(result) {
  return typeof result === 'object' && result?.card ? result.card : null;
}

export function execTool(name, args, data) {
  switch (name) {
    case 'get_next_match': {
      const games = data.games();
      const now = new Date();
      const game = games
        .filter(g => new Date(g.date + 'T23:59:59') >= now && !g.result)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      if (!game) return 'No upcoming games scheduled.';
      return `Next match: ${game.opponent} on ${formatDateLong(game.date)} at ${game.time}. Location: ${game.location.name}, ${game.location.address}. ${game.homeAway === 'home' ? 'Home' : 'Away'} game - wear ${game.jersey} jersey.`;
    }

    case 'list_schedule': {
      const games = data.games();
      const now = new Date();
      const past = games.filter(g => g.result).reverse();
      const upcoming = games.filter(g => !g.result && new Date(g.date + 'T23:59:59') >= now);
      const limit = args?.limit || 10;
      const lines = [`Schedule: ${games.length} games (${past.length} completed, ${upcoming.length} upcoming).`];
      if (past.length > 0) {
        lines.push('\nCompleted:');
        past.slice(0, limit).forEach(g => {
          lines.push(`[${g.id}] ${formatDate(g.date)}: vs ${g.opponent} — ${g.result.us}-${g.result.them} (${outcome(g.result.us, g.result.them)})`);
        });
      }
      if (upcoming.length > 0) {
        lines.push('\nUpcoming:');
        upcoming.slice(0, limit).forEach(g => {
          lines.push(`[${g.id}] ${formatDate(g.date)}: vs ${g.opponent}, ${g.time} at ${g.location.name}`);
        });
      }
      return {
        text: lines.join('\n'),
        card: {
          type: 'schedule',
          completed: past.slice(0, limit).map(g => ({ id: g.id, date: formatDate(g.date), opponent: g.opponent, scoreUs: g.result.us, scoreThem: g.result.them, outcome: outcome(g.result.us, g.result.them) })),
          upcoming: upcoming.slice(0, limit).map(g => ({ id: g.id, date: formatDate(g.date), opponent: g.opponent, time: g.time, location: g.location.name })),
        },
      };
    }

    case 'get_roster': {
      const roster = data.roster();
      const sorted = [...roster].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
      return {
        text: `Roster: ${sorted.length} players. ${sorted.map(p => `#${p.number} ${p.fullName}`).join(', ')}.`,
        card: { type: 'roster', players: sorted.map(p => ({ number: p.number, name: p.fullName })) },
      };
    }

    case 'get_player_stats': {
      const stats = data.playerStats();
      if (args?.playerId) {
        const query = args.playerId.toLowerCase().replace(/[-_]/g, ' ');
        const p = stats.find(s => s.playerId === args.playerId)
          || stats.find(s => s.playerName.toLowerCase() === query)
          || stats.find(s => s.playerName.toLowerCase().includes(query) || query.includes(s.playerName.toLowerCase().split(' ').pop()));
        if (!p) return `No stats found for player: ${args.playerId}`;
        const numLabel = p.number != null ? ` (#${p.number})` : '';
        return `${p.playerName}${numLabel}: ${p.gamesPlayed} games, ${p.goals} goals, ${p.assists} assists`;
      }
      const sorted = [...stats].sort((a, b) => b.goals - a.goals);
      const totalGoals = stats.reduce((s, p) => s + p.goals, 0);
      const totalAssists = stats.reduce((s, p) => s + p.assists, 0);
      const topScorers = sorted.slice(0, 5);
      return {
        text: `Team stats: ${totalGoals} goals, ${totalAssists} assists. Top scorers: ${topScorers.map(p => `${p.playerName}${p.number != null ? ` (#${p.number})` : ''} ${p.goals}G ${p.assists}A`).join(', ')}.`,
        card: { type: 'stats', totalGoals, totalAssists, players: sorted.map(p => ({ name: p.playerName, number: p.number, gamesPlayed: p.gamesPlayed, goals: p.goals, assists: p.assists })) },
      };
    }

    case 'get_game_details': {
      const games = data.games();
      const game = games.find(g => g.id === args.gameId);
      if (!game) return `Game not found: ${args.gameId}`;
      const sections = [];
      sections.push(`${game.opponent} — ${formatDateLong(game.date)} at ${game.time}`);
      sections.push(`${game.homeAway === 'home' ? 'Home' : 'Away'} game at ${game.location.name}`);
      if (game.result) {
        sections.push(`Score: ${game.result.us}-${game.result.them} (${outcome(game.result.us, game.result.them)})`);
        if (game.result.goalScorers?.length) sections.push(`Goals: ${game.result.goalScorers.join(', ')}`);
        if (game.result.assists?.length) sections.push(`Assists: ${game.result.assists.join(', ')}`);
        if (game.result.goalkeepers?.length) {
          sections.push(`Goalkeepers: ${game.result.goalkeepers.map(gk => `${gk.name} (${gk.goalsAllowed} GA)`).join(', ')}`);
        }
      } else {
        sections.push('Result: Not yet played');
      }
      const clips = formatGoalClips(game);
      if (clips) {
        sections.push(`\n${clips}`);
      } else if (game.videoUrl) {
        sections.push(`Game Film: ${game.videoUrl}`);
      }
      return sections.join('\n');
    }

    case 'get_season_record': {
      const seasonId = args?.seasonId || 'spring-2026';
      const games = data.seasonGames(seasonId);
      if (!games) return `Season not found: ${seasonId}. Available: spring-2026, fall-2025`;
      const competitive = games.filter(g => g.result && g.type !== 'scrimmage');
      const wins = competitive.filter(g => g.result.us > g.result.them).length;
      const losses = competitive.filter(g => g.result.us < g.result.them).length;
      const ties = competitive.filter(g => g.result.us === g.result.them).length;
      const gf = competitive.reduce((s, g) => s + g.result.us, 0);
      const ga = competitive.reduce((s, g) => s + g.result.them, 0);
      const gd = gf - ga;
      const winRate = competitive.length > 0 ? ((wins / competitive.length) * 100).toFixed(1) : '0.0';
      const label = seasonId === 'spring-2026' ? 'Spring 2026' : 'Fall 2025';
      return `${label} Record: ${wins}-${losses}-${ties} (${competitive.length} games). Goals: ${gf} for, ${ga} against (${gd >= 0 ? '+' : ''}${gd} GD). Win rate: ${winRate}%.`;
    }

    case 'get_recent_form': {
      const games = data.games();
      const count = args?.count || 5;
      const past = games.filter(g => g.result).reverse().slice(0, count);
      if (past.length === 0) return 'No completed games found.';
      const form = past.map(g => outcome(g.result.us, g.result.them)).join('');
      const lines = past.map(g => {
        let line = `[${g.id}] ${formatDate(g.date)}: vs ${g.opponent} — ${g.result.us}-${g.result.them} (${outcome(g.result.us, g.result.them)})`;
        if (g.result.goalScorers?.length) line += ` | Goals: ${g.result.goalScorers.join(', ')}`;
        const clips = formatGoalClips(g);
        if (clips) {
          line += `\n  ${clips.replace(/\n/g, '\n  ')}`;
        } else if (g.videoUrl) {
          line += ` | Game Film: ${g.videoUrl}`;
        }
        return line;
      });
      return {
        text: `Recent form (last ${past.length}): ${form}\n${lines.join('\n')}`,
        card: {
          type: 'recent-form',
          form,
          games: past.map(g => ({ id: g.id, date: formatDate(g.date), opponent: g.opponent, scoreUs: g.result.us, scoreThem: g.result.them, outcome: outcome(g.result.us, g.result.them), goalScorers: g.result.goalScorers })),
        },
      };
    }

    case 'get_goalkeeper_stats': {
      const games = data.games();
      const roster = data.roster();
      const numberByNorm = new Map();
      roster.forEach(p => {
        const norm = (p.fullName || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        numberByNorm.set(norm, p.number);
      });
      const gkMap = {};
      games.forEach(g => {
        if (!g.result?.goalkeepers) return;
        g.result.goalkeepers.forEach(gk => {
          if (!gkMap[gk.name]) gkMap[gk.name] = { games: 0, ga: 0, saves: 0, cs: 0 };
          gkMap[gk.name].games++;
          gkMap[gk.name].ga += gk.goalsAllowed ?? 0;
          if (gk.saves != null) gkMap[gk.name].saves += gk.saves;
          if (gk.goalsAllowed === 0) gkMap[gk.name].cs++;
        });
      });
      const entries = Object.entries(gkMap).sort((a, b) => b[1].saves - a[1].saves);
      if (entries.length === 0) return 'No goalkeeper data available.';
      const totalSaves = entries.reduce((s, [, v]) => s + v.saves, 0);
      const totalGA = entries.reduce((s, [, v]) => s + v.ga, 0);
      const denom = totalSaves + totalGA;
      const savePct = denom > 0 ? Math.round((totalSaves / denom) * 100) : 0;
      const lookupNumber = (name) => {
        const norm = name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        return numberByNorm.get(norm);
      };
      return {
        text: `Goalkeeper Stats:\n${entries.map(([name, s]) => `- ${name}: ${s.games} appearances, ${s.saves} saves, ${s.ga} GA, ${(s.ga / s.games).toFixed(2)} GAA, ${s.cs} clean sheets`).join('\n')}`,
        card: {
          type: 'goalkeeper',
          summary: { totalSaves, totalGA, savePct },
          keepers: entries.map(([name, s]) => ({
            name,
            number: lookupNumber(name),
            games: s.games,
            saves: s.saves,
            goalsAllowed: s.ga,
            gaa: (s.ga / Math.max(1, s.games)).toFixed(2),
            cleanSheets: s.cs,
          })),
        },
      };
    }

    case 'get_saves_leader': {
      const games = data.games();
      const roster = data.roster();
      const numberByNorm = new Map();
      roster.forEach(p => {
        const norm = (p.fullName || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        numberByNorm.set(norm, p.number);
      });
      const gkMap = {};
      games.forEach(g => {
        if (!g.result?.goalkeepers) return;
        g.result.goalkeepers.forEach(gk => {
          if (!gkMap[gk.name]) gkMap[gk.name] = { games: 0, ga: 0, saves: 0, cs: 0 };
          gkMap[gk.name].games++;
          gkMap[gk.name].ga += gk.goalsAllowed ?? 0;
          if (gk.saves != null) gkMap[gk.name].saves += gk.saves;
          if (gk.goalsAllowed === 0) gkMap[gk.name].cs++;
        });
      });
      const entries = Object.entries(gkMap);
      if (entries.length === 0) return 'No goalkeeper data available.';
      const sorted = entries.sort((a, b) => b[1].saves - a[1].saves);
      const [name, s] = sorted[0];
      const totalSaves = entries.reduce((acc, [, v]) => acc + v.saves, 0);
      const totalGA = entries.reduce((acc, [, v]) => acc + v.ga, 0);
      const denomTeam = totalSaves + totalGA;
      const teamSavePct = denomTeam > 0 ? Math.round((totalSaves / denomTeam) * 100) : 0;
      const denomLeader = s.saves + s.ga;
      const leaderSavePct = denomLeader > 0 ? Math.round((s.saves / denomLeader) * 100) : 0;
      const norm = name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
      return {
        text: `Saves leader: ${name} with ${s.saves} saves across ${s.games} game${s.games === 1 ? '' : 's'} (${leaderSavePct}% save rate, ${s.cs} clean sheet${s.cs === 1 ? '' : 's'}). Team total: ${totalSaves} saves.`,
        card: {
          type: 'saves-leader',
          seasonLabel: 'This season',
          savePct: leaderSavePct,
          teamSaves: totalSaves,
          leader: {
            name,
            number: numberByNorm.get(norm),
            saves: s.saves,
            games: s.games,
            cleanSheets: s.cs,
            goalsAllowed: s.ga,
            gaa: (s.ga / Math.max(1, s.games)).toFixed(2),
          },
        },
      };
    }

    case 'get_tournament': {
      const tournaments = data.tournaments();
      const id = args?.tournamentId;
      const t = id ? tournaments.find(t => t.id === id) : tournaments[0];
      if (!t) return id ? `Tournament not found: ${id}` : 'No tournaments found.';
      const record = `${t.mercuryRecord.w}-${t.mercuryRecord.l}-${t.mercuryRecord.t}`;
      const sections = [
        t.name,
        `Dates: ${t.dates.start} to ${t.dates.end}`,
        `Location: ${t.location.name}, ${t.location.address}`,
        `Record: ${record} | Placement: ${t.mercuryPlacement}${t.mercuryPlacementRank ? ` (${t.mercuryPlacementRank})` : ''}`,
      ];
      if (t.mercuryGames?.length) {
        sections.push('\nMercury Games:');
        t.mercuryGames.forEach(mg => {
          const res = mg.result ? `${mg.result.us}-${mg.result.them}` : 'TBD';
          sections.push(`  Game ${mg.gameNumber}: vs ${mg.opponentShort} ${mg.day} ${mg.date} ${mg.time} → ${res}`);
        });
      }
      if (t.standings) {
        sections.push('\nStandings:');
        Object.entries(t.standings).forEach(([bracket, teams]) => {
          sections.push(`  Bracket ${bracket}:`);
          teams.forEach(team => {
            sections.push(`    ${team.team}: ${team.w}W-${team.l}L-${team.t}T, Pts:${team.pts}${team.isUs ? ' (Mercury)' : ''}`);
          });
        });
      }
      return sections.join('\n');
    }

    case 'list_tournaments': {
      const tournaments = data.tournaments();
      return `Tournaments (${tournaments.length}):\n${tournaments.map(t => {
        const record = `${t.mercuryRecord.w}-${t.mercuryRecord.l}-${t.mercuryRecord.t}`;
        return `- ${t.name}: ${t.dates.start} to ${t.dates.end}, Record: ${record}, Result: ${t.mercuryPlacement}`;
      }).join('\n')}`;
    }

    case 'list_photo_albums': {
      const albums = data.albums();
      return `Photo Albums (${albums.length}):\n${albums.map(a => `- ${a.title} (${a.date}): ${a.photoCount > 0 ? a.photoCount + ' photos' : 'Photos pending'}, by ${a.photographer}. URL: ${a.url}`).join('\n')}`;
    }

    case 'list_seasons': {
      return 'Available seasons:\n- spring-2026: Spring 2026 (current)\n- fall-2025: Fall 2025';
    }

    case 'get_league_standings': {
      const league = data.leagueData();
      const updated = league.timestamp ? new Date(league.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'unknown';
      const standings = league.standings || [];
      if (standings.length === 0) return 'No league standings available.';
      const lines = standings.map(t => {
        const isMercury = t.team.toLowerCase().includes('mercury') || t.team.toLowerCase().includes('almaden');
        return `${t.position}. ${t.team} — ${t.wins}W-${t.losses}L-${t.draws}D, ${t.points} pts (GF:${t.goalsFor} GA:${t.goalsAgainst}, ${t.goalDifference >= 0 ? '+' : ''}${t.goalDifference} GD)${isMercury ? ' ← MERCURY' : ''}`;
      });
      return {
        text: `League Standings (updated ${updated}):\n${lines.join('\n')}`,
        card: {
          type: 'standings',
          updated,
          teams: standings.map(t => ({
            position: t.position, team: t.team, wins: t.wins, losses: t.losses, draws: t.draws,
            points: t.points, goalsFor: t.goalsFor, goalsAgainst: t.goalsAgainst, goalDifference: t.goalDifference,
            isMercury: t.team.toLowerCase().includes('mercury') || t.team.toLowerCase().includes('almaden'),
          })),
        },
      };
    }

    case 'get_league_results': {
      const league = data.leagueData();
      const schedule = league.leagueSchedule || league.schedule || [];
      if (schedule.length === 0) return 'No league match results available.';
      const teamFilter = args?.teamName?.toLowerCase();
      const filtered = teamFilter
        ? schedule.filter(m => m.homeTeam.toLowerCase().includes(teamFilter) || m.awayTeam.toLowerCase().includes(teamFilter))
        : schedule;
      if (filtered.length === 0) return `No matches found for "${args.teamName}". Try a shorter name (e.g., "Monterey" instead of the full name).`;
      const lines = filtered.map(m => `- ${m.date}: ${m.homeTeam} vs ${m.awayTeam} — ${m.score || 'TBD'}${m.status ? ` (${m.status})` : ''}`);
      return `League Results${teamFilter ? ` for "${args.teamName}"` : ''} (${filtered.length} matches):\n${lines.join('\n')}`;
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

// Gemini function declarations
export const toolDeclarations = [
  {
    name: 'get_next_match',
    description: 'Get info about the next upcoming game including opponent, kickoff time, and location.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'list_schedule',
    description: 'Get the team schedule with past results and upcoming fixtures.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: { type: 'INTEGER', description: 'Max games to show per section (default 10)' },
      },
    },
  },
  {
    name: 'get_roster',
    description: 'Get the team roster with jersey numbers.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_player_stats',
    description: 'Get season statistics for a specific player or team summary.',
    parameters: {
      type: 'OBJECT',
      properties: {
        playerId: { type: 'STRING', description: 'Player ID (e.g. player-044) or player name (e.g. "Kaden Tamura") for individual stats. Omit for team summary with top scorers.' },
      },
    },
  },
  {
    name: 'get_game_details',
    description: 'Get full details for a specific game by ID, including score, goal scorers, assists, and video links.',
    parameters: {
      type: 'OBJECT',
      properties: {
        gameId: { type: 'STRING', description: 'The game ID (e.g. game-001)' },
      },
      required: ['gameId'],
    },
  },
  {
    name: 'get_season_record',
    description: 'Get win/loss/tie record, goal differential, and win rate for a season.',
    parameters: {
      type: 'OBJECT',
      properties: {
        seasonId: { type: 'STRING', description: 'Season ID: spring-2026 (default) or fall-2025' },
      },
    },
  },
  {
    name: 'get_recent_form',
    description: 'Get results of the last N completed games with scores and goal scorers.',
    parameters: {
      type: 'OBJECT',
      properties: {
        count: { type: 'INTEGER', description: 'Number of recent games (default 5)' },
      },
    },
  },
  {
    name: 'get_goalkeeper_stats',
    description: 'Get goalkeeper performance stats for all keepers: saves, goals allowed, GAA, clean sheets, games played.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_saves_leader',
    description: 'Get the goalkeeper with the most saves this season as a compact glance answer. Use this when the user asks who has the most saves, the saves leader, or the top goalkeeper by saves.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_tournament',
    description: 'Get full tournament details including bracket, results, and standings.',
    parameters: {
      type: 'OBJECT',
      properties: {
        tournamentId: { type: 'STRING', description: 'Tournament ID. Omit for most recent.' },
      },
    },
  },
  {
    name: 'list_tournaments',
    description: 'List all tournaments the team has participated in.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'list_photo_albums',
    description: 'List photo albums with links.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'list_seasons',
    description: 'List available seasons.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_league_standings',
    description: 'Get current league standings for all teams in the division, including wins, losses, draws, goals, and points.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_league_results',
    description: 'Get league match results. Can filter by team name (partial match, e.g. "Monterey" matches "Monterey County Soccer-ECFC...").',
    parameters: {
      type: 'OBJECT',
      properties: {
        teamName: { type: 'STRING', description: 'Partial team name to filter results (e.g. "Monterey", "Hollister"). Omit for all matches.' },
      },
    },
  },
];

export const SYSTEM_PROMPT = `You are the Mercury B16 team assistant — a helpful, concise AI for Almaden FC Mercury Black B16, a BU10 (Boys Under 10) youth soccer team based in San Jose, CA.

You help parents, coaches, and fans quickly find information about the team using the tools available to you.

GUIDELINES:
- Be concise and friendly. These are busy parents checking on their kid's team.
- Use **bold** for key info (names, scores, dates).
- Use the tools to get current data — don't make up information.
- When showing scores, use format like "Mercury 3-1 Opponent" with (W), (L), or (D).
- When showing dates, include day of week.
- If asked about something you can't look up, say so honestly.
- Keep responses short — 2-4 sentences for simple questions, bullet lists for detailed info.
- When users say "we", "us", "our team", or "Mercury" they mean Almaden FC Mercury Black B16.
- You have access to league standings and match results for all teams in the division. Use get_league_standings and get_league_results to answer questions about opponents.
- When sharing goal highlight clips, always include the timestamped URL so parents can jump directly to the goal.`;
