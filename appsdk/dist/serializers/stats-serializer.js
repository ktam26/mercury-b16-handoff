"use strict";
/**
 * Player stats serializer for MCP tools
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadStats = loadStats;
exports.getPlayerStats = getPlayerStats;
exports.getTopScorers = getTopScorers;
exports.getTeamStats = getTeamStats;
exports.serializePlayerStats = serializePlayerStats;
exports.serializeTeamStats = serializeTeamStats;
const fs_1 = require("fs");
const path_1 = require("path");
const PROJECT_ROOT = __dirname.includes('dist')
    ? (0, path_1.resolve)(__dirname, '..', '..', '..')
    : (0, path_1.resolve)(__dirname, '..', '..');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { calculatePlayerStats } = require((0, path_1.join)(PROJECT_ROOT, 'lib', 'stats-calc.js'));
function loadJSON(filename) {
    return JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(PROJECT_ROOT, 'data', filename), 'utf-8'));
}
function loadStats() {
    const games = loadJSON('games.json');
    const roster = loadJSON('roster.json');
    return calculatePlayerStats(games, roster);
}
function perGameAvg(value, games) {
    return games > 0 ? (value / games).toFixed(2) : '0.00';
}
function getPlayerStats(playerId, allStats) {
    return (allStats ?? loadStats()).find(s => s.playerId === playerId) || null;
}
function getTopScorers(limit = 5, allStats) {
    return [...(allStats ?? loadStats())]
        .sort((a, b) => b.goals - a.goals)
        .slice(0, limit);
}
function getTeamStats(allStats) {
    const stats = allStats ?? loadStats();
    const totals = stats.reduce((acc, player) => ({
        gamesPlayed: Math.max(acc.gamesPlayed, player.gamesPlayed),
        totalGoals: acc.totalGoals + player.goals,
        totalAssists: acc.totalAssists + player.assists,
        activePlayers: player.gamesPlayed > 0 ? acc.activePlayers + 1 : acc.activePlayers
    }), { gamesPlayed: 0, totalGoals: 0, totalAssists: 0, activePlayers: 0 });
    return totals;
}
function serializePlayerStats(playerId) {
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
function serializeTeamStats() {
    const allStats = loadStats();
    const teamStats = getTeamStats(allStats);
    const topScorers = getTopScorers(5, allStats);
    return {
        content: `Team stats: ${teamStats.totalGoals} goals, ${teamStats.totalAssists} assists in ${teamStats.gamesPlayed} games. Top scorers: ${topScorers.map(p => `${p.playerName} (${p.goals}G)`).join(', ')}.`
    };
}
