"use strict";
/**
 * Game data serializer for MCP tools
 * Reuses existing game-utils functions for consistency
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadGames = loadGames;
exports.getNextGame = getNextGame;
exports.getUpcomingGames = getUpcomingGames;
exports.getPastGames = getPastGames;
exports.getAllGames = getAllGames;
exports.serializeNextMatch = serializeNextMatch;
exports.serializeSchedule = serializeSchedule;
exports.serializeGameDetail = serializeGameDetail;
exports.serializeRecentForm = serializeRecentForm;
exports.serializeGoalkeeperStats = serializeGoalkeeperStats;
const fs_1 = require("fs");
const path_1 = require("path");
// Resolve project root: works from both source (appsdk/serializers/) and compiled (appsdk/dist/serializers/)
const PROJECT_ROOT = __dirname.includes('dist')
    ? (0, path_1.resolve)(__dirname, '..', '..', '..')
    : (0, path_1.resolve)(__dirname, '..', '..');
const gameUtils = require((0, path_1.join)(PROJECT_ROOT, 'lib', 'game-utils.js'));
function outcome(us, them) {
    return us > them ? 'W' : us < them ? 'L' : 'D';
}
/**
 * Load games from JSON
 */
function loadGames() {
    const gamesPath = (0, path_1.join)(PROJECT_ROOT, 'data', 'games.json');
    const gamesData = (0, fs_1.readFileSync)(gamesPath, 'utf-8');
    return JSON.parse(gamesData);
}
/**
 * Get the next upcoming game
 */
function getNextGame(games) {
    return gameUtils.getNextGame(games ?? loadGames()) ?? null;
}
/**
 * Get upcoming games with optional limit
 */
function getUpcomingGames(limit = 5, games) {
    return gameUtils.getUpcomingGames(games ?? loadGames(), limit);
}
/**
 * Get past games
 */
function getPastGames(games) {
    return gameUtils.getPastGames(games ?? loadGames());
}
/**
 * Get all games (past and future)
 */
function getAllGames() {
    return loadGames();
}
/**
 * Format game for "next match" tool output
 */
function serializeNextMatch(game) {
    const timeUntil = gameUtils.getTimeUntilGame(game);
    const arrivalTime = gameUtils.getArrivalTime(game.time);
    const formattedDate = gameUtils.formatGameDateLong(game.date);
    return {
        content: `Next match: ${game.opponent} on ${formattedDate} at ${game.time}. Location: ${game.location.name}, ${game.location.address}. ${game.homeAway === 'home' ? 'Home' : 'Away'} game - wear ${game.jersey} jersey.${timeUntil ? ` Game in ${timeUntil.days}d ${timeUntil.hours}h ${timeUntil.minutes}m.` : ''}`
    };
}
/**
 * Format games list for "schedule" tool output
 */
function serializeSchedule(options = {}) {
    const { includePast = true, upcomingLimit = 10, pastLimit = 5 } = options;
    const games = loadGames();
    const upcoming = getUpcomingGames(upcomingLimit, games);
    const pastGames = includePast ? getPastGames(games).filter(g => g.result !== null).slice(0, pastLimit) : [];
    const orderedPast = includePast ? [...pastGames].reverse() : [];
    const upcomingCount = upcoming.length;
    const pastCount = includePast ? pastGames.length : 0;
    const latestRecord = pastGames[0]?.mercuryRecord ?? '0-0-0';
    const totalGames = pastCount + upcomingCount;
    const lines = [];
    lines.push(`Schedule: ${totalGames} games (${pastCount} completed, ${upcomingCount} upcoming). Current record: ${latestRecord}.`);
    if (orderedPast.length > 0) {
        lines.push('\nCompleted:');
        for (const game of orderedPast) {
            const formattedDate = gameUtils.formatGameDate(game.date);
            const oc = outcome(game.result.us, game.result.them);
            lines.push(`[${game.id}] ${formattedDate}: vs ${game.opponent} — ${game.result.us}-${game.result.them} (${oc})`);
        }
    }
    if (upcoming.length > 0) {
        lines.push('\nUpcoming:');
        for (const game of upcoming) {
            const formattedDate = gameUtils.formatGameDate(game.date);
            lines.push(`[${game.id}] ${formattedDate}: vs ${game.opponent}, ${game.time} at ${game.location.name}`);
        }
    }
    return {
        content: lines.join('\n')
    };
}
/**
 * Format full game detail for tool output
 */
