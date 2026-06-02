"use strict";
/**
 * Tournament data serializer for MCP tools
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTournaments = loadTournaments;
exports.serializeTournamentList = serializeTournamentList;
exports.serializeTournament = serializeTournament;
const fs_1 = require("fs");
const path_1 = require("path");
const PROJECT_ROOT = __dirname.includes('dist')
    ? (0, path_1.resolve)(__dirname, '..', '..', '..')
    : (0, path_1.resolve)(__dirname, '..', '..');
/**
 * Load all tournaments from data/tournaments/
 */
function loadTournaments() {
    const tournamentsDir = (0, path_1.join)(PROJECT_ROOT, 'data', 'tournaments');
    const files = (0, fs_1.readdirSync)(tournamentsDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
        const data = (0, fs_1.readFileSync)((0, path_1.join)(tournamentsDir, f), 'utf-8');
        return JSON.parse(data);
    });
}
/**
 * Format tournament list for tool output
 */
function serializeTournamentList() {
    const tournaments = loadTournaments();
    const lines = tournaments.map(t => {
        const record = `${t.mercuryRecord.w}-${t.mercuryRecord.l}-${t.mercuryRecord.t}`;
        const placement = t.mercuryPlacement;
        const rank = t.mercuryPlacementRank ? ` (${t.mercuryPlacementRank})` : '';
        return `- ${t.name}: ${t.dates.start} to ${t.dates.end}, ${t.location.name} (${t.location.address}). Record: ${record}, Result: ${placement}${rank}`;
    });
    return {
        content: `Tournaments (${tournaments.length}):\n${lines.join('\n')}`
    };
}
/**
 * Format full tournament details for tool output
 */
function serializeTournament(tournamentId) {
    // If no ID provided, use the most recent tournament
    if (!tournamentId) {
        const tournaments = loadTournaments();
        if (tournaments.length === 0)
            return { content: 'No tournaments found.' };
        tournamentId = tournaments[0].id;
    }
    const filePath = (0, path_1.join)(PROJECT_ROOT, 'data', 'tournaments', `${tournamentId}.json`);
    let tournament;
    try {
        const data = (0, fs_1.readFileSync)(filePath, 'utf-8');
        tournament = JSON.parse(data);
    }
    catch {
        return { content: `Tournament not found: ${tournamentId}` };
    }
    const t = tournament;
    const record = `${t.mercuryRecord.w}-${t.mercuryRecord.l}-${t.mercuryRecord.t}`;
    const sections = [];
    // Header
    sections.push(`${t.name}`);
    sections.push(`Dates: ${t.dates.start} to ${t.dates.end}`);
    sections.push(`Location: ${t.location.name}, ${t.location.address}`);
    sections.push(`Division: ${t.division} | Format: ${t.format}`);
    sections.push(`Mercury Record: ${record} | Placement: ${t.mercuryPlacement}${t.mercuryPlacementRank ? ` (${t.mercuryPlacementRank})` : ''}`);
    // Location details
    if (t.location.parking) {
        sections.push(`\nParking: ${t.location.parking}`);
    }
    if (t.location.fields.length > 0) {
        sections.push(`Fields: ${t.location.fields.join(', ')}`);
    }
    if (t.location.note) {
        sections.push(`Note: ${t.location.note}`);
    }
    // Mercury games
    sections.push(`\nMercury Games:`);
    for (const mg of t.mercuryGames) {
        const resultStr = mg.result
            ? `${mg.result.us}-${mg.result.them} (${mg.result.us > mg.result.them ? 'W' : mg.result.us < mg.result.them ? 'L' : 'D'})`
            : 'TBD';
        const finalTag = mg.isFinal ? ' [FINAL]' : '';
        sections.push(`  Game ${mg.gameNumber}: vs ${mg.opponentShort} - ${mg.day} ${mg.date} ${mg.time}, Field ${mg.field} (${mg.homeAway}) → ${resultStr}${finalTag}`);
    }
    // Bracket results
    sections.push(`\nBracket Results:`);
    for (const [bracketName, bracket] of Object.entries(t.brackets)) {
        sections.push(`  Bracket ${bracketName}:`);
        for (const game of bracket.games) {
            const mercuryTag = game.isMercuryGame ? ' *' : '';
            sections.push(`    ${game.date} ${game.time} - ${game.homeTeam} vs ${game.awayTeam} @ ${game.location}: ${game.result ?? 'TBD'}${mercuryTag}`);
        }
    }
    // Final
    if (t.final) {
        const f = t.final;
        sections.push(`\nFinal: ${f.homeTeam} vs ${f.awayTeam} - ${f.date} ${f.time} @ ${f.location}: ${f.result ?? 'TBD'}`);
    }
    // Standings
    if (t.standings) {
        sections.push(`\nStandings:`);
        for (const [bracketName, teams] of Object.entries(t.standings)) {
            sections.push(`  Bracket ${bracketName}:`);
            for (const team of teams) {
                const usTag = team.isUs ? ' (Mercury)' : '';
                sections.push(`    ${team.team}: ${team.w}W-${team.l}L-${team.t}T, GF:${team.gf} GA:${team.ga} Pts:${team.pts}${usTag}`);
            }
        }
    }
    // Goal scorers
    if (t.goalScorers && t.goalScorers.length > 0) {
        sections.push(`\nGoal Scorers: ${t.goalScorers.map(gs => `${gs.name} (${gs.goals})`).join(', ')}`);
    }
    return { content: sections.join('\n') };
}
