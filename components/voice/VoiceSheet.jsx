'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Send, RotateCcw, Volume2, MessageSquare } from 'lucide-react';
import { VoiceVisualizer } from './VoiceVisualizer';
import { VoiceTranscript } from './VoiceTranscript';
import { VoiceCardRenderer } from './VoiceCards';
import { QuickPrompts, FollowUpSuggestions } from './VoiceChips';

const STATUS = {
  idle: { label: 'Ready', dot: 'var(--halo-accent-bright)', live: false },
  connecting: { label: 'Connecting', dot: 'var(--halo-faint)', live: false },
  listening: { label: 'Listening', dot: 'var(--halo-accent-bright)', live: true },
  thinking: { label: 'Thinking', dot: '#fbbf24', live: true },
  speaking: { label: 'Responding', dot: '#60a5fa', live: true },
  error: { label: "Didn't catch that", dot: '#ef4444', live: false },
  muted: { label: 'Muted', dot: '#ef4444', live: false },
};

function ListeningPill({ state }) {
  const status = STATUS[state] || STATUS.idle;
  return (
    <div
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full backdrop-blur-xl"
      style={{
        background: 'var(--halo-glass-strong)',
        border: '1px solid var(--halo-glass-border)',
      }}
    >
      <div className="flex gap-[3px]">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-[5px] h-[5px] rounded-full"
            style={{
              background: status.dot,
              opacity: status.live ? (i === 0 ? 1 : i === 4 ? 0.4 : 0.7) : 0.3,
              animation: status.live ? `voicePulse 1.2s ${i * 0.12}s infinite` : 'none',
            }}
          />
        ))}
      </div>
      <span
        className="text-[13px] font-semibold tracking-tight"
        style={{ color: 'var(--halo-ink)' }}
      >
        {status.label}
      </span>
    </div>
  );
}

function ModeToggle({ textMode, onToggle }) {
  return (
    <div
      className="inline-flex p-1 rounded-full backdrop-blur-xl"
      style={{
        background: 'var(--halo-glass-strong)',
        border: '1px solid var(--halo-glass-border)',
      }}
    >
      <button
        onClick={() => { if (textMode) onToggle(); }}
        aria-label="Voice mode"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150"
        style={
          !textMode
            ? {
                background: 'color-mix(in srgb, var(--halo-accent) 12%, transparent)',
                color: 'var(--halo-accent-bright)',
                border: '1px solid color-mix(in srgb, var(--halo-accent) 30%, transparent)',
              }
            : { color: 'var(--halo-muted)', border: '1px solid transparent' }
        }
      >
        <Volume2 className="w-3.5 h-3.5" />
        Voice
      </button>
      <button
        onClick={() => { if (!textMode) onToggle(); }}
        aria-label="Text mode"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150"
        style={
          textMode
            ? {
                background: 'color-mix(in srgb, var(--halo-accent) 12%, transparent)',
                color: 'var(--halo-accent-bright)',
                border: '1px solid color-mix(in srgb, var(--halo-accent) 30%, transparent)',
              }
            : { color: 'var(--halo-muted)', border: '1px solid transparent' }
        }
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Text
      </button>
    </div>
  );
}

function CircleIconButton({ onClick, ariaLabel, children, tone = 'glass' }) {
  const styles =
    tone === 'glass'
      ? {
          background: 'var(--halo-glass-strong)',
          border: '1px solid var(--halo-glass-border)',
          color: 'var(--halo-ink)',
        }
      : tone === 'danger'
        ? {
            background: '#ef4444',
            border: 'none',
            color: '#fff',
            boxShadow: '0 6px 16px rgba(239,68,68,0.4)',
          }
        : {
            background: 'linear-gradient(135deg, var(--halo-accent) 0%, #0aa352 100%)',
            border: 'none',
            color: '#fff',
            boxShadow: '0 6px 16px color-mix(in srgb, var(--halo-accent) 35%, transparent)',
          };
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="grid place-items-center rounded-full backdrop-blur-xl transition-transform duration-150 active:scale-95 shrink-0"
      style={{ width: 40, height: 40, ...styles }}
    >
      {children}
    </button>
  );
}

