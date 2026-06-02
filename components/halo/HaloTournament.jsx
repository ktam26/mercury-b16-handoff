'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Navigation, AlertTriangle, Camera, Mail, Phone, Globe, Instagram } from 'lucide-react';
import {
  deriveRoundLabel,
  getMercuryGroup,
  getMercuryRow,
  getKpis,
  formatPlacement,
} from '@/lib/tournament-utils';
import { HaloPage, HaloCard, HaloPill, HaloSectionLabel } from './HaloShell';
import { RulesChat } from '../RulesChat';
import teamInfo from '@/data/team-info.json';

const accentTint = (pct) =>
  `color-mix(in srgb, var(--halo-accent) ${pct}%, transparent)`;

const ctaGradient = 'linear-gradient(135deg, var(--halo-accent) 0%, #0aa352 100%)';

function formatDates(dates) {
  if (!dates) return '';
  if (typeof dates === 'string') return dates;
  // { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
  const start = parseISO(dates.start);
  const end = parseISO(dates.end);
  if (!start) return '';
  const startMonth = MONTHS[start.month];
  const endMonth = end ? MONTHS[end.month] : null;
  if (!end || (start.year === end.year && start.month === end.month && start.day === end.day)) {
    return `${startMonth} ${start.day}, ${start.year}`;
  }
  if (start.year === end.year && start.month === end.month) {
    return `${startMonth} ${start.day}–${end.day}, ${start.year}`;
  }
  if (start.year === end.year) {
    return `${startMonth} ${start.day} – ${endMonth} ${end.day}, ${start.year}`;
  }
  return `${startMonth} ${start.day}, ${start.year} – ${endMonth} ${end.day}, ${end.year}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseISO(str) {
  if (!str) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

function getMonthYearTag(dates) {
  const formatted = formatDates(dates);
  return formatted.toUpperCase();
}

export default function HaloTournament({
  tournament,
  isArchived = false,
  isLive = false,
  lastUpdated,
  onFieldClick,
}) {
  const isChampion = tournament.mercuryPlacement?.toUpperCase() === 'CHAMPION';
  const mercuryRow = getMercuryRow(tournament.standings);
  const groupKey = getMercuryGroup(tournament.standings);
  const groupRows = (groupKey && tournament.standings?.[groupKey]) || [];
  const kpis = getKpis(tournament.mercuryRecord, mercuryRow);
  const placementText = formatPlacement(tournament.mercuryPlacement, tournament.mercuryPlacementRank);

  return (
    <HaloPage>
      {/* MOBILE */}
      <div className="md:hidden max-w-3xl mx-auto px-4 pt-4 pb-28">
        {isArchived && <BackLink href="/tournament/history" label="Back to history" className="mb-3" />}
        {isLive && <LivePulse lastUpdated={lastUpdated} />}

        <Hero tournament={tournament} kpis={kpis} isChampion={isChampion} placementText={placementText} variant="mobile" />

        <div className="mt-4">
          <TournamentInfoTable tournament={tournament} />
        </div>

        <div className="mt-5">
          <HaloSectionLabel>Final standings</HaloSectionLabel>
          <StandingsTable rows={groupRows} variant="mobile" />
        </div>

        <div className="mt-5">
          <HaloSectionLabel>Match results</HaloSectionLabel>
          <MatchResultsList
            games={tournament.mercuryGames || []}
            placement={tournament.mercuryPlacement}
          />
        </div>

        {tournament.fieldMap && (
          <div className="mt-5">
            <FieldMapCard fieldMap={tournament.fieldMap} venueShort={tournament.location?.name} onFieldClick={onFieldClick} />
          </div>
        )}

        <div className="mt-5">
          <LocationCard tournament={tournament} variant="mobile" />
        </div>

        {tournament.eventInfo && (
          <div className="mt-5">
            <EventDayInfoCard eventInfo={tournament.eventInfo} />
          </div>
        )}

        {tournament.rules && (
          <div className="mt-5">
            <RulesTeaser rules={tournament.rules} />
          </div>
        )}

        <div className="mt-5">
          <QuickLinksTournament tournament={tournament} layout="stack" />
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block max-w-6xl mx-auto px-9 pt-6 pb-16">
        {isArchived && <BackLink href="/tournament/history" label="Back to history" className="mb-4" />}
        {isLive && <LivePulse lastUpdated={lastUpdated} />}

        <Hero tournament={tournament} kpis={kpis} isChampion={isChampion} placementText={placementText} variant="desktop" />

        <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
          <StandingsTable rows={groupRows} variant="desktop" />
          {isChampion ? (
            <PathToTitle games={tournament.mercuryGames || []} placement={tournament.mercuryPlacement} />
          ) : (
            <MatchResultsList
              games={tournament.mercuryGames || []}
              placement={tournament.mercuryPlacement}
              asCard
            />
          )}
        </div>

        <div className="mt-4">
          <TournamentInfoTable tournament={tournament} />
        </div>

        <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: '1.1fr 1fr' }}>
          {tournament.fieldMap ? (
            <FieldMapCard fieldMap={tournament.fieldMap} venueShort={tournament.location?.name} onFieldClick={onFieldClick} />
          ) : (
            <LocationCard tournament={tournament} variant="desktop" />
          )}
          {tournament.fieldMap ? (
            <LocationCard tournament={tournament} variant="desktop" />
          ) : tournament.eventInfo ? (
            <EventDayInfoCard eventInfo={tournament.eventInfo} />
          ) : null}
        </div>

        {tournament.fieldMap && tournament.eventInfo && (
          <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <EventDayInfoCard eventInfo={tournament.eventInfo} />
            {tournament.rules && <RulesTeaser rules={tournament.rules} />}
          </div>
        )}

        {!tournament.fieldMap && tournament.rules && tournament.eventInfo && (
          <div className="mt-4">
            <RulesTeaser rules={tournament.rules} />
          </div>
        )}

        {!tournament.eventInfo && tournament.rules && (
          <div className="mt-4">
            <RulesTeaser rules={tournament.rules} />
          </div>
        )}

        <div className="mt-4">
          <QuickLinksTournament tournament={tournament} layout="grid" />
        </div>
      </div>
    </HaloPage>
  );
}

/* ─────────────────────────  pieces  ───────────────────────── */

function BackLink({ href, label, className = '' }) {
  return (
    <Link
      href={href}
      className={
        'inline-flex items-center gap-1 text-[12px] font-semibold tracking-wider hover:opacity-80 ' +
        className
      }
      style={{ color: 'var(--halo-muted)' }}
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </Link>
  );
}

function LivePulse({ lastUpdated }) {
  return (
    <div className="flex items-center justify-center gap-2 py-2 mb-2">
      <span
        className="w-2 h-2 rounded-full halo-pulse"
        style={{ background: 'var(--halo-loss)' }}
      />
      <span
        className="text-[11px] font-bold tracking-wider uppercase"
        style={{ color: 'var(--halo-loss)' }}
      >
        Live scores
      </span>
      {lastUpdated && (
        <span className="text-[11px]" style={{ color: 'var(--halo-muted)' }}>
          Updated {lastUpdated.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

function Hero({ tournament, kpis, isChampion, placementText, variant }) {
  const dates = tournament.dates;
  const datesText = formatDates(dates);
  const venue = tournament.location?.name;
  const meta = [datesText, venue, tournament.division, tournament.format].filter(Boolean).join(' · ');

  if (isChampion) {
    return (
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: variant === 'desktop' ? 36 : 28,
          padding: variant === 'desktop' ? '32px 36px' : '22px 22px',
          color: '#fff',
          background: ctaGradient,
          boxShadow:
            variant === 'desktop'
              ? '0 20px 50px rgba(0,132,61,0.35)'
              : '0 14px 38px rgba(0,132,61,0.38)',
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            right: variant === 'desktop' ? -40 : -20,
            top: variant === 'desktop' ? -50 : -30,
            fontSize: variant === 'desktop' ? 320 : 220,
            opacity: 0.13,
            lineHeight: 1,
          }}
        >
          🏆
        </div>
        {variant === 'desktop' ? (
          <div className="relative grid items-center gap-9" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
            <div>
              <div className="text-[11px] font-extrabold tracking-[0.22em] opacity-90">
                ◆ CHAMPION · {getMonthYearTag(dates)}
              </div>
              <div className="text-[44px] font-bold leading-tight mt-2" style={{ letterSpacing: '-0.03em' }}>
                {tournament.name}
              </div>
              <div className="text-[14px] mt-2 opacity-80">{meta}</div>
            </div>
            <KpiGrid kpis={kpis} variant="desktop" />
          </div>
        ) : (
          <div className="relative">
            <div className="text-[10px] font-extrabold tracking-[0.22em] opacity-90">
              ◆ CHAMPION · {getMonthYearTag(dates)}
            </div>
            <div className="text-[26px] font-bold mt-1.5" style={{ letterSpacing: '-0.02em', lineHeight: 1.05 }}>
              {tournament.name}
            </div>
            <div className="text-[12px] mt-1 opacity-85">
              {[datesText, tournament.location?.name].filter(Boolean).join(' · ')}
            </div>
            <div className="mt-4">
              <KpiGrid kpis={kpis} variant="mobile" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Glass placement hero (non-champion)
  return (
    <HaloCard
      className={variant === 'desktop' ? 'p-9 relative overflow-hidden' : 'p-5 relative overflow-hidden'}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 0%, var(--halo-accent), transparent 65%)',
          opacity: 0.14,
        }}
      />
      <div className="relative">
        {placementText && (
          <HaloPill className="mb-3">◆ {placementText} · {getMonthYearTag(dates)}</HaloPill>
        )}
        <div
          className={variant === 'desktop' ? 'text-[40px]' : 'text-[24px]'}
          style={{
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: 'var(--halo-ink)',
          }}
        >
          {tournament.name}
        </div>
        <div
          className={variant === 'desktop' ? 'text-[13px] mt-2' : 'text-[12px] mt-1'}
          style={{ color: 'var(--halo-muted)' }}
        >
          {meta}
        </div>
        <div className="mt-4">
          <KpiGrid kpis={kpis} variant={variant} dark={false} />
        </div>
      </div>
    </HaloCard>
  );
}

function KpiGrid({ kpis, variant, dark = true }) {
  const tiles = [
    [kpis.recordStr, 'RECORD'],
    [kpis.gf, 'GF'],
    [kpis.ga, 'GA'],
    [`${kpis.gd >= 0 ? '+' : ''}${kpis.gd}`, 'GD'],
  ];

  const tileStyle = dark
    ? {
        background: 'rgba(255,255,255,0.16)',
        backdropFilter: 'blur(10px)',
      }
    : {
        background: 'var(--halo-glass-strong)',
        border: '1px solid var(--halo-glass-border)',
      };

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
    >
      {tiles.map(([v, l]) => (
        <div
          key={l}
          className="text-center py-3 px-1 rounded-xl"
          style={tileStyle}
        >
          <div
            style={{
              fontSize: variant === 'desktop' ? 22 : 17,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              color: dark ? '#fff' : 'var(--halo-ink)',
            }}
          >
            {v}
          </div>
          <div
            className="font-extrabold mt-1"
            style={{
              fontSize: 9,
              letterSpacing: '0.18em',
              opacity: dark ? 0.85 : 1,
              color: dark ? '#fff' : 'var(--halo-muted)',
            }}
          >
            {l}
          </div>
        </div>
      ))}
    </div>
  );
}

function TournamentInfoTable({ tournament }) {
  const rows = [
    ['Division', tournament.division],
    ['Format', tournament.format],
    ['Venue', tournament.location?.name],
    ['Dates', formatDates(tournament.dates)],
  ].filter(([, v]) => v);
  return (
    <HaloCard className="px-4 py-1">
      {rows.map(([k, v], i) => (
        <div
          key={k}
          className="flex justify-between items-center py-3"
          style={{
            borderBottom: i < rows.length - 1 ? '1px solid var(--halo-row-divider)' : 'none',
          }}
        >
          <div className="text-[11px]" style={{ color: 'var(--halo-muted)', letterSpacing: '0.04em' }}>
            {k}
          </div>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--halo-ink)' }}>
            {v}
          </div>
        </div>
      ))}
    </HaloCard>
  );
}

function StandingsTable({ rows, variant }) {
  if (!rows || rows.length === 0) return null;
  return (
    <HaloCard className="overflow-hidden">
      <div
        className="grid gap-2 px-4 py-2.5"
        style={{
          gridTemplateColumns:
            variant === 'desktop'
              ? '32px 1fr 36px 36px 36px 36px 50px'
              : '26px 1fr 30px 30px 30px 38px',
          background: accentTint(4),
          color: 'var(--halo-muted)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        <div>#</div>
        <div>Team</div>
        <div className="text-center">W</div>
        <div className="text-center">L</div>
        {variant === 'desktop' && <div className="text-center">GF</div>}
        {variant === 'desktop' ? <div className="text-center">GA</div> : <div className="text-center">GD</div>}
        <div className="text-right">Pts</div>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.team + i}
          className="grid gap-2 items-center px-4 py-3"
          style={{
            gridTemplateColumns:
              variant === 'desktop'
                ? '32px 1fr 36px 36px 36px 36px 50px'
                : '26px 1fr 30px 30px 30px 38px',
            borderTop: '1px solid var(--halo-row-divider)',
            background: r.isUs ? accentTint(10) : 'transparent',
          }}
        >
          <div
            className="grid place-items-center font-extrabold"
            style={{
              width: variant === 'desktop' ? 26 : 22,
              height: variant === 'desktop' ? 26 : 22,
              borderRadius: 7,
              background: i === 0 ? 'var(--halo-accent-bright)' : 'var(--halo-glass-strong)',
              color: i === 0 ? '#fff' : 'var(--halo-ink)',
              fontSize: variant === 'desktop' ? 12 : 11,
            }}
          >
            {i + 1}
          </div>
          <div>
            <div
              className="flex items-center gap-1.5"
              style={{
                fontSize: variant === 'desktop' ? 14 : 13,
                fontWeight: r.isUs ? 700 : 600,
                color: 'var(--halo-ink)',
                letterSpacing: '-0.01em',
              }}
            >
              <span className="truncate">{variant === 'desktop' ? (r.fullName || r.team) : r.team}</span>
              {r.isUs && (
                <span
                  className="text-[8px] font-extrabold px-1.5 py-0.5 rounded"
                  style={{
                    background: 'var(--halo-accent)',
                    color: '#fff',
                    letterSpacing: '0.1em',
                  }}
                >
                  US
                </span>
              )}
            </div>
            {variant === 'mobile' && r.fullName && (
              <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--halo-muted)' }}>
                {r.fullName}
              </div>
            )}
          </div>
          <div
            className="text-center font-extrabold"
            style={{
              fontSize: variant === 'desktop' ? 14 : 13,
              color: 'var(--halo-accent-bright)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {r.w}
          </div>
          <div
            className="text-center"
            style={{
              fontSize: variant === 'desktop' ? 14 : 13,
              color: 'var(--halo-muted)',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
            }}
          >
            {r.l}
          </div>
          {variant === 'desktop' ? (
            <>
              <div
                className="text-center"
                style={{
                  fontSize: 14,
                  color: 'var(--halo-ink)',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 600,
                }}
              >
                {r.gf}
              </div>
              <div
                className="text-center"
                style={{
                  fontSize: 14,
                  color: 'var(--halo-muted)',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 600,
                }}
              >
                {r.ga}
              </div>
            </>
          ) : (
            <div
              className="text-center"
              style={{
                fontSize: 13,
                color: 'var(--halo-ink)',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 600,
              }}
            >
              {r.gf - r.ga >= 0 ? '+' : ''}
              {r.gf - r.ga}
            </div>
          )}
          <div
            className="text-right font-extrabold"
            style={{
              fontSize: variant === 'desktop' ? 16 : 14,
              color: 'var(--halo-ink)',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {r.pts}
          </div>
        </div>
      ))}
    </HaloCard>
  );
}

function MatchResultsList({ games, placement, asCard = false }) {
  if (!games || games.length === 0) return null;
  return (
    <HaloCard className="px-4 py-1">
      {asCard && (
        <div
          className="text-[15px] font-bold py-3"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
        >
          Match results
        </div>
      )}
      {games.map((g, i) => {
        const round = deriveRoundLabel(g, games, placement);
        const us = g.result?.us;
        const them = g.result?.them;
        const hasResult = us != null && them != null;
        const isWin = hasResult && us > them;
        const isLoss = hasResult && us < them;
        const letter = !hasResult ? '·' : isWin ? 'W' : isLoss ? 'L' : 'D';
        return (
          <div
            key={g.id || i}
            className="py-3"
            style={{
              borderTop: i === 0 ? 'none' : '1px solid var(--halo-row-divider)',
            }}
          >
            <div className="flex items-baseline justify-between">
              <div
                className="text-[10px] font-extrabold uppercase"
                style={{ color: 'var(--halo-accent-bright)', letterSpacing: '0.16em' }}
              >
                {round}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--halo-muted)' }}>
                {g.day ? `${g.day} · ${g.time}` : g.time}
              </div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div
                className="text-[13px] font-semibold"
                style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
              >
                vs {g.opponentShort || g.opponent}
              </div>
              <div className="flex items-center gap-2">
                {hasResult ? (
                  <div
                    className="text-[16px] font-extrabold"
                    style={{
                      color: isWin
                        ? 'var(--halo-accent-bright)'
                        : isLoss
                        ? 'var(--halo-loss)'
                        : 'var(--halo-ink)',
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {us}
                    <span style={{ color: 'var(--halo-faint)', margin: '0 3px' }}>:</span>
                    {them}
                  </div>
                ) : (
                  <div className="text-[12px]" style={{ color: 'var(--halo-muted)' }}>
                    Upcoming
                  </div>
                )}
                <div
                  className="grid place-items-center font-extrabold"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    background: isWin
                      ? 'var(--halo-accent)'
                      : isLoss
                      ? 'var(--halo-loss)'
                      : 'var(--halo-faint)',
                    color: '#fff',
                    fontSize: 10,
                  }}
                >
                  {letter}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </HaloCard>
  );
}

function PathToTitle({ games, placement }) {
  return (
    <HaloCard className="p-6">
      <div
        className="text-[16px] font-bold mb-4"
        style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
      >
        Path to the title
      </div>
      <div className="relative">
        <div
          className="absolute left-3.5 top-4 bottom-3.5"
          style={{
            width: 2,
            background:
              'linear-gradient(180deg, var(--halo-accent), var(--halo-accent-bright))',
            opacity: 0.4,
          }}
        />
        {games.map((g, i) => {
          const round = deriveRoundLabel(g, games, placement);
          const us = g.result?.us;
          const them = g.result?.them;
          const hasResult = us != null && them != null;
          const isWin = hasResult && us > them;
          const isLoss = hasResult && us < them;
          return (
            <div
              key={g.id || i}
              className="relative"
              style={{ paddingLeft: 38, paddingBottom: i < games.length - 1 ? 18 : 0 }}
            >
              <div
                className="absolute grid place-items-center font-extrabold text-white"
                style={{
                  left: 4,
                  top: 6,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'var(--halo-accent)',
                  fontSize: 11,
                  border: '3px solid var(--halo-bg)',
                }}
              >
                {i + 1}
              </div>
              <div
                className="text-[10px] font-extrabold uppercase"
                style={{ color: 'var(--halo-accent-bright)', letterSpacing: '0.18em' }}
              >
                {round}
              </div>
              <div className="flex items-center justify-between mt-1">
                <div>
                  <div
                    className="text-[14px] font-semibold"
                    style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
                  >
                    vs {g.opponent}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--halo-muted)' }}>
                    {g.day} · {g.time}
                  </div>
                </div>
                {hasResult && (
                  <div
                    className="text-[22px] font-extrabold"
                    style={{
                      color: isWin
                        ? 'var(--halo-accent-bright)'
                        : isLoss
                        ? 'var(--halo-loss)'
                        : 'var(--halo-ink)',
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {us}
                    <span style={{ color: 'var(--halo-faint)', margin: '0 4px' }}>:</span>
                    {them}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </HaloCard>
  );
}

function FieldMapCard({ fieldMap, venueShort, onFieldClick }) {
  const fields = fieldMap.mercuryFields || [];
  return (
    <HaloCard className="overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 14 }}>🗺</span>
          <div className="text-[14px] font-bold" style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}>
            Field map
          </div>
        </div>
        {venueShort && (
          <div className="text-[10px]" style={{ color: 'var(--halo-muted)' }}>
            {venueShort}
          </div>
        )}
      </div>
      <div
        className="mx-5 my-2 relative rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--halo-glass-border)' }}
      >
        <Image
          src={fieldMap.imageUrl || '/images/delmar-field-map.png'}
          alt={`Field layout — Mercury plays on ${fields.join(', ')}`}
          width={2000}
          height={1545}
          className="w-full h-auto"
        />
      </div>
      {fields.length > 0 && (
        <div className="px-5 pb-4 pt-2">
          <div
            className="text-[10px] font-bold uppercase mb-2"
            style={{ color: 'var(--halo-muted)', letterSpacing: '0.18em' }}
          >
            Mercury plays on
          </div>
          <div className="flex flex-wrap gap-2">
            {fields.map((f) => (
              <button
                key={f}
                type="button"
                onClick={onFieldClick ? () => onFieldClick(f) : undefined}
                className="text-[12px] font-bold tracking-wide"
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  background: accentTint(10),
                  color: 'var(--halo-accent-bright)',
                  border: `1px solid ${accentTint(25)}`,
                  cursor: onFieldClick ? 'pointer' : 'default',
                }}
              >
                Field {f}
              </button>
            ))}
          </div>
        </div>
      )}
    </HaloCard>
  );
}

function LocationCard({ tournament, variant }) {
  const loc = tournament.location || {};
  const eventInfo = tournament.eventInfo;
  const height = variant === 'desktop' ? 200 : 140;
  return (
    <HaloCard className="overflow-hidden">
      <div className="relative" style={{ height }}>
        {loc.embedUrl ? (
          <iframe
            src={loc.embedUrl}
            width="100%"
            height={height}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${loc.name || 'Venue'} map`}
            style={{ border: 0, display: 'block', width: '100%' }}
          />
        ) : (
          <div
            style={{
              height,
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--halo-accent) 14%, var(--halo-bg-2)) 0%, var(--halo-bg-2) 100%)',
            }}
          />
        )}
        <div
          className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider text-white"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
        >
          <MapPin className="w-3 h-3" style={{ color: 'var(--halo-accent-bright)' }} />
          VENUE
        </div>
      </div>
      <div className="p-5">
        <div
          className="text-[16px] font-bold"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
        >
          {loc.name || 'Venue TBD'}
        </div>
        {loc.address && (
          <div className="text-[12px] mt-1" style={{ color: 'var(--halo-muted)' }}>
            {loc.address}
          </div>
        )}
        {loc.note && (
          <Callout
            variant="danger"
            label="IMPORTANT"
            body={loc.note}
            icon={<AlertTriangle className="w-4 h-4" />}
            className="mt-4"
          />
        )}
        {loc.parking && (
          <Callout
            variant="muted"
            label="Parking · Free"
            body={loc.parking}
            icon={<span style={{ fontSize: 14 }}>🅿️</span>}
            className="mt-2"
          />
        )}
        {eventInfo?.bathrooms && (
          <Callout
            variant="muted"
            label="Bathrooms"
            body={eventInfo.bathrooms}
            icon={<span style={{ fontSize: 14 }}>🚻</span>}
            className="mt-2"
          />
        )}
        {loc.googleMapsUrl && (
          <a
            href={loc.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 text-white font-bold"
            style={{
              background: ctaGradient,
              boxShadow: '0 8px 20px rgba(0,132,61,0.3)',
              borderRadius: 14,
              padding: '12px 14px',
              fontSize: 13,
              letterSpacing: '0.04em',
            }}
          >
            <Navigation className="w-4 h-4" />
            GET DIRECTIONS →
          </a>
        )}
      </div>
    </HaloCard>
  );
}

