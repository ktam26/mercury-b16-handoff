'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useCountdown, useMounted } from '@/hooks/useCountdown';
import { Cloud, Sun, Droplets, Wind } from 'lucide-react';

export function TournamentHero({ tournament, nextGame, isArchived = false }) {
  const mounted = useMounted();

  const countdownGame = useMemo(() => {
    if (isArchived || !nextGame) return null;
    return {
      date: nextGame.date,
      time: nextGame.time
    };
  }, [isArchived, nextGame?.date, nextGame?.time]);

  const timeUntil = useCountdown(countdownGame);

  const isToday = (dateStr) => {
    const today = new Date();
    const gameDate = new Date(dateStr + 'T00:00:00');
    return today.toDateString() === gameDate.toDateString();
  };

  const isSaturday = nextGame?.day === 'Saturday';
  const weatherImage = isSaturday ? '/tournament/weather-sat.png' : '/tournament/weather-sun.png';
  const weatherVideo = isSaturday ? '/tournament/weather-sat.mp4' : '/tournament/weather-sun.mp4';

  const record = tournament.mercuryRecord;
  const placement = tournament.mercuryPlacement;
  const placementRank = tournament.mercuryPlacementRank;
  const isChampion = placement === 'CHAMPION';

  // Format archived dates for display
  const archivedDateDisplay = isArchived && tournament.dates
    ? (() => {
        const start = new Date(tournament.dates.start + 'T00:00:00');
        const end = new Date(tournament.dates.end + 'T00:00:00');
        const opts = { month: 'short', day: 'numeric', year: 'numeric' };
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${end.toLocaleDateString('en-US', opts)}`;
      })()
    : null;

  return (
    <div className="slide-in-up" style={{ animationDelay: '0.1s' }}>
      {/* Main Hero Card */}
      <div className="stadium-card overflow-hidden relative mb-6">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          {isArchived ? (
            <div className="absolute inset-0 bg-linear-to-b from-stadium-gray/30 to-stadium-dark" />
          ) : (
            <>
              <video
                autoPlay
                loop
                muted
                playsInline
                poster={weatherImage}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              >
                <source src={weatherVideo} type="video/mp4" />
              </video>
              <Image
                src={weatherImage}
                alt="Weather forecast background for tournament weekend"
                fill
                className="object-cover opacity-40 video-fallback"
                style={{ display: 'none' }}
                onError={(e) => { e.target.style.display = 'block'; }}
              />
              <div className="absolute inset-0 bg-linear-to-b from-stadium-black/60 via-stadium-black/40 to-stadium-black/90" />
            </>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 p-6">
          {/* Tournament Badge */}
          <div className="flex justify-center mb-4">
            {isArchived ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-stadium-gray/80 backdrop-blur-sm rounded-full border border-stadium-border">
                <span className="text-chalk-dim text-lg">🏁</span>
                <span className="athletic-condensed text-chalk-dim font-semibold text-sm tracking-widest uppercase">
                  Completed
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-stadium-gray/80 backdrop-blur-sm rounded-full border border-gold-bright/30">
                <span className="text-gold-bright text-lg">🏆</span>
                <span className="athletic-condensed text-gold-bright font-semibold text-sm tracking-widest uppercase">
                  Tournament Weekend
                </span>
              </div>
            )}
          </div>

          {/* Tournament Name */}
          <h2 className="athletic-heading text-3xl md:text-4xl font-bold text-center mb-1 text-chalk-white">
            {tournament.name}
          </h2>
          <p className="athletic-condensed text-center text-chalk-dim text-sm mb-6 tracking-wide">
            {tournament.division} • {tournament.format}
          </p>

          {isArchived ? (
            <>
              {/* Archived Date */}
              {archivedDateDisplay && (
                <p className="athletic-condensed text-center text-chalk-dim text-sm mb-6 tracking-wide">
                  {archivedDateDisplay}
                </p>
              )}

              {/* Result Banner */}
              {record && (
                <div className="text-center">
                  <div className="inline-block">
                    <div className={`${isChampion ? 'glow-border-gold' : 'glow-border'} bg-stadium-black/80 backdrop-blur-sm rounded-xl px-8 py-5`}>
                      <p className="athletic-condensed text-turf text-xs uppercase tracking-[0.2em] mb-3 font-semibold">
                        Mercury Final Result
                      </p>
                      <div className="flex gap-4 justify-center mb-3">
                        <span className="scoreboard-number text-3xl">
                          <span className="text-turf">{record.w}W</span>
                        </span>
                        <span className="scoreboard-number text-3xl text-chalk-dim">-</span>
                        <span className="scoreboard-number text-3xl">
                          <span className="text-scoreboard-red">{record.l}L</span>
                        </span>
                        <span className="scoreboard-number text-3xl text-chalk-dim">-</span>
                        <span className="scoreboard-number text-3xl">
                          <span className="text-chalk-dim">{record.t}T</span>
                        </span>
                      </div>
                      <p className={`athletic-heading text-lg ${isChampion ? 'trophy-gradient bg-clip-text text-transparent' : 'text-chalk-white'}`}>
                        {placement}{placementRank ? ` - ${placementRank} PLACE` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Weather Strip */}
              <div className="flex justify-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 bg-stadium-gray/60 backdrop-blur-sm rounded-lg border border-stadium-border">
                  <Sun className="w-4 h-4 text-gold-bright" />
                  <span className="athletic-condensed text-chalk-white text-sm font-medium">Mostly Sunny</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-stadium-gray/60 backdrop-blur-sm rounded-lg border border-stadium-border">
                  <span className="scoreboard-number text-turf text-lg font-bold">58°</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-stadium-gray/60 backdrop-blur-sm rounded-lg border border-stadium-border">
                  <Wind className="w-4 h-4 text-chalk-dim" />
                  <span className="athletic-condensed text-chalk-dim text-sm">7 mph</span>
                </div>
              </div>

              {/* Countdown Section */}
              {nextGame && (
                <div className="text-center">
                  <p className="athletic-condensed text-turf text-xs uppercase tracking-[0.2em] mb-4 font-semibold">
                    {isToday(nextGame.date) ? '⚡ KICKOFF TODAY' : `NEXT GAME • ${nextGame.day.toUpperCase()}`}
                  </p>

                  {/* Scoreboard Countdown */}
                  {mounted && timeUntil ? (
                    <div className="flex gap-3 justify-center mb-6">
                      <CountdownBlock value={timeUntil.days} label="DAYS" />
                      <div className="flex items-center text-turf text-2xl font-bold">:</div>
                      <CountdownBlock value={timeUntil.hours} label="HRS" />
                      <div className="flex items-center text-turf text-2xl font-bold">:</div>
                      <CountdownBlock value={timeUntil.minutes} label="MIN" />
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-center mb-6">
                      <CountdownBlock value="--" label="DAYS" />
                      <div className="flex items-center text-turf text-2xl font-bold">:</div>
                      <CountdownBlock value="--" label="HRS" />
                      <div className="flex items-center text-turf text-2xl font-bold">:</div>
                      <CountdownBlock value="--" label="MIN" />
                    </div>
                  )}

                  {/* Next Game Info */}
                  <div className="inline-block">
                    <div className="glow-border bg-stadium-black/80 backdrop-blur-sm rounded-xl px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="scoreboard-number text-turf text-2xl font-bold">
                            {nextGame.time}
                          </p>
                        </div>
                        <div className="w-px h-10 bg-stadium-border" />
                        <div className="text-left">
                          <p className="athletic-condensed text-chalk-white font-semibold text-lg">
                            vs {nextGame.opponentShort}
                          </p>
                          <p className="athletic-condensed text-chalk-dim text-sm">
                            Field {nextGame.field} •{' '}
                            <span className={nextGame.homeAway === 'home' ? 'text-turf' : 'text-chalk-dim'}>
                              {nextGame.homeAway === 'home' ? 'HOME' : 'AWAY'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Location Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-gold-bright athletic-condensed tracking-wider">
              2025-2026 SEASON
            </p>
            <p className="athletic-condensed text-chalk-dim text-xs tracking-wider">
              📍 {tournament.location.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CountdownBlock({ value, label }) {
  return (
    <div className="countdown-block px-4 py-3 min-w-[70px] text-center">
      <span className="scoreboard-number text-turf text-3xl font-bold block">
        {String(value).padStart(2, '0')}
      </span>
      <span className="athletic-condensed text-chalk-dim text-[10px] tracking-[0.15em] uppercase">
        {label}
      </span>
    </div>
  );
}
