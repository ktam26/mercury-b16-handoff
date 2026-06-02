'use client';

import { MessageCircle } from 'lucide-react';

export function VoiceFab({ onClick, isActive }) {
  return (
    <button
      onClick={onClick}
      aria-label={isActive ? 'Assistant active' : 'Open assistant'}
      className="group fixed z-50 right-4 bottom-[5.5rem] md:bottom-4 w-14 h-14 rounded-2xl border-none cursor-pointer flex items-center justify-center transition-all duration-200 ease-out hover:scale-[1.08] active:scale-95"
      style={{
        background: isActive
          ? 'linear-gradient(135deg, #059669, #34d399)'
          : 'linear-gradient(135deg, #00632e, var(--halo-accent))',
        boxShadow: isActive
          ? '0 4px 24px rgba(52,211,153,0.35), 0 0 0 4px rgba(52,211,153,0.1)'
          : '0 8px 24px rgba(0,132,61,0.35), 0 0 0 4px rgba(0,132,61,0.1)',
      }}
    >
      {isActive && (
        <span className="absolute inset-[-6px] rounded-[22px] border-2 border-emerald-400/30 animate-[voice-pulse_2s_ease-out_infinite]" />
      )}
      <MessageCircle className="w-6 h-6 text-white" />
    </button>
  );
}
