'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, Navigation, Shirt, Wind, Cloud, ExternalLink } from 'lucide-react';
import { getArrivalTime, getShortTeamName } from '@/lib/game-utils';

export default function GameDayQuickView({ game, countdown, homeShortName, weather, WeatherIcon }) {
  const opponentShortName = getShortTeamName(game.opponent);
  const arrivalTime = getArrivalTime(game.time);
  const isWhiteJersey = game.jersey === 'white';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative mt-6 mb-8"
    >
      <div className="bg-stadium-black border border-turf/20 rounded-2xl p-5 shadow-[0_0_40px_rgba(0,255,106,0.08)] space-y-4">

        {/* 1. GAME DAY Header */}
        <div className="flex items-center justify-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-turf opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-turf" />
          </span>
          <h2 className="athletic-heading text-turf text-xl drop-shadow-[0_0_12px_rgba(0,255,106,0.6)]">
            GAME DAY
          </h2>
        </div>

        {/* 2. Opponent Matchup Row */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
            <span className="text-sm font-bold text-chalk-white athletic-condensed uppercase tracking-wider truncate text-right">
              {homeShortName}
            </span>
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src={(game.homeAway === 'home' ? game.teamLogos?.home : game.teamLogos?.away) || '/images/logos/mercury-b16.png'}
                alt={homeShortName}
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
          </div>

          <span className="athletic-heading text-turf text-sm px-2 shrink-0">VS</span>

          <div className="flex-1 min-w-0 flex items-center justify-start gap-2">
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src={(game.homeAway === 'home' ? game.teamLogos?.away : game.teamLogos?.home) || '/images/logos/default.png'}
                alt={opponentShortName}
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <span className="text-sm font-bold text-chalk-white athletic-condensed uppercase tracking-wider truncate">
              {opponentShortName}
            </span>
          </div>
        </div>

        {/* 2.5 Weather Row */}
        {weather && !weather.isLoading && !weather.error && weather.temp !== null && (
          <div className="flex justify-center gap-2 flex-wrap" role="group" aria-label="Game day weather forecast">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stadium-gray/60 rounded-lg border border-stadium-border">
              {WeatherIcon && <WeatherIcon className="w-3.5 h-3.5 text-gold-bright" />}
              <span className="athletic-condensed text-chalk-white text-xs font-medium">{weather.condition}</span>
            </div>
            <div className="flex items-center px-2.5 py-1.5 bg-stadium-gray/60 rounded-lg border border-stadium-border" aria-label={`Temperature: ${weather.temp} degrees Fahrenheit`}>
              <span className="scoreboard-number text-turf text-sm font-bold">{weather.temp}°F</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stadium-gray/60 rounded-lg border border-stadium-border" aria-label={`Wind: ${weather.windSpeed} miles per hour`}>
              <Wind className="w-3.5 h-3.5 text-chalk-dim" />
              <span className="athletic-condensed text-chalk-dim text-xs">{weather.windSpeed} mph</span>
            </div>
          </div>
        )}
        {weather && !weather.isLoading && weather.error && game.weatherUrl && (
          <div className="flex justify-center">
            <a
              href={game.weatherUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Check weather forecast (opens in new tab)"
              className="flex items-center gap-2 px-3 py-1.5 bg-stadium-gray/60 rounded-lg border border-stadium-border hover:border-turf/30 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5 text-chalk-dim" />
              <span className="athletic-condensed text-chalk-white text-xs font-medium">Check Weather</span>
              <ExternalLink className="w-3 h-3 text-chalk-dim" />
            </a>
          </div>
        )}

        {/* 3. Arrival Time — most prominent */}
        <div className="flex flex-col items-center gap-1 py-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gold-bright" />
            <span className="text-xs text-gold-bright uppercase tracking-widest athletic-condensed font-bold">
              ARRIVE BY
            </span>
          </div>
          <span className="scoreboard-number text-4xl text-gold-bright font-bold drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">
            {arrivalTime}
          </span>
        </div>

        {/* 4. Field + Directions */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-chalk-white athletic-condensed font-bold text-sm text-center">
            {game.location?.name || 'TBD'}
          </span>
          <a
            href={game.location?.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-linear-to-r from-turf-dim to-turf text-stadium-black px-6 rounded-lg font-bold text-xs uppercase tracking-wider athletic-condensed min-h-[48px] hover:shadow-[0_0_20px_rgba(0,255,106,0.3)] transition-shadow"
            aria-label={`Get directions to ${game.location?.name || 'field'}`}
          >
            <Navigation className="w-4 h-4" />
            GET DIRECTIONS
          </a>
        </div>

        {/* 5. Jersey Indicator */}
        <div className="flex items-center justify-center gap-3">
          <Shirt className="w-5 h-5 text-chalk-dim" />
          <div
            className={`w-10 h-10 rounded-full border-2 border-stadium-border ${
              isWhiteJersey ? 'bg-white' : 'bg-black'
            }`}
            aria-hidden="true"
          />
          <span className="athletic-heading text-chalk-white tracking-wider text-sm">
            {isWhiteJersey ? 'WEAR WHITE' : 'WEAR BLACK'}
          </span>
        </div>

        {/* 6. Hours:Minutes Countdown */}
        <div className="flex items-center justify-center gap-6 pt-1">
          <div className="flex flex-col items-center">
            <span className="scoreboard-number text-2xl text-turf drop-shadow-[0_0_10px_rgba(0,255,106,0.4)]">
              {String(countdown.hours).padStart(2, '0')}
            </span>
            <span className="text-chalk-dim text-xs uppercase tracking-widest font-bold">
              HRS
            </span>
          </div>
          <span className="text-turf text-xl font-bold scoreboard-number -mt-3">:</span>
          <div className="flex flex-col items-center">
            <span className="scoreboard-number text-2xl text-turf drop-shadow-[0_0_10px_rgba(0,255,106,0.4)]">
              {String(countdown.minutes).padStart(2, '0')}
            </span>
            <span className="text-chalk-dim text-xs uppercase tracking-widest font-bold">
              MIN
            </span>
          </div>
        </div>

      </div>
    </motion.section>
  );
}
