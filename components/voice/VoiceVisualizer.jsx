'use client';

import { useState, useEffect, useRef } from 'react';

const SM_BARS = 12;
const LG_BARS = 24;

function makeIdle(n) {
  return Array.from({ length: n }, () => 0.18);
}

export function VoiceVisualizer({ state, size = 'pill' }) {
  const bars = size === 'lg' ? LG_BARS : size === 'sm' ? SM_BARS : 5;
  const [levels, setLevels] = useState(() => makeIdle(bars));
  const frameRef = useRef(null);
  const isAnimating = state === 'listening' || state === 'speaking' || state === 'thinking';

  useEffect(() => {
    setLevels(makeIdle(bars));
  }, [bars]);

  useEffect(() => {
    if (!isAnimating) {
      setLevels(makeIdle(bars));
      return;
    }
    const animate = () => {
      const t = Date.now();
      setLevels((prev) =>
        prev.map((_, i) => {
          if (state === 'listening')
            return 0.3 + Math.random() * 0.5 + Math.sin(t / 200 + i) * 0.15;
          if (state === 'speaking')
            return 0.35 + Math.sin(t / 150 + i * 0.7) * 0.4 + Math.random() * 0.15;
          return 0.18 + Math.sin(t / 380 + i * 1.1) * 0.1;
        })
      );
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [state, isAnimating, bars]);

  // Pill (legacy) — small bar cluster; kept for any non-overlay usage
  if (size === 'pill') {
    return (
      <div className="flex items-center gap-[2.5px] h-5">
        {levels.map((level, i) => (
          <div
            key={i}
            className="w-[3px] rounded-sm transition-[height] duration-75 ease-out"
            style={{
              height: `${Math.max(15, level * 100)}%`,
              backgroundColor: 'var(--halo-accent-bright)',
              opacity: 0.9,
            }}
          />
        ))}
      </div>
    );
  }

  // Inline waveform inside the input dock
  if (size === 'sm') {
    return (
      <div className="flex items-center gap-[3px] h-8 w-[88px]">
        {levels.map((level, i) => (
          <div
            key={i}
            className="flex-1 rounded-[2px] transition-[height] duration-75 ease-out"
            style={{
              height: `${Math.max(18, level * 100)}%`,
              backgroundColor: isAnimating ? 'var(--halo-accent-bright)' : 'var(--halo-faint)',
              opacity: isAnimating ? 0.55 + level * 0.45 : 0.4,
            }}
          />
        ))}
      </div>
    );
  }

  // Large orb with internal waveform — responsive size, never shrinks via flex
  return (
    <div
      className="relative grid place-items-center rounded-full shrink-0 w-[180px] h-[180px] md:w-[160px] md:h-[160px]"
      style={{
        background:
          'radial-gradient(circle at 30% 30%, var(--halo-accent), #0aa352 70%, #003318)',
        boxShadow:
          '0 20px 60px color-mix(in srgb, var(--halo-accent) 40%, transparent), 0 0 0 12px color-mix(in srgb, var(--halo-accent) 8%, transparent), 0 0 0 28px color-mix(in srgb, var(--halo-accent) 4%, transparent)',
      }}
    >
      <div className="flex items-center justify-center gap-1 h-12 w-[125px]">
        {levels.map((level, i) => (
          <div
            key={i}
            className="flex-1 rounded transition-[height] duration-75 ease-out"
            style={{
              height: `${Math.max(20, level * 100)}%`,
              backgroundColor: 'rgba(255,255,255,0.95)',
              opacity: isAnimating ? 0.65 + level * 0.35 : 0.45,
            }}
          />
        ))}
      </div>
      {/* Inner highlight */}
      <div
        className="pointer-events-none absolute top-3 left-7 rounded-full"
        style={{
          width: 70,
          height: 44,
          background: 'rgba(255,255,255,0.18)',
          filter: 'blur(12px)',
        }}
      />
    </div>
  );
}
