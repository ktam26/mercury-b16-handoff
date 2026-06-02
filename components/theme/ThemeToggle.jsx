'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

const ORDER = ['light', 'dark', 'system'];
const ICON = { light: Sun, dark: Moon, system: Monitor };
const LABEL = { light: 'Light', dark: 'Dark', system: 'System' };

export function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = mounted ? (theme || 'system') : 'system';
  const Icon = ICON[current] || Monitor;
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${LABEL[current]}. Switch to ${LABEL[next]}.`}
      title={`Theme: ${LABEL[current]} — click for ${LABEL[next]}`}
      className={
        'halo-glass inline-flex items-center justify-center w-9 h-9 rounded-full text-[var(--halo-ink)] transition-transform active:scale-95 ' +
        className
      }
      suppressHydrationWarning
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}
