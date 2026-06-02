'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sun, Cloud, CloudSun, CloudFog, CloudDrizzle, CloudRain, CloudLightning, Snowflake,
  ChevronRight, MapPin, Clock, Calendar, Shirt, Wind, Trophy, ExternalLink,
} from 'lucide-react';
import currentGamesData from '@/data/games.json';
import teamInfo from '@/data/team-info.json';
import tournament from '@/data/tournament.json';
import rosterData from '@/data/roster.json';
import { SEASONS } from '@/lib/seasons';
import { getCompetitiveGames, getSeasonRecord } from '@/lib/stats-utils';
import { calculateLeaderboards } from '@/lib/stats-calc';
import {
  formatGameDate,
  getNextGame,
  getShortTeamName,
  getArrivalTime,
  getResult,
  getOpponentLogo,
  getOurLogo,
  isScrimmage,
  pad2,
} from '@/lib/game-utils';
import { useCountdown, useMounted } from '@/hooks/useCountdown';
import { useWeather } from '@/hooks/useWeather';
import { cn } from '@/lib/utils';
import { HaloPage, HaloCard, HaloPill, HaloSectionLabel } from './HaloShell';
import { HaloWinRateRing } from './HaloWinRateRing';

const WEATHER_ICONS = {
  Sun, Cloud, CloudSun, CloudFog, CloudDrizzle, CloudRain, CloudLightning, Snowflake,
};
const PLACEHOLDER_LOGO = '/images/logos/mercury-b16.png';

export default function HaloHome() {
  const [selectedSeason, setSelectedSeason] = useState(SEASONS[0].id);
  const currentSeason = SEASONS.find((s) => s.id === selectedSeason);
  const gamesData = currentSeason?.data || [];
  const seasonLabel = currentSeason?.fullLabel || 'Season';

  const upcomingGame = getNextGame(currentGamesData);
  const mounted = useMounted();
  const homeShortName = getShortTeamName(teamInfo.name);

  const countdown = useCountdown(upcomingGame);
  const weather = useWeather(upcomingGame);
  const WeatherIcon = weather.iconName ? WEATHER_ICONS[weather.iconName] || Cloud : null;

  const stats = useMemo(() => {
    const past = getCompetitiveGames(gamesData);
    const { wins, losses, ties } = getSeasonRecord(gamesData);
    const gf = past.reduce((s, g) => s + g.result.us, 0);
    const ga = past.reduce((s, g) => s + g.result.them, 0);
    const gd = gf - ga;
    const last = past.slice(-5).reverse();
    const cleanSheets = past.filter((g) => g.result.them === 0).length;
    return { past, wins, losses, ties, gf, ga, gd, last, cleanSheets };
  }, [gamesData]);

  const topScorers = useMemo(
    () => calculateLeaderboards(gamesData, rosterData).goalLeaders.slice(0, 4),
    [gamesData]
  );

  const isChampion = tournament?.mercuryPlacement === 'CHAMPION';
  const isTomorrow = countdown && countdown.days === 1;
  const isGameDay = countdown && countdown.days === 0;

  const showHero = upcomingGame && mounted && countdown;

  return (
    <HaloPage>
      <div className="max-w-6xl mx-auto px-4 lg:px-9 pt-3 md:pt-6">
        {/* HERO — different layouts for mobile vs desktop */}
        {showHero && (
          <>
            <div className="md:hidden">
              <HeroMobile
                game={upcomingGame}
                countdown={countdown}
                homeShortName={homeShortName}
                opponentName={getShortTeamName(upcomingGame.opponent)}
                weather={weather}
                WeatherIcon={WeatherIcon}
                isTomorrow={isTomorrow}
                isGameDay={isGameDay}
              />
            </div>
            <div className="hidden md:block">
              <HeroDesktop
                game={upcomingGame}
                countdown={countdown}
                homeShortName={homeShortName}
                opponentName={getShortTeamName(upcomingGame.opponent)}
                weather={weather}
                WeatherIcon={WeatherIcon}
                isTomorrow={isTomorrow}
                isGameDay={isGameDay}
              />
            </div>
          </>
        )}

        {/* GRID: Recent | Season | Champion (3-col on desktop, stacks mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr] gap-4 mt-4">
          <RecentResultsCard
            games={stats.last}
            homeShortName={homeShortName}
            mobileScroll
            seasonLabel={seasonLabel}
          />
          <SeasonStatsCard
            wins={stats.wins}
            losses={stats.losses}
            ties={stats.ties}
            gd={stats.gd}
            gf={stats.gf}
            ga={stats.ga}
            cleanSheets={stats.cleanSheets}
            seasonLabel={seasonLabel}
            selectedSeason={selectedSeason}
            setSelectedSeason={setSelectedSeason}
            past={stats.past}
          />
          {isChampion && <ChampionCard />}
        </div>

        {/* Top scorers — vertical list on mobile, 4-col grid on desktop */}
        {topScorers.length > 0 && (
          <HaloCard className="p-5 md:p-6 mt-4">
            <div className="flex items-baseline justify-between mb-4">
              <div
                className="text-[15px] font-bold"
                style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
              >
                Top scorers · {seasonLabel}
              </div>
              <div
                className="text-[11px] font-semibold"
                style={{ color: 'var(--halo-muted)', letterSpacing: '0.1em' }}
              >
                ⚽ GOALS
              </div>
            </div>
            {/* Mobile vertical list */}
            <div className="md:hidden">
              {topScorers.map((p, i) => (
                <ScorerRowMobile key={p.name} player={p} rank={i} />
              ))}
            </div>
            {/* Desktop 4-col grid */}
            <div className="hidden md:grid md:grid-cols-4 gap-3">
              {topScorers.map((p, i) => (
                <ScorerTile key={p.name} player={p} rank={i} />
              ))}
            </div>
          </HaloCard>
        )}

        <div className="h-8" />
      </div>
    </HaloPage>
  );
}

