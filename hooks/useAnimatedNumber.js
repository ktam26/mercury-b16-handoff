'use client';

import { useEffect, useState } from 'react';

/**
 * Hook for animating numbers with a counting effect
 * @param {number} target - The target number to animate to
 * @param {number} duration - Animation duration in ms (default: 1000)
 * @param {number} delay - Delay before starting in ms (default: 0)
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {number} The animated value
 */
export function useAnimatedNumber(target, duration = 1000, delay = 0, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) {
      setValue(0);
      return;
    }

    const timeout = setTimeout(() => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for satisfying deceleration
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentValue = target * eased;
        setValue(decimals > 0 ? parseFloat(currentValue.toFixed(decimals)) : Math.round(currentValue));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeout);
  }, [target, duration, delay, decimals]);

  return value;
}

/**
 * Hook for animating percentages with a counting effect
 * @param {number} target - The target percentage (0-100)
 * @param {number} duration - Animation duration in ms
 * @param {number} delay - Delay before starting in ms
 * @returns {number} The animated percentage value
 */
export function useAnimatedPercent(target, duration = 1200, delay = 300) {
  return useAnimatedNumber(target, duration, delay, 0);
}
