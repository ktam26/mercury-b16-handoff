'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ExternalLink, Navigation, Play } from 'lucide-react';
import {
  formatGameDate,
  formatGameDateLong,
  getArrivalTime,
  getShortTeamName,
  getOpponentLogo,
  getOurLogo,
  isScrimmage,
  getFormDisplay,
} from '@/lib/game-utils';
import { buildHighlights } from '@/lib/tournament-utils';
import teamInfo from '@/data/team-info.json';
import { HaloPage, HaloCard, HaloPill, HaloSectionLabel } from './HaloShell';

const PLACEHOLDER_LOGO = '/images/logos/mercury-b16.png';

const accentTint = (pct) =>
  `color-mix(in srgb, var(--halo-accent) ${pct}%, transparent)`;

const ctaGradient = 'linear-gradient(135deg, var(--halo-accent) 0%, #0aa352 100%)';

function deriveRecordStr({ w, l, t }) {
  if (t) return `${w}W·${l}L·${t}D`;
  return `${w}W·${l}L`;
}

function deriveCompetitionLabel(game) {
  if (isScrimmage(game)) return 'Scrimmage';
  if (game.matchNumber) return `League · MN ${game.matchNumber}`;
  return 'League';
}

function deriveFormat(game) {
  if (game.format) return game.format;
  return '7v7 · 25-min halves';
}

function describeKit(game) {
  if (!game.jersey && !game.socks) return null;
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const jersey = cap(game.jersey);
  const socks = cap(game.socks);
  if (jersey && socks) {
    return jersey === socks
      ? `${jersey} kit · ${socks} socks`
      : `${jersey} kit · ${socks} socks`;
  }
  return jersey || socks;
}

