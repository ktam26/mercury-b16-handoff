'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatMonthDay } from '@/lib/game-utils';
import { HaloPage, HaloCard, HaloSectionLabel } from './HaloShell';
import { HaloWinRateRing } from './HaloWinRateRing';

export default function HaloStats({
  seasons,
  precomputedStats,
  seasonRecords,
  perGameTrend,
}) {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0].id);
  const stats = precomputedStats[selectedSeason];
  const record = seasonRecords[selectedSeason] || { wins: 0, losses: 0, ties: 0 };
  const trend = perGameTrend[selectedSeason] || [];
  const seasonLabel =
    seasons.find((s) => s.id === selectedSeason)?.fullLabel || 'Season';

  const cleanSheets = useMemo(
    () => (stats?.gkLeaders || []).reduce((sum, gk) => sum + (gk.cleanSheets || 0), 0),
    [stats]
  );

  const totalSaves = useMemo(
    () => (stats?.gkLeaders || []).reduce((sum, gk) => sum + (gk.saves || 0), 0),
    [stats]
  );

  const goalsAgainst = useMemo(
    () => trend.reduce((s, g) => s + (g.conceded || 0), 0),
    [trend]
  );

  const gp = stats.gamesPlayed || 0;
  const gd = (stats.totalGoals || 0) - goalsAgainst;
  const goalsAgainstPerMatch = gp > 0 ? (goalsAgainst / gp).toFixed(1) : null;
  const saveDenom = totalSaves + goalsAgainst;
  const savePct = saveDenom > 0 ? Math.round((totalSaves / saveDenom) * 100) : null;

  return (
    <HaloPage>
      {/* MOBILE */}
      <div className="md:hidden max-w-3xl mx-auto px-4 pt-4">
        <div className="flex items-baseline justify-between mb-4 px-1">
          <h1
            className="text-[22px] font-bold"
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
          >
            Stats
          </h1>
          <SeasonPicker
            seasons={seasons}
            value={selectedSeason}
            onChange={setSelectedSeason}
          />
        </div>

        <HaloCard className="p-5 mb-3">
          <HaloSectionLabel className="mb-2 px-0">{seasonLabel}</HaloSectionLabel>
          <div className="flex gap-5 items-center mt-3">
            <HaloWinRateRing
              wins={record.wins}
              losses={record.losses}
              ties={record.ties}
              size={132}
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-[22px] font-bold"
                style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
              >
                {record.wins}W · {record.losses}L · {record.ties}D
              </div>
              <div className="text-[12px] mt-1" style={{ color: 'var(--halo-muted)' }}>
                {gp} game{gp === 1 ? '' : 's'} played
              </div>
            </div>
          </div>
        </HaloCard>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <StatTile
            label="Goals scored"
            value={stats.totalGoals}
            sub={gp > 0 ? `${(stats.totalGoals / gp).toFixed(1)} / match` : null}
            accent
          />
          <StatTile
            label="Save %"
            value={savePct != null ? `${savePct}%` : '—'}
            sub={
              totalSaves > 0
                ? `${totalSaves} sv · ${goalsAgainst} ga`
                : null
            }
            accent
          />
          <StatTile
            label="Goals against"
            value={goalsAgainst}
            sub={goalsAgainstPerMatch ? `${goalsAgainstPerMatch} / match` : null}
          />
          <StatTile
            label="Saves"
            value={totalSaves}
            sub={
              gp > 0 && totalSaves > 0
                ? `${(totalSaves / gp).toFixed(1)} / match`
                : null
            }
            accent
          />
          <StatTile
            label="Clean sheets"
            value={cleanSheets}
            sub={gp > 0 ? `${Math.round((cleanSheets / gp) * 100)}%` : null}
          />
          <StatTile
            label="Goal diff"
            value={gd >= 0 ? `+${gd}` : gd}
            sub={null}
            accent={gd >= 0}
          />
        </div>

        {trend.length > 0 && (
          <HaloCard className="p-5 mb-4">
            <div
              className="text-[15px] font-bold"
              style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
            >
              Goals scored
            </div>
            <div
              className="text-[11px] mt-1"
              style={{ color: 'var(--halo-muted)' }}
            >
              Last {Math.min(8, trend.length)} matches
            </div>
            <GoalTrend trend={trend.slice(-8)} compact />
          </HaloCard>
        )}

        {stats.goalLeaders.length > 0 && (
          <HaloCard className="p-5 mb-4">
            <Header title="Top scorers" right="⚽ GOALS" />
            {stats.goalLeaders.map((p, i) => (
              <BarRow
                key={p.name}
                rank={i}
                name={p.name}
                value={p.goals}
                max={stats.maxGoals}
                sub={p.assists ? `${p.assists} assist${p.assists === 1 ? '' : 's'}` : null}
              />
            ))}
          </HaloCard>
        )}

        {stats.assistLeaders.length > 0 && (
          <HaloCard className="p-5 mb-4">
            <Header title="Top assists" right="🎯 ASSISTS" />
            {stats.assistLeaders.map((p, i) => (
              <BarRow
                key={p.name}
                rank={i}
                name={p.name}
                value={p.assists}
                max={stats.maxAssists}
              />
            ))}
          </HaloCard>
        )}

        {stats.gkLeaders.length > 0 && (
          <HaloCard className="p-5">
            <div
              className="text-[15px] font-bold mb-3"
              style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
            >
              Goalkeepers
            </div>
            {stats.gkLeaders.map((gk, i) => (
              <GkRow key={gk.name} gk={gk} isFirst={i === 0} />
            ))}
          </HaloCard>
        )}

        <div className="h-8" />
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block max-w-6xl mx-auto px-9 pt-6">
        <div className="flex items-baseline justify-between mb-4 px-1">
          <h1
            className="text-[28px] font-bold"
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
          >
            Stats
          </h1>
          <SeasonPicker
            seasons={seasons}
            value={selectedSeason}
            onChange={setSelectedSeason}
          />
        </div>

        {/* 6-col KPI row: ring + Save % hero + 4 stat tiles */}
        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 1fr' }}
        >
          <HaloCard className="p-5">
            <HaloSectionLabel className="mb-2 px-0">{seasonLabel}</HaloSectionLabel>
            <div className="flex gap-4 items-center mt-3">
              <HaloWinRateRing
                wins={record.wins}
                losses={record.losses}
                ties={record.ties}
                size={120}
              />
              <div className="min-w-0">
                <div
                  className="text-[22px] font-bold"
                  style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
                >
                  {record.wins}W·{record.losses}L·{record.ties}D
                </div>
                <div className="text-[12px] mt-1" style={{ color: 'var(--halo-muted)' }}>
                  {gp} games · GD {gd >= 0 ? '+' : ''}{gd}
                </div>
                <div className="flex gap-1 mt-2.5">
                  {trend.slice(-8).map((g, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded"
                      style={{
                        background:
                          g.result === 'W'
                            ? 'var(--halo-accent-bright)'
                            : g.result === 'L'
                            ? 'var(--halo-loss)'
                            : 'var(--halo-faint)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </HaloCard>

          <DesktopKpiTile
            label="Save %"
            value={savePct != null ? `${savePct}%` : '—'}
            sub={
              totalSaves > 0 ? `${totalSaves} sv · ${goalsAgainst} ga` : null
            }
            accent
          />
          <DesktopKpiTile
            label="Goals scored"
            value={stats.totalGoals}
            sub={gp > 0 ? `${(stats.totalGoals / gp).toFixed(1)} / match` : null}
            accent
          />
          <DesktopKpiTile
            label="Goals against"
            value={goalsAgainst}
            sub={goalsAgainstPerMatch ? `${goalsAgainstPerMatch} / match` : null}
          />
          <DesktopKpiTile
            label="Saves"
            value={totalSaves}
            sub={
              gp > 0 && totalSaves > 0
                ? `${(totalSaves / gp).toFixed(1)} / match`
                : null
            }
            accent
          />
          <DesktopKpiTile
            label="Clean sheets"
            value={cleanSheets}
            sub={gp > 0 ? `${Math.round((cleanSheets / gp) * 100)}%` : null}
          />
        </div>

        {/* 2-col: Top scorers + Goal trend */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {stats.goalLeaders.length > 0 ? (
            <HaloCard className="p-6">
              <Header title="Top scorers" right="⚽ GOALS" />
              {stats.goalLeaders.map((p, i) => (
                <BarRow
                  key={p.name}
                  rank={i}
                  name={p.name}
                  value={p.goals}
                  max={stats.maxGoals}
                  sub={p.assists ? `${p.assists} assist${p.assists === 1 ? '' : 's'}` : null}
                  desktop
                />
              ))}
            </HaloCard>
          ) : (
            <HaloCard className="p-6">
              <Header title="Top scorers" right="⚽ GOALS" />
              <div
                className="text-[13px] py-6 text-center"
                style={{ color: 'var(--halo-muted)' }}
              >
                No goals recorded yet this season
              </div>
            </HaloCard>
          )}

          <HaloCard className="p-6">
            <div
              className="text-[16px] font-bold"
              style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
            >
              Goal trend
            </div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--halo-muted)' }}>
              Goals scored, last {Math.min(8, trend.length)} matches
            </div>
            {trend.length > 0 ? (
              <GoalTrend trend={trend.slice(-8)} />
            ) : (
              <div
                className="text-[13px] py-10 text-center"
                style={{ color: 'var(--halo-muted)' }}
              >
                No completed matches yet
              </div>
            )}
          </HaloCard>
        </div>

        {/* Assists + Goalkeepers row */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {stats.assistLeaders.length > 0 && (
            <HaloCard className="p-6">
              <Header title="Top assists" right="🎯 ASSISTS" />
              {stats.assistLeaders.map((p, i) => (
                <BarRow
                  key={p.name}
                  rank={i}
                  name={p.name}
                  value={p.assists}
                  max={stats.maxAssists}
                  desktop
                />
              ))}
            </HaloCard>
          )}

          {stats.gkLeaders.length > 0 && (
            <HaloCard className="p-6">
              <div
                className="text-[16px] font-bold mb-3"
                style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
              >
                Goalkeepers
              </div>
              {stats.gkLeaders.map((gk, i) => (
                <GkRow key={gk.name} gk={gk} isFirst={i === 0} desktop />
              ))}
            </HaloCard>
          )}
        </div>

        <div className="h-12" />
      </div>
    </HaloPage>
  );
}

function SeasonPicker({ seasons, value, onChange }) {
  return (
    <div className="flex gap-1">
      {seasons.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={cn(
            'px-3 py-1 rounded-full text-[12px] font-semibold transition-colors',
            value === s.id
              ? 'bg-[var(--halo-accent)] text-white'
              : 'text-[var(--halo-muted)] hover:text-[var(--halo-ink)]'
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function Header({ title, right }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <div
        className="text-[15px] md:text-[16px] font-bold"
        style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
      >
        {title}
      </div>
      <div
        className="text-[11px] font-semibold"
        style={{ color: 'var(--halo-muted)', letterSpacing: '0.1em' }}
      >
        {right}
      </div>
    </div>
  );
}

function StatTile({ label, value, sub, accent }) {
  return (
    <HaloCard className="p-4">
      <div
        className="text-[10px] font-bold uppercase"
        style={{ color: 'var(--halo-muted)', letterSpacing: '0.12em' }}
      >
        {label}
      </div>
      <div
        className="text-[36px] font-bold leading-none mt-2"
        style={{
          color: accent ? 'var(--halo-accent-bright)' : 'var(--halo-ink)',
          letterSpacing: '-0.04em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="text-[11px] mt-1.5"
          style={{ color: 'var(--halo-muted)' }}
        >
          {sub}
        </div>
      )}
    </HaloCard>
  );
}

function DesktopKpiTile({ label, value, sub, accent }) {
  return (
    <HaloCard className="p-5">
      <div
        className="text-[10px] font-bold uppercase"
        style={{ color: 'var(--halo-muted)', letterSpacing: '0.14em' }}
      >
        {label}
      </div>
      <div
        className="text-[56px] font-bold leading-none mt-3"
        style={{
          color: accent ? 'var(--halo-accent-bright)' : 'var(--halo-ink)',
          letterSpacing: '-0.05em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="text-[11px] mt-2"
          style={{ color: 'var(--halo-muted)' }}
        >
          {sub}
        </div>
      )}
    </HaloCard>
  );
}

function GoalTrend({ trend, compact = false }) {
  const max = Math.max(...trend.map((g) => g.goals), 1);
  const totalH = compact ? 96 : 220;
  // Reserve space for top label (~16) and bottom label (~16 desktop only) + gaps (~8)
  const reserved = compact ? 22 : 44;
  const barZone = totalH - reserved;
  return (
    <div className="flex gap-2.5 mt-5" style={{ height: totalH }}>
      {trend.map((g, i) => {
        const barH = Math.max(4, (g.goals / max) * barZone);
        const isLatest = i === trend.length - 1;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center min-w-0"
            style={{ justifyContent: 'flex-end', gap: 6 }}
          >
            <div
              className="text-[11px] font-bold"
              style={{
                color: 'var(--halo-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {g.goals}
            </div>
            <div
              className="w-full rounded-md"
              style={{
                height: barH,
                background: isLatest
                  ? 'var(--halo-accent-bright)'
                  : 'var(--halo-faint)',
              }}
            />
            {!compact && (
              <div
                className="text-[10px] font-semibold mt-1"
                style={{ color: 'var(--halo-muted)', letterSpacing: '0.06em' }}
              >
                {formatMonthDay(g.date)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BarRow({ rank, name, value, max, sub, desktop = false }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div
      className={cn(desktop ? 'py-3' : 'py-2.5')}
      style={{
        borderTop:
          rank === 0 ? 'none' : '1px solid var(--halo-row-divider)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'rounded-lg grid place-items-center font-extrabold shrink-0',
            desktop ? 'w-9 h-9 text-[13px]' : 'w-8 h-8 text-[12px]'
          )}
          style={{
            background:
              rank === 0
                ? 'var(--halo-accent)'
                : 'color-mix(in srgb, var(--halo-ink) 6%, transparent)',
            color: rank === 0 ? '#fff' : 'var(--halo-ink)',
          }}
        >
          {rank + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'font-semibold truncate',
              desktop ? 'text-[14px]' : 'text-[13px]'
            )}
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
          >
            {name}
          </div>
          {sub && (
            <div
              className="text-[11px]"
              style={{ color: 'var(--halo-muted)' }}
            >
              {sub}
            </div>
          )}
        </div>
        <div
          className={cn(
            'font-bold',
            desktop ? 'text-[28px]' : 'text-[20px]'
          )}
          style={{
            color: rank === 0 ? 'var(--halo-accent-bright)' : 'var(--halo-ink)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </div>
      </div>
      <div
        className={cn('mt-2 rounded-full overflow-hidden', desktop ? 'h-2' : 'h-1.5')}
        style={{
          background: 'color-mix(in srgb, var(--halo-ink) 6%, transparent)',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background:
              rank === 0 ? 'var(--halo-accent-bright)' : 'var(--halo-faint)',
            borderRadius: 100,
          }}
        />
      </div>
    </div>
  );
}

function GkRow({ gk, isFirst, desktop = false }) {
  return (
    <div
      className={cn('grid items-center gap-3', desktop ? 'py-3' : 'py-2.5')}
      style={{
        gridTemplateColumns: '1fr auto auto auto auto',
        borderTop: isFirst ? 'none' : '1px solid var(--halo-row-divider)',
      }}
    >
      <div
        className={cn('font-semibold truncate', desktop ? 'text-[14px]' : 'text-[13px]')}
        style={{ color: 'var(--halo-ink)' }}
      >
        {gk.name}
      </div>
      <GkStat label="SV" value={gk.saves ?? 0} accent />
      <GkStat label="GP" value={gk.gamesInGoal} />
      <GkStat label="GA" value={gk.goalsAllowed} />
      <GkStat label="CS" value={gk.cleanSheets} />
    </div>
  );
}

function GkStat({ label, value, accent }) {
  return (
    <div className="text-right min-w-[36px]">
      <div
        className="text-[9px] font-bold"
        style={{ color: 'var(--halo-muted)', letterSpacing: '0.15em' }}
      >
        {label}
      </div>
      <div
        className="text-[16px] font-bold"
        style={{
          color: accent ? 'var(--halo-accent-bright)' : 'var(--halo-ink)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}
