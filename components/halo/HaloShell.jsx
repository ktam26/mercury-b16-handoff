'use client';

export function HaloPage({ children, className = '' }) {
  return (
    <div className={'relative min-h-screen ' + className}>
      <HaloOrbs />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function HaloOrbs() {
  return (
    <>
      <div
        className="halo-orb halo-orb-green"
        style={{ top: 60, left: -60, width: 220, height: 220 }}
      />
      <div
        className="halo-orb halo-orb-amber"
        style={{ top: 280, right: -60, width: 240, height: 240 }}
      />
      <div
        className="halo-orb halo-orb-green"
        style={{ top: 720, left: -80, width: 280, height: 280, opacity: 0.12 }}
      />
    </>
  );
}

export function HaloCard({ children, className = '', style = {} }) {
  return (
    <div className={'halo-glass rounded-3xl ' + className} style={style}>
      {children}
    </div>
  );
}

export function HaloPill({ children, tone = 'default', className = '' }) {
  const styles =
    tone === 'accent'
      ? {
          background: 'var(--halo-accent)',
          color: '#ffffff',
        }
      : tone === 'amber'
      ? {
          background: 'rgba(255,193,7,0.18)',
          color: 'var(--halo-amber-ink)',
          border: '1px solid rgba(255,193,7,0.35)',
        }
      : {
          background: 'var(--halo-glass-strong)',
          color: 'var(--halo-ink)',
          border: '1px solid var(--halo-glass-border)',
        };
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ' +
        className
      }
      style={styles}
    >
      {children}
    </span>
  );
}

export function HaloSectionLabel({ children, className = '' }) {
  return (
    <div
      className={
        'text-[11px] font-bold uppercase mb-2 px-1 ' + className
      }
      style={{ color: 'var(--halo-muted)', letterSpacing: '0.16em' }}
    >
      {children}
    </div>
  );
}