export default function HaloGame({ game, currentRecord }) {
  const isPast = !!game.result;
  const result = game.result;
  const isWin = isPast && result.us > result.them;
  const isLoss = isPast && result.us < result.them;
  const isDraw = isPast && result.us === result.them;
  const opponentLogo = getOpponentLogo(game) || PLACEHOLDER_LOGO;
  const mercuryLogo = getOurLogo(game) || PLACEHOLDER_LOGO;
  const opponentShort = getShortTeamName(game.opponent);
  const arriveBy = !isPast ? getArrivalTime(game.time) : null;
  const oppFormDisplay = getFormDisplay(game.opponentRecentResults);
  const merFormDisplay = getFormDisplay(game.mercuryRecentResults);
  const highlights = isPast ? buildHighlights(result) : [];
  const kit = describeKit(game);
  const competition = deriveCompetitionLabel(game);
  const format = deriveFormat(game);

  return (
    <HaloPage>
      {/* MOBILE */}
      <div className="md:hidden max-w-3xl mx-auto px-4 pt-4 pb-28">
        <BackLink className="mb-3" />
        <GameHero
          game={game}
          isPast={isPast}
          result={result}
          isWin={isWin}
          isLoss={isLoss}
          isDraw={isDraw}
          opponentLogo={opponentLogo}
          mercuryLogo={mercuryLogo}
          opponentShort={opponentShort}
          mercuryRecordLabel={
            currentRecord ? deriveRecordStr({ w: currentRecord.wins, l: currentRecord.losses, t: currentRecord.ties }) : null
          }
          oppForm={oppFormDisplay.form}
          merForm={merFormDisplay.form}
          variant="mobile"
          kit={kit}
        />

        {!isPast && arriveBy && (
          <div className="mt-3">
            <ArriveByCard arriveBy={arriveBy} />
          </div>
        )}

        {game.location?.googleMapsUrl && (
          <div className="mt-3">
            <DirectionsButton
              href={game.location.googleMapsUrl}
              label={game.location.field ? `Directions to ${game.location.field}` : 'Get directions'}
            />
          </div>
        )}

        <div className="mt-5">
          <HaloSectionLabel>Venue</HaloSectionLabel>
          <VenueCard game={game} variant="mobile" />
        </div>

        <div className="mt-5">
          <HaloSectionLabel>Match info</HaloSectionLabel>
          <MatchInfoTable game={game} competition={competition} format={format} kit={kit} />
        </div>

        {isPast && highlights.length > 0 && (
          <div className="mt-5">
            <HaloSectionLabel>{game.videoUrl ? 'Game film' : 'Goal highlights'}</HaloSectionLabel>
            <GameFootageCard videoUrl={game.videoUrl} highlights={highlights} />
          </div>
        )}

        {!isPast && game.opponentRecentResults?.length > 0 && (
          <div className="mt-5">
            <HaloSectionLabel>Scouting · {opponentShort}</HaloSectionLabel>
            <ScoutingCard oppShort={opponentShort} oppForm={oppFormDisplay.form} oppRecent={oppFormDisplay.results} />
          </div>
        )}

        <div className="mt-5">
          <QuickLinks game={game} layout="stack" />
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block max-w-6xl mx-auto px-9 pt-6 pb-16">
        <BackLink className="mb-4" />
        <GameHero
          game={game}
          isPast={isPast}
          result={result}
          isWin={isWin}
          isLoss={isLoss}
          isDraw={isDraw}
          opponentLogo={opponentLogo}
          mercuryLogo={mercuryLogo}
          opponentShort={opponentShort}
          mercuryRecordLabel={
            currentRecord ? deriveRecordStr({ w: currentRecord.wins, l: currentRecord.losses, t: currentRecord.ties }) : null
          }
          oppForm={oppFormDisplay.form}
          merForm={merFormDisplay.form}
          variant="desktop"
          kit={kit}
          arriveBy={arriveBy}
        />

        {(() => {
          const showFootage = isPast && highlights.length > 0;
          const showScouting = game.opponentRecentResults?.length > 0;
          // Pick a third trio column: Footage (past) > Scouting > nothing.
          const trioThird = showFootage
            ? 'footage'
            : showScouting
            ? 'scouting'
            : null;
          return (
            <>
              <div
                className="grid gap-4 mt-4"
                style={{ gridTemplateColumns: trioThird ? '1.1fr 1fr 1fr' : '1.2fr 1fr' }}
              >
                <VenueCard game={game} variant="desktop" />
                <MatchInfoTable
                  game={game}
                  competition={competition}
                  format={format}
                  kit={kit}
                  asCard
                />
                {trioThird === 'footage' && (
                  <GameFootageCard videoUrl={game.videoUrl} highlights={highlights} compact />
                )}
                {trioThird === 'scouting' && (
                  <ScoutingCard
                    oppShort={opponentShort}
                    oppForm={oppFormDisplay.form}
                    oppRecent={oppFormDisplay.results}
                    compact
                  />
                )}
              </div>

              {/* If footage took the trio slot, scouting goes below alongside Quick Links. */}
              {trioThird === 'footage' && showScouting && (
                <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
                  <ScoutingCard
                    oppShort={opponentShort}
                    oppForm={oppFormDisplay.form}
                    oppRecent={oppFormDisplay.results}
                  />
                  <QuickLinks game={game} layout="stack" />
                </div>
              )}

              {/* Otherwise, Quick Links goes full-width grid below. */}
              {!(trioThird === 'footage' && showScouting) && (
                <div className="mt-4">
                  <QuickLinks game={game} layout="grid" />
                </div>
              )}
            </>
          );
        })()}
      </div>
    </HaloPage>
  );
}

/* ─────────────────────────  pieces  ───────────────────────── */

function BackLink({ className = '' }) {
  return (
    <Link
      href="/schedule"
      className={
        'inline-flex items-center gap-1 text-[12px] font-semibold tracking-wider hover:opacity-80 ' +
        className
      }
      style={{ color: 'var(--halo-muted)' }}
    >
      <ChevronLeft className="w-4 h-4" />
      Back to schedule
    </Link>
  );
}

