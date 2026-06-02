import gamesData from '@/data/games.json';
import fall2025Games from '@/data/seasons/fall-2025.json';
import HaloSchedule from '@/components/halo/HaloSchedule';

export const dynamic = 'force-dynamic';

export default function Schedule() {
  return (
    <HaloSchedule
      currentSeason={{
        id: 'spring-2026',
        label: 'Spring 2026',
        games: gamesData,
      }}
      previousSeason={{
        id: 'fall-2025',
        label: 'Fall 2025',
        games: fall2025Games,
      }}
    />
  );
}
