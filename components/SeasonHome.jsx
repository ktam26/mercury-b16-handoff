'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, Cloud, CloudSun, CloudFog, CloudDrizzle, CloudRain, CloudLightning, Snowflake } from 'lucide-react';
import { getNextGame, getShortTeamName } from '@/lib/game-utils';
import { getCompetitiveGames, getSeasonRecord } from '@/lib/stats-utils';
import { useCountdown, useMounted } from '@/hooks/useCountdown';
import { useAnimatedNumber, useAnimatedPercent } from '@/hooks/useAnimatedNumber';
import { useWeather } from '@/hooks/useWeather';
import currentGamesData from '@/data/games.json';
import teamInfo from '@/data/team-info.json';
import { cn } from '@/lib/utils';
import { SEASONS } from '@/lib/seasons';

import UpcomingMatchHero from '@/components/UpcomingMatchHero';
import SeasonStatsHeader from '@/components/SeasonStatsHeader';
import WinRateRing from '@/components/WinRateRing';
import GoalsCharts from '@/components/GoalsCharts';
import RecentFormCarousel from '@/components/RecentFormCarousel';
import QuickLinksFooter from '@/components/QuickLinksFooter';

// Animation variants for staggered reveals
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

// Map Lucide icon names from weather-utils to actual components
const WEATHER_ICONS = {
  Sun, Cloud, CloudSun, CloudFog, CloudDrizzle, CloudRain, CloudLightning, Snowflake,
};

