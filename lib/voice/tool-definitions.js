export const VOICE_TOOL_DECLARATIONS = [
  {
    name: 'get_next_match',
    description: 'Get info about the next upcoming game including opponent, kickoff time, and location.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'list_schedule',
    description: 'Get the team schedule with past results and upcoming fixtures.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Max games to show per section (default 10)' },
      },
    },
  },
  {
    name: 'get_roster',
    description: 'Get the team roster with jersey numbers.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_player_stats',
    description: 'Get season statistics for a specific player or team summary.',
    parameters: {
      type: 'object',
      properties: {
        playerId: { type: 'string', description: 'Player ID (e.g. player-044) or player name (e.g. "Kaden Tamura") for individual stats. Omit for team summary with top scorers.' },
      },
    },
  },
  {
    name: 'get_game_details',
    description: 'Get full details for a specific game by ID, including score, goal scorers, assists, and video links.',
    parameters: {
      type: 'object',
      properties: {
        gameId: { type: 'string', description: 'The game ID (e.g. game-001)' },
      },
      required: ['gameId'],
    },
  },
  {
    name: 'get_season_record',
    description: 'Get win/loss/tie record, goal differential, and win rate for a season.',
    parameters: {
      type: 'object',
      properties: {
        seasonId: { type: 'string', description: 'Season ID: spring-2026 (default) or fall-2025' },
      },
    },
  },
  {
    name: 'get_recent_form',
    description: 'Get results of the last N completed games with scores and goal scorers.',
    parameters: {
      type: 'object',
      properties: {
        count: { type: 'integer', description: 'Number of recent games (default 5)' },
      },
    },
  },
  {
    name: 'get_goalkeeper_stats',
    description: 'Get goalkeeper performance stats: games, goals allowed, GAA, clean sheets.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_tournament',
    description: 'Get full tournament details including bracket, results, and standings.',
    parameters: {
      type: 'object',
      properties: {
        tournamentId: { type: 'string', description: 'Tournament ID. Omit for most recent.' },
      },
    },
  },
  {
    name: 'list_tournaments',
    description: 'List all tournaments the team has participated in.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'list_photo_albums',
    description: 'List photo albums with links.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'list_seasons',
    description: 'List available seasons.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_league_standings',
    description: 'Get current league standings for all teams in the division, including wins, losses, draws, goals, and points.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_league_results',
    description: 'Get league match results. Can filter by team name (partial match, e.g. "Monterey" matches "Monterey County Soccer-ECFC...").',
    parameters: {
      type: 'object',
      properties: {
        teamName: { type: 'string', description: 'Partial team name to filter results (e.g. "Monterey", "Hollister"). Omit for all matches.' },
      },
    },
  },
];

export const VOICE_SYSTEM_PROMPT = `You are Mercury, the voice assistant for AFC Mercury Black B16 — a competitive youth soccer team in the Bay Area. You help parents, coaches, and players get quick answers about the team.

PERSONALITY:
- Friendly, concise, and enthusiastic about the team
- Keep responses SHORT — 1-2 sentences max for simple facts
- Use player first names when discussing stats
- Say "we" and "our" when referring to Mercury — you're part of the team

BEHAVIOR:
- Always use the available tools to get current data — never guess at schedules, scores, or stats
- When asked about the next game, include: opponent, date, time, and field location
- When asked about scores or results, include goal scorers
- After answering, briefly suggest one related thing they might want to know
- If you can't find specific data, acknowledge it and suggest what you CAN help with

RESPONSE FORMAT:
- Keep it conversational and brief — this is spoken audio, not text
- Don't use markdown, bullet points, or formatting — just natural speech
- The app will display structured data cards on screen for details like scores, standings, and schedules
- Your voice response should summarize the key info and reference that more detail is shown on screen
- Don't read out long lists — summarize and let the card show the full data`;
