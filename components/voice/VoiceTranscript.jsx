'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SOURCE_LABELS = {
  get_next_match: 'Next match',
  get_player_stats: 'Top scorers',
  get_league_standings: 'Standings',
  get_season_record: 'Season stats',
  get_recent_form: 'Recent results',
  list_schedule: 'Schedule',
  get_goalkeeper_stats: 'Goalkeeper stats',
  get_tournament: 'Tournament',
  list_tournaments: 'Tournaments',
  get_roster: 'Roster',
  get_game_details: 'Game details',
  list_seasons: 'Seasons',
  list_photo_albums: 'Photos',
  get_league_results: 'League results',
};

function MercuryAvatar() {
  return (
    <div
      className="grid place-items-center text-white font-extrabold text-[12px] shrink-0"
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--halo-accent), #0aa352)',
      }}
    >
      M
    </div>
  );
}

export function VoiceTranscript({ inputTranscript, outputTranscript, state, lastToolName }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [inputTranscript, outputTranscript]);

  const sourceLabel = lastToolName ? (SOURCE_LABELS[lastToolName] || lastToolName) : null;
  const showThinking = state === 'thinking' && !outputTranscript;

  return (
    <div className="flex flex-col gap-3 px-4">
      {/* User bubble — shown while listening or whenever we have an input transcript */}
      <AnimatePresence mode="wait">
        {inputTranscript && (
          <motion.div
            key="user"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="self-end max-w-[80%]"
          >
            <div
              className="px-4 py-2.5 rounded-[18px] text-[14px] font-medium leading-relaxed text-white"
              style={{
                background: 'linear-gradient(135deg, var(--halo-accent) 0%, #0aa352 100%)',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--halo-accent) 20%, transparent)',
              }}
            >
              {inputTranscript}
              {state === 'listening' && <span className="ml-1 animate-pulse opacity-70">|</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mercury bubble */}
      {(outputTranscript || showThinking) && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="self-start max-w-[88%] flex gap-2.5"
        >
          <MercuryAvatar />
          <div className="flex-1 min-w-0">
            <div
              className="px-4 py-2.5 rounded-[18px] text-[14px] leading-[1.55] text-[var(--halo-ink)]"
              style={{
                background: 'var(--halo-glass-strong)',
                border: '1px solid var(--halo-glass-border)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {showThinking ? (
                <div className="flex gap-1 py-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--halo-faint)]"
                      style={{
                        animation: 'voicePulse 1.2s infinite',
                        animationDelay: `${i * 0.18}s`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="[&_strong]:font-semibold [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_h3]:font-bold [&_h3]:text-[14px] [&_h3]:mt-2 [&_h3]:mb-1 [&_h4]:font-bold [&_h4]:text-[13px] [&_h4]:mt-1.5 [&_h4]:mb-1 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:space-y-1 [&_ol]:my-2 [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:space-y-1 [&_ul]:my-2 [&_table]:w-full [&_table]:text-xs [&_table]:my-2 [&_th]:text-left [&_th]:font-bold [&_th]:pb-1 [&_th]:pr-3 [&_th]:border-b [&_th]:border-[var(--halo-row-divider)] [&_td]:py-1 [&_td]:pr-3 [&_td]:border-b [&_td]:border-[var(--halo-row-divider)] [&_a]:text-[var(--halo-accent-bright)] [&_a]:underline">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{outputTranscript}</ReactMarkdown>
                </div>
              )}
            </div>
            {/* Source chip — only when we have an answer + a known tool */}
            {!showThinking && outputTranscript && sourceLabel && (
              <div className="flex gap-1.5 mt-2">
                <div
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                  style={{
                    background: 'color-mix(in srgb, var(--halo-accent) 12%, transparent)',
                    color: 'var(--halo-accent-bright)',
                    border: '1px solid color-mix(in srgb, var(--halo-accent) 30%, transparent)',
                  }}
                >
                  <span aria-hidden>📎</span>
                  {sourceLabel}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div ref={scrollRef} />
    </div>
  );
}
