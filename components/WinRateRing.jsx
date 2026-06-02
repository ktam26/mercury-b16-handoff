'use client';

import { motion } from 'framer-motion';

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

export default function WinRateRing({
  wins,
  losses,
  ties,
  totalGames,
  animatedWinRate,
  animatedWins,
  animatedLosses,
  animatedTies,
  animatedGoalDiff,
}) {
  const circumference = 2 * Math.PI * 54;
  const winPercent = totalGames > 0 ? wins / totalGames : 0;
  const lossPercent = totalGames > 0 ? losses / totalGames : 0;

  return (
    <>
      {/* Win Rate Ring + Stats Card */}
      <motion.section
        variants={item}
        className="bg-stadium-card backdrop-blur-xl p-5 rounded-2xl border border-stadium-border shadow-2xl flex items-center space-x-6 relative overflow-hidden"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-turf/50 to-transparent opacity-50" />

        {/* Win Rate Ring */}
        <div className="relative w-36 h-36 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle (gray for ties) */}
            <circle cx="60" cy="60" r="54" fill="none" stroke="#2A2F38" strokeWidth="8" className="opacity-50" />
            {/* Win arc (green) - animated draw */}
            <motion.circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="#00FF6A"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (circumference * winPercent) }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 106, 0.4))' }}
            />
            {/* Loss arc (red) - animated draw */}
            <motion.circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="#FF3D3D"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (circumference * lossPercent) }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
              style={{
                transform: `rotate(${winPercent * 360}deg)`,
                transformOrigin: '60px 60px'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold athletic-heading text-chalk-white drop-shadow-md">
              {animatedWinRate}%
            </span>
            <span className="text-xs text-turf uppercase tracking-widest font-bold athletic-condensed mt-1">
              Win Rate
            </span>
          </div>
        </div>

        {/* W/L/T vertical stack */}
        <div className="grow grid grid-cols-3 gap-2 text-center border-l border-stadium-border pl-6">
          <div className="group">
            <p className="text-3xl font-bold text-turf scoreboard-number group-hover:scale-110 transition-transform duration-300">
              {animatedWins}
            </p>
            <p className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold mt-1">
              Wins
            </p>
          </div>
          <div className="group">
            <p className="text-3xl font-bold text-scoreboard-red scoreboard-number group-hover:scale-110 transition-transform duration-300">
              {animatedLosses}
            </p>
            <p className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold mt-1">
              Losses
            </p>
          </div>
          <div className="group">
            <p className="text-3xl font-bold text-chalk-dim scoreboard-number group-hover:scale-110 transition-transform duration-300">
              {animatedTies}
            </p>
            <p className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold mt-1">
              Ties
            </p>
          </div>
        </div>
      </motion.section>

      {/* Record Summary Bar */}
      <motion.section
        variants={item}
        className="bg-stadium-card backdrop-blur-xl p-4 rounded-xl border border-stadium-border shadow-lg flex justify-around text-center divide-x divide-stadium-border"
      >
        <div className="flex-1 px-2">
          <p className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold mb-1">
            Record
          </p>
          <p className="font-bold text-xl athletic-heading text-chalk-white">
            {wins}-{losses}-{ties}
          </p>
        </div>
        <div className="flex-1 px-2">
          <p className="text-[10px] text-chalk-dim uppercase tracking-widest font-bold mb-1">
            GD
          </p>
          <p
            className={`font-bold text-xl athletic-heading ${
              animatedGoalDiff > 0 ? "text-turf" :
              animatedGoalDiff < 0 ? "text-scoreboard-red" :
              "text-chalk-white"
            }`}
          >
            {animatedGoalDiff > 0 ? '+' : ''}{animatedGoalDiff}
          </p>
        </div>
      </motion.section>
    </>
  );
}
