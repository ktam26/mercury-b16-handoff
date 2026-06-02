/**
 * Album data serializer for MCP tools
 */

import { readFileSync } from 'fs';
import { join, resolve } from 'path';

const PROJECT_ROOT = __dirname.includes('dist')
  ? resolve(__dirname, '..', '..', '..')
  : resolve(__dirname, '..', '..');

interface Album {
  id: string;
  title: string;
  date: string;
  photoCount: number;
  coverImage: string;
  url: string;
  photographer: string;
}

/**
 * Load albums from JSON
 */
export function loadAlbums(): Album[] {
  const albumsPath = join(PROJECT_ROOT, 'data', 'albums.json');
  const albumsData = readFileSync(albumsPath, 'utf-8');
  return JSON.parse(albumsData);
}

/**
 * Format albums list for tool output
 */
export function serializeAlbums() {
  const albums = loadAlbums();

  const lines = albums.map(a => {
    const photoInfo = a.photoCount > 0 ? `${a.photoCount} photos` : 'Photos pending';
    return `- ${a.title} (${a.date}): ${photoInfo}, by ${a.photographer}. URL: ${a.url}`;
  });

  return {
    content: `Photo Albums (${albums.length}):\n${lines.join('\n')}`
  };
}
