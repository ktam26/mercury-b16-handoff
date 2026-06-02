'use client';

import { useState, useEffect } from 'react';
import { getWeatherInfo, parseLocationForGeocode } from '@/lib/weather-utils';
import { convertTo24Hour } from '@/lib/game-utils';

// Module-level cache keyed by gameId — expires after 30 minutes
const weatherCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Custom hook to fetch weather data for an upcoming game via Open-Meteo API
 * Steps: geocode location → fetch hourly forecast → find matching hour slot
 * @param {Object} game - Game object with date, time, location
 * @returns {{ temp: number|null, condition: string|null, conditionCode: number|null, windSpeed: number|null, iconName: string|null, isLoading: boolean, error: string|null }}
 */
export function useWeather(game) {
  const [weather, setWeather] = useState({
    temp: null,
    condition: null,
    conditionCode: null,
    windSpeed: null,
    iconName: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!game?.date || !game?.time || !game?.location) {
      setWeather(prev => ({ ...prev, isLoading: false, error: 'Missing game data' }));
      return;
    }

    // Check cache first (with TTL expiry)
    const cached = weatherCache.get(game.id);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      setWeather(cached);
      return;
    }

    let cancelled = false;

    async function fetchWeather() {
      try {
        // Step 1: Geocode the location
        const query = parseLocationForGeocode(game.location);
        if (!query) {
          throw new Error('No geocodable location');
        }

        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
        );
        if (!geoRes.ok) throw new Error('Geocoding failed');

        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
          throw new Error('Location not found');
        }

        const { latitude, longitude } = geoData.results[0];

        // Step 2: Fetch hourly forecast
        const forecastRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FLos_Angeles&forecast_days=16`
        );
        if (!forecastRes.ok) throw new Error('Forecast fetch failed');

        const forecastData = await forecastRes.json();

        // Step 3: Find the matching hour slot for game time
        const time24 = convertTo24Hour(game.time);
        const gameHour = parseInt(time24.split(':')[0], 10);
        const targetISO = `${game.date}T${String(gameHour).padStart(2, '0')}:00`;

        const hourly = forecastData.hourly;
        const idx = hourly.time.findIndex(t => t === targetISO);

        if (idx === -1) {
          throw new Error('Game time outside forecast window');
        }

        const temp = Math.round(hourly.temperature_2m[idx]);
        const conditionCode = hourly.weather_code[idx];
        const windSpeed = Math.round(hourly.wind_speed_10m[idx]);
        const { label: condition, iconName } = getWeatherInfo(conditionCode);

        const result = {
          temp,
          condition,
          conditionCode,
          windSpeed,
          iconName,
          isLoading: false,
          error: null,
        };

        if (!cancelled) {
          weatherCache.set(game.id, { ...result, cachedAt: Date.now() });
          setWeather(result);
        }
      } catch (err) {
        if (!cancelled) {
          const errorResult = {
            temp: null,
            condition: null,
            conditionCode: null,
            windSpeed: null,
            iconName: null,
            isLoading: false,
            error: err.message,
          };
          setWeather(errorResult);
        }
      }
    }

    fetchWeather();

    return () => {
      cancelled = true;
    };
  }, [game?.id, game?.date, game?.time, game?.location?.name, game?.location?.address]);

  return weather;
}
