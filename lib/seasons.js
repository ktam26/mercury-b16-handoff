import currentGamesData from '@/data/games.json';
import fall2025Games from '@/data/seasons/fall-2025.json';

// Centralized season configuration to avoid duplication
export const SEASONS = [
  { id: 'spring-2026', label: 'Spring 26', fullLabel: 'Spring 2026', data: currentGamesData },
  { id: 'fall-2025', label: 'Fall 25', fullLabel: 'Fall 2025', data: fall2025Games },
];

// Helper to get season by ID
export function getSeasonById(seasonId) {
  return SEASONS.find(s => s.id === seasonId);
}

// Get the current (most recent) season
export function getCurrentSeason() {
  return SEASONS[0];
}
