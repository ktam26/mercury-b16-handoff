'use client';

import { motion } from 'framer-motion';

const QUICK_PROMPTS = [
  { label: 'Next game info', query: "When's our next game?" },
  { label: 'Top scorers', query: 'Who are our top scorers?' },
  { label: 'Standings', query: 'What are the league standings?' },
  { label: 'Our record', query: "What's our season record?" },
  { label: 'Recent results', query: 'How did our last few games go?' },
  { label: 'Field map', query: 'Where do we play?' },
  { label: 'Tournament rules', query: 'What are the tournament rules?' },
];

const FOLLOW_UPS = {
  get_next_match: ['Team roster', 'Season standings', 'Last game result'],
  get_player_stats: ['Full schedule', 'Last game scorers', 'Goalkeeper stats'],
  get_league_standings: ['Next match info', 'Our season record', 'Recent results'],
  get_season_record: ['Top scorers', 'Recent results', 'League standings'],
  get_recent_form: ['Top scorers', 'League standings', 'Next game info'],
  list_schedule: ['Our season record', 'Top scorers', 'League standings'],
  get_goalkeeper_stats: ['Top scorers', 'Season record', 'Recent results'],
  get_tournament: ['Season record', 'League standings', 'Top scorers'],
  get_roster: ['Top scorers', 'Next game', 'Season record'],
};

function ChipButton({ label, onClick }) {
  return (
    <button
      role="option"
      onClick={onClick}
      className="shrink-0 px-4 py-2.5 rounded-full whitespace-nowrap text-[13px] font-medium text-[var(--halo-ink)] border border-[var(--halo-glass-border)] bg-[var(--halo-glass-strong)] backdrop-blur-xl transition-all duration-150 hover:border-[color-mix(in_srgb,var(--halo-accent)_40%,transparent)] hover:text-[var(--halo-accent-bright)] active:scale-95"
    >
      {label}
    </button>
  );
}

export function QuickPrompts({ onSelect, layout = 'scroll', max = 5 }) {
  const items = QUICK_PROMPTS.slice(0, max);
  if (layout === 'wrap') {
    return (
      <div role="listbox" className="flex flex-wrap gap-2 justify-center">
        {items.map((p) => (
          <ChipButton key={p.label} label={p.label} onClick={() => onSelect(p.query)} />
        ))}
      </div>
    );
  }
  return (
    <div role="listbox" className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
      {items.map((p) => (
        <ChipButton key={p.label} label={p.label} onClick={() => onSelect(p.query)} />
      ))}
    </div>
  );
}

export function FollowUpSuggestions({ lastToolName, onSelect, layout = 'wrap' }) {
  const suggestions = FOLLOW_UPS[lastToolName];
  if (!suggestions) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className={layout === 'scroll' ? 'px-4' : 'px-1'}
      role="listbox"
    >
      <div className="text-[10px] text-[var(--halo-faint)] font-mono uppercase tracking-wider mb-1.5">
        Related
      </div>
      <div className={layout === 'scroll' ? 'flex gap-2 overflow-x-auto no-scrollbar' : 'flex flex-wrap gap-2'}>
        {suggestions.map((s) => (
          <ChipButton key={s} label={s} onClick={() => onSelect(s)} />
        ))}
      </div>
    </motion.div>
  );
}
