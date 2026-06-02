"use strict";
/**
 * Roster data serializer for MCP tools
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRoster = loadRoster;
exports.getPlayerById = getPlayerById;
exports.serializeRoster = serializeRoster;
exports.serializePlayer = serializePlayer;
const fs_1 = require("fs");
const path_1 = require("path");
const PROJECT_ROOT = __dirname.includes('dist')
    ? (0, path_1.resolve)(__dirname, '..', '..', '..')
    : (0, path_1.resolve)(__dirname, '..', '..');
/**
 * Load roster from JSON
 */
function loadRoster() {
    const rosterPath = (0, path_1.join)(PROJECT_ROOT, 'data', 'roster.json');
    const rosterData = (0, fs_1.readFileSync)(rosterPath, 'utf-8');
    return JSON.parse(rosterData);
}
/**
 * Get player by ID
 */
function getPlayerById(playerId, roster) {
    return (roster ?? loadRoster()).find(p => p.id === playerId) || null;
}
/**
 * Format roster for tool output
 */
function serializeRoster() {
    const roster = loadRoster();
    const players = roster.map(player => ({
        id: player.id,
        name: player.fullName,
        number: player.number,
    })).sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
    return {
        content: `Roster: ${players.length} players. ${players.map(p => `#${p.number} ${p.name}`).join(', ')}.`
    };
}
/**
 * Format individual player info
 */
function serializePlayer(playerId) {
    const player = getPlayerById(playerId);
    if (!player) {
        return {
            content: `Player not found: ${playerId}`
        };
    }
    return {
        content: `${player.fullName} (#${player.number})`
    };
}