function GameHero({
  game,
  isPast,
  result,
  isWin,
  isLoss,
  isDraw,
  opponentLogo,
  mercuryLogo,
  opponentShort,
  mercuryRecordLabel,
  oppForm,
  merForm,
  variant,
  kit,
  arriveBy,
}) {
  const datePill = isPast ? 'Final' : formatGameDateLong(game.date) + ' · ' + game.time;
  const middle = isPast ? (
    <ScoreDisplay
      result={result}
      isWin={isWin}
      isLoss={isLoss}
      isDraw={isDraw}
      large={variant === 'desktop'}
    />
  ) : (
    <div
      className={variant === 'desktop' ? 'text-[56px]' : 'text-[40px]'}
      style={{
        fontWeight: 700,
        letterSpacing: '-0.05em',
        lineHeight: 1,
        color: 'var(--halo-accent-bright)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      VS
    </div>
  );

  if (variant === 'desktop') {
    return (
      <HaloCard className="p-9 relative overflow-hidden">
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
          <SideBlock
            logo={mercuryLogo}
            alt="Mercury"
            name="Mercury Black"
            sub={mercuryRecordLabel}
            extra={merForm ? `Form: ${formatForm(merForm)}` : null}
            align="left"
            size={84}
          />
          <div className="text-center">
            <HaloPill tone={isPast ? (isWin ? 'accent' : 'default') : 'accent'} className="mb-3">
              {!isPast && <span className="w-1.5 h-1.5 rounded-full bg-white halo-pulse" />}
              {datePill}
            </HaloPill>
            {middle}
            <div
              className="mt-3 text-[12px] font-semibold"
              style={{ color: 'var(--halo-muted)', letterSpacing: '0.06em' }}
            >
              {[
                competitionForHero(game),
                game.location?.field ? `Field ${game.location.field}` : null,
                kit ? `Kit · ${kit.split('·')[0].trim()}` : null,
                arriveBy ? `Arrive by ${arriveBy}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
          <SideBlock
            logo={opponentLogo}
            alt={opponentShort}
            name={opponentShort}
            sub={game.homeAway === 'home' ? 'Away' : 'Home'}
            extra={oppForm ? `Form: ${formatForm(oppForm)}` : null}
            align="right"
            size={84}
          />
        </div>
      </HaloCard>
    );
  }

  // Mobile
  return (
    <HaloCard className="p-5 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 0%, var(--halo-accent), transparent 70%)',
          opacity: 0.16,
        }}
      />
      <div className="relative text-center">
        <HaloPill tone={isPast ? (isWin ? 'accent' : 'default') : 'accent'}>
          {!isPast && <span className="w-1.5 h-1.5 rounded-full bg-white halo-pulse" />}
          {datePill}
        </HaloPill>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mt-5">
          <MobileSide
            logo={mercuryLogo}
            name="Mercury"
            sub={mercuryRecordLabel}
          />
          {middle}
          <MobileSide
            logo={opponentLogo}
            name={opponentShort}
            sub={oppForm ? formatForm(oppForm) : (game.homeAway === 'home' ? 'Away' : 'Home')}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 mt-4">
          {game.location?.field && <HaloPill>📍 Field {game.location.field}</HaloPill>}
          {kit && <HaloPill>👕 {kit.split('·')[0].trim()}</HaloPill>}
          <HaloPill>{game.homeAway === 'home' ? '🏠 Home' : '✈️ Away'}</HaloPill>
        </div>
      </div>
    </HaloCard>
  );
}

function competitionForHero(game) {
  if (isScrimmage(game)) return 'Scrimmage';
  return 'League';
}

function formatForm(form) {
  return form.split('').join(' ');
}

function MobileSide({ logo, name, sub }) {
  return (
    <div className="text-center min-w-0">
      <div className="relative w-14 h-14 mx-auto rounded-full halo-glass-strong overflow-hidden">
        <Image src={logo} alt={name} fill sizes="56px" className="object-contain p-1" />
      </div>
      <div
        className="text-[14px] font-bold mt-2 truncate"
        style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
      >
        {name}
      </div>
      {sub && (
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--halo-muted)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function SideBlock({ logo, alt, name, sub, extra, align, size = 64 }) {
  const isLeft = align === 'left';
  return (
    <div
      className="flex items-center gap-4"
      style={{ flexDirection: isLeft ? 'row' : 'row-reverse' }}
    >
      <div
        className="relative rounded-full halo-glass-strong overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        <Image src={logo} alt={alt} fill sizes={`${size}px`} className="object-contain p-2" />
      </div>
      <div style={{ textAlign: isLeft ? 'left' : 'right' }}>
        <div
          className="text-[24px] font-bold leading-none"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
        >
          {name}
        </div>
        {sub && (
          <div className="text-[12px] mt-1.5" style={{ color: 'var(--halo-muted)' }}>
            {sub}
          </div>
        )}
        {extra && (
          <div className="text-[11px] mt-1" style={{ color: 'var(--halo-muted)' }}>
            {extra}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreDisplay({ result, isWin, isLoss, isDraw, large }) {
  const color = isWin
    ? 'var(--halo-accent-bright)'
    : isLoss
    ? 'var(--halo-loss)'
    : 'var(--halo-muted)';
  const size = large ? 56 : 40;
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 800,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {result.us}
      <span style={{ color: 'var(--halo-faint)', margin: '0 6px' }}>:</span>
      {result.them}
    </div>
  );
}

function ArriveByCard({ arriveBy }) {
  return (
    <div
      className="rounded-2xl px-4 py-3.5"
      style={{
        background: 'rgba(255,193,7,0.18)',
        border: '1px solid rgba(255,193,7,0.4)',
      }}
    >
      <div
        className="text-[10px] font-bold uppercase"
        style={{ color: 'var(--halo-amber-ink)', letterSpacing: '0.14em' }}
      >
        ⏰ Arrive by
      </div>
      <div
        className="text-[24px] font-bold mt-1"
        style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
      >
        {arriveBy}
      </div>
      <div className="text-[11px]" style={{ color: 'var(--halo-muted)' }}>
        30 min before kickoff
      </div>
    </div>
  );
}

function DirectionsButton({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full text-center font-bold text-white"
      style={{
        background: ctaGradient,
        boxShadow: '0 10px 24px rgba(0,132,61,0.30)',
        borderRadius: 18,
        padding: '14px 16px',
        fontSize: 14,
        letterSpacing: '0.04em',
      }}
    >
      <Navigation className="inline w-4 h-4 mr-1.5 -mt-0.5" />
      {label} →
    </a>
  );
}

function VenueCard({ game, variant, asCard = true }) {
  const loc = game.location || {};
  const showMap = !!loc.embedUrl;
  const height = variant === 'desktop' ? 200 : 160;
  return (
    <HaloCard className="overflow-hidden">
      {showMap && (
        <div className="relative" style={{ height }}>
          <iframe
            src={loc.embedUrl}
            width="100%"
            height={height}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${loc.name || 'Venue'} map`}
            style={{ border: 0, display: 'block', width: '100%' }}
          />
        </div>
      )}
      <div className="p-4">
        <div
          className="text-[15px] font-bold"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
        >
          {loc.field ? `Field ${loc.field} · ` : ''}
          {loc.name || 'Venue TBD'}
        </div>
        {loc.address && (
          <div className="text-[12px] mt-1" style={{ color: 'var(--halo-muted)' }}>
            {loc.address}
          </div>
        )}
        {variant === 'desktop' && loc.googleMapsUrl && (
          <a
            href={loc.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 text-white font-bold"
            style={{
              background: ctaGradient,
              boxShadow: '0 6px 18px rgba(0,132,61,0.28)',
              borderRadius: 14,
              padding: '11px 14px',
              fontSize: 13,
            }}
          >
            <Navigation className="w-4 h-4" />
            Open in Maps →
          </a>
        )}
      </div>
    </HaloCard>
  );
}

function MatchInfoTable({ game, competition, format, kit, asCard = false }) {
  const rows = [
    ['Competition', competition],
    ['Format', format],
    ['Home/Away', game.homeAway === 'home' ? 'Home' : 'Away'],
    kit ? ['Kit', kit] : null,
  ].filter(Boolean);

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
          <div
            className="text-[11px]"
            style={{ color: 'var(--halo-muted)', letterSpacing: '0.04em' }}
          >
            {k}
          </div>
          <div
            className="text-[13px] font-semibold text-right max-w-[65%]"
            style={{ color: 'var(--halo-ink)' }}
          >
            {v}
          </div>
        </div>
      ))}
    </HaloCard>
  );
}

