/**
 * Data Sanitization Utilities
 *
 * These functions ensure sensitive player data (birthdays, IDs, etc.)
 * are never exposed through API endpoints.
 */

/**
 * Sanitize player stats - remove all PII
 * @param {Object} playerStat - Raw player stat object
 * @returns {Object} Sanitized player stat (no birthdate, no IDs)
 */
export function sanitizePlayerStat(playerStat) {
  return {
    playerId: playerStat.playerId, // Keep ID for internal reference only
    playerName: playerStat.playerName,
    goals: playerStat.goals || 0,
    assists: playerStat.assists || 0,
    gamesPlayed: playerStat.gamesPlayed || 0,
    // Explicitly exclude: birthdate, usClubId, contact info
  };
}

/**
 * Sanitize array of player stats
 * @param {Array} playerStats - Array of raw player stat objects
 * @returns {Array} Array of sanitized player stats
 */
export function sanitizePlayerStats(playerStats) {
  return playerStats.map(sanitizePlayerStat);
}

/**
 * Sanitize roster data - remove birthdates and IDs
 * @param {Object} player - Raw player object from roster
 * @returns {Object} Sanitized player (no birthdate, no usClubId)
 */
export function sanitizeRosterPlayer(player) {
  return {
    id: player.id, // Internal ID only
    number: player.number,
    firstName: player.firstName,
    lastName: player.lastName,
    fullName: player.fullName,
    // Explicitly exclude: birthdate, usClubId, contact info, addresses
  };
}

/**
 * Sanitize full roster
 * @param {Array} roster - Array of raw player objects
 * @returns {Array} Array of sanitized players
 */
export function sanitizeRoster(roster) {
  return roster.map(sanitizeRosterPlayer);
}

/**
 * Sanitize game data - remove any embedded player PII if present
 * @param {Object} game - Raw game object
 * @returns {Object} Sanitized game object
 */
export function sanitizeGame(game) {
  // Games data should already be clean, but we ensure consistency
  return {
    id: game.id,
    date: game.date,
    time: game.time,
    opponent: game.opponent,
    opponentRecord: game.opponentRecord,
    opponentGoals: game.opponentGoals,
    mercuryRecord: game.mercuryRecord,
    mercuryRecentResults: game.mercuryRecentResults,
    opponentRecentResults: game.opponentRecentResults,
    location: game.location,
    homeAway: game.homeAway,
    jersey: game.jersey,
    socks: game.socks,
    result: game.result, // Includes goal scorers (public info)
    teamLogos: game.teamLogos,
    weatherUrl: game.weatherUrl,
    gotsportUrl: game.gotsportUrl,
    photoAlbumUrl: game.photoAlbumUrl,
  };
}

/**
 * Sanitize games array
 * @param {Array} games - Array of raw game objects
 * @returns {Array} Array of sanitized games
 */
export function sanitizeGames(games) {
  return games.map(sanitizeGame);
}

/**
 * Sanitize team info - remove any contact details
 * @param {Object} teamInfo - Raw team info object
 * @returns {Object} Sanitized team info
 */
export function sanitizeTeamInfo(teamInfo) {
  return {
    name: teamInfo.name,
    shortName: teamInfo.shortName,
    ageGroup: teamInfo.ageGroup, // Birth year only (not individual birthdates)
    colors: teamInfo.colors,
    links: teamInfo.links, // Public GotSport links
    // Explicitly exclude: managerPhone, emails, addresses
  };
}
