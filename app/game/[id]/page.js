import { notFound } from 'next/navigation';
import { formatGameDate, getShortTeamName } from '@/lib/game-utils';
import { getSeasonRecord } from '@/lib/stats-utils';
import currentGamesData from '@/data/games.json';
import fall2025Games from '@/data/seasons/fall-2025.json';
import { logger } from '@/lib/logger';
import HaloGame from '@/components/halo/HaloGame';

const allGamesData = [...currentGamesData, ...fall2025Games];

export async function generateMetadata({ params }) {
  const { id } = await params;
  const game = allGamesData.find((g) => g.id === id);

  if (!game) {
    return {
      title: 'Game Not Found | Mercury Black B16',
    };
  }

  const opponentShort = getShortTeamName(game.opponent);
  const isPast = game.result !== null;
  const dateFormatted = formatGameDate(game.date);

  if (isPast) {
    const isWin = game.result.us > game.result.them;
    const isLoss = game.result.us < game.result.them;
    const resultText = isWin ? 'Victory' : isLoss ? 'Defeat' : 'Draw';

    return {
      title: `AFC ${game.result.us}-${game.result.them} ${opponentShort} | Mercury Black B16`,
      description: `${resultText}! Final score: ${game.result.us}-${game.result.them} vs ${game.opponent} on ${dateFormatted} at ${game.location?.name || 'TBD'}.`,
    };
  }

  return {
    title: `AFC vs ${opponentShort} | ${dateFormatted} | Mercury Black B16`,
    description: `Upcoming match vs ${game.opponent} on ${dateFormatted} at ${game.time}. Location: ${game.location?.name || 'TBD'}.`,
  };
}

export default async function GameDetail({ params }) {
  const { id } = await params;
  const game = allGamesData.find((g) => g.id === id);

  if (!game) {
    logger.warn(`Game not found: ${id}`);
    notFound();
  }

  logger.pageView(`Game Detail: ${game.opponent}`);
  logger.info(`Viewing game: ${game.date} vs ${game.opponent}`);

  const currentRecord = getSeasonRecord(currentGamesData);

  return <HaloGame game={game} currentRecord={currentRecord} />;
}
