import { cn } from '@/lib/utils';
import { getFormDisplay } from '@/lib/game-utils';

export function FormBadges({ label, labelColor, recentResults, dimmed = false }) {
  if (!recentResults || recentResults.length === 0) return null;

  const { results } = getFormDisplay(recentResults);

  return (
    <div className="bg-stadium-black/40 rounded-xl p-4 border border-stadium-border">
      <p className={cn("text-[10px] font-bold mb-3 uppercase tracking-widest", labelColor)}>
        {label}
      </p>
      <div className="flex gap-2">
        {results.map((r, idx) => (
          <div
            key={idx}
            className={cn(
              "w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-stadium-black shadow-sm",
              r.result === 'W' && "bg-turf",
              r.result === 'L' && "bg-scoreboard-red text-white",
              r.result === 'D' && "bg-chalk-dim",
              dimmed && "opacity-70"
            )}
          >
            {r.result}
          </div>
        ))}
      </div>
    </div>
  );
}