export default function SeasonHome() {
  const [selectedSeason, setSelectedSeason] = useState(SEASONS[0].id);
  const [statsExpanded, setStatsExpanded] = useState(false);

  // Get the current season's data
  const currentSeasonData = SEASONS.find(s => s.id === selectedSeason);
  const gamesData = currentSeasonData?.data || [];
  const seasonLabel = currentSeasonData?.fullLabel || 'Season';

  // Always check current games for upcoming match (regardless of selected season tab)
  const upcomingGame = getNextGame(currentGamesData);
  const nextGame = getNextGame(gamesData);
  const mounted = useMounted();
  const homeShortName = getShortTeamName(teamInfo.name);

  // Countdown for upcoming game
  const countdown = useCountdown(upcomingGame);
  const weather = useWeather(upcomingGame);
  const WeatherIcon = weather.iconName ? WEATHER_ICONS[weather.iconName] || Cloud : null;
  const isScrimmage = upcomingGame?.type === 'scrimmage';
  const isGameDay = countdown && countdown.days === 0;
  const isTomorrow = countdown && countdown.days === 1;

  // Memoize all season statistics calculations
  const seasonStats = useMemo(() => {
    const pastGames = getCompetitiveGames(gamesData);
    const { wins, losses, ties } = getSeasonRecord(gamesData);
    const totalGoalsFor = pastGames.reduce((sum, g) => sum + g.result.us, 0);
    const totalGoalsAgainst = pastGames.reduce((sum, g) => sum + g.result.them, 0);
    const goalDiff = totalGoalsFor - totalGoalsAgainst;
    const winRate = pastGames.length > 0 ? Math.round((wins / pastGames.length) * 100) : 0;
    const goalsPerGame = pastGames.length > 0 ? (totalGoalsFor / pastGames.length).toFixed(1) : '0.0';
    const goalsAgainstPerGame = pastGames.length > 0 ? (totalGoalsAgainst / pastGames.length).toFixed(1) : '0.0';
    const last5Games = pastGames.slice(-5).reverse();

    return {
      pastGames, wins, losses, ties,
      totalGoalsFor, totalGoalsAgainst, goalDiff,
      winRate, goalsPerGame, goalsAgainstPerGame, last5Games,
    };
  }, [gamesData]);

  const { pastGames, wins, losses, ties, goalDiff, winRate, goalsPerGame, goalsAgainstPerGame, last5Games } = seasonStats;
  const isSeasonComplete = !nextGame && pastGames.length > 0;

  // Animated values
  const animatedWinRate = useAnimatedPercent(winRate, 1200, 400);
  const animatedWins = useAnimatedNumber(wins, 800, 500);
  const animatedLosses = useAnimatedNumber(losses, 800, 600);
  const animatedTies = useAnimatedNumber(ties, 800, 700);
  const animatedGoalDiff = useAnimatedNumber(goalDiff, 800, 300);

  // Memoize chart data generation
  const goalsScoredPath = useMemo(() => {
    if (pastGames.length < 2) return 'M0 45 L100 45';
    const scores = pastGames.map(g => g.result.us);
    const max = Math.max(...scores, 1);
    const points = scores.map((score, i) => {
      const x = (i / (scores.length - 1)) * 100;
      const y = 48 - (score / max) * 40;
      return `${x},${y}`;
    });
    return `M${points.join(' L')}`;
  }, [pastGames]);

  const goalsAgainstBars = useMemo(() => {
    if (pastGames.length === 0) return [];
    const scores = pastGames.map(g => g.result.them);
    const max = Math.max(...scores, 1);
    const barWidth = Math.min(8, 90 / scores.length);
    const gap = (100 - barWidth * scores.length) / (scores.length + 1);

    return scores.map((score, i) => {
      const height = Math.max(5, (score / max) * 40);
      const x = gap + i * (barWidth + gap);
      const y = 50 - height;
      return { x, y, width: barWidth, height };
    });
  }, [pastGames]);

  return (
    <div className="bg-stadium-black text-chalk-white min-h-screen antialiased relative overflow-hidden">
      {/* Global Background Glow */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-linear-to-b from-stadium-gray/50 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-turf/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold-bright/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto min-h-screen flex flex-col pb-28 px-4 lg:px-8">

        {/* Upcoming Match Hero */}
        {upcomingGame && mounted && countdown && (
          <UpcomingMatchHero
            upcomingGame={upcomingGame}
            countdown={countdown}
            homeShortName={homeShortName}
            weather={weather}
            WeatherIcon={WeatherIcon}
            isScrimmage={isScrimmage}
            isGameDay={isGameDay}
            isTomorrow={isTomorrow}
          />
        )}

        {/* Season Stats Header */}
        <SeasonStatsHeader
          statsExpanded={statsExpanded}
          setStatsExpanded={setStatsExpanded}
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
          isSeasonComplete={isSeasonComplete}
          shortName={teamInfo.shortName}
          seasonLabel={seasonLabel}
          wins={wins}
          losses={losses}
          ties={ties}
          winRate={winRate}
          goalDiff={goalDiff}
          hasPastGames={pastGames.length > 0}
          animationDelay={upcomingGame ? 0.3 : 0}
        />

        {/* Collapsible Stats Content */}
        <div
          id="season-stats-content"
          role="region"
          aria-labelledby="season-stats-toggle"
          aria-hidden={!statsExpanded}
          className={cn(
            "overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out",
            statsExpanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
        <motion.main
          variants={container}
          initial="hidden"
          animate="show"
          className="grow space-y-4 max-w-4xl mx-auto w-full"
        >
          <WinRateRing
            wins={wins}
            losses={losses}
            ties={ties}
            totalGames={pastGames.length}
            animatedWinRate={animatedWinRate}
            animatedWins={animatedWins}
            animatedLosses={animatedLosses}
            animatedTies={animatedTies}
            animatedGoalDiff={animatedGoalDiff}
          />

          <GoalsCharts
            goalsScoredPath={goalsScoredPath}
            goalsAgainstBars={goalsAgainstBars}
            goalsPerGame={goalsPerGame}
            goalsAgainstPerGame={goalsAgainstPerGame}
          />

          <RecentFormCarousel last5Games={last5Games} />

        </motion.main>
        </div>

        {/* Quick Links */}
        <QuickLinksFooter
          standingsUrl={teamInfo.links.gotsportStandings}
          animationDelay={upcomingGame ? 0.5 : 0.2}
        />
      </div>
    </div>
  );
}
