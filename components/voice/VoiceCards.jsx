'use client';

import { motion } from 'framer-motion';

const cardAnimation = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.35, type: 'spring', damping: 20, stiffness: 300 },
};

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const COL_HEAD =
  'text-[10px] font-mono uppercase tracking-[0.14em] font-semibold';
const ROW_BASE =
  'flex items-center gap-2.5 px-2.5 py-2 rounded-xl';
const ROW_TXT = 'text-[13px]';
const FAINT_STYLE = { color: 'var(--halo-faint)' };
const MUTED_STYLE = { color: 'var(--halo-muted)' };
const INK_STYLE = { color: 'var(--halo-ink)' };
const ACCENT_STYLE = { color: 'var(--halo-accent-bright)' };

const CHIP_BG =
  'color-mix(in srgb, var(--halo-accent) 12%, transparent)';
const CHIP_BORDER =
  'color-mix(in srgb, var(--halo-accent) 28%, transparent)';
const HEADER_WASH =
  'linear-gradient(180deg, color-mix(in srgb, var(--halo-accent) 7%, transparent), color-mix(in srgb, var(--halo-accent) 0%, transparent))';
const ROW_STRIPE = 'var(--halo-glass)';

function CardShell({ icon, label, sub, footer, scrollHeight, children }) {
  return (
    <motion.div
      {...cardAnimation}
      className="rounded-3xl overflow-hidden backdrop-blur-xl"
      style={{
        background: 'var(--halo-glass-strong)',
        border: '1px solid var(--halo-glass-border)',
        boxShadow: 'var(--halo-shadow-glass)',
        color: 'var(--halo-ink)',
      }}
    >
      {/* Header band */}
      <div
        className="flex items-center gap-2.5 px-4 pt-3.5 pb-3"
        style={{
          background: HEADER_WASH,
          borderBottom: '1px solid var(--halo-row-divider)',
        }}
      >
        {icon && (
          <div
            className="w-6 h-6 rounded-lg grid place-items-center text-[13px] shrink-0"
            style={{
              background: CHIP_BG,
              border: `1px solid ${CHIP_BORDER}`,
              color: 'var(--halo-accent-bright)',
            }}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div
            className="text-[11px] font-mono font-semibold uppercase tracking-[0.12em]"
            style={MUTED_STYLE}
          >
            {label}
          </div>
          {sub && (
            <div
              className="mt-0.5 text-[13px] font-semibold truncate"
              style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
            >
              {sub}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        className="px-3 py-2.5"
        style={
          scrollHeight
            ? { maxHeight: scrollHeight, overflowY: 'auto' }
            : undefined
        }
      >
        {children}
      </div>

      {footer && (
        <div
          className="px-4 py-2.5 text-[11px] font-mono tracking-[0.04em] flex items-center gap-2"
          style={{
            color: 'var(--halo-muted)',
            borderTop: '1px solid var(--halo-row-divider)',
          }}
        >
          {footer}
        </div>
      )}
    </motion.div>
  );
}

function ColHead({ children, w, align = 'right', className = '' }) {
  return (
    <div
      className={`${COL_HEAD} ${className}`}
      style={{
        width: w,
        flex: w ? '0 0 auto' : 1,
        textAlign: align,
        color: 'var(--halo-faint)',
      }}
    >
      {children}
    </div>
  );
}

function Avatar({ num, name }) {
  return (
    <div
      className="w-[30px] h-[30px] rounded-full grid place-items-center font-mono text-[12px] font-extrabold shrink-0"
      style={{
        background: CHIP_BG,
        border: `1px solid ${CHIP_BORDER}`,
        color: 'var(--halo-accent-bright)',
      }}
    >
      {num != null ? num : (name?.[0] || '?')}
    </div>
  );
}

function MiniBar({ value, max }) {
  const pct = Math.max(2, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div
      className="flex-1 h-[5px] rounded overflow-hidden"
      style={{ background: ROW_STRIPE }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: 'var(--halo-accent-bright)',
          borderRadius: 4,
        }}
      />
    </div>
  );
}

function ResultPill({ result }) {
  const map = {
    W: {
      bg: 'color-mix(in srgb, var(--halo-accent) 16%, transparent)',
      fg: 'var(--halo-accent-bright)',
    },
    L: {
      bg: 'color-mix(in srgb, var(--halo-loss) 16%, transparent)',
      fg: 'var(--halo-loss)',
    },
    D: {
      bg: 'color-mix(in srgb, var(--halo-amber) 22%, transparent)',
      fg: 'var(--halo-amber-ink)',
    },
  }[result] || { bg: ROW_STRIPE, fg: 'var(--halo-muted)' };
  return (
    <span
      className="inline-grid place-items-center w-[22px] h-[22px] rounded-md font-mono text-[11px] font-extrabold"
      style={{ background: map.bg, color: map.fg, letterSpacing: '0.04em' }}
    >
      {result}
    </span>
  );
}

function rowStyle(i) {
  return {
    background: i % 2 === 0 ? ROW_STRIPE : 'transparent',
  };
}

function ScheduleCard({ card }) {
  const completed = card.completed || [];
  const upcoming = card.upcoming || [];
  const wins = completed.filter((g) => g.outcome === 'W').length;
  const draws = completed.filter((g) => g.outcome === 'D').length;
  const losses = completed.filter((g) => g.outcome === 'L').length;
  const sub = `${wins}W · ${draws}D · ${losses}L · ${upcoming.length} upcoming`;

  return (
    <CardShell
      icon="📅"
      label="Schedule"
      sub={sub}
      scrollHeight={420}
      footer="Verify dates and times against the official schedule"
    >
      {completed.length > 0 && (
        <>
          <div
            className="px-2.5 pt-1 pb-2 text-[10px] font-mono font-semibold uppercase tracking-[0.14em]"
            style={FAINT_STYLE}
          >
            Recent results
          </div>
          <div className="flex flex-col gap-1">
            {completed.map((g, i) => (
              <div
                key={g.id}
                className={`${ROW_BASE} ${ROW_TXT}`}
                style={rowStyle(i)}
              >
                <span
                  className="w-14 shrink-0 font-mono text-[11px]"
                  style={MUTED_STYLE}
                >
                  {g.date}
                </span>
                <span
                  className="flex-1 truncate font-medium"
                  style={{ ...INK_STYLE, letterSpacing: '-0.01em' }}
                >
                  {g.opponent}
                </span>
                <span
                  className="font-mono text-[13px] font-extrabold min-w-[36px] text-right"
                  style={{ ...INK_STYLE, letterSpacing: '0.02em' }}
                >
                  {g.scoreUs}
                  <span className="px-px" style={FAINT_STYLE}>
                    –
                  </span>
                  {g.scoreThem}
                </span>
                <ResultPill result={g.outcome} />
              </div>
            ))}
          </div>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <div
            className="px-2.5 pt-3.5 pb-2 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] flex items-center gap-2"
            style={FAINT_STYLE}
          >
            Upcoming
            <div
              className="flex-1 h-px"
              style={{ background: 'var(--halo-row-divider)' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            {upcoming.map((g, i) => (
              <div
                key={g.id}
                className={`${ROW_BASE} ${ROW_TXT}`}
                style={{
                  ...rowStyle(i),
                  border:
                    i === 0
                      ? `1px solid ${CHIP_BORDER}`
                      : '1px solid transparent',
                }}
              >
                <span
                  className="w-14 shrink-0 font-mono text-[11px]"
                  style={MUTED_STYLE}
                >
                  {g.date}
                </span>
                <span
                  className="flex-1 truncate font-medium"
                  style={{ ...INK_STYLE, letterSpacing: '-0.01em' }}
                >
                  {g.opponent}
                </span>
                <span
                  className="font-mono text-[12px] font-bold px-2 py-[3px] rounded-lg"
                  style={{
                    background: CHIP_BG,
                    border: `1px solid ${CHIP_BORDER}`,
                    color: 'var(--halo-accent-bright)',
                  }}
                >
                  {g.time}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </CardShell>
  );
}

function StatsCard({ card }) {
  const players = card.players || [];
  const max = players.reduce((m, p) => Math.max(m, p.goals || 0), 1);
  const sub = `${card.totalGoals} goals · ${card.totalAssists} assists across ${players.length} player${players.length === 1 ? '' : 's'}`;

  return (
    <CardShell
      icon="⚽"
      label="Top scorers"
      sub={sub}
      scrollHeight={360}
      footer="Source · games.json"
    >
      <div className="flex items-center gap-2.5 px-2.5 pb-1.5 pt-1">
        <div className="w-[30px] shrink-0" />
        <ColHead align="left">Player</ColHead>
        <ColHead w={100} align="left">
          Goals
        </ColHead>
        <ColHead w={36}>A</ColHead>
        <ColHead w={36}>GP</ColHead>
      </div>
      <div className="flex flex-col gap-1">
        {players.map((p, i) => (
          <div
            key={`${p.number ?? 'x'}-${p.name}-${i}`}
            className={ROW_BASE}
            style={rowStyle(i)}
          >
            <Avatar num={p.number} name={p.name} />
            <div
              className="flex-1 min-w-0 text-[13px] font-semibold truncate"
              style={{ ...INK_STYLE, letterSpacing: '-0.01em' }}
            >
              {p.name}
            </div>
            <div className="w-[100px] flex items-center gap-1.5">
              <MiniBar value={p.goals} max={max} />
              <div
                className="w-4 text-right font-mono text-[13px] font-extrabold"
                style={INK_STYLE}
              >
                {p.goals}
              </div>
            </div>
            <div
              className="w-9 text-right font-mono text-[12px]"
              style={MUTED_STYLE}
            >
              {p.assists}
            </div>
            <div
              className="w-9 text-right font-mono text-[12px]"
              style={FAINT_STYLE}
            >
              {p.gamesPlayed}
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function RosterCard({ card }) {
  return (
    <CardShell icon="👥" label="Team roster" sub={`${card.players.length} players`}>
      <div className="grid grid-cols-2 gap-1.5">
        {card.players.map((p) => (
          <div
            key={p.number}
            className={`${ROW_BASE} text-[12px]`}
            style={{ background: ROW_STRIPE }}
          >
            <span
              className="font-mono font-extrabold w-7 text-right shrink-0"
              style={ACCENT_STYLE}
            >
              {p.number}
            </span>
            <span className="truncate" style={INK_STYLE}>
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function RecentFormCard({ card }) {
  return (
    <CardShell
      icon="📈"
      label="Recent form"
      sub={card.form}
      scrollHeight={360}
    >
      <div className="flex gap-1.5 px-2.5 pb-2.5">
        {card.form.split('').map((r, i) => (
          <ResultPill key={i} result={r} />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {card.games.map((g, i) => (
          <div
            key={g.id}
            className={`${ROW_BASE} ${ROW_TXT}`}
            style={rowStyle(i)}
          >
            <span
              className="w-14 shrink-0 font-mono text-[11px]"
              style={MUTED_STYLE}
            >
              {g.date}
            </span>
            <span
              className="flex-1 truncate font-medium"
              style={{ ...INK_STYLE, letterSpacing: '-0.01em' }}
            >
              {g.opponent}
            </span>
            <span
              className="font-mono text-[13px] font-extrabold min-w-[36px] text-right"
              style={INK_STYLE}
            >
              {g.scoreUs}
              <span className="px-px" style={FAINT_STYLE}>
                –
              </span>
              {g.scoreThem}
            </span>
            <ResultPill result={g.outcome} />
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function GoalkeeperCard({ card }) {
  const keepers = card.keepers || [];
  const totalSaves = keepers.reduce((s, k) => s + (k.saves || 0), 0);
  const totalGA = keepers.reduce((s, k) => s + (k.goalsAllowed || 0), 0);
  const denom = totalSaves + totalGA;
  const savePct = denom > 0 ? Math.round((totalSaves / denom) * 100) : 0;
  const maxSaves = keepers.reduce((m, k) => Math.max(m, k.saves || 0), 1);
  const sub = `${totalSaves} saves · ${totalGA} GA · ${savePct}% save rate`;

  return (
    <CardShell
      icon="🧤"
      label="Goalkeepers"
      sub={sub}
      footer="Saves & clean sheets across competitive matches"
    >
      <div className="flex items-center gap-2.5 px-2.5 pb-1.5 pt-1">
        <div className="w-[30px] shrink-0" />
        <ColHead align="left">Keeper</ColHead>
        <ColHead w={110} align="left">
          Saves
        </ColHead>
        <ColHead w={32}>GA</ColHead>
        <ColHead w={40}>GAA</ColHead>
        <ColHead w={28}>CS</ColHead>
        <ColHead w={28}>GP</ColHead>
      </div>
      <div className="flex flex-col gap-1">
        {keepers.map((k, i) => (
          <div key={k.name} className={ROW_BASE} style={rowStyle(i)}>
            <Avatar num={k.number} name={k.name} />
            <div
              className="flex-1 min-w-0 text-[13px] font-semibold truncate"
              style={{ ...INK_STYLE, letterSpacing: '-0.01em' }}
            >
              {k.name}
            </div>
            <div className="w-[110px] flex items-center gap-1.5">
              <MiniBar value={k.saves || 0} max={maxSaves} />
              <div
                className="w-[22px] text-right font-mono text-[13px] font-extrabold"
                style={INK_STYLE}
              >
                {k.saves ?? 0}
              </div>
            </div>
            <div
              className="w-8 text-right font-mono text-[12px]"
              style={MUTED_STYLE}
            >
              {k.goalsAllowed}
            </div>
            <div
              className="w-10 text-right font-mono text-[12px]"
              style={MUTED_STYLE}
            >
              {k.gaa}
            </div>
            <div
              className="w-7 text-right font-mono text-[12px] font-bold"
              style={k.cleanSheets > 0 ? ACCENT_STYLE : FAINT_STYLE}
            >
              {k.cleanSheets}
            </div>
            <div
              className="w-7 text-right font-mono text-[12px]"
              style={FAINT_STYLE}
            >
              {k.games}
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function SavesLeaderCard({ card }) {
  const top = card.leader || {};
  return (
    <CardShell icon="🛡" label="Saves leader" sub={card.seasonLabel || 'Season'}>
      <div className="flex items-center gap-3.5 px-2.5 pt-1.5 pb-3.5">
        <div
          className="w-24 h-24 rounded-3xl grid place-items-center shrink-0"
          style={{
            background: `radial-gradient(circle at 30% 25%, ${CHIP_BG}, transparent 70%), ${ROW_STRIPE}`,
            border: `1px solid ${CHIP_BORDER}`,
          }}
        >
          <div className="text-center">
            <div
              className="font-mono text-[36px] font-extrabold leading-none"
              style={{
                color: 'var(--halo-accent-bright)',
                letterSpacing: '-0.04em',
              }}
            >
              {top.saves ?? 0}
            </div>
            <div
              className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em]"
              style={MUTED_STYLE}
            >
              Saves
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[15px] font-bold mb-1 truncate"
            style={{ ...INK_STYLE, letterSpacing: '-0.02em' }}
          >
            {top.name}
          </div>
          <div className="text-[12px] mb-2.5" style={MUTED_STYLE}>
            {top.number != null ? `#${top.number} · ` : ''}
            {top.games} game{top.games === 1 ? '' : 's'} ·{' '}
            {top.cleanSheets} clean sheet
            {top.cleanSheets === 1 ? '' : 's'}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ['Save %', `${card.savePct ?? 0}%`],
              ['GAA', top.gaa ?? '0.00'],
              ['Team SV', card.teamSaves ?? 0],
            ].map(([l, v]) => (
              <div
                key={l}
                className="px-2 py-1.5 rounded-[10px]"
                style={{
                  background: ROW_STRIPE,
                  border: '1px solid var(--halo-row-divider)',
                }}
              >
                <div
                  className="text-[9px] font-mono uppercase tracking-[0.12em]"
                  style={FAINT_STYLE}
                >
                  {l}
                </div>
                <div
                  className="font-mono text-[14px] font-extrabold mt-[2px]"
                  style={INK_STYLE}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function StandingsCard({ card }) {
  if (card?.teams) {
    return (
      <CardShell
        icon="🏆"
        label="League standings"
        sub={card.updated ? `Updated ${card.updated}` : null}
        scrollHeight={420}
      >
        <div className="flex items-center gap-2.5 px-2.5 pb-1.5 pt-1">
          <ColHead w={20} align="right">
            #
          </ColHead>
          <ColHead align="left">Team</ColHead>
          <ColHead w={68}>Record</ColHead>
          <ColHead w={32}>Pts</ColHead>
          <ColHead w={32}>GD</ColHead>
        </div>
        <div className="flex flex-col gap-1">
          {card.teams.map((t, i) => (
            <div
              key={i}
              className={ROW_BASE}
              style={
                t.isMercury
                  ? {
                      background:
                        'color-mix(in srgb, var(--halo-accent) 12%, transparent)',
                      borderLeft: '2px solid var(--halo-accent-bright)',
                    }
                  : rowStyle(i)
              }
            >
              <span
                className="w-5 text-right shrink-0 font-mono text-[11px]"
                style={t.isMercury ? ACCENT_STYLE : FAINT_STYLE}
              >
                {t.position}.
              </span>
              <span
                className={`flex-1 truncate text-[13px] ${t.isMercury ? 'font-semibold' : 'font-medium'}`}
                style={t.isMercury ? ACCENT_STYLE : INK_STYLE}
              >
                {t.team}
              </span>
              <span
                className="w-[68px] text-right font-mono text-[11px] shrink-0"
                style={t.isMercury ? ACCENT_STYLE : MUTED_STYLE}
              >
                {t.wins}W-{t.losses}L-{t.draws}D
              </span>
              <span
                className="w-8 text-right font-mono text-[12px] font-extrabold"
                style={t.isMercury ? ACCENT_STYLE : INK_STYLE}
              >
                {t.points}
              </span>
              <span
                className="w-8 text-right font-mono text-[10px]"
                style={t.isMercury ? ACCENT_STYLE : FAINT_STYLE}
              >
                {t.goalDifference >= 0 ? '+' : ''}
                {t.goalDifference}
              </span>
            </div>
          ))}
        </div>
      </CardShell>
    );
  }

  // Legacy text fallback
  const data = typeof card === 'string' ? card : card?.data || '';
  const lines = data.split('\n').filter(Boolean);
  return (
    <CardShell icon="🏆" label="League standings" scrollHeight={360}>
      <div className="flex flex-col gap-1">
        {lines.map((row, i) => {
          const isMercury = row.toLowerCase().includes('mercury');
          return (
            <div
              key={i}
              className={ROW_BASE}
              style={
                isMercury
                  ? {
                      background:
                        'color-mix(in srgb, var(--halo-accent) 12%, transparent)',
                      borderLeft: '2px solid var(--halo-accent-bright)',
                    }
                  : rowStyle(i)
              }
            >
              <span
                className={`text-[12px] font-mono ${isMercury ? 'font-semibold' : ''}`}
                style={isMercury ? ACCENT_STYLE : MUTED_STYLE}
              >
                {row.replace(' ← MERCURY', '')}
              </span>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

const CARD_LABELS = {
  get_next_match: 'Match info',
  get_game_details: 'Match info',
  get_season_record: 'Season record',
  get_tournament: 'Tournament',
  list_tournaments: 'Tournaments',
  list_photo_albums: 'Photo albums',
  list_seasons: 'Info',
  get_league_results: 'League results',
};

const CARD_ICONS = {
  get_next_match: '⚽',
  get_game_details: '⚽',
  get_season_record: '📊',
  get_tournament: '🏆',
  list_tournaments: '🏆',
  list_photo_albums: '📸',
  list_seasons: 'ℹ️',
  get_league_results: '📋',
};

const SCROLLABLE_TOOLS = new Set([
  'get_tournament',
  'list_tournaments',
  'get_league_results',
]);

function VoiceCard({ toolName, data, card }) {
  if (!data && !card) return null;

  if (card) {
    switch (card.type) {
      case 'schedule':
        return <ScheduleCard card={card} />;
      case 'stats':
        return <StatsCard card={card} />;
      case 'roster':
        return <RosterCard card={card} />;
      case 'recent-form':
        return <RecentFormCard card={card} />;
      case 'goalkeeper':
        return <GoalkeeperCard card={card} />;
      case 'saves-leader':
        return <SavesLeaderCard card={card} />;
      case 'standings':
        return <StandingsCard card={card} />;
    }
  }

  if (toolName === 'get_league_standings') return <StandingsCard card={data} />;

  return (
    <CardShell
      icon={CARD_ICONS[toolName] || '💬'}
      label={CARD_LABELS[toolName] || 'Info'}
      scrollHeight={SCROLLABLE_TOOLS.has(toolName) ? 360 : undefined}
    >
      <div
        className="whitespace-pre-line text-[13px] leading-relaxed px-1.5 py-1"
        style={INK_STYLE}
      >
        {data}
      </div>
    </CardShell>
  );
}

export function VoiceCardRenderer({ cards }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 px-4">
      {cards.map((card, i) => (
        <VoiceCard
          key={i}
          toolName={card.toolName}
          data={card.data}
          card={card.card}
        />
      ))}
    </div>
  );
}