/* ──────────────────────────  HERO — MOBILE  ────────────────────────── */

function HeroMobile({
  game, countdown, homeShortName, opponentName,
  weather, WeatherIcon, isTomorrow, isGameDay,
}) {
  const opponentLogo = getOpponentLogo(game);
  const mercuryLogo = getOurLogo(game);
  const scrim = isScrimmage(game);
  return (
    <HaloCard className="p-5 relative overflow-hidden mt-1">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--halo-accent), transparent 70%)',
          opacity: 0.18,
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isGameDay ? (
              <HaloPill tone="accent">
                <span className="w-1.5 h-1.5 rounded-full bg-white halo-pulse" /> Game Day
              </HaloPill>
            ) : isTomorrow ? (
              <HaloPill tone="amber">
                <span className="w-1.5 h-1.5 rounded-full halo-pulse" style={{ background: 'var(--halo-amber)' }} /> Tomorrow
              </HaloPill>
            ) : (
              <HaloPill tone="accent">
                <span className="w-1.5 h-1.5 rounded-full bg-white halo-pulse" /> Next Match
              </HaloPill>
            )}
            {scrim && <HaloPill>Scrimmage</HaloPill>}
            <HaloPill>{game.homeAway === 'home' ? '🏠 Home' : '✈️ Away'}</HaloPill>
          </div>
          <div className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--halo-muted)' }}>
            {formatGameDate(game.date)}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mt-5">
          <TeamSide name={homeShortName} logo={mercuryLogo || PLACEHOLDER_LOGO} sub={game.homeAway === 'home' ? 'Home' : 'Away'} compact />
          <div className="text-[13px] font-bold tracking-[0.25em]" style={{ color: 'var(--halo-faint)' }}>VS</div>
          <TeamSide name={opponentName} logo={opponentLogo || PLACEHOLDER_LOGO} sub={game.homeAway === 'home' ? 'Away' : 'Home'} compact />
        </div>

        <CountdownTiles cd={countdown} size="sm" />

        <InfoChips game={game} weather={weather} WeatherIcon={WeatherIcon} compact />

        <ArriveByCard game={game} compact />

        <div className="mt-4 flex">
          <Link
            href={`/game/${game.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl text-white px-5 py-3.5 text-[14px] font-semibold transition-transform active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, var(--halo-accent) 0%, #0aa352 100%)',
              boxShadow: '0 10px 24px rgba(0,132,61,0.30)',
            }}
          >
            View match details
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </HaloCard>
  );
}

/* ──────────────────────────  HERO — DESKTOP  ────────────────────────── */

function HeroDesktop({
  game, countdown, homeShortName, opponentName,
  weather, WeatherIcon, isTomorrow, isGameDay,
}) {
  const opponentLogo = getOpponentLogo(game);
  const mercuryLogo = getOurLogo(game);
  const scrim = isScrimmage(game);
  return (
    <HaloCard className="p-9 lg:p-10 relative overflow-hidden mt-1">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 0%, var(--halo-accent), transparent 60%)',
          opacity: 0.15,
        }}
      />
      <div className="relative grid grid-cols-[1.2fr_1.5fr_1fr] gap-9 items-center">
        {/* LEFT — matchup vertical */}
        <div>
          <div className="flex flex-wrap gap-2">
            {isGameDay ? (
              <HaloPill tone="accent">
                <span className="w-1.5 h-1.5 rounded-full bg-white halo-pulse" /> Game Day · {formatGameDate(game.date)}
              </HaloPill>
            ) : isTomorrow ? (
              <HaloPill tone="amber">
                <span className="w-1.5 h-1.5 rounded-full halo-pulse" style={{ background: 'var(--halo-amber)' }} /> Tomorrow · {formatGameDate(game.date)}
              </HaloPill>
            ) : (
              <HaloPill tone="accent">
                <span className="w-1.5 h-1.5 rounded-full bg-white halo-pulse" /> Next Match · {formatGameDate(game.date)}
              </HaloPill>
            )}
            {scrim && <HaloPill>Scrimmage</HaloPill>}
          </div>

          <div className="mt-7 flex items-center gap-4">
            <TeamLogo logo={mercuryLogo || PLACEHOLDER_LOGO} alt={homeShortName} size={64} />
            <div>
              <div
                className="text-[24px] lg:text-[26px] font-bold leading-none"
                style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
              >
                {homeShortName}
              </div>
              <div className="text-[12px] mt-1.5" style={{ color: 'var(--halo-muted)' }}>
                {game.homeAway === 'home' ? 'Home' : 'Away'} · {game.jersey || '—'} kit
              </div>
            </div>
          </div>

          <div
            className="my-3.5 ml-[80px] text-[12px] font-bold tracking-[0.3em]"
            style={{ color: 'var(--halo-faint)' }}
          >
            VERSUS
          </div>

          <div className="flex items-center gap-4">
            <TeamLogo logo={opponentLogo || PLACEHOLDER_LOGO} alt={opponentName} size={64} />
            <div className="min-w-0">
              <div
                className="text-[24px] lg:text-[26px] font-bold leading-none truncate"
                style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
              >
                {opponentName}
              </div>
              <div className="text-[12px] mt-1.5" style={{ color: 'var(--halo-muted)' }}>
                {game.homeAway === 'home' ? 'Away' : 'Home'}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER — giant countdown */}
        <div>
          <div
            className="text-[11px] font-bold uppercase text-center mb-3"
            style={{ color: 'var(--halo-muted)', letterSpacing: '0.2em' }}
          >
            Kickoff in
          </div>
          <CountdownTiles cd={countdown} size="lg" />
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <InfoChip icon={<Clock className="w-3.5 h-3.5" />} label="Kickoff">{game.time}</InfoChip>
            {game.location?.name && (
              <InfoChip icon={<MapPin className="w-3.5 h-3.5" />} label="Field">
                <span className="max-w-[180px] truncate">{game.location.name}</span>
              </InfoChip>
            )}
            {!weather.isLoading && !weather.error && weather.temp != null && (
              <InfoChip icon={WeatherIcon ? <WeatherIcon className="w-3.5 h-3.5" /> : null} label="Weather">
                {weather.temp}° {weather.condition}
              </InfoChip>
            )}
          </div>
        </div>

        {/* RIGHT — Arrive-by + actions */}
        <div className="flex flex-col gap-3">
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,193,7,0.18)',
              border: '1px solid rgba(255,193,7,0.40)',
            }}
          >
            <div
              className="text-[10px] font-bold uppercase"
              style={{ color: 'var(--halo-amber-ink)', letterSpacing: '0.12em' }}
            >
              ⏰ Arrive By
            </div>
            <div
              className="text-[26px] font-bold mt-1"
              style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
            >
              {getArrivalTime(game.time)}
            </div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--halo-muted)' }}>
              30 min before kickoff
            </div>
          </div>

          {game.location?.googleMapsUrl ? (
            <a
              href={game.location.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl text-white px-4 py-3.5 text-[14px] font-semibold transition-transform active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--halo-accent) 0%, #0aa352 100%)',
                boxShadow: '0 10px 24px rgba(0,132,61,0.30)',
              }}
            >
              <MapPin className="w-4 h-4" />
              Directions to {game.location?.name?.split(' ').slice(-2).join(' ') || 'field'}
            </a>
          ) : (
            <Link
              href={`/game/${game.id}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl text-white px-4 py-3.5 text-[14px] font-semibold transition-transform active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--halo-accent) 0%, #0aa352 100%)',
                boxShadow: '0 10px 24px rgba(0,132,61,0.30)',
              }}
            >
              View match details
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            href={`/game/${game.id}`}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[14px] font-semibold transition-colors"
            style={{
              background: 'transparent',
              border: '1px solid var(--halo-glass-border)',
              color: 'var(--halo-ink)',
            }}
          >
            Match details
          </Link>
        </div>
      </div>
    </HaloCard>
  );
}

