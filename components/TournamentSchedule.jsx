'use client';

import { MapPin, Clock, Shirt, ChevronRight, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { convertTo24Hour } from '@/lib/game-utils';
import { StadiumGameCard } from './StadiumGameCard';

export function TournamentSchedule({ games, tournament, onFieldClick }) {
  const isGamePast = (game) => {
    const now = new Date();
    const gameDateTime = new Date(`${game.date}T${convertTo24Hour(game.time)}`);
    // Game duration: 2x20min halves + 5min halftime + buffer = ~50 minutes
    gameDateTime.setMinutes(gameDateTime.getMinutes() + 50);
    return now > gameDateTime;
  };

  const isGameNow = (game) => {
    const now = new Date();
    const gameStart = new Date(`${game.date}T${convertTo24Hour(game.time)}`);
    const gameEnd = new Date(gameStart);
    gameEnd.setMinutes(gameEnd.getMinutes() + 50);
    return now >= gameStart && now <= gameEnd;
  };

  const gamesByDay = games.reduce((acc, game) => {
    const day = game.day;
    if (!acc[day]) acc[day] = [];
    acc[day].push(game);
    return acc;
  }, {});

  return (
    <div className="mb-6 slide-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="stadium-card p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="athletic-heading text-sm font-bold text-chalk-white tracking-wider flex items-center gap-2">
            <span className="text-turf">⚽</span> ALMADEN FC MERCURY B16
          </h3>
          <span className="team-badge">
            {(() => {
              const bracketKey = Object.keys(tournament.brackets).find(key =>
                tournament.brackets[key].teams.some(t => t.isUs)
              );
              return bracketKey ? `BRACKET ${bracketKey}` : 'BRACKET';
            })()}
          </span>
        </div>

        {/* Games by Day */}
        <div className="space-y-6 stagger-children">
          {Object.entries(gamesByDay).map(([day, dayGames]) => (
            <div key={day}>
              {/* Day Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-linear-to-r from-turf/50 to-transparent" />
                <span className="athletic-condensed text-turf text-xs font-semibold tracking-[0.2em] uppercase">
                  {day}
                </span>
                <div className="h-px flex-1 bg-linear-to-l from-turf/50 to-transparent" />
              </div>

              {/* Games */}
              <div className="space-y-3">
                {dayGames.map((game) => {
                  const isPast = isGamePast(game);
                  const isLive = isGameNow(game);
                  const isFinal = game.isFinal;

                  return (
                    <StadiumGameCard
                      key={game.id}
                      game={game}
                      isPast={isPast}
                      isLive={isLive}
                      isFinal={isFinal}
                      onFieldClick={onFieldClick}
                      tournamentLocation={tournament.location}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
