'use client';

import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEASONS } from '@/lib/seasons';

export default function SeasonStatsHeader({
  statsExpanded,
  setStatsExpanded,
  selectedSeason,
  setSelectedSeason,
  isSeasonComplete,
  shortName,
  seasonLabel,
  wins,
  losses,
  ties,
  winRate,
  goalDiff,
  hasPastGames,
  animationDelay,
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: animationDelay }}
      className="p-6 pt-4 text-center"
    >
      {/* Collapsible Toggle */}
      <button
        id="season-stats-toggle"
        onClick={() => setStatsExpanded(!statsExpanded)}
        aria-expanded={statsExpanded}
        aria-controls="season-stats-content"
        className={cn(
          "w-full group rounded-xl p-4 transition-colors",
          !statsExpanded && "border border-stadium-border/50 hover:border-turf/30"
        )}
      >
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-3xl font-bold tracking-wider uppercase athletic-heading text-chalk-white drop-shadow-lg">
            {isSeasonComplete ? 'Season Complete' : 'Season Stats'}
          </h1>
          {statsExpanded ? (
            <ChevronUp className="w-6 h-6 text-chalk-white transition-colors" />
          ) : (
            <ChevronDown className="w-6 h-6 text-chalk-white transition-colors" />
          )}
        </div>
        <p className="text-turf mt-1 uppercase tracking-widest text-sm font-bold athletic-condensed">
          {shortName} | {seasonLabel}
        </p>
        {/* Compact summary visible when collapsed */}
        {!statsExpanded && hasPastGames && (
          <p className="text-chalk-dim mt-2 text-sm athletic-condensed tracking-wider">
            <span className="text-chalk-white font-bold">{wins}-{losses}-{ties}</span>
            <span className="mx-2 text-stadium-border" aria-hidden="true">·</span>
            <span className="text-turf font-bold">{winRate}% Win Rate</span>
            <span className="mx-2 text-stadium-border" aria-hidden="true">·</span>
            <span className={cn(
              "font-bold",
              goalDiff > 0 && "text-turf",
              goalDiff < 0 && "text-scoreboard-red",
              goalDiff === 0 && "text-chalk-white"
            )}>
              {goalDiff > 0 ? '+' : ''}{goalDiff} Goal Diff
            </span>
          </p>
        )}
      </button>

      {/* Season Tabs — always visible */}
      <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Season selector">
        {SEASONS.map((season) => (
          <button
            key={season.id}
            role="tab"
            aria-selected={selectedSeason === season.id}
            onClick={() => setSelectedSeason(season.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300",
              selectedSeason === season.id
                ? "bg-turf text-stadium-black shadow-[0_0_15px_rgba(0,255,106,0.3)]"
                : "bg-stadium-card text-chalk-dim border border-stadium-border hover:border-turf/50 hover:text-chalk-white"
            )}
          >
            {season.label}
          </button>
        ))}
      </div>
    </motion.header>
  );
}