/* ──────────────────────────  HERO PARTS  ────────────────────────── */

function CountdownTiles({ cd, size = 'sm' }) {
  const cls =
    size === 'lg'
      ? 'text-[44px] lg:text-[56px]'
      : 'text-[28px]';
  const tilePad = size === 'lg' ? 'py-5' : 'py-3';
  const labelMt = size === 'lg' ? 'mt-2' : 'mt-1';
  return (
    <div className={cn('grid grid-cols-4 gap-2.5 md:gap-3', size === 'sm' && 'mt-7')}>
      {[
        [pad2(cd.days), 'DAYS'],
        [pad2(cd.hours), 'HRS'],
        [pad2(cd.minutes), 'MIN'],
        [pad2(cd.seconds ?? 0), 'SEC'],
      ].map(([v, l], i) => (
        <div key={l} className={cn('halo-glass-strong rounded-2xl text-center', tilePad)}>
          <div
            className={cn('font-bold leading-none', cls)}
            style={{
              color: i === 0 ? 'var(--halo-accent-bright)' : 'var(--halo-ink)',
              letterSpacing: '-0.04em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {v}
          </div>
          <div
            className={cn('text-[10px] font-bold', labelMt)}
            style={{ color: 'var(--halo-muted)', letterSpacing: '0.18em' }}
          >
            {l}
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoChips({ game, weather, WeatherIcon, compact = false }) {
  return (
    <div className={cn('flex flex-wrap gap-2 justify-center', compact ? 'mt-4' : 'mt-5')}>
      <InfoChip icon={<Clock className="w-3.5 h-3.5" />} label="Kickoff">{game.time}</InfoChip>
      <InfoChip icon={<Calendar className="w-3.5 h-3.5" />} label="Date">{formatGameDate(game.date)}</InfoChip>
      {game.location?.name && (
        <InfoChip icon={<MapPin className="w-3.5 h-3.5" />} label="Field">
          <span className="max-w-[160px] truncate">{game.location.name}</span>
        </InfoChip>
      )}
      {game.jersey && (
        <InfoChip icon={<Shirt className="w-3.5 h-3.5" />} label="Kit">
          <span className="capitalize">{game.jersey}</span>
        </InfoChip>
      )}
      {!weather.isLoading && !weather.error && weather.temp != null && (
        <InfoChip icon={WeatherIcon ? <WeatherIcon className="w-3.5 h-3.5" /> : null} label="Weather">
          {weather.temp}° {weather.condition}
        </InfoChip>
      )}
      {weather.windSpeed != null && !weather.error && (
        <InfoChip icon={<Wind className="w-3.5 h-3.5" />} label="Wind">
          {weather.windSpeed} mph
        </InfoChip>
      )}
    </div>
  );
}

function ArriveByCard({ game, compact = false }) {
  return (
    <div
      className={cn('rounded-2xl flex items-center gap-3', compact ? 'p-3.5 mt-4' : 'p-4 mt-5')}
      style={{
        background: 'rgba(255,193,7,0.16)',
        border: '1px solid rgba(255,193,7,0.32)',
      }}
    >
      <div
        className="w-10 h-10 rounded-full grid place-items-center text-[18px] shrink-0"
        style={{ background: 'var(--halo-amber)', color: '#1a1200' }}
      >
        ⏰
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[10px] font-bold uppercase"
          style={{ color: 'var(--halo-amber-ink)', letterSpacing: '0.12em' }}
        >
          Arrive By
        </div>
        <div
          className="text-[18px] font-bold"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
        >
          {getArrivalTime(game.time)}
        </div>
      </div>
      {game.location?.googleMapsUrl && (
        <a
          href={game.location.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0"
          style={{
            background: 'var(--halo-ink)',
            color: 'var(--halo-bg)',
          }}
          aria-label="Open directions in Maps"
        >
          <MapPin className="w-3 h-3" />
          Maps
        </a>
      )}
    </div>
  );
}

function TeamSide({ name, logo, sub, compact = false }) {
  return (
    <div className="text-center min-w-0">
      <div className={cn('relative mx-auto rounded-full halo-glass-strong overflow-hidden', compact ? 'w-20 h-20' : 'w-24 h-24')}>
        <Image src={logo} alt={name} fill sizes="96px" className="object-contain p-2" />
      </div>
      <div
        className={cn('font-bold mt-2.5 truncate px-1', compact ? 'text-[15px]' : 'text-[16px]')}
        style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
      >
        {name}
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: 'var(--halo-muted)' }}>
        {sub}
      </div>
    </div>
  );
}

function TeamLogo({ logo, alt, size = 56 }) {
  return (
    <div
      className="relative rounded-full halo-glass-strong overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      <Image src={logo} alt={alt} fill sizes={`${size}px`} className="object-contain p-1.5" />
    </div>
  );
}

function InfoChip({ icon, label, children }) {
  return (
    <div
      className="halo-glass inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
      style={{ color: 'var(--halo-ink)' }}
      aria-label={label}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}

/* ──────────────────────────  RECENT  ────────────────────────── */

function RecentResultsCard({ games, homeShortName, mobileScroll = false, seasonLabel }) {
  if (games.length === 0) return null;
  return (
    <HaloCard className="p-5 md:p-6">
      <div className="flex items-baseline justify-between mb-3">
        <div
          className="text-[15px] font-bold"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
        >
          {seasonLabel ? `${seasonLabel} · Recent results` : 'Recent results'}
        </div>
        <Link
          href="/schedule"
          className="text-[12px] font-semibold"
          style={{ color: 'var(--halo-muted)' }}
        >
          See all →
        </Link>
      </div>
      {/* Mobile: horizontal scroll cards. Desktop: list rows. */}
      <div className={cn('md:hidden', mobileScroll && 'flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1')}>
        {games.map((g) => (
          <RecentMobileCard key={g.id} game={g} />
        ))}
      </div>
      <div className="hidden md:block">
        {games.map((g, i) => (
          <RecentDesktopRow
            key={g.id}
            game={g}
            isFirst={i === 0}
          />
        ))}
      </div>
    </HaloCard>
  );
}

function RecentMobileCard({ game }) {
  const r = getResult(game);
  const oppLogo = getOpponentLogo(game);
  return (
    <Link
      href={`/game/${game.id}`}
      className="halo-glass rounded-2xl p-3.5 min-w-[170px] shrink-0"
    >
      <div className="flex items-center justify-between">
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{
            background:
              r === 'W' ? 'var(--halo-accent)' :
              r === 'L' ? 'var(--halo-loss)' :
              'var(--halo-faint)',
            color: '#fff',
          }}
        >
          {r === 'W' ? 'Win' : r === 'L' ? 'Loss' : 'Draw'}
        </span>
        {oppLogo && (
          <div className="relative w-7 h-7 rounded-full halo-glass-strong overflow-hidden">
            <Image src={oppLogo} alt="" fill sizes="28px" className="object-contain p-0.5" />
          </div>
        )}
      </div>
      <div
        className="text-[26px] font-bold mt-2.5"
        style={{
          color: 'var(--halo-ink)',
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {game.result.us}<span style={{ color: 'var(--halo-faint)' }}>:</span>{game.result.them}
      </div>
      <div
        className="text-[12px] font-semibold mt-1.5 leading-tight"
        style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
      >
        {getShortTeamName(game.opponent).slice(0, 24)}
      </div>
      <div className="text-[10px] mt-1" style={{ color: 'var(--halo-muted)' }}>
        {formatGameDate(game.date)}
      </div>
    </Link>
  );
}

function RecentDesktopRow({ game, isFirst }) {
  const r = getResult(game);
  const oppLogo = getOpponentLogo(game);
  return (
    <Link
      href={`/game/${game.id}`}
      className="grid grid-cols-[28px_1fr_auto] gap-3 items-center py-2.5"
      style={{
        borderTop: isFirst ? 'none' : '1px solid var(--halo-row-divider)',
      }}
    >
      <div
        className="w-7 h-7 rounded-md grid place-items-center text-[11px] font-extrabold text-white"
        style={{
          background:
            r === 'W' ? 'var(--halo-accent)' :
            r === 'L' ? 'var(--halo-loss)' :
            'var(--halo-faint)',
        }}
      >
        {r}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {oppLogo && (
            <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0">
              <Image src={oppLogo} alt="" fill sizes="16px" className="object-contain" />
            </div>
          )}
          <div
            className="text-[13px] font-semibold truncate"
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
          >
            {getShortTeamName(game.opponent)}
          </div>
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--halo-muted)' }}>
          {formatGameDate(game.date)}
        </div>
      </div>
      <div
        className="text-[16px] font-bold"
        style={{
          color: 'var(--halo-ink)',
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {game.result.us}:{game.result.them}
      </div>
    </Link>
  );
}

/* ──────────────────────────  SEASON CARD  ────────────────────────── */

function SeasonStatsCard({
  wins, losses, ties, gd, gf, ga, cleanSheets, seasonLabel,
  selectedSeason, setSelectedSeason, past,
}) {
  return (
    <HaloCard className="p-5 md:p-6">
      <div className="flex items-baseline justify-between mb-3">
        <div
          className="text-[15px] font-bold"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
        >
          {seasonLabel}
        </div>
        <div className="flex gap-1">
          {SEASONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSeason(s.id)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors',
                selectedSeason === s.id
                  ? 'bg-[var(--halo-accent)] text-white'
                  : 'text-[var(--halo-muted)] hover:text-[var(--halo-ink)]'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <HaloWinRateRing wins={wins} losses={losses} ties={ties} size={110} />
        <div className="flex-1 min-w-0">
          <div
            className="text-[18px] font-bold"
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
          >
            {wins}W·{losses}L·{ties}D
          </div>
          <div className="text-[12px] mt-1" style={{ color: 'var(--halo-muted)' }}>
            {past.length} game{past.length === 1 ? '' : 's'} · GD {gd >= 0 ? '+' : ''}{gd}
          </div>
          <div className="flex gap-1 mt-2.5">
            {past.slice(-8).map((g, i) => {
              const r = g.result.us > g.result.them ? 'W' : g.result.us < g.result.them ? 'L' : 'D';
              const bg =
                r === 'W' ? 'var(--halo-accent)' :
                r === 'L' ? 'var(--halo-loss)' :
                'var(--halo-faint)';
              return <div key={g.id || i} className="w-3 h-3 rounded" style={{ background: bg }} />;
            })}
          </div>
        </div>
      </div>

      {/* Triple stat row */}
      <div
        className="grid grid-cols-3 gap-3 mt-4 pt-4"
        style={{ borderTop: '1px solid var(--halo-row-divider)' }}
      >
        {[
          ['GF', gf],
          ['GA', ga],
          ['CS', cleanSheets],
        ].map(([k, v]) => (
          <div key={k} className="text-center">
            <div
              className="text-[10px] font-bold uppercase"
              style={{ color: 'var(--halo-muted)', letterSpacing: '0.15em' }}
            >
              {k}
            </div>
            <div
              className="text-[22px] font-bold mt-0.5"
              style={{
                color: 'var(--halo-ink)',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>
    </HaloCard>
  );
}

/* ──────────────────────────  CHAMPION CARD  ────────────────────────── */

function ChampionCard() {
  const tStart = tournament?.dates?.start;
  const tEnd = tournament?.dates?.end;
  const formatRange = () => {
    if (!tStart || !tEnd) return '';
    const startD = new Date(tStart + 'T00:00:00');
    const endD = new Date(tEnd + 'T00:00:00');
    const sameMonth = startD.getMonth() === endD.getMonth();
    const month = startD.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    if (sameMonth) return `${month} ${startD.getDate()}–${endD.getDate()}`;
    return `${month} ${startD.getDate()} – ${endD.toLocaleString('en-US', { month: 'short' }).toUpperCase()} ${endD.getDate()}`;
  };

  const r = tournament?.mercuryRecord;

  // Compute mercury GF/GA from tournament games if present
  const tournamentGoals = useMemo(() => {
    const games = tournament?.mercuryGames || [];
    const gf = games.reduce((s, g) => s + (g?.result?.us ?? 0), 0);
    const ga = games.reduce((s, g) => s + (g?.result?.them ?? 0), 0);
    return { gf, ga };
  }, []);

  return (
    <Link href="/tournament" className="group block">
      <div
        className="rounded-3xl p-5 md:p-6 text-white relative overflow-hidden h-full transition-transform group-hover:-translate-y-0.5"
        style={{
          background: 'linear-gradient(135deg, var(--halo-accent) 0%, #0aa352 100%)',
          boxShadow: 'var(--halo-shadow-strong)',
        }}
      >
        <Trophy
          className="absolute right-2 top-2 opacity-15"
          style={{ width: 140, height: 140 }}
          aria-hidden="true"
        />
        <div
          className="text-[10px] font-extrabold uppercase opacity-90 relative"
          style={{ letterSpacing: '0.22em' }}
        >
          ◆ Champion · {formatRange()}
        </div>
        <div
          className="text-[20px] md:text-[22px] font-bold mt-2 relative"
          style={{ letterSpacing: '-0.02em' }}
        >
          {tournament?.organizer || tournament?.name}
        </div>
        {tournament?.location?.name && (
          <div className="text-[12px] opacity-85 mt-1 relative">
            {tournament.location.name}
          </div>
        )}
        {r && (
          <div className="grid grid-cols-3 gap-2 mt-4 relative">
            {[
              [`${r.w}-${r.l}-${r.t}`, 'RECORD'],
              [tournamentGoals.gf, 'GF'],
              [tournamentGoals.ga, 'GA'],
            ].map(([v, l]) => (
              <div
                key={l}
                className="rounded-xl text-center py-2.5"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div
                  className="text-[16px] font-bold"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {v}
                </div>
                <div
                  className="text-[9px] font-bold opacity-90"
                  style={{ letterSpacing: '0.15em' }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ──────────────────────────  SCORERS  ────────────────────────── */

function ScorerRowMobile({ player, rank }) {
  return (
    <div
      className="flex items-center gap-3 py-2.5"
      style={{ borderTop: rank === 0 ? 'none' : '1px solid var(--halo-row-divider)' }}
    >
      <div
        className="w-8 h-8 rounded-lg grid place-items-center text-[12px] font-extrabold"
        style={{
          background:
            rank === 0 ? 'var(--halo-accent)' : 'color-mix(in srgb, var(--halo-ink) 6%, transparent)',
          color: rank === 0 ? '#fff' : 'var(--halo-ink)',
        }}
      >
        {rank + 1}
      </div>
      <div
        className="flex-1 text-[13px] font-semibold truncate"
        style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
      >
        {player.name}
        {player.assists > 0 && (
          <span className="ml-2 text-[11px] font-normal" style={{ color: 'var(--halo-muted)' }}>
            {player.assists}A
          </span>
        )}
      </div>
      <div
        className="text-[18px] font-bold"
        style={{
          color: rank === 0 ? 'var(--halo-accent-bright)' : 'var(--halo-ink)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {player.goals}
      </div>
    </div>
  );
}

function ScorerTile({ player, rank }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--halo-glass-strong)',
        border: '1px solid var(--halo-glass-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl grid place-items-center text-[13px] font-extrabold"
          style={{
            background:
              rank === 0 ? 'var(--halo-accent-bright)' : 'color-mix(in srgb, var(--halo-ink) 6%, transparent)',
            color: rank === 0 ? '#fff' : 'var(--halo-ink)',
          }}
        >
          {rank + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[13px] font-semibold truncate"
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
          >
            {player.name}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--halo-muted)' }}>
            {player.assists}A
          </div>
        </div>
        <div
          className="text-[28px] font-bold leading-none"
          style={{
            color: rank === 0 ? 'var(--halo-accent-bright)' : 'var(--halo-ink)',
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {player.goals}
        </div>
      </div>
    </div>
  );
}
