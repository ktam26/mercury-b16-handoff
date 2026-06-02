'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import {
  formatGameDate,
  getShortTeamName,
  getGameDateTime,
  getResult,
  getOpponentLogo,
  getOurLogo,
  isScrimmage,
  getDateParts,
} from '@/lib/game-utils';
import { cn } from '@/lib/utils';
import {
  HaloPage,
  HaloCard,
  HaloPill,
  HaloSectionLabel,
} from './HaloShell';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'all', label: 'All' },
];

const PLACEHOLDER_LOGO = '/images/logos/mercury-b16.png';

function compLabel(game) {
  return isScrimmage(game) ? 'Scrimmage' : 'League';
}

export default function HaloSchedule({ currentSeason, previousSeason }) {
  const [tab, setTab] = useState('upcoming');

  const buckets = useMemo(() => {
    const now = new Date();
    const cur = currentSeason?.games || [];
    const prev = previousSeason?.games || [];

    const isLeague = (g) => g.type !== 'scrimmage';
    const isScrim = (g) => g.type === 'scrimmage';
    const isFuture = (g) => getGameDateTime(g) > now;

    const sortAsc = (arr) =>
      [...arr].sort((a, b) => getGameDateTime(a) - getGameDateTime(b));
    const sortDesc = (arr) =>
      [...arr].sort((a, b) => getGameDateTime(b) - getGameDateTime(a));

    const leagueUpcoming = sortAsc(cur.filter((g) => isLeague(g) && isFuture(g)));
    const leaguePast = sortDesc(cur.filter((g) => isLeague(g) && !isFuture(g)));
    const scrimUpcoming = sortAsc(cur.filter((g) => isScrim(g) && isFuture(g)));
    const scrimPast = sortDesc(cur.filter((g) => isScrim(g) && !isFuture(g)));
    const previous = sortDesc(prev);

    const next = leagueUpcoming[0] || null;

    return { leagueUpcoming, leaguePast, scrimUpcoming, scrimPast, previous, next };
  }, [currentSeason, previousSeason]);

  const totalRows = (() => {
    if (tab === 'upcoming') return buckets.leagueUpcoming.length + buckets.scrimUpcoming.length;
    if (tab === 'past')
      return buckets.leaguePast.length + buckets.scrimPast.length + buckets.previous.length;
    return (
      buckets.leagueUpcoming.length +
      buckets.scrimUpcoming.length +
      buckets.leaguePast.length +
      buckets.scrimPast.length +
      buckets.previous.length
    );
  })();

  const curLabel = currentSeason?.label || 'Current season';
  const prevLabel = previousSeason?.label || 'Previous season';

  return (
    <HaloPage>
      {/* MOBILE */}
      <div className="md:hidden max-w-3xl mx-auto px-4 pt-4">
        <h1
          className="text-[22px] font-bold mb-3 px-1"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
        >
          Schedule
        </h1>

        <SegmentedControl tabs={TABS} value={tab} onChange={setTab} />

        {tab === 'upcoming' && buckets.next && (
          <div className="mt-4">
            <NextMatchHero game={buckets.next} variant="mobile" />
          </div>
        )}

        {totalRows === 0 ? (
          <HaloCard className="p-8 text-center mt-4">
            <div className="text-[14px]" style={{ color: 'var(--halo-muted)' }}>
              {tab === 'upcoming' ? 'No upcoming games' : 'No games to show'}
            </div>
          </HaloCard>
        ) : (
          <>
            {(tab === 'upcoming' || tab === 'all') && buckets.leagueUpcoming.length > 0 && (
              <SectionedList
                label={`${curLabel} · League`}
                games={buckets.leagueUpcoming}
              />
            )}
            {(tab === 'upcoming' || tab === 'all') && buckets.scrimUpcoming.length > 0 && (
              <SectionedList
                label={`${curLabel} · Pre-season scrimmages`}
                games={buckets.scrimUpcoming}
              />
            )}
            {(tab === 'past' || tab === 'all') && buckets.leaguePast.length > 0 && (
              <SectionedList
                label={`${curLabel} · Recent results`}
                games={buckets.leaguePast}
              />
            )}
            {(tab === 'past' || tab === 'all') && buckets.scrimPast.length > 0 && (
              <SectionedList
                label={`${curLabel} · Pre-season scrimmages`}
                games={buckets.scrimPast}
              />
            )}
            {(tab === 'past' || tab === 'all') && buckets.previous.length > 0 && (
              <SectionedList
                label={`${prevLabel} · Previous season`}
                games={buckets.previous}
              />
            )}
          </>
        )}

        <div className="h-8" />
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block max-w-6xl mx-auto px-9 pt-6">
        <h1
          className="text-[28px] font-bold mb-4 px-1"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
        >
          Matches
        </h1>

        {buckets.next && <NextMatchHero game={buckets.next} variant="desktop" />}

        <div
          className="grid gap-4 mt-4"
          style={{ gridTemplateColumns: '1.3fr 1fr' }}
        >
          <ListCard
            title="Upcoming matches"
            sub={
              buckets.leagueUpcoming.length === 0
                ? 'None scheduled'
                : `Next ${Math.min(4, buckets.leagueUpcoming.length)}`
            }
          >
            {buckets.leagueUpcoming.length === 0 ? (
              <Empty>No upcoming league games</Empty>
            ) : (
              buckets.leagueUpcoming.slice(0, 6).map((g, i) => (
                <DesktopUpcomingRow
                  key={g.id}
                  game={g}
                  isFirst={i === 0}
                />
              ))
            )}
          </ListCard>

          <ListCard
            title="Recent results"
            sub={
              buckets.leaguePast.length === 0
                ? '—'
                : `Last ${Math.min(4, buckets.leaguePast.length)}`
            }
          >
            {buckets.leaguePast.length === 0 ? (
              <Empty>No completed league games yet</Empty>
            ) : (
              buckets.leaguePast.slice(0, 4).map((g, i) => (
                <DesktopResultRow key={g.id} game={g} isFirst={i === 0} />
              ))
            )}
          </ListCard>
        </div>

        {/* Pre-season scrimmages — full width if any */}
        {(buckets.scrimPast.length > 0 || buckets.scrimUpcoming.length > 0) && (
          <ListCard
            className="mt-4"
            title={`${curLabel} · Pre-season scrimmages`}
            sub={`${buckets.scrimPast.length + buckets.scrimUpcoming.length} game${
              buckets.scrimPast.length + buckets.scrimUpcoming.length === 1 ? '' : 's'
            }`}
          >
            {[...buckets.scrimUpcoming, ...buckets.scrimPast].map((g, i) =>
              g.result ? (
                <DesktopResultRow key={g.id} game={g} isFirst={i === 0} />
              ) : (
                <DesktopUpcomingRow key={g.id} game={g} isFirst={i === 0} />
              )
            )}
          </ListCard>
        )}

        {/* Previous season — collapsible-style standalone card */}
        {buckets.previous.length > 0 && (
          <ListCard
            className="mt-4"
            title={`${prevLabel} · Previous season`}
            sub={`${buckets.previous.length} games`}
          >
            {buckets.previous.map((g, i) => (
              <DesktopResultRow key={g.id} game={g} isFirst={i === 0} />
            ))}
          </ListCard>
        )}

        <div className="h-12" />
      </div>
    </HaloPage>
  );
}

