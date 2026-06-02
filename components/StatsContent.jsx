'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Users, Flame, Shield } from 'lucide-react';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import teamInfo from '@/data/team-info.json';
import { cn } from '@/lib/utils';

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } }
};

// Leaderboard row component
function LeaderboardRow({ rank, player, stat, maxStat, colorClassName, delay }) {
  const barWidth = maxStat > 0 ? (stat / maxStat) * 100 : 0;

  const rankColors = {
    1: 'text-gold-bright drop-shadow-md',
    2: 'text-chalk-dim',
    3: 'text-stadium-border',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center gap-3 py-3 border-b border-stadium-border/50 last:border-0 group hover:bg-stadium-border/10 px-2 rounded-lg transition-colors"
    >
      {/* Rank */}
      <span
        className={cn("w-6 text-center font-bold text-lg athletic-heading", rankColors[rank] || 'text-stadium-border/50')}
      >
        {rank}
      </span>

      {/* Player name */}
      <span
        className="grow font-semibold text-chalk-white truncate athletic-condensed text-lg"
      >
        {player}
      </span>

      {/* Stat bar + number */}
      <div className="flex items-center gap-2 w-28">
        <div className="grow h-1.5 bg-stadium-black rounded-full overflow-hidden border border-stadium-border/30">
          <motion.div
            className={cn("h-full rounded-full", colorClassName)}
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
          />
        </div>
        <span
          className={cn("w-8 text-right font-bold athletic-heading text-xl", colorClassName.replace("bg-", "text-"))}
        >
          {stat}
        </span>
      </div>
    </motion.div>
  );
}

