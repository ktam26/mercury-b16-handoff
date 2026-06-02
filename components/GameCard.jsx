'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Shirt, Calendar, ChevronRight, Shield } from 'lucide-react';
import { formatGameDate, getArrivalTime, getShortTeamName } from '@/lib/game-utils';
import { cn } from '@/lib/utils';
import teamInfo from '@/data/team-info.json';

function GameCardComponent({ game }) {
  const isPast = game.result !== null;
  const isWin = isPast && game.result.us > game.result.them;
  const isLoss = isPast && game.result.us < game.result.them;
  const isScrimmage = game.type === 'scrimmage';
  const mercuryShortName = getShortTeamName(teamInfo.name);
  const opponentShortName = getShortTeamName(game.opponent);

  return (
    <Card className={cn(
      "border-0 transition-all duration-300 group hover:-translate-y-1 overflow-hidden",
      "bg-stadium-card shadow-lg hover:shadow-[0_0_20px_rgba(0,255,106,0.1)]",
      isPast && "opacity-80 hover:opacity-100"
    )}>
      {/* Accent Top Border */}
      <div className={cn(
        "h-1 w-full",
        isWin ? "bg-turf" : isLoss ? "bg-scoreboard-red" : "bg-stadium-border group-hover:bg-turf transition-colors"
      )} />

      <CardContent className="p-0">
        <Link href={`/game/${game.id}`} className="block">
          <div className="p-5">
            {/* Header: Date & Time */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-chalk-dim text-sm">
                <Calendar className="w-4 h-4 text-turf" />
                <span className="athletic-condensed uppercase tracking-wider font-medium">{formatGameDate(game.date)}</span>
                {isScrimmage && (
                  <Badge className="border-0 bg-stadium-border text-chalk-white font-bold uppercase tracking-wider text-[10px]">
                    Scrimmage
                  </Badge>
                )}
              </div>
              <Badge className={cn(
                "border-0 text-stadium-black font-bold uppercase tracking-wider text-[10px]",
                game.homeAway === 'home' ? "bg-turf" : "bg-gold-bright"
              )}>
                {game.homeAway === 'home' ? 'Home' : 'Away'}
              </Badge>
            </div>

            {/* Teams & Score */}
            <div className="flex items-center justify-between py-2 mb-4">
              {/* Us */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 bg-chalk-white rounded-full opacity-10 blur-md" />
                  <Image
                    src={game.homeAway === 'home' ? game.teamLogos.home : game.teamLogos.away}
                    alt={mercuryShortName}
                    fill
                    sizes="48px"
                    className="object-contain"
                  />
                </div>
                <span className="text-xs font-bold text-chalk-white text-center leading-tight">
                  {mercuryShortName}
                </span>
              </div>

              {/* Score / Time */}
              <div className="flex flex-col items-center px-2 min-w-[80px]">
                {isPast && game.result ? (
                  <div className="text-center">
                    <span className={cn(
                      "scoreboard-number text-3xl font-bold tracking-tight",
                      isWin ? "text-turf" : isLoss ? "text-scoreboard-red" : "text-chalk-white"
                    )}>
                      {game.result.us}-{game.result.them}
                    </span>
                    <p className={cn(
                      "text-[10px] uppercase font-black tracking-widest mt-1",
                      isWin ? "text-turf" : isLoss ? "text-scoreboard-red" : "text-chalk-dim"
                    )}>
                      {isWin ? 'WIN' : isLoss ? 'LOSS' : 'DRAW'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center bg-stadium-black/50 rounded-lg px-3 py-2 border border-stadium-border">
                    <span className="scoreboard-number text-2xl text-chalk-white">{game.time}</span>
                    <p className="text-[9px] text-chalk-dim uppercase mt-1">Kickoff</p>
                  </div>
                )}
              </div>

              {/* Opponent */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 bg-chalk-white rounded-full opacity-5 blur-md" />
                  <Image
                    src={(game.homeAway === 'home' ? game.teamLogos.away : game.teamLogos.home) || '/images/logos/mercury-b16.png'}
                    alt={opponentShortName}
                    fill
                    sizes="48px"
                    className="object-contain"
                  />
                </div>
                <span className="text-xs font-bold text-chalk-white text-center leading-tight line-clamp-2">
                  {opponentShortName}
                </span>
              </div>
            </div>

            {/* Footer Info */}
            <div className="space-y-2 border-t border-stadium-border/50 pt-4">
              <div className="flex items-center gap-2 text-xs text-chalk-dim">
                <MapPin className="w-3.5 h-3.5 text-turf/70" />
                <span className="truncate">{game.location.name}</span>
              </div>
              {isPast && game.result?.goalkeepers?.some(gk => gk.saves != null) && (() => {
                const gkMap = {};
                game.result.goalkeepers.forEach(gk => {
                  if (gk.saves != null) {
                    gkMap[gk.name] = (gkMap[gk.name] || 0) + gk.saves;
                  }
                });
                const entries = Object.entries(gkMap);
                if (entries.length === 0) return null;
                return (
                  <div className="flex items-center gap-2 text-xs text-chalk-dim">
                    <Shield className="w-3.5 h-3.5 text-gold-bright/70" />
                    <span>
                      {entries.map(([name, saves]) => (
                        <span key={name}>{name.split(' ')[0]}: <span className="text-chalk-white font-medium">{saves} saves</span></span>
                      ))}
                    </span>
                  </div>
                );
              })()}
              {!isPast && (
                <div className="flex items-center gap-2 text-xs text-chalk-dim">
                  <Clock className="w-3.5 h-3.5 text-gold-bright/70" />
                  <span>Arrive: <span className="text-chalk-white font-medium">{getArrivalTime(game.time)}</span></span>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Action Button */}
        <div className="px-5 pb-5 pt-0">
          <Button
            variant="outline"
            className="w-full h-9 text-xs uppercase tracking-wide border-stadium-border bg-transparent text-chalk-dim hover:bg-stadium-gray hover:text-white hover:border-turf/50 transition-all group"
            asChild
          >
            <Link href={`/game/${game.id}`}>
              <span className="group-hover:mr-2 transition-all">Match Details</span>
              <ChevronRight className="w-3 h-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export const GameCard = memo(GameCardComponent, (prevProps, nextProps) => {
  return prevProps.game.id === nextProps.game.id;
});
