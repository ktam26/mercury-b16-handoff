'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import teamInfo from '@/data/team-info.json';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useVoiceTrigger } from '@/components/voice/VoiceTriggerContext';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/stats', label: 'Stats' },
  { href: '/photos', label: 'Photos' },
  { href: '/tournament', label: 'Tournament' },
];

export const DesktopHeader = memo(function DesktopHeader() {
  const pathname = usePathname();
  const { openVoice } = useVoiceTrigger();

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-xl pt-[env(safe-area-inset-top)]"
      style={{
        background: 'color-mix(in srgb, var(--halo-bg) 60%, transparent)',
        borderBottomColor: 'var(--halo-glass-border)',
      }}
    >
      <div className="container flex h-12 md:h-16 items-center justify-between">
        {/* Crest + name */}
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <Image
            src="/images/logos/mercury-b16.png"
            alt="Mercury B16"
            width={36}
            height={36}
            className="w-9 h-9 md:w-9 md:h-9 object-contain rounded-md"
            priority
          />
          <div className="min-w-0">
            <div className="font-semibold text-sm md:text-base text-[var(--halo-ink)] tracking-tight truncate">
              <span className="md:hidden">Mercury B16</span>
              <span className="hidden md:inline">{teamInfo.shortName}</span>
            </div>
            <div className="hidden md:block text-[11px] text-[var(--halo-muted)]">
              {teamInfo.ageGroup}
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-[var(--halo-glass-strong)] text-[var(--halo-ink)] border border-[var(--halo-glass-border)]'
                    : 'text-[var(--halo-muted)] hover:text-[var(--halo-ink)]'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster — theme toggle + ask Mercury (desktop only) */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={openVoice}
            aria-label="Ask Mercury"
            className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-[13px] font-semibold transition-transform active:scale-95"
            style={{
              background:
                'linear-gradient(135deg, var(--halo-accent) 0%, #0aa352 100%)',
              boxShadow: '0 8px 24px rgba(0,132,61,0.30)',
            }}
          >
            <Mic className="w-4 h-4" aria-hidden="true" />
            Ask Mercury
          </button>
        </div>
      </div>
    </header>
  );
});
