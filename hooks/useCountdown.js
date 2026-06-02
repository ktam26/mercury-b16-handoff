'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getTimeUntilGame } from '@/lib/game-utils';

/**
 * Custom hook for countdown timer with performance optimizations
 * Pauses updates when tab is not visible to save battery
 * @param {Object} game - The game object to count down to
 * @returns {Object|null} Time until game or null if game has passed
 */
export function useCountdown(game) {
  const [timeUntil, setTimeUntil] = useState(null);
  const intervalRef = useRef(null);

  const updateCountdown = useCallback(() => {
    if (!game) return;
    const newTime = getTimeUntilGame(game);
    setTimeUntil(newTime);
  }, [game]);

  useEffect(() => {
    // Initial update
    updateCountdown();

    const startInterval = () => {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Update every second for real-time countdown
      intervalRef.current = setInterval(updateCountdown, 1000);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, stop the interval to save resources
        stopInterval();
      } else {
        // Page is visible, update immediately and restart interval
        updateCountdown();
        startInterval();
      }
    };

    // Start interval if page is visible
    if (!document.hidden) {
      startInterval();
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [game, updateCountdown]);

  return timeUntil;
}

/**
 * Hook to check if component is mounted (for SSR safety)
 * @returns {boolean} Whether the component is mounted
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}