'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Camera, BarChart3, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceTrigger } from './voice/VoiceTriggerContext';

const NAV = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/schedule', icon: Calendar, label: 'Schedule' },
  // center voice FAB sits here
  { href: '/stats', icon: BarChart3, label: 'Stats' },
  { href: '/photos', icon: Camera, label: 'Photos' },
];

export const BottomNav = memo(function BottomNav() {
  const pathname = usePathname();
  const { openVoice } = useVoiceTrigger();

  const isActive = (href) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="halo-glass border-t"
        style={{
          borderTopColor: 'var(--halo-glass-border)',
          background: 'color-mix(in srgb, var(--halo-bg) 60%, transparent)',
        }}
      >
        <div className="grid grid-cols-5 items-end h-16 px-2">
          <TabLink item={NAV[0]} active={isActive(NAV[0].href)} />
          <TabLink item={NAV[1]} active={isActive(NAV[1].href)} />

          <div className="flex justify-center">
            <button
              type="button"
              onClick={openVoice}
              aria-label="Open voice assistant"
              className="relative -translate-y-3.5 w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform active:scale-95"
              style={{
                background:
                  'linear-gradient(135deg, var(--halo-accent) 0%, #0aa352 100%)',
                boxShadow:
                  '0 8px 24px rgba(0,132,61,0.35), 0 0 0 4px color-mix(in srgb, var(--halo-bg) 80%, transparent)',
              }}
            >
              <Mic className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <TabLink item={NAV[2]} active={isActive(NAV[2].href)} />
          <TabLink item={NAV[3]} active={isActive(NAV[3].href)} />
        </div>
      </div>
    </nav>
  );
});

function TabLink({ item, active }) {
  const { href, icon: Icon, label } = item;
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-col items-center justify-center h-16 gap-1 transition-colors',
        active ? 'text-[var(--halo-accent-bright)]' : 'text-[var(--halo-muted)]'
      )}
    >
      <Icon
        className={cn(
          'w-5 h-5 transition-transform',
          active && 'scale-110'
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          'text-[10px] tracking-wide',
          active ? 'font-semibold' : 'font-medium'
        )}
      >
        {label}
      </span>
    </Link>
  );
}
