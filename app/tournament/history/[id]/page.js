'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { getTournamentById } from '@/lib/tournaments';
import HaloTournament from '@/components/halo/HaloTournament';

export default function TournamentHistoryDetailPage({ params }) {
  const { id } = use(params);
  const tournament = getTournamentById(id);

  if (!tournament || tournament.isCurrent || !tournament.data) {
    notFound();
  }

  return <HaloTournament tournament={tournament.data} isArchived />;
}
