'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export function TournamentBracket({ tournament }) {
  const { brackets, standings, final } = tournament;

  return (
    <div className="mb-6 slide-in-up" style={{ animationDelay: '0.3s' }}>
      <div className="stadium-card p-5">
        <h3 className="athletic-heading text-sm font-bold text-chalk-white tracking-wider mb-5 flex items-center gap-2">
          <span className="text-turf">📊</span> TOURNAMENT BRACKETS
        </h3>

        <div className={`grid grid-cols-1 ${Object.keys(brackets).length > 1 ? 'md:grid-cols-2' : ''} gap-4`}>
          {Object.keys(brackets).map((key) => {
            const bracket = brackets[key];
            const bracketStandings = standings[key];
            const hasUs = bracket.teams.some(t => t.isUs);
            return (
              <BracketTable
                key={key}
                bracketName={`Bracket ${key}`}
                bracketColor={hasUs ? "var(--color-turf)" : "var(--color-bracket-blue)"}
                teams={bracket.teams}
                standings={bracketStandings}
                highlightUs={hasUs}
              />
            );
          })}
        </div>

        {/* Championship Final */}
        <div className="mt-6 p-5 rounded-xl bg-linear-to-r from-gold-dark-tint to-stadium-gray border border-gold-bright/30 glow-border-gold">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-gold-bright text-2xl">🏆</span>
            <h4 className="trophy-gradient athletic-heading text-xl font-bold tracking-wider">
              CHAMPIONSHIP FINAL
            </h4>
          </div>
          <div className="text-center">
            <p className="athletic-condensed text-chalk-dim text-sm mb-2">
              {final ? `${new Date(final.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • ${final.time} • ${final.location}` : 'TBD'}
            </p>
            <div className="flex items-center justify-center gap-4">
              <span className="athletic-condensed text-bracket-blue font-bold text-lg">
                {final?.homeTeam || 'TBD'}
              </span>
              <span className="scoreboard-number text-chalk-dim text-xl">VS</span>
              <span className="athletic-condensed text-turf font-bold text-lg">
                {final?.awayTeam || 'TBD'}
              </span>
            </div>
          </div>
        </div>

        {/* Tiebreaker Rules */}
        <div className="mt-4 pt-4 border-t border-stadium-border">
          <p className="athletic-condensed text-chalk-dim text-xs tracking-wider">
            <span className="text-chalk-white font-semibold">TIEBREAKER:</span>{' '}
            Points → Head-to-head → Goal diff → Goals scored
          </p>
        </div>
      </div>
    </div>
  );
}

function BracketTable({ bracketName, bracketColor, teams, standings, highlightUs = false }) {
  // Memoize sorted standings to prevent re-sorting on every render
  const sortedStandings = useMemo(() => {
    return [...standings].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const aDiff = a.gf - a.ga;
      const bDiff = b.gf - b.ga;
      if (bDiff !== aDiff) return bDiff - aDiff;
      return b.gf - a.gf;
    });
  }, [standings]);

  return (
    <div className="bg-stadium-dark rounded-xl p-4 border border-stadium-border">
      <h4 className="athletic-condensed font-bold text-chalk-white mb-4 flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: bracketColor }}
        />
        {bracketName}
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="athletic-condensed text-[10px] text-chalk-dim uppercase tracking-wider">
              <th className="text-left pb-3 pr-2">#</th>
              <th className="text-left pb-3">Team</th>
              <th className="text-center pb-3 px-1 w-8">W</th>
              <th className="text-center pb-3 px-1 w-8">L</th>
              <th className="text-center pb-3 px-1 w-8">T</th>
              <th className="text-center pb-3 px-1 w-10">GD</th>
              <th className="text-center pb-3 px-1 w-10 text-gold-bright">PTS</th>
            </tr>
          </thead>
          <tbody>
            {sortedStandings.map((team, index) => {
              const isUs = highlightUs && team.isUs;
              const isFirst = index === 0;
              const gd = team.gf - team.ga;

              return (
                <tr
                  key={team.team}
                  className={cn(
                    "border-t border-stadium-border transition-colors",
                    isUs && "bg-turf/10",
                    isFirst && !isUs && "bg-gold-bright/5"
                  )}
                >
                  <td className={cn(
                    "py-3 pr-2 athletic-condensed font-bold",
                    isFirst ? "text-gold-bright" : "text-chalk-dim"
                  )}>
                    {index + 1}
                  </td>
                  <td className={cn(
                    "py-3 athletic-condensed font-semibold",
                    isUs ? "text-turf" : "text-chalk-white"
                  )}>
                    {team.fullName || team.team}
                    {isUs && <span className="ml-1 text-gold-bright">★</span>}
                  </td>
                  <td className="text-center py-3 px-1 scoreboard-number text-turf">
                    {team.w}
                  </td>
                  <td className="text-center py-3 px-1 scoreboard-number text-scoreboard-red">
                    {team.l}
                  </td>
                  <td className="text-center py-3 px-1 scoreboard-number text-chalk-dim">
                    {team.t}
                  </td>
                  <td className={cn(
                    "text-center py-3 px-1 scoreboard-number",
                    gd > 0 && "text-turf",
                    gd < 0 && "text-scoreboard-red",
                    gd === 0 && "text-chalk-dim"
                  )}>
                    {gd > 0 ? '+' : ''}{gd}
                  </td>
                  <td className="text-center py-3 px-1 scoreboard-number text-gold-bright font-bold">
                    {team.pts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