/* ──────────────────────────  SHARED PIECES  ────────────────────────── */

function SegmentedControl({ tabs, value, onChange }) {
  return (
    <div
      className="grid gap-1 p-1 rounded-2xl mb-4"
      style={{
        gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
        background: 'var(--halo-glass-strong)',
        border: '1px solid var(--halo-glass-border)',
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            'py-2.5 rounded-xl text-[13px] font-semibold transition-colors',
            value === t.id
              ? 'text-[var(--halo-ink)]'
              : 'text-[var(--halo-muted)] hover:text-[var(--halo-ink)]'
          )}
          style={
            value === t.id
              ? {
                  background: 'var(--halo-bg)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }
              : {}
          }
          aria-pressed={value === t.id}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function NextMatchHero({ game, variant }) {
  const opponentLogo = getOpponentLogo(game);
  const mercuryLogo = getOurLogo(game);

  if (variant === 'desktop') {
    return (
      <Link href={`/game/${game.id}`} className="block group">
        <HaloCard className="p-8 lg:p-9 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 60% at 50% 0%, var(--halo-accent), transparent 60%)',
              opacity: 0.18,
            }}
          />
          <div
            className="relative grid items-center"
            style={{ gridTemplateColumns: 'auto 1fr auto', gap: 36 }}
          >
            {/* Left: Mercury */}
            <div className="flex items-center gap-4">
              <TeamLogo logo={mercuryLogo || PLACEHOLDER_LOGO} alt="Mercury" size={84} />
              <div>
                <div
                  className="text-[24px] font-bold leading-none"
                  style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
                >
                  Mercury Black
                </div>
                <div
                  className="text-[12px] mt-1.5"
                  style={{ color: 'var(--halo-muted)' }}
                >
                  {game.homeAway === 'home' ? 'Home' : 'Away'}
                  {game.jersey ? ` · ${game.jersey} kit` : ''}
                </div>
              </div>
            </div>

            {/* Center: VS + meta */}
            <div className="text-center">
              <HaloPill tone="accent" className="mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white halo-pulse" />
                Next Match
              </HaloPill>
              <div
                className="text-[56px] font-bold leading-none"
                style={{
                  color: 'var(--halo-accent-bright)',
                  letterSpacing: '-0.05em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                VS
              </div>
              <div
                className="text-[12px] mt-3 font-semibold"
                style={{ color: 'var(--halo-muted)', letterSpacing: '0.06em' }}
              >
                {formatGameDate(game.date).toUpperCase()} · {game.time}
                {game.location?.name ? ` · ${game.location.name}` : ''}
              </div>
            </div>

            {/* Right: Opponent */}
            <div className="flex items-center gap-4 justify-end">
              <div className="text-right">
                <div
                  className="text-[24px] font-bold leading-none"
                  style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
                >
                  {getShortTeamName(game.opponent)}
                </div>
                <div
                  className="text-[12px] mt-1.5"
                  style={{ color: 'var(--halo-muted)' }}
                >
                  {game.homeAway === 'home' ? 'Away' : 'Home'}
                </div>
              </div>
              <TeamLogo
                logo={opponentLogo || PLACEHOLDER_LOGO}
                alt={getShortTeamName(game.opponent)}
                size={84}
              />
            </div>
          </div>
        </HaloCard>
      </Link>
    );
  }

  // Mobile
  return (
    <Link href={`/game/${game.id}`} className="block">
      <HaloCard className="p-5 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, var(--halo-accent), transparent 70%)',
            opacity: 0.18,
          }}
        />
        <div className="relative">
          <HaloPill tone="accent">
            <span className="w-1.5 h-1.5 rounded-full bg-white halo-pulse" />
            Next Match
          </HaloPill>
          <div
            className="text-[12px] mt-3 font-semibold"
            style={{ color: 'var(--halo-muted)', letterSpacing: '0.04em' }}
          >
            {formatGameDate(game.date)} · {game.time}
          </div>
          <div
            className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mt-4"
          >
            <SmallSide
              logo={mercuryLogo || PLACEHOLDER_LOGO}
              name="Mercury"
              sub={game.homeAway === 'home' ? 'Home' : 'Away'}
            />
            <div
              className="text-[18px] font-bold"
              style={{
                color: 'var(--halo-accent-bright)',
                letterSpacing: '-0.02em',
              }}
            >
              vs
            </div>
            <SmallSide
              logo={opponentLogo || PLACEHOLDER_LOGO}
              name={getShortTeamName(game.opponent)}
              sub={game.homeAway === 'home' ? 'Away' : 'Home'}
            />
          </div>
        </div>
      </HaloCard>
    </Link>
  );
}

function SmallSide({ logo, name, sub }) {
  return (
    <div className="text-center min-w-0">
      <div className="relative w-12 h-12 mx-auto rounded-full halo-glass-strong overflow-hidden">
        <Image src={logo} alt={name} fill sizes="48px" className="object-contain p-1" />
      </div>
      <div
        className="text-[13px] font-bold mt-2 truncate"
        style={{ color: 'var(--halo-ink)' }}
      >
        {name}
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: 'var(--halo-muted)' }}>
        {sub}
      </div>
    </div>
  );
}

