/**
 * Shared utilities and constants for Open Graph image generation
 */

// Brand colors matching tailwind.config.js
export const OG_COLORS = {
  kellyGreen: '#00843D',
  kellyGreenLight: '#047857',
  kellyGreenDark: '#00632E',
  black: '#0a0a0a',
  darkGray: '#1a1a1a',
  white: '#ffffff',
  gold: '#FFC107',
  win: '#10B981',
  loss: '#EF4444',
  tie: '#6B7280',
};

// Standard OG image dimensions
export const OG_DIMENSIONS = {
  width: 1200,
  height: 630,
};

// Common styles for OG templates
export const OG_STYLES = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(180deg, ${OG_COLORS.black} 0%, ${OG_COLORS.darkGray} 100%)`,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  greenBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '8px',
    background: OG_COLORS.kellyGreen,
  },
  branding: {
    position: 'absolute',
    bottom: '24px',
    color: OG_COLORS.white,
    opacity: 0.6,
    fontSize: '18px',
  },
};

/**
 * Get the result badge styling based on game outcome
 */
export function getResultBadgeStyle(result) {
  if (result === 'W') {
    return {
      background: OG_COLORS.win,
      color: OG_COLORS.white,
    };
  }
  if (result === 'L') {
    return {
      background: OG_COLORS.loss,
      color: OG_COLORS.white,
    };
  }
  return {
    background: OG_COLORS.tie,
    color: OG_COLORS.white,
  };
}

/**
 * Format a date string for OG display
 */
export function formatOGDate(dateString) {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get short team name for display
 */
export function getShortName(name) {
  if (!name) return '';
  const normalized = name.toLowerCase();

  if (normalized.includes('mercury') || normalized.includes('almaden')) {
    return 'AFC';
  }
  if (normalized.includes('esjfc') || normalized.includes('east san jose')) {
    return 'ESJFC';
  }

  const words = name.trim().split(/\s+/);
  if (words.length <= 2) return name;
  return words.slice(0, 2).join(' ');
}
