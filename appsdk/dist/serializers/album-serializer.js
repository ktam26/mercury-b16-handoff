"use strict";
/**
 * Album data serializer for MCP tools
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAlbums = loadAlbums;
exports.serializeAlbums = serializeAlbums;
const fs_1 = require("fs");
const path_1 = require("path");
const PROJECT_ROOT = __dirname.includes('dist')
    ? (0, path_1.resolve)(__dirname, '..', '..', '..')
    : (0, path_1.resolve)(__dirname, '..', '..');
/**
 * Load albums from JSON
 */
function loadAlbums() {
    const albumsPath = (0, path_1.join)(PROJECT_ROOT, 'data', 'albums.json');
    const albumsData = (0, fs_1.readFileSync)(albumsPath, 'utf-8');
    return JSON.parse(albumsData);
}
/**
 * Format albums list for tool output
 */
function serializeAlbums() {
    const albums = loadAlbums();
    const lines = albums.map(a => {
        const photoInfo = a.photoCount > 0 ? `${a.photoCount} photos` : 'Photos pending';
        return `- ${a.title} (${a.date}): ${photoInfo}, by ${a.photographer}. URL: ${a.url}`;
    });
    return {
        content: `Photo Albums (${albums.length}):\n${lines.join('\n')}`
    };
}
