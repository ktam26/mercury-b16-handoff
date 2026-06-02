import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { HaloCard } from '@/components/halo/HaloShell';

export function TournamentHistoryCard({ tournament }) {
  const { id, fullLabel, dates, location, data } = tournament;
  const record = data?.mercuryRecord;
  const placement = data?.mercuryPlacement;
  const placementRank = data?.mercuryPlacementRank;
  const isChampion = placement === 'CHAMPION';
  const isFinalist = placement === 'FINALIST';
  const placementGold = isChampion || isFinalist;

  return (
    <Link href={`/tournament/history/${id}`}>
      <HaloCard className="p-5 transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] cursor-pointer">
        <p
          className="text-xs tracking-wider uppercase mb-2"
          style={{ color: 'var(--halo-muted)' }}
        >
          {dates}
        </p>

        <h3
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
        >
          {fullLabel}
        </h3>

        <p className="text-sm mb-4" style={{ color: 'var(--halo-muted)' }}>
          📍 {location}
        </p>

        {record && (
          <div
            className="rounded-lg p-3 mb-4"
            style={{
              background: 'var(--halo-glass-strong)',
              border: '1px solid var(--halo-glass-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-[10px] tracking-wider uppercase mb-1"
                  style={{ color: 'var(--halo-muted)' }}
                >
                  Mercury Record
                </p>
                <div className="flex gap-2 items-baseline">
                  <span className="text-lg font-bold" style={{ color: 'var(--halo-accent-bright)' }}>
                    {record.w}W
                  </span>
                  <span className="text-lg" style={{ color: 'var(--halo-muted)' }}>-</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--halo-loss)' }}>
                    {record.l}L
                  </span>
                  <span className="text-lg" style={{ color: 'var(--halo-muted)' }}>-</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--halo-muted)' }}>
                    {record.t}T
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p
                  className="text-[10px] tracking-wider uppercase mb-1"
                  style={{ color: 'var(--halo-muted)' }}
                >
                  Placement
                </p>
                <p
                  className="text-base font-bold"
                  style={{
                    color: placementGold ? 'var(--halo-amber-ink)' : 'var(--halo-ink)',
                  }}
                >
                  {isChampion && '🏆 '}{placement}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span
            className="text-sm font-bold tracking-wider uppercase"
            style={{ color: 'var(--halo-accent-bright)' }}
          >
            View Tournament Details
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--halo-accent-bright)' }} />
        </div>
      </HaloCard>
    </Link>
  );
}