function serializeGameDetail(gameId) {
    const games = loadGames();
    const game = games.find(g => g.id === gameId);
    if (!game) {
        return { content: `Game not found: ${gameId}` };
    }
    const formattedDate = gameUtils.formatGameDateLong(game.date);
    const sections = [];
    // Header
    sections.push(`${game.opponent}`);
    sections.push(`${formattedDate} at ${game.time}`);
    sections.push(`${game.homeAway === 'home' ? 'Home' : 'Away'} game`);
    // Score
    if (game.result) {
        const oc = outcome(game.result.us, game.result.them);
        sections.push(`\nScore: ${game.result.us}-${game.result.them} (${oc})`);
        // Goal scorers with timeline minutes
        if (game.result.goalScorers && game.result.goalScorers.length > 0) {
            const scorerLines = game.result.goalScorers.map(gs => {
                // Try to find minute info from timeline for this scorer
                if (game.result.timeline && game.result.timeline.length > 0) {
                    const timelineEntries = game.result.timeline.filter(t => t.team === 'mercury' && t.scorer === gs.replace(/\s*\(\d+\)$/, ''));
                    if (timelineEntries.length > 0) {
                        const minutes = timelineEntries.map(t => `${t.minute}'`).join(', ');
                        return `  ${gs} [${minutes}]`;
                    }
                }
                return `  ${gs}`;
            });
            sections.push(`Goals: \n${scorerLines.join('\n')}`);
        }
        // Assists
        if (game.result.assists && game.result.assists.length > 0) {
            sections.push(`Assists: ${game.result.assists.join(', ')}`);
        }
        // Goalkeeper stats
        if (game.result.goalkeepers && game.result.goalkeepers.length > 0) {
            const gkLines = game.result.goalkeepers.map(gk => `  ${gk.name} (Half ${gk.half}): ${gk.goalsAllowed} goals allowed`);
            sections.push(`Goalkeepers:\n${gkLines.join('\n')}`);
        }
    }
    else {
        sections.push(`\nResult: Not yet played`);
    }
    // Video
    if (game.videoUrl) {
        sections.push(`\nGame Film: ${game.videoUrl}`);
    }
    // Location
    sections.push(`\nLocation: ${game.location.name}`);
    if (game.location.address) {
        sections.push(`Address: ${game.location.address}`);
    }
    if (game.location.googleMapsUrl) {
        sections.push(`Map: ${game.location.googleMapsUrl}`);
    }
    // Kit
    sections.push(`\nJersey: ${game.jersey} | Socks: ${game.socks}`);
    // Weather
    if (game.weatherUrl) {
        sections.push(`Weather: ${game.weatherUrl}`);
    }
    return { content: sections.join('\n') };
}
/**
 * Format recent form (last N completed games) for tool output
 */
function serializeRecentForm(count) {
    const games = loadGames();
    const pastGames = getPastGames(games).filter(g => g.result !== null).slice(0, count);
    if (pastGames.length === 0) {
        return { content: 'No completed games found.' };
    }
    const results = pastGames.map(game => {
        const oc = outcome(game.result.us, game.result.them);
        const formattedDate = gameUtils.formatGameDate(game.date);
        let line = `[${game.id}] ${formattedDate}: vs ${game.opponent} — ${game.result.us}-${game.result.them} (${oc})`;
        if (game.result.goalScorers?.length) {
            line += ` | Goals: ${game.result.goalScorers.join(', ')}`;
        }
        if (game.result.assists?.length) {
            line += ` | Assists: ${game.result.assists.join(', ')}`;
        }
        return { line, oc };
    });
    const formString = results.map(r => r.oc).join('');
    return {
        content: `Recent form (last ${pastGames.length}): ${formString}\n${results.map(r => r.line).join('\n')}`
    };
}
/**
 * Compute and format goalkeeper stats across all games for tool output
 */
function serializeGoalkeeperStats() {
    const games = loadGames();
    const gkMap = {};
    for (const game of games) {
        if (!game.result || !game.result.goalkeepers)
            continue;
        for (const gk of game.result.goalkeepers) {
            if (!gkMap[gk.name]) {
                gkMap[gk.name] = { gamesPlayed: 0, totalGoalsAllowed: 0, cleanSheets: 0 };
            }
            gkMap[gk.name].gamesPlayed += 1;
            gkMap[gk.name].totalGoalsAllowed += gk.goalsAllowed;
            if (gk.goalsAllowed === 0) {
                gkMap[gk.name].cleanSheets += 1;
            }
        }
    }
    const gkEntries = Object.entries(gkMap)
        .sort((a, b) => b[1].gamesPlayed - a[1].gamesPlayed);
    if (gkEntries.length === 0) {
        return { content: 'No goalkeeper data available.' };
    }
    const lines = gkEntries.map(([name, stats]) => {
        const gaa = stats.gamesPlayed > 0 ? (stats.totalGoalsAllowed / stats.gamesPlayed).toFixed(2) : '0.00';
        return `- ${name}: ${stats.gamesPlayed} appearances, ${stats.totalGoalsAllowed} GA, ${gaa} GAA, ${stats.cleanSheets} clean sheets`;
    });
    return {
        content: `Goalkeeper Stats:\n${lines.join('\n')}`
    };
}
