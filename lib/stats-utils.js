/**
 * Shared stats utility functions
 */

/**
 * Filters games to only competitive (non-scrimmage) games with results
 */
export function getCompetitiveGames(games) {
  return games.filter(g => g.result && g.type !== 'scrimmage');
}

/**
 * Calculates win/loss/tie record from an array of games
 */
export function getSeasonRecord(games) {
  const competitive = getCompetitiveGames(games);
  return {
    wins: competitive.filter(g => g.result.us > g.result.them).length,
    losses: competitive.filter(g => g.result.us < g.result.them).length,
    ties: competitive.filter(g => g.result.us === g.result.them).length,
  };
}
