'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getShortTeamName } from '@/lib/game-utils';

const DEFAULT_LOGO = '/images/logos/default.png';

/**
 * Reusable component for displaying team matchups with logos
 * Used in home page, game details, and game cards
 * @param {Object} props - Component props
 * @param {string} props.homeTeam - Home team name
 * @param {string} props.awayTeam - Away team name
 * @param {string} [props.homeLogo] - URL to home team logo
 * @param {string} [props.awayLogo] - URL to away team logo
 * @param {boolean} [props.showScore] - Whether to show score
 * @param {Object} [props.score] - Score object with us/them properties
 * @param {boolean} [props.isHomeGame] - Whether Mercury is the home team
 * @param {string} [props.size] - Size variant: 'small' | 'medium' | 'large'
 * @param {string} [props.className] - Additional CSS classes
 */
export function TeamMatchup({
  homeTeam = 'Almaden Mercury Black B16',
  awayTeam,
  homeLogo = '/afc-logo.png',
  awayLogo,
  showScore = false,
  score,
  isHomeGame = true,
  size = 'medium',
  className
}) {
  const [logoError, setLogoError] = useState({ home: false, away: false });

  // Size configurations
  const sizeConfig = {
    small: {
      logo: 'w-10 h-10',
      logoSize: 32,
      text: 'text-xs',
      score: 'text-lg',
      gap: 'gap-3'
    },
    medium: {
      logo: 'w-12 h-12',
      logoSize: 40,
      text: 'text-sm',
      score: 'text-2xl',
      gap: 'gap-4'
    },
    large: {
      logo: 'w-16 h-16',
      logoSize: 56,
      text: 'text-base',
      score: 'text-3xl',
      gap: 'gap-6'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Determine which team is Mercury
  const mercuryLogo = '/afc-logo.png';
  const mercuryDisplayName = getShortTeamName(homeTeam);
  const awayDisplayName = getShortTeamName(awayTeam);

  const leftTeam = {
    fullName: isHomeGame ? homeTeam : awayTeam,
    displayName: isHomeGame ? mercuryDisplayName : awayDisplayName,
    logo: isHomeGame ? mercuryLogo : (awayLogo || DEFAULT_LOGO),
    isHome: !isHomeGame
  };

  const rightTeam = {
    fullName: isHomeGame ? awayTeam : homeTeam,
    displayName: isHomeGame ? awayDisplayName : mercuryDisplayName,
    logo: isHomeGame ? (awayLogo || DEFAULT_LOGO) : mercuryLogo,
    isHome: isHomeGame
  };

  const handleLogoError = (team) => {
    setLogoError(prev => ({ ...prev, [team]: true }));
  };

  return (
    <div className={cn("flex items-center justify-center", config.gap, className)}>
      {/* Left Team */}
      <div className="text-center flex-1">
        <div className={cn(
          "bg-white rounded-full mx-auto shadow-md flex items-center justify-center p-2 mb-1",
          config.logo
        )}>
          <Image
            src={logoError.home ? DEFAULT_LOGO : leftTeam.logo}
            alt={leftTeam.fullName || leftTeam.displayName}
            width={config.logoSize}
            height={config.logoSize}
            className="object-contain"
            onError={() => handleLogoError('home')}
          />
        </div>
        <p className={cn("font-medium truncate", config.text)}>
          {leftTeam.displayName}
        </p>
      </div>

      {/* Score or VS */}
      <div className="flex flex-col items-center justify-center px-2">
        {showScore && score ? (
          <>
            <div className={cn("font-bold", config.score)}>
              {isHomeGame ? `${score.us} - ${score.them}` : `${score.them} - ${score.us}`}
            </div>
            {score.us > score.them && (
              <span className="text-xs text-green-600 font-medium">WIN</span>
            )}
            {score.us < score.them && (
              <span className="text-xs text-red-600 font-medium">LOSS</span>
            )}
            {score.us === score.them && (
              <span className="text-xs text-gray-600 font-medium">TIE</span>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center">
            <span className={cn("font-bold text-gray-400", config.text)}>VS</span>
          </div>
        )}
      </div>

      {/* Right Team */}
      <div className="text-center flex-1">
        <div className={cn(
          "bg-white rounded-full mx-auto shadow-md flex items-center justify-center p-2 mb-1",
          config.logo
        )}>
          <Image
            src={logoError.away ? DEFAULT_LOGO : rightTeam.logo}
            alt={rightTeam.fullName || rightTeam.displayName}
            width={config.logoSize}
            height={config.logoSize}
            className="object-contain"
            onError={() => handleLogoError('away')}
          />
        </div>
        <p className={cn("font-medium truncate", config.text)}>
          {rightTeam.displayName}
        </p>
      </div>
    </div>
  );
}
