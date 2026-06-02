'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { getShortTeamName } from '@/lib/game-utils';

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

// Helper to get result badge styling
function getResultBadge(game) {
  const isWin = game.result.us > game.result.them;
  const isLoss = game.result.us < game.result.them;
  if (isWin) return { text: 'Win', className: 'bg-turf text-stadium-black hover:bg-turf' };
  if (isLoss) return { text: 'Loss', className: 'bg-scoreboard-red text-chalk-white hover:bg-scoreboard-red' };
  return { text: 'Tie', className: 'bg-stadium-border text-chalk-dim' };
}

// Format date as MM/DD/YYYY
function formatShortDate(dateStr) {
  const date = new Date(dateStr);
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
}

export default function RecentFormCarousel({ last5Games }) {
  if (!last5Games || last5Games.length === 0) return null;

  return (
    <motion.section variants={item} className="pt-2">
      <h2 className="text-lg font-bold mb-4 px-2 uppercase tracking-widest text-chalk-white flex items-center gap-2 athletic-heading">
        <Activity className="w-5 h-5 text-turf" />
        Recent Form
      </h2>
      <div className="flex space-x-4 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory lg:justify-center lg:overflow-visible px-2">
        {last5Games.map((game, index) => {
          const badge = getResultBadge(game);
          return (
            <motion.div
              key={game.id || index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
              className="snap-center"
            >
              <Link
                href={`/game/${game.id}`}
                className="bg-stadium-card backdrop-blur-xl rounded-xl p-4 text-center shrink-0 w-36 flex flex-col items-center border border-stadium-border shadow-lg hover:-translate-y-1 hover:border-turf/50 hover:shadow-[0_0_15px_rgba(0,255,106,0.1)] transition-all duration-300 block group"
              >
                <p className="text-[10px] text-chalk-dim mb-3 font-mono border-b border-stadium-border/50 w-full pb-1">
                  {formatShortDate(game.date)}
                </p>
                <div className="w-14 h-14 rounded-full bg-stadium-black flex items-center justify-center overflow-hidden border border-stadium-border group-hover:border-chalk-white/20 transition-colors shadow-inner relative">
                  <div className="absolute inset-0 bg-stadium-gray opacity-20 group-hover:opacity-10 transition-opacity" />
                  {game.teamLogos?.away || game.teamLogos?.home ? (
                    <Image
                      src={game.homeAway === 'home' ? (game.teamLogos?.away || '/images/logos/default.png') : (game.teamLogos?.home || '/images/logos/default.png')}
                      alt={game.opponent}
                      width={40}
                      height={40}
                      className="object-contain p-2"
                    />
                  ) : (
                    <span className="font-bold text-xl text-chalk-white athletic-heading">
                      {getShortTeamName(game.opponent).substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold mt-2 line-clamp-1 text-chalk-white group-hover:text-turf transition-colors" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {getShortTeamName(game.opponent)}
                </p>
                <p className="text-xl font-bold my-1.5 scoreboard-number text-chalk-white tracking-widest">
                  {game.result.us}-{game.result.them}
                </p>
                <span className={`text-[9px] font-black py-0.5 px-3 rounded text-center uppercase tracking-widest w-full ${badge.className}`}>
                  {badge.text}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
