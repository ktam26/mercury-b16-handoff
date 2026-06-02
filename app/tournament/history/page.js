import { getPastTournaments } from '@/lib/tournaments';
import { TournamentHistoryCard } from '@/components/TournamentHistoryCard';
import { HaloPage } from '@/components/halo/HaloShell';
import { Trophy } from 'lucide-react';

export const metadata = {
  title: 'Past Tournaments | Mercury B16',
  description: 'Browse Mercury B16\'s past tournament results and history.',
};

export default function TournamentHistoryPage() {
  const pastTournaments = getPastTournaments();

  return (
    <HaloPage>
      <div className="pb-24 px-4 pt-6 max-w-7xl mx-auto lg:px-8">
        <div className="slide-in-up mb-8" style={{ animationDelay: '0.1s' }}>
          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
          >
            Past Tournaments
          </h1>
          <p
            className="text-sm tracking-wider"
            style={{ color: 'var(--halo-muted)' }}
          >
            Relive Mercury&apos;s tournament history
          </p>
        </div>

        {pastTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
            {pastTournaments.map((tournament) => (
              <TournamentHistoryCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Trophy
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: 'var(--halo-muted)', opacity: 0.5 }}
            />
            <p className="text-lg" style={{ color: 'var(--halo-muted)' }}>
              No past tournaments yet
            </p>
          </div>
        )}
      </div>
    </HaloPage>
  );
}
