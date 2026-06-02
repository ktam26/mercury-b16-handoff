#!/usr/bin/env node
/**
 * new-season.js — roll the app into a new season.
 *
 * What it does (all mechanical, deterministic steps):
 *   1. Archives the current season: copies data/games.json -> data/seasons/<current-id>.json
 *   2. Registers seasons in lib/seasons.js so a new tab appears (new season becomes the default)
 *   3. Resets data/games.json to an empty schedule for the new season
 *   4. Updates config/gotsport.json (event/team/group IDs) for the new GotSport site
 *   5. Refreshes the GotSport links in data/team-info.json
 *
 * What it does NOT do (human-judgment steps — see NEW_SEASON.md):
 *   - Find your new GotSport IDs (you paste them in when prompted)
 *   - Change the cron schedule in .github/workflows/scrape-gotsport.yml
 *   - Run the first scrape / commit (it prints the commands)
 *
 * Run: npm run new-season
 * Nothing is written until you confirm the plan.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PATHS = {
  seasonsFile: path.join(ROOT, 'lib', 'seasons.js'),
  gamesFile: path.join(ROOT, 'data', 'games.json'),
  seasonsDir: path.join(ROOT, 'data', 'seasons'),
  gotsportConfig: path.join(ROOT, 'config', 'gotsport.json'),
  teamInfo: path.join(ROOT, 'data', 'team-info.json'),
};

// --- pure helpers -----------------------------------------------------------

// 'fall-2026' -> 'fall2026Games' (a valid JS identifier for the import binding)
function varNameForId(id) {
  const camel = id
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1)))
    .join('');
  const safe = /^[a-zA-Z_]/.test(camel) ? camel : `s${camel}`;
  return `${safe}Games`;
}

// 'fall-2026' -> { label: 'Fall 26', fullLabel: 'Fall 2026' }
function deriveLabels(id) {
  const parts = id.split('-');
  const word = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : id;
  const year = parts[1] || '';
  const fullLabel = year ? `${word} ${year}` : word;
  const label = year.length === 4 ? `${word} ${year.slice(2)}` : fullLabel;
  return { label, fullLabel };
}

// Parse the SEASONS array out of lib/seasons.js into structured entries.
// Each entry: { id, label, fullLabel, dataVar }
function parseSeasons(src) {
  const arrayMatch = src.match(/export const SEASONS = \[([\s\S]*?)\];/);
  if (!arrayMatch) throw new Error('Could not find `export const SEASONS = [...]` in lib/seasons.js');
  const entries = [];
  const entryRe = /\{\s*id:\s*['"]([^'"]+)['"]\s*,\s*label:\s*['"]([^'"]+)['"]\s*,\s*fullLabel:\s*['"]([^'"]+)['"]\s*,\s*data:\s*([A-Za-z0-9_]+)\s*,?\s*\}/g;
  let m;
  while ((m = entryRe.exec(arrayMatch[1])) !== null) {
    entries.push({ id: m[1], label: m[2], fullLabel: m[3], dataVar: m[4] });
  }
  if (!entries.length) throw new Error('Parsed SEASONS but found no entries — check lib/seasons.js format.');
  return entries;
}

// Regenerate lib/seasons.js from structured entries.
// entries[0] is the current/default season and is backed by data/games.json (currentGamesData).
function renderSeasonsFile(entries) {
  const imports = ["import currentGamesData from '@/data/games.json';"];
  for (const e of entries) {
    if (e.dataVar !== 'currentGamesData') {
      imports.push(`import ${e.dataVar} from '@/data/seasons/${e.id}.json';`);
    }
  }
  const rows = entries
    .map((e) => `  { id: '${e.id}', label: '${e.label}', fullLabel: '${e.fullLabel}', data: ${e.dataVar} },`)
    .join('\n');

  return `${imports.join('\n')}

// Centralized season configuration to avoid duplication.
// SEASONS[0] is the current season and is backed by data/games.json (currentGamesData).
// Archived seasons import their own data/seasons/<id>.json file.
// To roll into a new season, run \`npm run new-season\`.
export const SEASONS = [
${rows}
];

// Helper to get season by ID
export function getSeasonById(seasonId) {
  return SEASONS.find(s => s.id === seasonId);
}

// Get the current (most recent) season
export function getCurrentSeason() {
  return SEASONS[0];
}
`;
}

function gotsportUrls({ eventId, teamId, groupId }) {
  return {
    gotsportSchedule: `https://system.gotsport.com/org_event/events/${eventId}/schedules?team=${teamId}`,
    gotsportStandings: `https://system.gotsport.com/org_event/events/${eventId}/results?group=${groupId}`,
  };
}

// Compute the new season layout from the current lib/seasons.js source.
// Returns { entries, current, nextEntries } without touching the filesystem.
function planRollover(src, { newId, label, fullLabel }) {
  const entries = parseSeasons(src);
  const currentIdx = entries.findIndex((e) => e.dataVar === 'currentGamesData');
  const current = entries[currentIdx === -1 ? 0 : currentIdx];
  if (entries.some((e) => e.id === newId)) {
    throw new Error(`A season with id '${newId}' already exists.`);
  }
  if (newId === current.id) {
    throw new Error(`New id '${newId}' matches the current season.`);
  }
  const archived = { ...current, dataVar: varNameForId(current.id) };
  const rest = entries.filter((e) => e !== current);
  const newEntry = { id: newId, label, fullLabel, dataVar: 'currentGamesData' };
  return { entries, current, nextEntries: [newEntry, archived, ...rest] };
}

// Apply the rollover to disk. Pure of any prompting — fully testable.
// opts: { newId, label, fullLabel, eventId, teamId, groupId, paths? }
function applyRollover(opts) {
  const p = { ...PATHS, ...(opts.paths || {}) };
  const src = fs.readFileSync(p.seasonsFile, 'utf-8');
  const { current, nextEntries } = planRollover(src, opts);

  // 1. Archive current season.
  if (!fs.existsSync(p.seasonsDir)) fs.mkdirSync(p.seasonsDir, { recursive: true });
  const archivePath = path.join(p.seasonsDir, `${current.id}.json`);
  fs.copyFileSync(p.gamesFile, archivePath);

  // 2. Rewrite lib/seasons.js.
  fs.writeFileSync(p.seasonsFile, renderSeasonsFile(nextEntries));

  // 3. Reset games.json.
  fs.writeFileSync(p.gamesFile, '[]\n');

  // 4. Update config/gotsport.json (preserve the _comment).
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(p.gotsportConfig, 'utf-8'));
  } catch {}
  const newCfg = {
    _comment: existing._comment ||
      'Single source of truth for GotSport IDs. Update each season or run `npm run new-season`. See NEW_SEASON.md.',
    eventId: opts.eventId,
    teamId: opts.teamId,
    groupId: opts.groupId,
  };
  fs.writeFileSync(p.gotsportConfig, JSON.stringify(newCfg, null, 2) + '\n');

  // 5. Refresh team-info.json links.
  let infoUpdated = false;
  try {
    const info = JSON.parse(fs.readFileSync(p.teamInfo, 'utf-8'));
    info.links = { ...(info.links || {}), ...gotsportUrls(opts) };
    fs.writeFileSync(p.teamInfo, JSON.stringify(info, null, 2) + '\n');
    infoUpdated = true;
  } catch {}

  return { current, nextEntries, archivePath, infoUpdated };
}

// --- interactive wrapper ----------------------------------------------------

async function promptAndRun() {
  const readline = require('node:readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (q, def) => {
    const a = (await rl.question(`${q}${def ? ` [${def}]` : ''}: `)).trim();
    return a || def || '';
  };

  try {
    console.log('\n⚽  New Season Rollover\n');

    const src = fs.readFileSync(PATHS.seasonsFile, 'utf-8');
    const entries = parseSeasons(src);
    const current = entries.find((e) => e.dataVar === 'currentGamesData') || entries[0];
    console.log(`Current season detected: ${current.fullLabel} (id: ${current.id})`);
    console.log(`It will be archived to data/seasons/${current.id}.json\n`);

    let newId = '';
    while (!newId) {
      newId = (await ask("New season id (e.g. 'fall-2026')")).toLowerCase().replace(/\s+/g, '-');
      if (!newId) continue;
      if (newId === current.id || entries.some((e) => e.id === newId)) {
        console.log(`  ✗ '${newId}' already exists — pick another.`);
        newId = '';
      }
    }
    const derived = deriveLabels(newId);
    const label = await ask('Short label (tab text)', derived.label);
    const fullLabel = await ask('Full label', derived.fullLabel);

    console.log('\nGotSport IDs for the NEW season (see NEW_SEASON.md to find these in your schedule URL).');
    console.log('Press Enter to keep the current value if it has not changed.');
    let cfg = {};
    try {
      cfg = JSON.parse(fs.readFileSync(PATHS.gotsportConfig, 'utf-8'));
    } catch {}
    const eventId = await ask('  GotSport eventId', cfg.eventId);
    const teamId = await ask('  GotSport teamId', cfg.teamId);
    const groupId = await ask('  GotSport groupId', cfg.groupId);

    const { nextEntries } = planRollover(src, { newId, label, fullLabel });
    console.log('\n── Plan ───────────────────────────────────────────────');
    console.log(`1. Copy   data/games.json  →  data/seasons/${current.id}.json`);
    console.log(`2. Update lib/seasons.js   →  new default tab "${label}" (${fullLabel})`);
    console.log('         New SEASONS order: ' + nextEntries.map((e) => e.id).join(', '));
    console.log('3. Reset  data/games.json  →  [] (empty schedule for the new season)');
    console.log(`4. Write  config/gotsport.json  →  event=${eventId} team=${teamId} group=${groupId}`);
    console.log('5. Update data/team-info.json GotSport links');
    console.log('────────────────────────────────────────────────────────\n');

    const go = (await ask('Apply these changes? (y/N)', 'N')).toLowerCase();
    if (go !== 'y' && go !== 'yes') {
      console.log('Aborted — nothing was written.');
      return;
    }

    const archivePath = path.join(PATHS.seasonsDir, `${current.id}.json`);
    if (fs.existsSync(archivePath)) {
      const ow = (await ask(`  ${current.id}.json already exists — overwrite? (y/N)`, 'N')).toLowerCase();
      if (ow !== 'y' && ow !== 'yes') {
        console.log('Aborted — archive file exists and overwrite declined.');
        return;
      }
    }

    applyRollover({ newId, label, fullLabel, eventId, teamId, groupId });

    console.log('\n✅ Done. Next steps:');
    console.log('   1. npm run dev            # verify the new tab + that the old season still renders');
    console.log('   2. npm run scrape         # seed the new schedule from GotSport (after IDs are live)');
    console.log('   3. Review .github/workflows/scrape-gotsport.yml — adjust the cron day/time if needed');
    console.log(`   4. git add -A && git commit -m "Start ${fullLabel} season"`);
    console.log('');
  } finally {
    rl.close();
  }
}

// Run interactively only when invoked directly; export pure parts for testing.
if (require.main === module) {
  promptAndRun().catch((err) => {
    console.error('\n✗ new-season failed:', err.message);
    process.exit(1);
  });
}

module.exports = {
  varNameForId,
  deriveLabels,
  parseSeasons,
  renderSeasonsFile,
  gotsportUrls,
  planRollover,
  applyRollover,
  PATHS,
};
