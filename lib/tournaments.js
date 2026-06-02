import downtownSuperCup2026 from '@/data/tournaments/downtown-super-cup-spring-2026.json';
import winterGoalRush2025 from '@/data/tournaments/winter-goal-rush-2025.json';

// Centralized tournament configuration to avoid duplication
export const TOURNAMENTS = [
  {
    id: 'downtown-super-cup-spring-2026',
    label: 'Downtown Super Cup',
    fullLabel: 'Downtown Super Cup - Spring 2026',
    dates: 'Feb 21-22, 2026',
    location: 'Del Mar High School',
    data: downtownSuperCup2026,
  },
  {
    id: 'winter-goal-rush-2025',
    label: 'Winter Goal Rush',
    fullLabel: '2025 Winter Goal Rush',
    dates: 'Dec 6-7, 2025',
    location: 'Morgan Hill Outdoor Sports Complex',
    data: winterGoalRush2025,
  },
];

// Helper to get tournament by ID
export function getTournamentById(id) {
  return TOURNAMENTS.find(t => t.id === id);
}

// Get past (non-current) tournaments
export function getPastTournaments() {
  return TOURNAMENTS.filter(t => !t.isCurrent);
}
