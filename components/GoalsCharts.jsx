'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Shield } from 'lucide-react';

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

export default function GoalsCharts({ goalsScoredPath, goalsAgainstBars, goalsPerGame, goalsAgainstPerGame }) {
  return (
    <motion.section variants={item} className="grid grid-cols-2 gap-4">
      {/* Goals Scored Chart */}
      <div className="bg-stadium-card backdrop-blur-xl p-5 rounded-2xl border border-stadium-border shadow-lg hover:border-turf/30 transition-colors group">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-chalk-white">
            <TrendingUp className="w-3 h-3 text-turf" />
            Goals For
          </h3>
          <span className="text-[10px] text-chalk-dim bg-stadium-black px-2 py-0.5 rounded-full border border-stadium-border">
            Per Game
          </span>
        </div>
        <div className="relative mt-2 h-24">
          <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="line-chart-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#00ff6a" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00ff6a" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d={`${goalsScoredPath} L100,50 L0,50 Z`}
              fill="url(#line-chart-gradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            />
            <motion.path
              d={goalsScoredPath}
              stroke="#00ff6a"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
              style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 106, 0.5))' }}
            />
          </svg>
          <div className="absolute top-0 right-0 p-2 text-right">
            <span className="text-2xl font-bold text-turf scoreboard-number drop-shadow-xs">
              {goalsPerGame}
            </span>
          </div>
        </div>
      </div>

      {/* Goals Against Chart */}
      <div className="bg-stadium-card backdrop-blur-xl p-5 rounded-2xl border border-stadium-border shadow-lg hover:border-gold-bright/30 transition-colors group">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-chalk-white">
            <Shield className="w-3 h-3 text-gold-bright" />
            Goals Against
          </h3>
          <span className="text-[10px] text-chalk-dim bg-stadium-black px-2 py-0.5 rounded-full border border-stadium-border">
            Per Game
          </span>
        </div>
        <div className="relative mt-2 h-24">
          <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none" fill="none">
            {goalsAgainstBars.map((bar, i) => (
              <motion.rect
                key={i}
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                rx="2"
                fill="#FFD700"
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + i * 0.05 }}
                style={{ transformOrigin: `${bar.x + bar.width / 2}px 50px` }}
                className="opacity-80 group-hover:opacity-100 transition-opacity"
              />
            ))}
          </svg>
          <div className="absolute top-0 right-0 p-2 text-right">
            <span className="text-2xl font-bold text-gold-bright scoreboard-number drop-shadow-xs">
              {goalsAgainstPerGame}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