function TeamLogo({ logo, alt, size = 64 }) {
  return (
    <div
      className="relative rounded-full halo-glass-strong overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      <Image src={logo} alt={alt} fill sizes={`${size}px`} className="object-contain p-2" />
    </div>
  );
}

/* ──────────────────────────  MOBILE LIST  ────────────────────────── */

function SectionedList({ label, games }) {
  return (
    <div className="mt-5">
      <HaloSectionLabel>{label}</HaloSectionLabel>
      <HaloCard className="overflow-hidden">
        {games.map((g, i) => (
          <MobileScheduleRow
            key={g.id}
            game={g}
            isLast={i === games.length - 1}
          />
        ))}
      </HaloCard>
    </div>
  );
}

function MobileScheduleRow({ game, isLast }) {
  const dp = getDateParts(game.date);
  const result = getResult(game);
  const isPast = !!result;
  const isHome = game.homeAway === 'home';
  const isScrim = isScrimmage(game);
  const opponentLogo = getOpponentLogo(game);

  return (
    <Link
      href={`/game/${game.id}`}
      className="grid grid-cols-[60px_1fr_auto] gap-3 items-center px-4 py-3.5 transition-colors"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--halo-row-divider)',
      }}
    >
      <div
        className="text-center py-2 rounded-xl"
        style={{
          background: 'var(--halo-glass-strong)',
          border: '1px solid var(--halo-glass-border)',
        }}
      >
        <div
          className="text-[9px] font-bold"
          style={{ color: 'var(--halo-muted)', letterSpacing: '0.15em' }}
        >
          {dp.month}
        </div>
        <div
          className="text-[20px] font-bold leading-none mt-0.5"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
        >
          {dp.day}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {opponentLogo && (
            <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
              <Image
                src={opponentLogo}
                alt=""
                fill
                sizes="20px"
                className="object-contain"
              />
            </div>
          )}
          <div
            className="text-[14px] font-semibold truncate"
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
          >
            {isHome ? 'vs ' : '@ '}
            {getShortTeamName(game.opponent)}
          </div>
        </div>
        <div
          className="text-[11px] mt-1 flex items-center gap-2 flex-wrap"
          style={{ color: 'var(--halo-muted)' }}
        >
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {game.time}
          </span>
          {game.location?.name && (
            <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{game.location.name}</span>
            </span>
          )}
          {isScrim && (
            <span
              className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase"
              style={{
                background: 'var(--halo-glass-strong)',
                color: 'var(--halo-muted)',
                letterSpacing: '0.12em',
                border: '1px solid var(--halo-glass-border)',
              }}
            >
              Scrim
            </span>
          )}
        </div>
      </div>

      {isPast ? (
        <div className="text-right">
          <div
            className="text-[10px] font-bold uppercase"
            style={{
              color:
                result === 'W'
                  ? 'var(--halo-accent-bright)'
                  : result === 'L'
                  ? 'var(--halo-loss)'
                  : 'var(--halo-muted)',
              letterSpacing: '0.12em',
            }}
          >
            {result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
          </div>
          <div
            className="text-[18px] font-bold mt-0.5"
            style={{
              color: 'var(--halo-ink)',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {game.result.us}
            <span style={{ color: 'var(--halo-faint)' }}>:</span>
            {game.result.them}
          </div>
        </div>
      ) : (
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
          style={{
            background: isHome
              ? 'color-mix(in srgb, var(--halo-accent) 15%, transparent)'
              : 'var(--halo-glass-strong)',
            color: isHome ? 'var(--halo-accent-bright)' : 'var(--halo-muted)',
            border: '1px solid var(--halo-glass-border)',
          }}
        >
          {isHome ? 'Home' : 'Away'}
        </span>
      )}
    </Link>
  );
}

/* ──────────────────────────  DESKTOP CARDS  ────────────────────────── */

function ListCard({ title, sub, children, className = '' }) {
  return (
    <HaloCard className={'p-6 ' + className}>
      <div className="flex items-baseline justify-between mb-4">
        <div
          className="text-[16px] font-bold"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
        >
          {title}
        </div>
        <div
          className="text-[12px]"
          style={{ color: 'var(--halo-muted)' }}
        >
          {sub}
        </div>
      </div>
      <div>{children}</div>
    </HaloCard>
  );
}

function Empty({ children }) {
  return (
    <div
      className="text-center py-6 text-[13px]"
      style={{ color: 'var(--halo-muted)' }}
    >
      {children}
    </div>
  );
}

function DesktopUpcomingRow({ game, isFirst }) {
  const dp = getDateParts(game.date);
  const isHome = game.homeAway === 'home';
  const isScrim = isScrimmage(game);
  const opponentLogo = getOpponentLogo(game);
  return (
    <Link
      href={`/game/${game.id}`}
      className="grid items-center gap-4 py-3.5"
      style={{
        gridTemplateColumns: '70px 1fr auto auto',
        borderTop: isFirst ? 'none' : '1px solid var(--halo-row-divider)',
      }}
    >
      <div
        className="text-center py-2 rounded-xl"
        style={{
          background: 'var(--halo-glass-strong)',
          border: '1px solid var(--halo-glass-border)',
        }}
      >
        <div
          className="text-[9px] font-bold"
          style={{ color: 'var(--halo-muted)', letterSpacing: '0.18em' }}
        >
          {dp.month}
        </div>
        <div
          className="text-[22px] font-bold leading-none mt-0.5"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
        >
          {dp.day}
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {opponentLogo && (
            <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
              <Image
                src={opponentLogo}
                alt=""
                fill
                sizes="20px"
                className="object-contain"
              />
            </div>
          )}
          <div
            className="text-[14px] font-semibold truncate"
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
          >
            {isHome ? 'vs ' : '@ '}
            {getShortTeamName(game.opponent)}
          </div>
        </div>
        <div
          className="text-[12px] mt-1"
          style={{ color: 'var(--halo-muted)' }}
        >
          {game.time}
          {game.location?.name ? ` · ${game.location.name}` : ''} · {compLabel(game)}
          {isScrim && (
            <span
              className="ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase align-middle"
              style={{
                background: 'var(--halo-glass-strong)',
                color: 'var(--halo-muted)',
                letterSpacing: '0.12em',
                border: '1px solid var(--halo-glass-border)',
              }}
            >
              Scrim
            </span>
          )}
        </div>
      </div>
      <span
        className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
        style={{
          background: isHome
            ? 'color-mix(in srgb, var(--halo-accent) 15%, transparent)'
            : 'var(--halo-glass-strong)',
          color: isHome ? 'var(--halo-accent-bright)' : 'var(--halo-muted)',
          border: '1px solid var(--halo-glass-border)',
        }}
      >
        {isHome ? 'Home' : 'Away'}
      </span>
      <ChevronRight
        className="w-4 h-4"
        style={{ color: 'var(--halo-muted)' }}
        aria-hidden="true"
      />
    </Link>
  );
}

function DesktopResultRow({ game, isFirst }) {
  const result = getResult(game);
  if (!result) return <DesktopUpcomingRow game={game} isFirst={isFirst} />;
  const isScrim = isScrimmage(game);
  const opponentLogo = getOpponentLogo(game);
  return (
    <Link
      href={`/game/${game.id}`}
      className="grid items-center gap-3 py-3"
      style={{
        gridTemplateColumns: '32px 1fr auto',
        borderTop: isFirst ? 'none' : '1px solid var(--halo-row-divider)',
      }}
    >
      <div
        className="w-7 h-7 rounded-md grid place-items-center text-[11px] font-extrabold text-white"
        style={{
          background:
            result === 'W'
              ? 'var(--halo-accent-bright)'
              : result === 'L'
              ? 'var(--halo-loss)'
              : 'var(--halo-faint)',
        }}
      >
        {result}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {opponentLogo && (
            <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0">
              <Image
                src={opponentLogo}
                alt=""
                fill
                sizes="16px"
                className="object-contain"
              />
            </div>
          )}
          <div
            className="text-[13px] font-semibold truncate"
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
          >
            {getShortTeamName(game.opponent)}
          </div>
        </div>
        <div
          className="text-[11px] mt-0.5 flex items-center gap-2"
          style={{ color: 'var(--halo-muted)' }}
        >
          <span>{formatGameDate(game.date)}</span>
          <span>·</span>
          <span>{compLabel(game)}</span>
          {isScrim && (
            <span
              className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase"
              style={{
                background: 'var(--halo-glass-strong)',
                color: 'var(--halo-muted)',
                letterSpacing: '0.12em',
                border: '1px solid var(--halo-glass-border)',
              }}
            >
              Scrim
            </span>
          )}
        </div>
      </div>
      <div
        className="text-[18px] font-bold"
        style={{
          color: 'var(--halo-ink)',
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {game.result.us}
        <span style={{ color: 'var(--halo-faint)', margin: '0 3px' }}>:</span>
        {game.result.them}
      </div>
    </Link>
  );
}
