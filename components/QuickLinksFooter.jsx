'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Camera, ChevronRight } from 'lucide-react';

export default function QuickLinksFooter({ standingsUrl, animationDelay }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
      className="space-y-3 lg:space-y-0 lg:flex lg:gap-4 pt-4 max-w-4xl mx-auto w-full"
    >
      <a
        href={standingsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-stadium-card backdrop-blur-xl p-5 rounded-2xl border border-stadium-border shadow-lg flex items-center hover:bg-stadium-gray hover:border-turf/30 transition-all duration-300 lg:flex-1 group"
      >
        <div className="bg-turf/10 p-3 rounded-xl group-hover:bg-turf/20 transition-colors">
          <Trophy className="w-6 h-6 text-turf" />
        </div>
        <span className="font-bold text-lg ml-4 uppercase tracking-wider athletic-heading text-chalk-white">
          League Standings
        </span>
        <ChevronRight className="w-5 h-5 text-chalk-dim ml-auto group-hover:text-turf transform group-hover:translate-x-1 transition-all" />
      </a>

      <Link
        href="/photos"
        className="bg-stadium-card backdrop-blur-xl p-5 rounded-2xl border border-stadium-border shadow-lg flex items-center hover:bg-stadium-gray hover:border-gold-bright/30 transition-all duration-300 lg:flex-1 group"
      >
        <div className="bg-gold-bright/10 p-3 rounded-xl group-hover:bg-gold-bright/20 transition-colors">
          <Camera className="w-6 h-6 text-gold-bright" />
        </div>
        <span className="font-bold text-lg ml-4 uppercase tracking-wider athletic-heading text-chalk-white">
          Team Photos
        </span>
        <ChevronRight className="w-5 h-5 text-chalk-dim ml-auto group-hover:text-gold-bright transform group-hover:translate-x-1 transition-all" />
      </Link>
    </motion.section>
  );
}