export default function StatsContent({ seasons, precomputedStats }) {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0].id);

  const currentSeasonData = seasons.find(s => s.id === selectedSeason);
  const seasonLabel = currentSeasonData?.fullLabel || 'Season';

  // Get pre-computed stats for the selected season
  const stats = precomputedStats[selectedSeason];
  const {
    goalLeaders,
    assistLeaders,
    playerStats,
    gkLeaders,
    totalGoals,
    totalAssists,
    gamesPlayed,
    topScorer,
    topAssister,
    maxGoals,
    maxAssists,
  } = stats;

  // Animated values
  const animatedTotalGoals = useAnimatedNumber(totalGoals, 1000, 300);
  const animatedTotalAssists = useAnimatedNumber(totalAssists, 1000, 400);
  const animatedGamesPlayed = useAnimatedNumber(gamesPlayed, 800, 500);

  return (
    <div className="bg-stadium-black text-chalk-white min-h-screen antialiased relative overflow-hidden">
      {/* Global Background Glow */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-linear-to-b from-stadium-gray/50 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-turf/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold-bright/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto min-h-screen flex flex-col pb-28 px-4 lg:px-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 pt-10 text-center"
        >
          <h1 className="text-4xl font-bold tracking-wider uppercase athletic-heading text-chalk-white drop-shadow-lg">
            Player Stats
          </h1>
          <p className="text-turf mt-1 uppercase tracking-widest text-sm font-bold athletic-condensed glow-text-sm">
            {teamInfo.shortName} | {seasonLabel}
          </p>

          {/* Season Tabs */}
          <div className="flex justify-center gap-2 mt-6">
            {seasons.map((season) => (
              <button
                key={season.id}
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

        {/* Main Content */}
        <motion.main
          variants={container}
          initial="hidden"
          animate="show"
          className="grow space-y-6 max-w-4xl mx-auto w-full"
        >
          {/* Top Performers */}
          <motion.section variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Scorer */}
            {topScorer && (
              <motion.div
                variants={scaleIn}
                className="relative bg-stadium-card backdrop-blur-xl p-6 rounded-2xl border border-turf/30 shadow-[0_0_20px_rgba(0,255,106,0.1)] overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
              >
                {/* Accent glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-turf/10 blur-3xl rounded-full" />

                <div className="relative flex items-center gap-5">
                  <div className="bg-stadium-black p-4 rounded-xl border border-stadium-border shadow-inner">
                    <Flame className="w-8 h-8 text-turf animate-pulse" />
                  </div>
                  <div className="grow">
                    <p className="text-[10px] text-turf uppercase tracking-widest font-bold mb-1">
                      Top Scorer
                    </p>
                    <p className="font-bold text-2xl text-chalk-white athletic-heading">
                      {topScorer.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-bold text-turf scoreboard-number drop-shadow-xs">
                      {topScorer.goals}
                    </p>
                    <p className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold">
                      Goals
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Top Assister */}
            {topAssister && (
              <motion.div
                variants={scaleIn}
                className="relative bg-stadium-card backdrop-blur-xl p-6 rounded-2xl border border-gold-bright/30 shadow-[0_0_20px_rgba(255,215,0,0.1)] overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
              >
                {/* Accent glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-bright/10 blur-3xl rounded-full" />

                <div className="relative flex items-center gap-5">
                  <div className="bg-stadium-black p-4 rounded-xl border border-stadium-border shadow-inner">
                    <Target className="w-8 h-8 text-gold-bright" />
                  </div>
                  <div className="grow">
                    <p className="text-[10px] text-gold-bright uppercase tracking-widest font-bold mb-1">
                      Playmaker
                    </p>
                    <p className="font-bold text-2xl text-chalk-white athletic-heading">
                      {topAssister.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-bold text-gold-bright scoreboard-number drop-shadow-xs">
                      {topAssister.assists}
                    </p>
                    <p className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold">
                      Assists
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.section>

          {/* Team Totals Bar */}
          <motion.section
            variants={item}
            className="bg-stadium-card backdrop-blur-xl p-6 rounded-2xl border border-stadium-border shadow-lg flex justify-around text-center divide-x divide-stadium-border relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-chalk-dim/20 to-transparent" />

            <div className="flex-1">
              <p className="text-4xl font-bold text-turf scoreboard-number">
                {animatedTotalGoals}
              </p>
              <p className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold mt-1">
                Team Goals
              </p>
            </div>
            <div className="flex-1">
              <p className="text-4xl font-bold text-gold-bright scoreboard-number">
                {animatedTotalAssists}
              </p>
              <p className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold mt-1">
                Team Assists
              </p>
            </div>
            <div className="flex-1">
              <p className="text-4xl font-bold text-chalk-white scoreboard-number">
                {animatedGamesPlayed}
              </p>
              <p className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold mt-1">
                Games
              </p>
            </div>
          </motion.section>

          {/* Goals Leaderboard */}
          {goalLeaders.length > 0 && (
            <motion.section variants={item}>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Flame className="w-5 h-5 text-turf" />
                <h2 className="text-xl font-bold uppercase tracking-widest athletic-heading text-chalk-white">
                  Goal Scorers
                </h2>
              </div>
              <div className="bg-stadium-card backdrop-blur-xl p-2 rounded-2xl border border-stadium-border shadow-lg">
                {goalLeaders.map((player, index) => (
                  <LeaderboardRow
                    key={player.name}
                    rank={index + 1}
                    player={player.name}
                    stat={player.goals}
                    maxStat={maxGoals}
                    colorClassName="bg-turf"
                    delay={0.1 + index * 0.05}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* Assists Leaderboard */}
          {assistLeaders.length > 0 && (
            <motion.section variants={item}>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Target className="w-5 h-5 text-gold-bright" />
                <h2 className="text-xl font-bold uppercase tracking-widest athletic-heading text-chalk-white">
                  Assist Leaders
                </h2>
              </div>
              <div className="bg-stadium-card backdrop-blur-xl p-2 rounded-2xl border border-stadium-border shadow-lg">
                {assistLeaders.map((player, index) => (
                  <LeaderboardRow
                    key={player.name}
                    rank={index + 1}
                    player={player.name}
                    stat={player.assists}
                    maxStat={maxAssists}
                    colorClassName="bg-gold-bright"
                    delay={0.1 + index * 0.05}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* Points Leaders (Goals + Assists) */}
          {playerStats.filter(p => p.points > 0).length > 0 && (
            <motion.section variants={item}>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Users className="w-5 h-5 text-chalk-dim" />
                <h2 className="text-xl font-bold uppercase tracking-widest athletic-heading text-chalk-white">
                  Points Leaders
                </h2>
                <span className="text-[10px] text-chalk-dim font-bold tracking-widest border border-stadium-border rounded px-1.5 py-0.5 ml-2 bg-stadium-black">
                  G + A
                </span>
              </div>
              <div className="bg-stadium-card backdrop-blur-xl p-2 rounded-2xl border border-stadium-border shadow-lg">
                {[...playerStats]
                  .filter(p => p.points > 0)
                  .sort((a, b) => b.points - a.points)
                  .map((player, index) => (
                    <LeaderboardRow
                      key={player.name}
                      rank={index + 1}
                      player={player.name}
                      stat={player.points}
                      maxStat={playerStats.reduce((max, p) => Math.max(max, p.points), 1)}
                      colorClassName="bg-chalk-white"
                      delay={0.1 + index * 0.05}
                    />
                  ))}
              </div>
            </motion.section>
          )}

          {/* Goalkeeping Leaderboard */}
          {gkLeaders.length > 0 && (
            <motion.section variants={item}>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Shield className="w-5 h-5 text-chalk-dim" />
                <h2 className="text-xl font-bold uppercase tracking-widest athletic-heading text-chalk-white">
                  Goalkeeping
                </h2>
              </div>
              <div className="bg-stadium-card backdrop-blur-xl rounded-2xl border border-stadium-border shadow-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-stadium-border/50 bg-stadium-black/40">
                  <span className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold">Player</span>
                  <span className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold w-16 text-center">Games</span>
                  <span className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold w-16 text-center">GA</span>
                  <span className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold w-16 text-center">GAA</span>
                  <span className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold w-16 text-center">CS</span>
                </div>
                {/* Table Rows */}
                {gkLeaders.map((gk, index) => (
                  <motion.div
                    key={gk.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-stadium-border/50 last:border-0 hover:bg-stadium-border/10 transition-colors"
                  >
                    <span className="font-semibold text-chalk-white truncate athletic-condensed text-lg">{gk.name}</span>
                    <span className="w-16 text-center font-bold text-chalk-white scoreboard-number text-lg">{gk.gamesInGoal}</span>
                    <span className={cn("w-16 text-center font-bold scoreboard-number text-lg", "text-turf")}>
                      {gk.goalsAllowed}
                    </span>
                    <span className={cn("w-16 text-center font-bold scoreboard-number text-lg", "text-turf")}>
                      {gk.gaa}
                    </span>
                    <span className={cn("w-16 text-center font-bold scoreboard-number text-lg", gk.cleanSheets > 0 ? "text-turf" : "text-chalk-dim")}>
                      {gk.cleanSheets}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Empty State */}
          {goalLeaders.length === 0 && assistLeaders.length === 0 && (
            <motion.section
              variants={item}
              className="bg-stadium-card backdrop-blur-xl p-10 rounded-2xl border border-stadium-border shadow-lg text-center"
            >
              <div className="bg-stadium-black p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center border border-stadium-border">
                <Users className="w-10 h-10 text-chalk-dim" />
              </div>
              <h3 className="text-2xl font-bold text-chalk-white athletic-heading">
                No Stats Yet
              </h3>
              <p className="text-sm text-chalk-dim mt-2 athletic-condensed uppercase tracking-wider">
                Player stats will appear here after games are played.
              </p>
            </motion.section>
          )}
        </motion.main>
      </div>
    </div>
  );
}
