import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export function GameFootageSection({ videoUrl, opponent, timeline }) {
  const goalHighlights = timeline?.filter(
    (e) => e.team === 'mercury' && e.videoTimestamp != null
  );

  return (
    <Card className="mb-4 bg-stadium-card backdrop-blur-xl rounded-2xl border border-stadium-border shadow-2xl">
      <CardContent className="pt-6">
        <h3 className="font-bold text-chalk-dim mb-4 athletic-condensed uppercase tracking-widest text-sm flex items-center gap-2">
          <span className="text-turf">🎬</span> Game Film
        </h3>

        <Button
          className="w-full bg-turf hover:bg-turf-dark text-stadium-black font-bold h-12 text-base transition-all shadow-[0_0_20px_rgba(0,255,106,0.3)] hover:shadow-[0_0_30px_rgba(0,255,106,0.5)]"
          asChild
        >
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Play className="w-5 h-5 mr-2" />
            WATCH FULL MATCH
          </a>
        </Button>

        {goalHighlights?.length > 0 && (
          <div className="mt-5 pt-5 border-t border-stadium-border/50">
            <p className="athletic-condensed text-chalk-dim text-xs uppercase tracking-widest font-bold mb-3">
              Goal Highlights
            </p>
            <div className="space-y-2">
              {goalHighlights.map((event, idx) => (
                <a
                  key={idx}
                  href={`${videoUrl}&t=${event.videoTimestamp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-stadium-black/40 border border-stadium-border/30 hover:border-turf/40 hover:bg-turf/5 transition-all group"
                >
                  <Play className="w-4 h-4 text-turf group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-turf/20 text-turf border border-turf/40 text-xs font-bold scoreboard-number flex-shrink-0">
                    {event.minute}&apos;
                  </span>
                  {event.goalType === 'FK' && (
                    <span className="px-1 py-[1px] rounded text-[9px] leading-none font-bold athletic-condensed tracking-wider bg-gold-bright/20 text-gold-bright border border-gold-bright/50 flex-shrink-0">
                      FK
                    </span>
                  )}
                  <span className="text-sm font-semibold text-chalk-white group-hover:text-turf transition-colors">
                    {event.scorer}
                  </span>
                  {event.assist && (
                    <span className="text-xs text-chalk-dim">
                      (ast. {event.assist})
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
