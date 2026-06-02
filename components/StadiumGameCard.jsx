'use client';

import { MapPin, ArrowRight, Shirt, Map, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function StadiumGameCard({ game, isPast, isLive, isFinal, onFieldClick, tournamentLocation }) {
    // Helper to determine result color
    const getResultColor = (us, them) => {
        if (us > them) return 'text-turf';
        if (us < them) return 'text-scoreboard-red';
        return 'text-chalk-dim';
    };

    const getResultText = (us, them) => {
        if (us > them) return 'WIN';
        if (us < them) return 'LOSS';
        return 'TIE';
    };

    const resultColor = game.result ? getResultColor(game.result.us, game.result.them) : '';

    return (
        <div
            className={cn(
                "relative p-4 rounded-xl transition-all border",
                // Past Game: Dimmed
                isPast && "bg-stadium-dark/50 border-stadium-gray opacity-60",
                // Live Game: Active Glow
                isLive && "bg-stadium-gray border-scoreboard-red glow-border",
                // Future Game: Normal
                !isPast && !isLive && !isFinal && "bg-stadium-gray/50 border-stadium-border hover:border-turf/50",
                // Final/Championship: Gold
                isFinal && "bg-linear-to-r from-stadium-gray to-gold-dark-tint border-gold-bright/30 glow-border-gold"
            )}
        >
            {/* Live Indicator */}
            {isLive && (
                <div className="flex items-center gap-2 mb-3">
                    <span className="live-indicator w-2 h-2 bg-scoreboard-red rounded-full" />
                    <span className="athletic-condensed text-scoreboard-red text-xs font-bold tracking-wider uppercase">
                        LIVE NOW
                    </span>
                </div>
            )}

            {/* Final Badge */}
            {isFinal && (
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-gold-bright">🏆</span>
                    <span className="trophy-gradient athletic-condensed text-sm font-bold tracking-wider uppercase">
                        CHAMPIONSHIP FINAL
                    </span>
                    {game.conditional && (
                        <span className="athletic-condensed text-chalk-dim text-xs">
                            ({game.note})
                        </span>
                    )}
                </div>
            )}

            {/* Main Content */}
            <div className="flex items-center justify-between">
                {/* Left: Time & Opponent */}
                <div className="flex items-center gap-4">
                    {/* Time Block */}
                    <div className="text-center min-w-[60px]">
                        <p className="scoreboard-number text-turf text-xl font-bold">
                            {game.time.split(' ')[0]}
                        </p>
                        <p className="athletic-condensed text-chalk-dim text-[10px] uppercase tracking-wider">
                            {game.time.split(' ')[1]}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-12 bg-stadium-border" />

                    {/* Opponent Info */}
                    <div>
                        <p className="athletic-condensed text-chalk-white text-lg font-semibold">
                            vs {game.opponentShort || game.opponent}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="athletic-condensed text-chalk-dim text-sm flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Field {game.field}
                            </span>
                            {game.jersey && game.jersey !== 'tbd' && (
                                <span className="athletic-condensed text-chalk-dim text-sm flex items-center gap-1">
                                    <Shirt className="w-3 h-3" />
                                    <span className="capitalize">{game.jersey}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Badge */}
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "team-badge",
                        game.homeAway === 'home' && "home-badge",
                        game.homeAway === 'away' && "away-badge",
                        game.homeAway === 'tbd' && "bg-stadium-gray text-chalk-dim"
                    )}>
                        {game.homeAway === 'home' ? 'HOME' : game.homeAway === 'away' ? 'AWAY' : 'TBD'}
                    </span>
                </div>
            </div>

            {/* Result (if played) */}
            {game.result && (
                <div className={cn(
                    "mt-4 p-3 rounded-lg text-center",
                    game.result.us > game.result.them && "bg-turf/10 border border-turf/30",
                    game.result.us < game.result.them && "bg-scoreboard-red/10 border border-scoreboard-red/30",
                    game.result.us === game.result.them && "bg-chalk-dim/10 border border-chalk-dim/30"
                )}>
                    <span className="scoreboard-number text-3xl font-black">
                        <span className={game.result.us > game.result.them ? 'text-turf' : 'text-chalk-white'}>
                            {game.result.us}
                        </span>
                        <span className="text-chalk-dim mx-2">-</span>
                        <span className={game.result.us < game.result.them ? 'text-scoreboard-red' : 'text-chalk-white'}>
                            {game.result.them}
                        </span>
                    </span>
                    <span className={cn(
                        "athletic-condensed ml-3 text-sm font-bold uppercase tracking-wider",
                        resultColor
                    )}>
                        {getResultText(game.result.us, game.result.them)}
                    </span>
                </div>
            )}

            {/* Field & Directions Links */}
            {!isPast && !isFinal && (
                <div className="mt-3 flex items-center gap-4">
                    {onFieldClick && (
                        <button
                            onClick={() => onFieldClick(game.field)}
                            className="inline-flex items-center gap-1.5 text-turf athletic-condensed text-xs font-medium tracking-wider hover:underline"
                        >
                            <Map className="w-3.5 h-3.5" />
                            FIND FIELD
                        </button>
                    )}
                    <a
                        href={tournamentLocation?.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(game.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-chalk-dim athletic-condensed text-xs font-medium tracking-wider hover:text-chalk-white hover:underline"
                    >
                        DIRECTIONS
                        <ChevronRight className="w-3 h-3" />
                    </a>
                </div>
            )}
        </div>
    );
}
