'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOURNAMENT_START = new Date('2026-02-21T00:00:00-08:00');
const TOURNAMENT_END = new Date('2026-02-22T23:59:59-08:00');

function normalizeForMatch(name) {
  if (!name) return '';
  const lower = name.toLowerCase();
  if (lower.includes('mercury') || lower.includes('almaden')) return 'Mercury';
  if (lower.includes('solano') || lower.includes('surf')) return 'Solano Surf';
  if (lower.includes('madera') || lower.includes('united')) return 'Madera United';
  if (lower.includes('esjfc') || lower.includes('east san jose')) return 'ESJFC';
  return name;
}

function mergeLiveData(staticData, liveData) {
  if (!liveData || !staticData) return staticData;

  const merged = JSON.parse(JSON.stringify(staticData));

  if (liveData.standings) {
    for (const [bracket, standings] of Object.entries(liveData.standings)) {
      if (merged.standings[bracket]) {
        merged.standings[bracket] = standings;
      }
    }
  }

  if (liveData.games && merged.brackets) {
    for (const [, bracket] of Object.entries(merged.brackets)) {
      for (const game of bracket.games) {
        const homeTeam = normalizeForMatch(game.homeTeam);
        const awayTeam = normalizeForMatch(game.awayTeam);

        for (const liveGame of liveData.games) {
          if ((liveGame.team1 === homeTeam && liveGame.team2 === awayTeam) ||
              (liveGame.team1 === awayTeam && liveGame.team2 === homeTeam)) {
            if (liveGame.team1 === homeTeam) {
              game.result = liveGame.score;
            } else {
              const [s1, s2] = liveGame.score.split('-').map(s => parseInt(s.trim()));
              game.result = `${s2}-${s1}`;
            }
            break;
          }
        }
      }
    }
  }

  if (liveData.games && merged.mercuryGames) {
    for (const game of merged.mercuryGames) {
      if (game.conditional) continue;

      const opponent = normalizeForMatch(game.opponent);
      for (const liveGame of liveData.games) {
        const isMercuryTeam1 = liveGame.team1 === 'Mercury';
        const isMercuryTeam2 = liveGame.team2 === 'Mercury';

        if (!isMercuryTeam1 && !isMercuryTeam2) continue;

        const matchOpponent = isMercuryTeam1 ? liveGame.team2 : liveGame.team1;
        if (matchOpponent === opponent) {
          const [s1, s2] = liveGame.score.split('-').map(s => parseInt(s.trim()));
          game.result = isMercuryTeam1
            ? { us: s1, them: s2 }
            : { us: s2, them: s1 };
          break;
        }
      }
    }
  }

  return merged;
}

export function useLiveScores(staticData) {
  const [liveData, setLiveData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef(null);

  const isTournamentActive = useCallback(() => {
    const now = new Date();
    return now >= TOURNAMENT_START && now <= TOURNAMENT_END;
  }, []);

  const fetchLiveData = useCallback(async () => {
    try {
      const res = await fetch('/api/tournament-update');
      if (!res.ok) return;

      const data = await res.json();
      if (!data.success) return;

      setLiveData(data);
      setLastUpdated(new Date(data.timestamp));
      setIsLive(true);
    } catch (err) {
      console.warn('Live score fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    if (!isTournamentActive()) return;

    fetchLiveData();

    intervalRef.current = setInterval(fetchLiveData, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTournamentActive, fetchLiveData]);

  const mergedData = mergeLiveData(staticData, liveData);

  return {
    data: mergedData,
    isLive,
    lastUpdated,
  };
}