function GameFootageCard({ videoUrl, highlights, compact = false }) {
  return (
    <HaloCard className={compact ? 'p-4' : 'p-5'}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 14 }}>{videoUrl ? '🎬' : '⚽'}</span>
        <div className="text-[14px] font-bold" style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}>
          {videoUrl ? 'Game film' : 'Goal highlights'}
        </div>
      </div>
      {videoUrl && (
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full text-white font-bold"
          style={{
            background: ctaGradient,
            boxShadow: '0 8px 20px rgba(0,132,61,0.3)',
            borderRadius: 14,
            padding: '12px 14px',
            fontSize: 13,
            letterSpacing: '0.05em',
          }}
        >
          <Play className="w-4 h-4" fill="currentColor" />
          WATCH FULL MATCH
        </a>
      )}
      {highlights.length > 0 && (
        <>
          {videoUrl && (
            <div
              className="text-[10px] font-bold uppercase mt-4 mb-2"
              style={{ color: 'var(--halo-muted)', letterSpacing: '0.16em' }}
            >
              Goal highlights
            </div>
          )}
          <div className="grid gap-1.5">
            {highlights.map((h, i) => (
              <HighlightRow key={i} highlight={h} videoUrl={videoUrl} />
            ))}
          </div>
        </>
      )}
    </HaloCard>
  );
}

