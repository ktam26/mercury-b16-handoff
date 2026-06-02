function getCompetitiveGames(games) {
  return games.filter(g => g.result && g.type !== 'scrimmage');
}

function normalizeName(name) {
  if (!name) return '';
  return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function parseStatEntry(entry) {
  const match = entry.match(/^(.+?)\s*\((\d+)\)$/);
  return match ? [match[1], parseInt(match[2], 10)] : [entry, 1];
}

function aggregateGameStats(games) {
  const goalsByName = {};
  const assistsByName = {};
  const appearancesByName = {};

  getCompetitiveGames(games).forEach(game => {
    const contributors = new Set();

    (game.result.goalScorers || []).forEach(entry => {
      const [name, count] = parseStatEntry(entry);
      if (name === 'Own Goal') return;
      goalsByName[name] = (goalsByName[name] || 0) + count;
      contributors.add(name);
    });

    (game.result.assists || []).forEach(entry => {
      const [name, count] = parseStatEntry(entry);
      assistsByName[name] = (assistsByName[name] || 0) + count;
      contributors.add(name);
    });

    (game.result.goalkeepers || []).forEach(gk => {
      contributors.add(gk.name);
    });

    contributors.forEach(name => {
      appearancesByName[name] = (appearancesByName[name] || 0) + 1;
    });
  });

  return { goalsByName, assistsByName, appearancesByName };
}

function calculatePlayerStats(games, roster) {
  const { goalsByName, assistsByName, appearancesByName } = aggregateGameStats(games);

  const rosterByNormName = new Map();
  roster.forEach(p => rosterByNormName.set(normalizeName(p.fullName), p));

  const byPlayerId = new Map();

  roster.forEach(p => {
    byPlayerId.set(p.id, {
      playerId: p.id,
      playerName: p.fullName,
      ...(p.number != null && { number: p.number }),
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      ...(p.guest && { guest: true }),
    });
  });

  const allGameNames = new Set([
    ...Object.keys(goalsByName),
    ...Object.keys(assistsByName),
    ...Object.keys(appearancesByName),
  ]);

  allGameNames.forEach(gameName => {
    const rosterEntry = rosterByNormName.get(normalizeName(gameName));
    if (rosterEntry) {
      const existing = byPlayerId.get(rosterEntry.id);
      existing.playerName = gameName;
      existing.goals += goalsByName[gameName] || 0;
      existing.assists += assistsByName[gameName] || 0;
      existing.gamesPlayed += appearancesByName[gameName] || 0;
    } else {
      byPlayerId.set(`unrostered:${gameName}`, {
        playerId: null,
        playerName: gameName,
        gamesPlayed: appearancesByName[gameName] || 0,
        goals: goalsByName[gameName] || 0,
        assists: assistsByName[gameName] || 0,
      });
    }
  });

  return Array.from(byPlayerId.values()).sort((a, b) => (a.number ?? 999) - (b.number ?? 999));
}

function calculateGoalkeeperStats(games) {
  const gkStats = {};

  getCompetitiveGames(games).forEach(game => {
    (game.result.goalkeepers || []).forEach(gk => {
      if (!gkStats[gk.name]) {
        gkStats[gk.name] = {
          name: gk.name,
          gamesInGoal: 0,
          goalsAllowed: 0,
          saves: 0,
          cleanSheets: 0,
        };
      }
      gkStats[gk.name].gamesInGoal += 1;
      gkStats[gk.name].goalsAllowed += gk.goalsAllowed ?? 0;
      if (gk.saves != null) gkStats[gk.name].saves += gk.saves;
      if (gk.goalsAllowed === 0) gkStats[gk.name].cleanSheets += 1;
    });
  });

  return Object.values(gkStats)
    .map(gk => ({ ...gk, gaa: (gk.goalsAllowed / gk.gamesInGoal).toFixed(2) }))
    .sort((a, b) => b.gamesInGoal - a.gamesInGoal);
}

function calculateLeaderboards(games, roster = []) {
  const playerStats = calculatePlayerStats(games, roster).map(p => ({
    name: p.playerName,
    goals: p.goals,
    assists: p.assists,
    points: p.goals + p.assists,
  }));

  const gkLeaders = calculateGoalkeeperStats(games);

  const goalLeaders = [...playerStats]
    .filter(p => p.goals > 0)
    .sort((a, b) => b.goals - a.goals);

  const assistLeaders = [...playerStats]
    .filter(p => p.assists > 0)
    .sort((a, b) => b.assists - a.assists);

  const pastGames = getCompetitiveGames(games);
  const totalGoals = pastGames.reduce((sum, g) => sum + g.result.us, 0);
  const totalAssists = playerStats.reduce((sum, p) => sum + p.assists, 0);
  const gamesPlayed = pastGames.length;

  const topScorer = goalLeaders[0] || null;
  const topAssister = assistLeaders[0] || null;

  const maxGoals = goalLeaders[0]?.goals || 1;
  const maxAssists = assistLeaders[0]?.assists || 1;

  return {
    playerStats,
    goalLeaders,
    assistLeaders,
    gkLeaders,
    totalGoals,
    totalAssists,
    gamesPlayed,
    topScorer,
    topAssister,
    maxGoals,
    maxAssists,
  };
}

module.exports = {
  normalizeName,
  parseStatEntry,
  aggregateGameStats,
  calculatePlayerStats,
  calculateGoalkeeperStats,
  calculateLeaderboards,
};
