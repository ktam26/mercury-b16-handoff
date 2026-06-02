import { redirect } from 'next/navigation';
import { TOURNAMENTS } from '@/lib/tournaments';
import TournamentPageClient from './TournamentPageClient';

export default function TournamentPage() {
  const currentTournament = TOURNAMENTS.find(t => t.isCurrent);

  if (!currentTournament) {
    redirect('/tournament/history');
  }

  return <TournamentPageClient />;
}