function HighlightRow({ highlight: h, videoUrl }) {
  const clickable = videoUrl && h.videoTimestamp != null;
  const inner = (
    <>
      <Play
        className="w-3 h-3"
        fill="currentColor"
        style={{ color: 'var(--halo-accent-bright)' }}
      />
      <div
        className="text-center font-extrabold text-[11px] py-0.5 rounded"
        style={{
          background: accentTint(10),
          color: 'var(--halo-accent-bright)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {h.min != null ? `${h.min}'` : '—'}
      </div>
      {h.fk ? (
        <span
          className="text-[9px] font-extrabold px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(255,193,7,0.2)',
            color: 'var(--halo-amber-ink)',
            letterSpacing: '0.1em',
          }}
        >
          FK
        </span>
      ) : (
        <span />
      )}
      <div className="text-[13px] font-semibold" style={{ color: 'var(--halo-ink)' }}>
        {h.scorer}
        {h.assist && (
          <span className="font-normal ml-1" style={{ color: 'var(--halo-muted)' }}>
            · ast. {h.assist}
          </span>
        )}
      </div>
    </>
  );

  const sharedStyle = {
    gridTemplateColumns: '20px 36px auto 1fr',
    background: 'var(--halo-glass-strong)',
    border: '1px solid var(--halo-glass-border)',
  };

  if (clickable) {
    return (
      <a
        href={`${videoUrl}&t=${h.videoTimestamp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="grid items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:opacity-90"
        style={{
          ...sharedStyle,
          borderColor: 'var(--halo-glass-border)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--halo-accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--halo-glass-border)';
        }}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className="grid items-center gap-2 px-3 py-2 rounded-lg" style={sharedStyle}>
      {inner}
    </div>
  );
}

function ScoutingCard({ oppShort, oppForm, oppRecent, compact = false }) {
  return (
    <HaloCard className={compact ? 'p-4' : 'p-5'}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 14 }}>🔭</span>
        <div className="text-[14px] font-bold" style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}>
          Scouting · {oppShort}
        </div>
      </div>

      {oppForm && (
        <div
          className="rounded-xl px-3 py-2.5 mb-3"
          style={{
            background: 'var(--halo-glass-strong)',
            border: '1px solid var(--halo-glass-border)',
          }}
        >
          <div
            className="text-[10px] font-bold uppercase mb-2"
            style={{ color: 'var(--halo-muted)', letterSpacing: '0.16em' }}
          >
            Opponent form · last {oppForm.length}
          </div>
          <div className="flex gap-1.5">
            {oppForm.split('').map((r, i) => (
              <FormBadge key={i} result={r} />
            ))}
          </div>
        </div>
      )}

      {oppRecent && oppRecent.length > 0 && (
        <>
          <div
            className="text-[10px] font-bold uppercase mb-1"
            style={{ color: 'var(--halo-muted)', letterSpacing: '0.16em' }}
          >
            Their last {oppRecent.length} matches
          </div>
          <div>
            {oppRecent.map((m, i) => (
              <div
                key={i}
                className="grid items-center gap-2 py-2"
                style={{
                  gridTemplateColumns: '60px 1fr auto 22px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--halo-row-divider)',
                }}
              >
                <div
                  className="text-[10px] font-semibold"
                  style={{ color: 'var(--halo-muted)' }}
                >
                  {m.date}
                </div>
                <div
                  className="text-[12px] font-semibold truncate"
                  style={{ color: 'var(--halo-ink)' }}
                >
                  vs {m.opponent || m.opp}
                </div>
                <div
                  className="text-[12px] font-extrabold"
                  style={{
                    color: 'var(--halo-ink)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.score || `${m.us}:${m.them}`}
                </div>
                <FormBadge result={m.result} small />
              </div>
            ))}
          </div>
        </>
      )}
    </HaloCard>
  );
}

function FormBadge({ result, small = false }) {
  const upper = (result || '').toUpperCase();
  const bg =
    upper === 'W'
      ? 'var(--halo-accent-bright)'
      : upper === 'L'
      ? 'var(--halo-loss)'
      : 'var(--halo-faint)';
  const size = small ? 22 : 26;
  return (
    <div
      className="grid place-items-center font-extrabold text-white"
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        background: bg,
        fontSize: small ? 10 : 11,
      }}
    >
      {upper}
    </div>
  );
}

