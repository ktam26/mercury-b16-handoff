'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import HaloTournament from '@/components/halo/HaloTournament';
import { HaloCard } from '@/components/halo/HaloShell';
import { FieldMapSheet } from '@/components/FieldMapSheet';
import { useLiveScores } from '@/hooks/useLiveScores';
import tournamentData from '@/data/tournament.json';

export default function TournamentPageClient() {
  const [fieldMapOpen, setFieldMapOpen] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const { data: tournamentLiveData, isLive, lastUpdated } = useLiveScores(tournamentData);

  const handleFieldClick = (field) => {
    setActiveField(field);
    setFieldMapOpen(true);
  };

  return (
    <>
      <HaloTournament
        tournament={tournamentLiveData}
        isLive={isLive}
        lastUpdated={lastUpdated}
        onFieldClick={handleFieldClick}
      />

      <div className="max-w-3xl md:max-w-6xl mx-auto px-4 md:px-9 -mt-4 mb-12">
        <HaloCard className="p-5">
          <div
            className="text-[14px] font-bold mb-1"
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
          >
            Tournament archive
          </div>
          <div className="text-[12px] mb-3" style={{ color: 'var(--halo-muted)' }}>
            Browse Mercury&apos;s past tournament results
          </div>
          <Link
            href="/tournament/history"
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-[12px] font-bold tracking-wider uppercase hover:opacity-80 transition-opacity"
            style={{
              border: '1px solid var(--halo-glass-border)',
              background: 'var(--halo-glass-strong)',
              color: 'var(--halo-accent-bright)',
            }}
          >
            View past tournaments
            <ChevronRight className="w-4 h-4" />
          </Link>
        </HaloCard>
      </div>

      <FieldMapSheet
        isOpen={fieldMapOpen}
        onClose={() => setFieldMapOpen(false)}
        activeField={activeField}
        fieldMap={tournamentLiveData.fieldMap}
        tournamentLocation={tournamentLiveData.location}
      />
    </>
  );
}
