import { SEASONS } from '@/lib/seasons';
import { calculateLeaderboards } from '@/lib/stats-calc';
import { getCompetitiveGames, getSeasonRecord } from '@/lib/stats-utils';
import rosterData from '@/data/roster.json';
import HaloStats from '@/components/halo/HaloStats';

export const dynamic = 'force-dynamic';

export default function StatsPage() {
  const seasons = SEASONS.map((season) => ({
    id: season.id,
    label: season.label,
    fullLabel: season.fullLabel,
  }));

  const precomputedStats = {};
  const seasonRecords = {};
  const perGameTrend = {};

  SEASONS.forEach((season) => {
    const competitive = getCompetitiveGames(season.data);
    precomputedStats[season.id] = calculateLeaderboards(season.data, rosterData);
    seasonRecords[season.id] = getSeasonRecord(season.data);
    perGameTrend[season.id] = competitive.map((g) => ({
      date: g.date,
      goals: g.result.us,
      conceded: g.result.them,
      result:
        g.result.us > g.result.them
          ? 'W'
          : g.result.us < g.result.them
          ? 'L'
          : 'D',
    }));
  });

  return (
    <HaloStats
      seasons={seasons}
      precomputedStats={precomputedStats}
      seasonRecords={seasonRecords}
      perGameTrend={perGameTrend}
    />
  );
}