function Callout({ variant = 'muted', label, body, icon, className = '' }) {
  const isDanger = variant === 'danger';
  const bg = isDanger
    ? 'color-mix(in srgb, var(--halo-loss) 8%, transparent)'
    : 'var(--halo-glass-strong)';
  const border = isDanger
    ? 'color-mix(in srgb, var(--halo-loss) 30%, transparent)'
    : 'var(--halo-glass-border)';
  const labelColor = isDanger ? 'var(--halo-loss)' : 'var(--halo-ink)';
  return (
    <div
      className={'flex gap-3 items-start px-3.5 py-3 rounded-xl ' + className}
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="shrink-0 mt-0.5" style={{ color: isDanger ? 'var(--halo-loss)' : 'var(--halo-accent-bright)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div
          className="text-[10px] font-extrabold uppercase"
          style={{ color: labelColor, letterSpacing: '0.15em' }}
        >
          {label}
        </div>
        <div
          className="text-[12px] mt-1"
          style={{ color: 'var(--halo-ink)', lineHeight: 1.5 }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

function EventDayInfoCard({ eventInfo }) {
  const photographer = eventInfo.photographer;
  return (
    <HaloCard className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 14 }}>⚠️</span>
        <div className="text-[14px] font-bold" style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}>
          Event day info
        </div>
      </div>

      {eventInfo.checkIn?.description && (
        <Callout
          variant="danger"
          label="CHECK-IN"
          body={eventInfo.checkIn.description}
          icon={<AlertTriangle className="w-4 h-4" />}
          className="mb-2"
        />
      )}

      {photographer && (
        <div
          className="rounded-xl px-3.5 py-3 mb-2"
          style={{
            background: 'var(--halo-glass-strong)',
            border: '1px solid var(--halo-glass-border)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 grid place-items-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: accentTint(10),
                color: 'var(--halo-accent-bright)',
              }}
            >
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-[13px] font-bold"
                style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
              >
                {photographer.name}
              </div>
              {photographer.description && (
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--halo-muted)' }}>
                  {photographer.description}
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3">
                {photographer.email && (
                  <PhotographerLink href={`mailto:${photographer.email}`} icon={<Mail className="w-3.5 h-3.5" />} label="Email" />
                )}
                {photographer.phone && (
                  <PhotographerLink href={`tel:${photographer.phone}`} icon={<Phone className="w-3.5 h-3.5" />} label="Text" />
                )}
                {photographer.website && (
                  <PhotographerLink href={photographer.website} icon={<Globe className="w-3.5 h-3.5" />} label="Site" />
                )}
                {photographer.instagram && (
                  <PhotographerLink href={photographer.instagram} icon={<Instagram className="w-3.5 h-3.5" />} label="IG" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {eventInfo.restrictions && eventInfo.restrictions.length > 0 && (
        <div
          className="rounded-xl px-3.5 py-3"
          style={{
            background: 'color-mix(in srgb, var(--halo-loss) 4%, transparent)',
            border: '1px solid color-mix(in srgb, var(--halo-loss) 20%, transparent)',
          }}
        >
          <div
            className="text-[10px] font-extrabold uppercase"
            style={{ color: 'var(--halo-loss)', letterSpacing: '0.15em' }}
          >
            ⊘ Restrictions
          </div>
          {eventInfo.restrictions.map((r, i) => (
            <div
              key={i}
              className="text-[12px] mt-1.5 flex gap-1.5"
              style={{ color: 'var(--halo-ink)' }}
            >
              <span style={{ color: 'var(--halo-loss)' }}>•</span>
              {r}
            </div>
          ))}
        </div>
      )}
    </HaloCard>
  );
}

function PhotographerLink({ href, icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-center py-2 rounded-lg flex flex-col items-center gap-1 transition-opacity hover:opacity-80"
      style={{
        background: 'var(--halo-glass-strong)',
        border: '1px solid var(--halo-glass-border)',
        color: 'var(--halo-ink)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      <span style={{ color: 'var(--halo-accent-bright)' }}>{icon}</span>
      {label}
    </a>
  );
}

function RulesTeaser({ rules }) {
  const [open, setOpen] = useState(false);
  const samples = ['Halftime length?', 'OT in finals?', 'Subs allowed?'];
  return (
    <HaloCard className="p-5 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 100% 0%, var(--halo-accent), transparent 60%)',
          opacity: 0.16,
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: 14 }}>📖</span>
          <div className="text-[14px] font-bold" style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}>
            Tournament rules
          </div>
          <span
            className="ml-auto text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full text-white"
            style={{ background: 'var(--halo-accent)', letterSpacing: '0.15em' }}
          >
            AI · BETA
          </span>
        </div>
        <div className="text-[12px] mb-3" style={{ color: 'var(--halo-muted)', lineHeight: 1.5 }}>
          Ask anything about format, overtime, sub rules, weather policies — answers cite the official rulebook.
        </div>
        {!open && (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {samples.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setOpen(true)}
                  className="text-[11px] font-medium px-2.5 py-1.5 rounded-full"
                  style={{
                    background: 'var(--halo-glass-strong)',
                    border: '1px solid var(--halo-glass-border)',
                    color: 'var(--halo-ink)',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-full text-[13px] font-bold flex items-center justify-center gap-2 rounded-xl"
              style={{
                background: 'var(--halo-ink)',
                color: 'var(--halo-bg)',
                padding: '12px',
              }}
            >
              💬 Ask the rulebook
            </button>
          </>
        )}
        {open && (
          <div className="mt-2">
            <RulesChat rules={rules} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 text-[11px] font-semibold tracking-wider hover:opacity-80"
              style={{ color: 'var(--halo-muted)' }}
            >
              Close chat
            </button>
          </div>
        )}
      </div>
    </HaloCard>
  );
}

function QuickLinksTournament({ tournament, layout = 'stack' }) {
  const items = [
    {
      icon: '🏆',
      label: 'League Standings',
      caption: 'GotSport',
      href: teamInfo.links.gotsportStandings,
      tone: 'accent',
    },
    tournament.photoAlbumUrl && {
      icon: '📸',
      label: 'Tournament Photos',
      caption: tournament.season || formatDates(tournament.dates),
      href: tournament.photoAlbumUrl,
      tone: 'amber',
    },
  ].filter(Boolean);
  if (items.length === 0) return null;
  const cols = layout === 'grid' ? 'md:grid-cols-2' : '';
  return (
    <div className={`grid gap-2.5 ${cols}`}>
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          className="halo-glass rounded-2xl px-4 py-3.5 flex items-center gap-3.5 hover:opacity-90 transition-opacity"
        >
          <div
            className="grid place-items-center shrink-0"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background:
                it.tone === 'amber' ? 'rgba(255,193,7,0.18)' : accentTint(10),
              color:
                it.tone === 'amber'
                  ? 'var(--halo-amber-ink)'
                  : 'var(--halo-accent-bright)',
              border: '1px solid var(--halo-glass-border)',
              fontSize: 18,
            }}
          >
            {it.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold truncate" style={{ color: 'var(--halo-ink)' }}>
              {it.label}
            </div>
            <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--halo-muted)' }}>
              {it.caption}
            </div>
          </div>
          <ExternalLink className="w-4 h-4" style={{ color: 'var(--halo-muted)' }} />
        </a>
      ))}
    </div>
  );
}