export function VoiceSheet({
  isOpen,
  onClose,
  state,
  inputTranscript,
  outputTranscript,
  cards,
  error,
  lastToolName,
  textInput,
  onTextInputChange,
  onTextSend,
  onMicToggle,
  onRetry,
  onChipSelect,
  textMode,
  onToggleMode,
  isMuted,
  onMuteToggle,
}) {
  const displayState = isMuted ? 'muted' : state;
  const isListening = state === 'listening' || state === 'speaking';
  const isVoiceMode = !textMode;
  const hasContent = !!(inputTranscript || outputTranscript || cards?.length);
  const scrollRef = useRef(null);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [cards, outputTranscript]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — mobile is part of the sheet itself, but on desktop dim the page */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] hidden md:block backdrop-blur-xl"
            style={{
              background:
                'color-mix(in srgb, var(--halo-bg) 50%, transparent)',
            }}
          />

          {/* Sheet — fullscreen on mobile, centered modal on desktop */}
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Ask Mercury"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="
              fixed z-[100] flex flex-col overflow-hidden
              inset-0 rounded-none
              md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
              md:w-[720px] md:h-[560px] md:rounded-[32px]
              md:max-w-[calc(100vw-3rem)] md:max-h-[calc(100vh-3rem)]
            "
            style={{
              background: 'var(--halo-bg)',
              color: 'var(--halo-ink)',
              border: '1px solid var(--halo-glass-border)',
              boxShadow: 'var(--halo-shadow-glass)',
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif",
            }}
          >
            {/* Ambient backdrop tint */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--halo-accent) 10%, transparent), transparent 50%), radial-gradient(circle at 80% 75%, color-mix(in srgb, var(--halo-accent) 7%, transparent), transparent 55%)',
                filter: 'blur(40px)',
                opacity: 0.7,
              }}
            />

            {/* Mobile-only safe-area spacer */}
            <div className="h-[max(env(safe-area-inset-top),28px)] md:hidden" />

            {/* HEADER */}
            <div className="relative px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3 md:border-b md:border-[var(--halo-row-divider)]">
              {/* Desktop has Mercury mark + title */}
              <div className="hidden md:flex items-center gap-3">
                <div
                  className="grid place-items-center text-white font-extrabold text-[15px]"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--halo-accent), #0aa352)',
                    boxShadow:
                      '0 4px 14px color-mix(in srgb, var(--halo-accent) 35%, transparent)',
                  }}
                >
                  M
                </div>
                <div>
                  <div className="text-[15px] font-bold tracking-tight">Ask Mercury</div>
                  <div className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--halo-muted)' }}>
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: STATUS[displayState]?.dot || STATUS.idle.dot }}
                    />
                    {isVoiceMode && state === 'listening' ? 'Listening · tap to stop' : (STATUS[displayState]?.label || 'Ready')}
                  </div>
                </div>
              </div>

              {/* Mobile: Listening pill */}
              <div className="md:hidden">
                <ListeningPill state={displayState} />
              </div>

              <div className="flex-1" />

              <ModeToggle textMode={textMode} onToggle={onToggleMode} />

              <button
                onClick={onClose}
                aria-label="Close"
                className="grid place-items-center rounded-full backdrop-blur-xl shrink-0"
                style={{
                  width: 38,
                  height: 38,
                  background: 'var(--halo-glass-strong)',
                  border: '1px solid var(--halo-glass-border)',
                  color: 'var(--halo-ink)',
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BODY */}
            <div
              ref={scrollRef}
              className="relative flex-1 overflow-y-auto"
            >
              {isVoiceMode && !hasContent ? (
                /* Voice — empty stage with orb */
                <div className="h-full flex flex-col items-center justify-center text-center px-6 py-4">
                  <VoiceVisualizer state={displayState} size="lg" />
                  <div className="mt-7 text-[22px] font-bold tracking-tight">
                    {state === 'listening'
                      ? "I'm listening…"
                      : state === 'thinking'
                        ? 'Thinking…'
                        : state === 'speaking'
                          ? 'Responding…'
                          : isMuted
                            ? 'Muted'
                            : 'Ready when you are'}
                  </div>
                  <div
                    className="mt-2 text-[14px] leading-relaxed max-w-[300px] md:max-w-[380px]"
                    style={{ color: 'var(--halo-muted)' }}
                  >
                    Ask anything about Mercury — schedule, stats, scoring leaders, tournament info.
                  </div>
                  {/* Desktop chip cluster sits inside the stage */}
                  <div className="hidden md:block mt-7 max-w-[540px]">
                    <QuickPrompts onSelect={onChipSelect} layout="wrap" max={6} />
                  </div>
                </div>
              ) : (
                /* Text mode OR voice with content — show transcript + cards */
                <div className="py-4 md:py-5 flex flex-col gap-3">
                  {!isVoiceMode && !hasContent && (
                    <div className="px-6 py-8 flex flex-col items-center text-center">
                      <div
                        className="grid place-items-center text-white font-extrabold text-[28px]"
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--halo-accent), #0aa352)',
                          boxShadow:
                            '0 14px 38px color-mix(in srgb, var(--halo-accent) 33%, transparent)',
                        }}
                      >
                        M
                      </div>
                      <div className="mt-5 text-[20px] font-bold tracking-tight">
                        Ask Mercury anything
                      </div>
                      <div
                        className="mt-1.5 text-[14px] leading-relaxed max-w-[300px]"
                        style={{ color: 'var(--halo-muted)' }}
                      >
                        Get the scoop on schedule, stats, and tournaments.
                      </div>
                    </div>
                  )}

                  <VoiceTranscript
                    inputTranscript={inputTranscript}
                    outputTranscript={outputTranscript}
                    state={state}
                    lastToolName={lastToolName}
                  />

                  {state === 'error' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mx-4 p-4 rounded-2xl text-center"
                      style={{
                        background: 'color-mix(in srgb, #ef4444 8%, transparent)',
                        border: '1px solid color-mix(in srgb, #ef4444 18%, transparent)',
                      }}
                    >
                      <div className="text-[14px] mb-2" style={{ color: '#ef4444' }}>
                        {error || "I didn't catch that"}
                      </div>
                      <div
                        className="text-[12px] mb-3"
                        style={{ color: 'var(--halo-muted)' }}
                      >
                        Try speaking louder or use text input below
                      </div>
                      <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-[12px] font-semibold"
                        style={{
                          background: 'color-mix(in srgb, #ef4444 12%, transparent)',
                          border: '1px solid color-mix(in srgb, #ef4444 25%, transparent)',
                          color: '#ef4444',
                        }}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Try Again
                      </button>
                    </motion.div>
                  )}

                  {!!cards?.length && (
                    <div className="px-4">
                      <VoiceCardRenderer cards={cards} />
                    </div>
                  )}

                  {(state === 'idle' || state === 'listening') && lastToolName && (
                    <FollowUpSuggestions
                      lastToolName={lastToolName}
                      onSelect={onChipSelect}
                      layout="scroll"
                    />
                  )}
                </div>
              )}
            </div>

            {/* SUGGESTION CHIPS (mobile scroll rail / desktop compact wrap above input in text mode) */}
            {!hasContent && isVoiceMode && (
              <div className="md:hidden shrink-0 pb-2">
                <QuickPrompts onSelect={onChipSelect} layout="scroll" max={6} />
              </div>
            )}
            {!isVoiceMode && !hasContent && (
              <div className="shrink-0 px-4 md:px-6 pb-2 flex gap-2 flex-wrap">
                <QuickPrompts onSelect={onChipSelect} layout="wrap" max={5} />
              </div>
            )}

            {/* INPUT DOCK */}
            <div
              className="relative shrink-0 px-4 md:px-6 pt-2 md:pt-3 pb-4 md:pb-5"
              style={{ borderTop: '1px solid var(--halo-row-divider)' }}
            >
              <div
                className="flex items-center gap-2 rounded-full backdrop-blur-xl"
                style={{
                  background: 'var(--halo-glass-strong)',
                  border: '1px solid var(--halo-glass-border)',
                  padding: isVoiceMode && isListening ? '6px 6px 6px 14px' : '6px 6px 6px 16px',
                }}
              >
                {isVoiceMode && isListening ? (
                  <>
                    <VoiceVisualizer state={displayState} size="sm" />
                    <div
                      className="flex-1 text-[14px] italic"
                      style={{ color: 'var(--halo-muted)' }}
                    >
                      {state === 'speaking' ? 'Responding…' : 'Speak now…'}
                    </div>
                    <CircleIconButton
                      onClick={onMicToggle}
                      ariaLabel="Stop listening"
                      tone="danger"
                    >
                      <div className="w-3.5 h-3.5 rounded-[2px] bg-white" />
                    </CircleIconButton>
                  </>
                ) : (
                  <>
                    <input
                      value={textInput || ''}
                      onChange={(e) => onTextInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onTextSend()}
                      placeholder="Ask about Mercury…"
                      className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:opacity-60"
                      style={{ color: 'var(--halo-ink)' }}
                    />
                    {/* Mute (only while a voice session is active) */}
                    {isVoiceMode && (state === 'listening' || state === 'speaking' || state === 'thinking') && (
                      <CircleIconButton
                        onClick={onMuteToggle}
                        ariaLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                        tone="glass"
                      >
                        <MicOff
                          className="w-[18px] h-[18px]"
                          style={{ color: isMuted ? '#ef4444' : 'var(--halo-muted)' }}
                        />
                      </CircleIconButton>
                    )}
                    {/* Mic toggle — switches to voice if currently in text mode */}
                    {!textInput?.trim() && (
                      <CircleIconButton
                        onClick={onMicToggle}
                        ariaLabel="Start listening"
                        tone="glass"
                      >
                        <Mic className="w-4 h-4" style={{ color: 'var(--halo-muted)' }} />
                      </CircleIconButton>
                    )}
                    {/* Send when there is text */}
                    {!!textInput?.trim() && (
                      <CircleIconButton
                        onClick={onTextSend}
                        ariaLabel="Send message"
                        tone="accent"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </CircleIconButton>
                    )}
                  </>
                )}
              </div>
              <div
                className="hidden md:block mt-2 text-[11px] text-center tracking-wide"
                style={{ color: 'var(--halo-muted)' }}
              >
                Mercury AI uses your team's data. Verify dates and times against the schedule.
              </div>
            </div>

            {/* Mobile home indicator */}
            <div className="md:hidden h-[max(env(safe-area-inset-bottom),12px)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
