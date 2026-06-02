'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronRight, MapPin, Clock, Calendar, Shirt, Wind, Cloud, ExternalLink } from 'lucide-react';
import { formatGameDate, getShortTeamName, getArrivalTime } from '@/lib/game-utils';
import { cn } from '@/lib/utils';
import GameDayQuickView from '@/components/GameDayQuickView';

// Countdown digit component with flip animation style
function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="bg-stadium-black/80 backdrop-blur-sm border border-turf/30 rounded-lg px-3 py-2 md:px-4 md:py-3 min-w-[52px] md:min-w-[72px] shadow-[0_0_20px_rgba(0,255,106,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <span className="scoreboard-number text-3xl md:text-5xl font-bold text-turf drop-shadow-[0_0_10px_rgba(0,255,106,0.5)]">
            {String(value).padStart(2, '0')}
          </span>
        </div>
        {/* Glow effect under the digit */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-turf/40 blur-md rounded-full" />
      </div>
      <span className="text-[10px] md:text-xs text-chalk-dim uppercase tracking-widest font-bold mt-2 athletic-condensed">
        {label}
      </span>
    </div>
  );
}

export default function UpcomingMatchHero({ upcomingGame, countdown, homeShortName, weather, WeatherIcon, isScrimmage, isGameDay, isTomorrow }) {
  if (!upcomingGame || !countdown) return null;

  if (isGameDay) {
    return <GameDayQuickView game={upcomingGame} countdown={countdown} homeShortName={homeShortName} weather={weather} WeatherIcon={WeatherIcon} />;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative mt-6 mb-8"
    >
      {/* Hero Card with dramatic styling */}
      <div className="relative overflow-hidden rounded-3xl border border-turf/20 bg-linear-to-br from-stadium-gray/80 via-stadium-black to-stadium-gray/60 shadow-[0_0_60px_rgba(0,255,106,0.1)]">
        {/* Animated background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-turf/10 blur-[80px] rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gold-bright/10 blur-[60px] rounded-full" />
          {/* Field lines pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-chalk-white" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-chalk-white" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-chalk-white rounded-full" />
          </div>
        </div>

        <div className="relative z-10 p-6 md:p-10">
          {/* Top Badge Row */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {isTomorrow && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="flex items-center gap-2 bg-gold-bright text-stadium-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(255,215,0,0.4)]"
              >
                <span className="w-2 h-2 bg-stadium-black rounded-full animate-pulse" />
                Tomorrow
              </motion.div>
            )}
            {isGameDay && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="flex items-center gap-2 bg-turf text-stadium-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,106,0.4)]"
              >
                <span className="w-2 h-2 bg-stadium-black rounded-full animate-pulse" />
                Game Day
              </motion.div>
            )}
            {isScrimmage && (
              <div className="flex items-center gap-2 bg-stadium-border/80 text-chalk-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                <span>🤝</span>
                Scrimmage
              </div>
            )}
            <div className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
              upcomingGame.homeAway === 'home'
                ? 'bg-turf/20 text-turf border border-turf/30'
                : 'bg-gold-bright/20 text-gold-bright border border-gold-bright/30'
            )}>
              {upcomingGame.homeAway === 'home' ? '🏠 Home' : '✈️ Away'}
            </div>
          </div>

          {/* Main Matchup Display */}
          <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
            {/* Mercury Team */}
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative w-20 h-20 md:w-28 md:h-28 mb-3">
                <div className="absolute inset-0 bg-turf/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-full h-full p-3 bg-stadium-gray/50 rounded-full border border-stadium-border shadow-xl">
                  <Image
                    src={(upcomingGame.homeAway === 'home' ? upcomingGame.teamLogos?.home : upcomingGame.teamLogos?.away) || '/images/logos/mercury-b16.png'}
                    alt={homeShortName}
                    fill
                    sizes="(max-width: 768px) 80px, 112px"
                    className="object-contain p-1"
                  />
                </div>
              </div>
              <h3 className="athletic-heading text-lg md:text-xl font-bold text-chalk-white text-center">
                {homeShortName}
              </h3>
            </motion.div>

            {/* VS Divider */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="relative"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 bg-stadium-black rounded-full flex items-center justify-center border-2 border-turf/50 shadow-[0_0_30px_rgba(0,255,106,0.2)]">
                <span className="athletic-heading text-xl md:text-2xl font-bold text-turf">VS</span>
              </div>
            </motion.div>

            {/* Opponent Team */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative w-20 h-20 md:w-28 md:h-28 mb-3">
                <div className="absolute inset-0 bg-gold-bright/10 rounded-full blur-xl" />
                <div className="relative w-full h-full p-3 bg-stadium-gray/50 rounded-full border border-stadium-border shadow-xl">
                  <Image
                    src={(upcomingGame.homeAway === 'home' ? upcomingGame.teamLogos?.away : upcomingGame.teamLogos?.home) || '/images/logos/default.png'}
                    alt={getShortTeamName(upcomingGame.opponent)}
                    fill
                    sizes="(max-width: 768px) 80px, 112px"
                    className="object-contain p-1"
                  />
                </div>
              </div>
              <h3 className="athletic-heading text-lg md:text-xl font-bold text-chalk-white text-center max-w-[100px] md:max-w-[140px] leading-tight">
                {getShortTeamName(upcomingGame.opponent)}
              </h3>
            </motion.div>
          </div>

          {/* Countdown Timer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-3 md:gap-4 mb-8"
          >
            {countdown.days > 0 && (
              <CountdownUnit value={countdown.days} label="Days" />
            )}
            <CountdownUnit value={countdown.hours} label="Hours" />
            <CountdownUnit value={countdown.minutes} label="Mins" />
          </motion.div>

          {/* Game Details Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
          >
            {/* Date */}
            <div className="bg-stadium-black/50 rounded-xl p-3 border border-stadium-border/50 text-center">
              <Calendar className="w-4 h-4 text-turf mx-auto mb-1" />
              <p className="text-xs text-chalk-dim uppercase tracking-wider mb-0.5">Date</p>
              <p className="text-sm font-bold text-chalk-white athletic-condensed">{formatGameDate(upcomingGame.date)}</p>
            </div>

            {/* Time */}
            <div className="bg-stadium-black/50 rounded-xl p-3 border border-stadium-border/50 text-center">
              <Clock className="w-4 h-4 text-turf mx-auto mb-1" />
              <p className="text-xs text-chalk-dim uppercase tracking-wider mb-0.5">Kickoff</p>
              <p className="text-sm font-bold text-turf athletic-condensed">{upcomingGame.time}</p>
            </div>

            {/* Location */}
            <div className="bg-stadium-black/50 rounded-xl p-3 border border-stadium-border/50 text-center">
              <MapPin className="w-4 h-4 text-gold-bright mx-auto mb-1" />
              <p className="text-xs text-chalk-dim uppercase tracking-wider mb-0.5">Field</p>
              <p className="text-sm font-bold text-chalk-white athletic-condensed truncate">{upcomingGame.location?.name || 'TBD'}</p>
            </div>

            {/* Kit */}
            <div className="bg-stadium-black/50 rounded-xl p-3 border border-stadium-border/50 text-center">
              <Shirt className="w-4 h-4 text-chalk-dim mx-auto mb-1" />
              <p className="text-xs text-chalk-dim uppercase tracking-wider mb-0.5">Kit</p>
              <div className="flex items-center justify-center gap-1.5">
                <div className={cn(
                  "w-4 h-4 rounded-full border border-stadium-border",
                  upcomingGame.jersey === 'white' ? 'bg-white' : 'bg-black'
                )} />
                <p className="text-sm font-bold text-chalk-white athletic-condensed capitalize">{upcomingGame.jersey}</p>
              </div>
            </div>
          </motion.div>

          {/* Weather Pills */}
          {!weather.isLoading && !weather.error && weather.temp !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              role="group"
              aria-label="Game day weather forecast"
              className="flex justify-center gap-3 mb-6 flex-wrap"
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-stadium-gray/60 backdrop-blur-sm rounded-lg border border-stadium-border">
                {WeatherIcon && <WeatherIcon className="w-4 h-4 text-gold-bright" />}
                <span className="athletic-condensed text-chalk-white text-sm font-medium">{weather.condition}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-stadium-gray/60 backdrop-blur-sm rounded-lg border border-stadium-border" aria-label={`Temperature: ${weather.temp} degrees Fahrenheit`}>
                <span className="scoreboard-number text-turf text-lg font-bold">{weather.temp}°F</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-stadium-gray/60 backdrop-blur-sm rounded-lg border border-stadium-border" aria-label={`Wind: ${weather.windSpeed} miles per hour`}>
                <Wind className="w-4 h-4 text-chalk-dim" />
                <span className="athletic-condensed text-chalk-dim text-sm">{weather.windSpeed} mph</span>
              </div>
            </motion.div>
          )}
          {/* Weather Fallback Link */}
          {!weather.isLoading && weather.error && upcomingGame.weatherUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex justify-center mb-6"
            >
              <a
                href={upcomingGame.weatherUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Check weather forecast (opens in new tab)"
                className="flex items-center gap-2 px-4 py-2 bg-stadium-gray/60 backdrop-blur-sm rounded-lg border border-stadium-border hover:border-turf/30 transition-colors"
              >
                <Cloud className="w-4 h-4 text-chalk-dim" />
                <span className="athletic-condensed text-chalk-white text-sm font-medium">Check Weather</span>
                <ExternalLink className="w-3 h-3 text-chalk-dim" />
              </a>
            </motion.div>
          )}

          {/* Arrival Time Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-gold-bright/10 border border-gold-bright/30 rounded-xl p-4 mb-6 flex items-center justify-center gap-3"
          >
            <span className="text-xl">⏰</span>
            <div className="text-center">
              <p className="text-xs text-gold-bright uppercase tracking-wider font-bold">Arrive By</p>
              <p className="text-xl font-bold text-gold-bright scoreboard-number">{getArrivalTime(upcomingGame.time)}</p>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center"
          >
            <Link
              href={`/game/${upcomingGame.id}`}
              className="group relative inline-flex items-center gap-3 bg-turf text-stadium-black px-8 py-4 rounded-xl text-base font-black uppercase tracking-wider shadow-[0_0_30px_rgba(0,255,106,0.4)] hover:shadow-[0_0_50px_rgba(0,255,106,0.6)] hover:-translate-y-1 transition-all duration-300"
            >
              <span>View Match Details</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
