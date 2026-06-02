/**
 * Tournament-specific helpers used by HaloTournament and HaloGame components.
 */

const KNOCKOUT_PLACEMENTS = new Set([
  'CHAMPION',
  'FINALIST',
  'RUNNER-UP',
  'RUNNER UP',
  'THIRD PLACE',
  'SEMIFINALIST',
  'SEMI-FINALIST',
]);

/**
 * Derive a round label per match. With knockout placements (CHAMPION/FINALIST/etc.)
 * and 4 games, the last is "Final" and the second-to-last is "Semi Final"; group
 * stage prefixes the rest. Otherwise: "Group · MW {n}" / "Match {n}".
 */
export function deriveRoundLabel(game, allGames, placement) {
  const total = allGames.length;
  const idx = allGames.indexOf(game);
  const num = game.gameNumber || idx + 1;
  const isKnockout = placement && KNOCKOUT_PLACEMENTS.has(placement.toUpperCase());

  if (isKnockout && total >= 3) {
    if (idx === total - 1) return 'Final';
    if (idx === total - 2) return 'Semi Final';
    if (idx === total - 3 && total >= 4) return `Group · MW ${num}`;
    return `Group · MW ${num}`;
  }

  return `Group · MW ${num}`;
}

/**
 * Pick the standings group containing Mercury. Falls back to the first group.
 */
export function getMercuryGroup(standings) {
  if (!standings) return null;
  const keys = Object.keys(standings);
  for (const key of keys) {
    const rows = standings[key];
    if (Array.isArray(rows) && rows.some((r) => r.isUs)) return key;
  }
  return keys[0] || null;
}

/**
 * Find the Mercury standings row across all groups.
 */
export function getMercuryRow(standings) {
  if (!standings) return null;
  for (const key of Object.keys(standings)) {
    const rows = standings[key];
    if (!Array.isArray(rows)) continue;
    const us = rows.find((r) => r.isUs);
    if (us) return us;
  }
  return null;
}

/**
 * Compute hero KPIs from Mercury record + standings row.
 * Returns { recordStr, gf, ga, gd } with sensible defaults.
 */
export function getKpis(mercuryRecord, standingsRow) {
  const w = mercuryRecord?.w ?? standingsRow?.w ?? 0;
  const l = mercuryRecord?.l ?? standingsRow?.l ?? 0;
  const t = mercuryRecord?.t ?? standingsRow?.t ?? 0;
  const recordStr = t ? `${w}-${l}-${t}` : `${w}-${l}`;
  const gf = standingsRow?.gf ?? 0;
  const ga = standingsRow?.ga ?? 0;
  const gd = gf - ga;
  return { recordStr, gf, ga, gd };
}

/**
 * Build goal highlight rows for a past game's footage card.
 * Prefers minute/scorer/assist from result.timeline; falls back to result.goalScorers.
 */
export function buildHighlights(result) {
  if (!result) return [];

  if (Array.isArray(result.timeline) && result.timeline.length > 0) {
    const out = result.timeline
      .filter((ev) => ev.type === 'goal' && ev.team === 'mercury')
      .map((ev) => ({
        min: ev.minute ?? null,
        scorer: ev.scorer || ev.player || 'Mercury',
        assist: ev.assist ?? null,
        fk: ev.goalType === 'FK' || !!ev.freeKick || !!ev.fk,
        videoTimestamp: ev.videoTimestamp ?? null,
      }));
    if (out.length > 0) return out;
  }

  if (Array.isArray(result.goalScorers) && result.goalScorers.length > 0) {
    return result.goalScorers.map((entry) => {
      if (typeof entry === 'string') {
        return { scorer: entry, min: null, assist: null, fk: false, videoTimestamp: null };
      }
      return {
        scorer: entry.name || entry.scorer || 'Mercury',
        min: entry.minute ?? null,
        assist: entry.assist ?? null,
        fk: entry.goalType === 'FK' || !!entry.freeKick || !!entry.fk,
        videoTimestamp: entry.videoTimestamp ?? null,
      };
    });
  }

  return [];
}

/**
 * Format a placement string + rank for display in non-champion hero.
 */
export function formatPlacement(placement, placementRank) {
  if (!placement) return null;
  const label = placement.toUpperCase();
  if (placementRank) return `${label} · ${placementRank}`;
  return label;
}