function QuickLinks({ game, layout = 'stack' }) {
  const items = [
    game.weatherUrl && {
      icon: '☀️',
      label: 'Weather Forecast',
      caption: 'Hourly forecast',
      href: game.weatherUrl,
      tone: 'amber',
    },
    game.gotsportUrl && {
      icon: '📊',
      label: 'GotSport Game',
      caption: 'Match details',
      href: game.gotsportUrl,
      tone: 'accent',
    },
    {
      icon: '🏆',
      label: 'League Standings',
      caption: 'GotSport',
      href: teamInfo.links.gotsportStandings,
      tone: 'accent',
    },
    game.photoAlbumUrl && {
      icon: '📸',
      label: 'Team Photos',
      caption: 'Spring 2026',
      href: game.photoAlbumUrl,
      tone: 'amber',
    },
  ].filter(Boolean);

  if (items.length === 0) return null;

  const cols = layout === 'grid' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1';

  return (
    <div className={`grid gap-2.5 ${cols}`}>
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          className="halo-glass rounded-2xl px-4 py-3.5 flex items-center gap-3.5 transition-colors hover:opacity-90"
        >
          <div
            className="grid place-items-center shrink-0"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background:
                it.tone === 'amber'
                  ? 'rgba(255,193,7,0.18)'
                  : accentTint(10),
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
            <div
              className="text-[14px] font-bold truncate"
              style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
            >
              {it.label}
            </div>
            <div
              className="text-[11px] mt-0.5"
              style={{ color: 'var(--halo-muted)' }}
            >
              {it.caption}
            </div>
          </div>
          <ExternalLink className="w-4 h-4" style={{ color: 'var(--halo-muted)' }} />
        </a>
      ))}
    </div>
  );
}
