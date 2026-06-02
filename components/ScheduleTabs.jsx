'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameCard } from '@/components/GameCard';
import { logger } from '@/lib/logger';

export default function ScheduleTabs({ upcomingGames, pastGames }) {
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    logger.pageView('Schedule');
    logger.info(`Loaded ${upcomingGames.length} upcoming games, ${pastGames.length} past games`);
  }, [upcomingGames.length, pastGames.length]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    logger.click(`Schedule Tab: ${tab}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <div className="bg-stadium-dark rounded-xl p-1 mb-4">
        <TabsList className="w-full grid grid-cols-3 bg-transparent border-0 h-auto p-0">
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-stadium-gray data-[state=active]:text-turf data-[state=active]:shadow-[0_0_10px_rgba(0,255,106,0.15)] data-[state=active]:font-semibold rounded-lg py-2.5 text-sm text-chalk-dim transition-all"
          >
            Upcoming
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-stadium-gray data-[state=active]:text-turf data-[state=active]:shadow-[0_0_10px_rgba(0,255,106,0.15)] data-[state=active]:font-semibold rounded-lg py-2.5 text-sm text-chalk-dim transition-all"
          >
            Past
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-stadium-gray data-[state=active]:text-turf data-[state=active]:shadow-[0_0_10px_rgba(0,255,106,0.15)] data-[state=active]:font-semibold rounded-lg py-2.5 text-sm text-chalk-dim transition-all"
          >
            All
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="upcoming">
        {upcomingGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {upcomingGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-chalk-dim">
            <p>No upcoming games</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="past">
        {pastGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pastGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-chalk-dim">
            <p>No past games</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="all">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...upcomingGames, ...pastGames].map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
