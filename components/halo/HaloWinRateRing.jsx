'use client';

export function HaloWinRateRing({ wins, losses, ties, size = 110 }) {
  const total = wins + losses + ties || 1;
  const winPct = wins / total;
  const drawPct = ties / total;
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <div
      style={{ width: size, height: size }}
      className="relative shrink-0"
      role="img"
      aria-label={`Win rate ${Math.round(winPct * 100)} percent`}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--halo-faint)"
          strokeWidth="10"
          fill="none"
          opacity="0.4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--halo-accent-bright)"
          strokeWidth="10"
          fill="none"
          strokeDasharray={`${c * winPct} ${c}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--halo-muted)"
          strokeWidth="10"
          fill="none"
          strokeDasharray={`${c * drawPct} ${c}`}
          strokeDashoffset={-c * winPct}
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div
            className="text-[24px] font-extrabold leading-none"
            style={{
              color: 'var(--halo-accent-bright)',
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(winPct * 100)}%
          </div>
          <div
            className="text-[9px] font-bold mt-1"
            style={{ color: 'var(--halo-muted)', letterSpacing: '0.12em' }}
          >
            WIN RATE
          </div>
        </div>
      </div>
    </div>
  );
}
