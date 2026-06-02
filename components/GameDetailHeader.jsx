'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatGameDateLong, getArrivalTime, getShortTeamName } from '@/lib/game-utils';
import teamInfo from '@/data/team-info.json';

export function GameDetailHeader({ game }) {
    const isPast = game.result !== null;
    const isWin = isPast && game.result.us > game.result.them;
    const isLoss = isPast && game.result.us < game.result.them;
    const isScrimmage = game.type === 'scrimmage';
    const videoUrl = game.videoUrl;
    const mercuryShortName = getShortTeamName(teamInfo.name);
    const opponentShortName = getShortTeamName(game.opponent);

    return (
        <div className="mb-8 relative overflow-hidden rounded-2xl border border-stadium-border bg-stadium-gray/50 shadow-2xl">
            {/* Stadium Lights & Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-turf/5 blur-[100px] rounded-full mix-blend-screen" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold-bright/5 blur-[100px] rounded-full mix-blend-screen" />
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-stadium-black/50 to-stadium-black/80" />
            </div>

            <div className="relative z-10 p-6 md:p-8">
                {/* Date & Time Strip */}
                <div className="flex justify-center mb-8">
                    <div className="text-center">
                        <p className="athletic-condensed text-chalk-dim uppercase tracking-widest text-sm mb-2">
                            {formatGameDateLong(game.date)}
                        </p>
                        <div className="inline-flex items-center gap-4 bg-stadium-black/60 backdrop-blur-md px-6 py-3 rounded-xl border border-stadium-border/50 shadow-inner">
                            <div className="text-right">
                                <p className="text-[10px] uppercase text-chalk-dim tracking-wider font-semibold">Arrive By</p>
                                <p className="scoreboard-number text-chalk-white text-lg">{getArrivalTime(game.time)}</p>
                            </div>
                            <div className="w-px h-8 bg-stadium-border" />
                            <div className="text-left">
                                <p className="text-[10px] uppercase text-turf tracking-wider font-semibold">Kickoff</p>
                                <p className="scoreboard-number text-turf text-xl md:text-2xl">{game.time}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Matchup */}
                <div className="flex items-center justify-between max-w-3xl mx-auto mb-8">
                    {/* Home/Mercury Team */}
                    <div className="flex-1 flex flex-col items-center group">
                        <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4 transition-transform duration-500 group-hover:scale-105">
                            <div className="absolute inset-0 bg-chalk-white/10 rounded-full blur-2xl group-hover:bg-turf/20 transition-colors duration-500" />
                            <div className="relative w-full h-full p-4 bg-stadium-gray rounded-full border border-stadium-border shadow-lg">
                                <Image
                                    src={game.homeAway === 'home' ? game.teamLogos.home : game.teamLogos.away}
                                    alt={mercuryShortName}
                                    fill
                                    sizes="(max-width: 768px) 96px, 128px"
                                    className="object-contain p-2"
                                />
                            </div>
                        </div>
                        <h2 className="athletic-heading text-xl md:text-2xl font-bold text-chalk-white text-center">
                            {mercuryShortName}
                        </h2>
                    </div>

                    {/* Center Stage: VS or Score */}
                    <div className="px-4 md:px-12 flex flex-col items-center">
                        {isPast && game.result ? (
                            <div className="text-center animate-scale-in">
                                <div className="flex items-center gap-4 mb-3">
                                    <span className={cn(
                                        "scoreboard-number text-5xl md:text-7xl font-bold filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                                        isWin ? "text-turf text-shadow-glow-turf" : "text-chalk-white"
                                    )}>
                                        {game.result.us}
                                    </span>
                                    <span className="w-4 h-1 bg-stadium-border rounded-full" />
                                    <span className={cn(
                                        "scoreboard-number text-5xl md:text-7xl font-bold filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                                        isLoss ? "text-scoreboard-red text-shadow-glow-red" : "text-chalk-white"
                                    )}>
                                        {game.result.them}
                                    </span>
                                </div>
                                <Badge className={cn(
                                    "border-0 px-3 py-1 text-xs tracking-widest font-bold uppercase",
                                    isWin && "bg-turf text-stadium-black hover:bg-turf",
                                    isLoss && "bg-scoreboard-red text-chalk-white hover:bg-scoreboard-red",
                                    !isWin && !isLoss && "bg-stadium-border text-chalk-dim"
                                )}>
                                    {isWin ? 'Victory' : isLoss ? 'Defeat' : 'Draw'}
                                </Badge>
                            </div>
                        ) : (
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-stadium-black rounded-full flex items-center justify-center border-2 border-stadium-border shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                                <span className="athletic-heading text-2xl text-chalk-dim">VS</span>
                            </div>
                        )}
                    </div>

                    {/* Opponent Team */}
                    <div className="flex-1 flex flex-col items-center group">
                        <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4 transition-transform duration-500 group-hover:scale-105">
                            <div className="absolute inset-0 bg-chalk-white/5 rounded-full blur-2xl group-hover:bg-gold-bright/10 transition-colors duration-500" />
                            <div className="relative w-full h-full p-4 bg-stadium-gray rounded-full border border-stadium-border shadow-lg">
                                <Image
                                    src={(game.homeAway === 'home' ? game.teamLogos.away : game.teamLogos.home) || '/images/logos/mercury-b16.png'}
                                    alt={opponentShortName}
                                    fill
                                    sizes="(max-width: 768px) 96px, 128px"
                                    className="object-contain p-2"
                                />
                            </div>
                        </div>
                        <h2 className="athletic-heading text-xl md:text-2xl font-bold text-chalk-white text-center wrap-break-word max-w-[140px] leading-tight">
                            {opponentShortName}
                        </h2>
                    </div>
                </div>

                {/* Game Meta Pills */}
                <div className="flex flex-wrap items-center justify-center gap-3 border-t border-stadium-border/50 pt-6">
                    {/* Scrimmage Badge */}
                    {isScrimmage && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-bright/20 rounded-full border border-gold-bright/30 shadow-sm">
                            <span className="text-sm">🤝</span>
                            <span className="athletic-condensed text-gold-bright text-xs uppercase tracking-wider font-bold">
                                Scrimmage
                            </span>
                        </div>
                    )}

                    {/* Home/Away Pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stadium-black rounded-full border border-stadium-border shadow-sm">
                        <span className="text-sm">🏠</span>
                        <span className="athletic-condensed text-chalk-dim text-xs uppercase tracking-wider">
                            {game.homeAway === 'home' ? 'Home Game' : 'Away Game'}
                        </span>
                    </div>

                    {/* Kit Pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stadium-black rounded-full border border-stadium-border shadow-sm">
                        <div className={cn(
                            "w-3 h-3 rounded-full border border-stadium-border",
                            game.jersey === 'white' ? 'bg-white' : 'bg-black'
                        )} />
                        <span className="athletic-condensed text-chalk-dim text-xs uppercase tracking-wider">
                            {game.jersey} Kit
                        </span>
                    </div>
                </div>

                {/* Goal Timeline or Fallback Stats */}
                {isPast && game.result?.timeline?.length > 0 ? (
                    <div className="mt-6 pt-6 border-t border-stadium-border/50 max-w-2xl mx-auto">
                        <div className="bg-stadium-black/40 rounded-xl p-4 border border-stadium-border/30">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-turf">⚽</span>
                                <p className="athletic-condensed text-turf text-xs uppercase tracking-widest font-bold">Goal Timeline</p>
                            </div>
                            <div className="relative">
                                {/* Center line */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stadium-border/60 -translate-x-1/2" />

                                {(() => {
                                    const timeline = game.result.timeline;
                                    const firstHalf = timeline.filter(e => e.minute < 30);
                                    const secondHalf = timeline.filter(e => e.minute >= 30);
                                    const halves = [];
                                    if (firstHalf.length > 0) halves.push({ label: '1st Half', events: firstHalf });
                                    if (secondHalf.length > 0) halves.push({ label: '2nd Half', events: secondHalf });

                                    return halves.map((half, hIdx) => (
                                        <div key={half.label}>
                                            {hIdx > 0 && (
                                                <div className="relative flex items-center justify-center my-3">
                                                    <div className="absolute left-0 right-0 h-px bg-stadium-border/40" />
                                                    <span className="relative z-10 px-3 py-0.5 bg-stadium-gray text-chalk-dim text-[10px] uppercase tracking-widest font-bold athletic-condensed rounded-full border border-stadium-border/40">
                                                        {half.label}
                                                    </span>
                                                </div>
                                            )}
                                            {hIdx === 0 && halves.length > 1 && (
                                                <div className="relative flex items-center justify-center mb-3">
                                                    <div className="absolute left-0 right-0 h-px bg-stadium-border/40" />
                                                    <span className="relative z-10 px-3 py-0.5 bg-stadium-gray text-chalk-dim text-[10px] uppercase tracking-widest font-bold athletic-condensed rounded-full border border-stadium-border/40">
                                                        {half.label}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                {half.events.map((event, eIdx) => {
                                                    const isMercury = event.team === 'mercury';
                                                    const isOwnGoal = event.scorer === 'Own Goal';
                                                    return (
                                                        <div key={`${event.minute}-${eIdx}`} className="relative flex items-center min-h-[36px]">
                                                            {/* Mercury goal — left side */}
                                                            {isMercury && (
                                                                <div className="flex-1 flex justify-end pr-4">
                                                                    <div className="text-right">
                                                                        <span className={cn(
                                                                            "text-sm font-semibold",
                                                                            isOwnGoal ? "text-chalk-dim italic" : "text-turf"
                                                                        )}>
                                                                            {event.scorer}
                                                                        </span>
                                                                        {event.assist && (
                                                                            <span className="text-chalk-dim text-xs ml-1.5">
                                                                                ({event.assist})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {!isMercury && <div className="flex-1" />}

                                                            {/* Minute badge — center */}
                                                            {(() => {
                                                                const badgeBase = "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold scoreboard-number border";
                                                                const mercuryColors = "bg-turf/20 text-turf border-turf/40";
                                                                const hasVideoLink = isMercury && event.videoTimestamp != null && videoUrl;
                                                                const fkBadge = event.goalType === 'FK' && (
                                                                    <span className="absolute -top-1 -right-1 px-1 py-[1px] rounded text-[8px] leading-none font-bold athletic-condensed tracking-wider bg-gold-bright/20 text-gold-bright border border-gold-bright/50">
                                                                        FK
                                                                    </span>
                                                                );
                                                                return (
                                                            <div className="relative z-10 flex-shrink-0 w-10 flex justify-center">
                                                                {hasVideoLink ? (
                                                                    <a
                                                                        href={`${videoUrl}&t=${event.videoTimestamp}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={cn(badgeBase, mercuryColors, "relative hover:bg-turf/40 hover:scale-110 hover:shadow-[0_0_12px_rgba(0,255,106,0.4)] transition-all")}
                                                                    >
                                                                        {event.minute}&apos;
                                                                        {fkBadge}
                                                                    </a>
                                                                ) : (
                                                                    <span className={cn(
                                                                        badgeBase,
                                                                        "relative",
                                                                        isMercury
                                                                            ? mercuryColors
                                                                            : "bg-scoreboard-red/20 text-scoreboard-red border-scoreboard-red/40"
                                                                    )}>
                                                                        {event.minute}&apos;
                                                                        {fkBadge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                                );
                                                            })()}

                                                            {/* Opponent goal — right side */}
                                                            {!isMercury && (
                                                                <div className="flex-1 flex justify-start pl-4">
                                                                    <span className="text-sm font-semibold text-scoreboard-red">
                                                                        Goal
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {isMercury && <div className="flex-1" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                ) : isPast && (game.result?.goalScorers?.length > 0 || game.result?.assists?.length > 0) ? (
                    <div className="mt-6 pt-6 border-t border-stadium-border/50 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        {game.result.goalScorers?.length > 0 && (
                            <div className="bg-stadium-black/40 rounded-xl p-4 border border-stadium-border/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-turf">⚽</span>
                                    <p className="athletic-condensed text-turf text-xs uppercase tracking-widest font-bold">Goals</p>
                                </div>
                                <p className="text-chalk-white font-medium text-sm leading-relaxed">
                                    {game.result.goalScorers.join(', ')}
                                </p>
                            </div>
                        )}
                        {game.result.assists?.length > 0 && (
                            <div className="bg-stadium-black/40 rounded-xl p-4 border border-stadium-border/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-gold-bright">👟</span>
                                    <p className="athletic-condensed text-gold-bright text-xs uppercase tracking-widest font-bold">Assists</p>
                                </div>
                                <p className="text-chalk-white font-medium text-sm leading-relaxed">
                                    {game.result.assists.join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Goalkeeper Stats */}
                {isPast && game.result?.goalkeepers?.length > 0 && (
                    <div className="mt-4 max-w-2xl mx-auto">
                        <div className="bg-stadium-black/40 rounded-xl p-4 border border-stadium-border/30">
                            <div className="flex items-center gap-2 mb-3">
                                <span>🧤</span>
                                <p className="athletic-condensed text-chalk-white text-xs uppercase tracking-widest font-bold">Goalkeepers</p>
                            </div>
                            <div className="space-y-2">
                                {game.result.goalkeepers.map((gk, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-stadium-border/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-chalk-white font-semibold text-sm">{gk.name}</span>
                                            <span className="text-chalk-dim text-xs athletic-condensed uppercase tracking-wider">
                                                {gk.half === 1 ? '1H' : '2H'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {gk.saves != null && (
                                                <span className="font-bold text-sm scoreboard-number text-gold-bright">
                                                    {gk.saves} SV
                                                </span>
                                            )}
                                            <span className="font-bold text-sm scoreboard-number text-turf">
                                                {gk.goalsAllowed} GA
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
