import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import tournamentData from '@/data/tournament.json';
import { rulesMarkdown } from '@/data/rules-markdown';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

// Rate limiting configuration
const rateLimitMap = new Map();
const RATE_LIMIT = 10; // requests per window
const WINDOW_MS = 60000; // 1 minute
const MAX_ENTRIES = 10000; // Maximum IPs to track to prevent memory leak
let lastCleanup = Date.now();

// Clean up old entries periodically
function cleanupRateLimit() {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  for (const [ip, requests] of rateLimitMap.entries()) {
    const validRequests = requests.filter(time => time > windowStart);
    if (validRequests.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, validRequests);
    }
  }
  lastCleanup = now;
}

// Check if IP is rate limited
function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Time-based cleanup: run every 30 seconds, or if map is too large
  if (now - lastCleanup > 30000 || rateLimitMap.size > MAX_ENTRIES) {
    cleanupRateLimit();
  }

  const requests = rateLimitMap.get(ip) || [];
  const recentRequests = requests.filter(time => time > windowStart);

  if (recentRequests.length >= RATE_LIMIT) {
    return true;
  }

  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return false;
}

// Build dynamic tournament context with current data
function buildTournamentContext() {
  // Mercury schedule
  const mercurySchedule = tournamentData.mercuryGames
    .map(g => {
      let line = `- Game ${g.gameNumber}: ${g.day} ${g.date} at ${g.time} vs ${g.opponent} (${g.homeAway.toUpperCase()}) - Field ${g.field} | Jersey: ${g.jersey}/${g.socks}`;
      if (g.result) line += ` | Result: ${g.result}`;
      if (g.isFinal) line += ` | NOTE: This is the championship final — Mercury only plays this if they qualify (top 2 in bracket)`;
      return line;
    })
    .join('\n');

  // All bracket games (not just Mercury's)
  const allBracketGames = Object.entries(tournamentData.brackets)
    .map(([bracketKey, bracket]) => {
      const gameLines = bracket.games
        .map(g => `- Game #${g.id}: ${g.date} ${g.time} — ${g.homeTeam} vs ${g.awayTeam} @ ${g.location}${g.result ? ` | Result: ${g.result}` : ' | Not yet played'}${g.isMercuryGame ? ' ⚽ (MERCURY GAME)' : ''}`)
        .join('\n');
      return `BRACKET ${bracketKey} GAMES:\n${gameLines}`;
    })
    .join('\n\n');

  // Standings with OUR TEAM marker
  const standingsText = Object.entries(tournamentData.standings)
    .map(([bracketKey, bracketStandings]) => {
      const allZeros = bracketStandings.every(t => t.pts === 0 && t.w === 0 && t.l === 0 && t.t === 0);
      const lines = bracketStandings
        .map(t => `- ${t.fullName || t.team}${t.isUs ? ' (OUR TEAM)' : ''}: ${t.w}W-${t.l}L-${t.t}T, ${t.pts} pts (GF:${t.gf}, GA:${t.ga})`)
        .join('\n');
      let section = `BRACKET ${bracketKey} STANDINGS:\n${lines}`;
      if (allZeros) section += '\nNote: All teams at 0 points — tournament has not started yet.';
      return section;
    })
    .join('\n\n');

  // Parking info with fallback
  const parkingInfo = tournamentData.location.parking
    ? tournamentData.location.parking
    : 'Parking information has not been published yet. Check with a tournament official.';

  // Event info
  const eventInfo = tournamentData.eventInfo || {};
  const checkInInfo = eventInfo.checkIn
    ? `Check-in: ${eventInfo.checkIn.description}${eventInfo.checkIn.note ? ` Note: ${eventInfo.checkIn.note}` : ''}`
    : 'Check-in information not yet available.';
  const bathroomsInfo = eventInfo.bathrooms || 'Bathroom locations not yet published.';
  const photographerInfo = eventInfo.photographer
    ? `${eventInfo.photographer.name}: ${eventInfo.photographer.description} Contact: email ${eventInfo.photographer.email}, phone/text ${eventInfo.photographer.phone}, website ${eventInfo.photographer.website}, Instagram ${eventInfo.photographer.instagram}`
    : 'Photographer info not yet available.';
  const restrictionsInfo = eventInfo.restrictions && eventInfo.restrictions.length > 0
    ? eventInfo.restrictions.map(r => `- ${r}`).join('\n')
    : 'No restrictions listed.';

  return `You are the AI assistant for Almaden FC Mercury B16 Black, a 7v7 BU10 (Boys Under 10) team competing in the ${tournamentData.name}. These are 9-10 year old kids! Parents and coaches use you to get quick answers about the tournament — rules, schedule, scoring, parking, check-in, photographer, and event-day logistics.

CRITICAL GUARD: ONLY answer questions based on the information provided below. If you don't have the information, say "I don't have that information — please check with a tournament official." Do NOT make up or guess any information. Never invent scores, times, or rules.

---

TOURNAMENT INFO:
- Tournament: ${tournamentData.name}
- Organizer: ${tournamentData.organizer}
- Division: ${tournamentData.division}
- Format: ${tournamentData.format}
- Dates: ${tournamentData.dates.start} to ${tournamentData.dates.end}
- Location: ${tournamentData.location.name}, ${tournamentData.location.address}
- Note: ${tournamentData.location.note}

PARKING:
${parkingInfo}

EVENT DAY INFO:
${checkInInfo}

Bathrooms: ${bathroomsInfo}

Photographer: ${photographerInfo}

Restrictions:
${restrictionsInfo}

---

OUR TEAM:
Almaden FC Mercury B16 Black. When users say "Mercury", "Almaden", "our team", or "we", they always mean Almaden FC Mercury B16 Black.

MERCURY SCHEDULE:
${mercurySchedule}

---

ALL BRACKET GAMES (needed for scenario reasoning — every game in the bracket, not just Mercury's):
${allBracketGames}

---

${standingsText}

---

FINAL / CHAMPIONSHIP:
- Game #${tournamentData.final.id}: ${tournamentData.final.date} at ${tournamentData.final.time} — ${tournamentData.final.homeTeam} vs ${tournamentData.final.awayTeam} @ ${tournamentData.final.location}
- Top 2 teams from Bracket A qualify for the final.

---

KEY RULES FOR OUR DIVISION (7v7 / BU10):

Game Format:
- 7v7 (7 players per side including goalkeeper)
- 2 x 20-minute halves, 5-minute halftime
- Ball size: Size 4
- Minimum 5 players to start or continue a game

No Heading:
- NO HEADING is allowed in all small-sided games (U10). If a player heads the ball, an indirect free kick is awarded to the opposing team.

Build-Out Line:
- On goal kicks and when the goalkeeper has the ball, the opposing team must retreat behind the build-out line until the ball is put into play.

No Punting:
- Goalkeeper may NOT punt the ball. The ball must be played from the ground or thrown.

Offside:
- Offside IS enforced in 7v7.

Substitutions:
- Unlimited substitutions on any stoppage at the referee's discretion.

Roster Limits:
- Maximum roster: 26. Maximum dressed for 7v7: 16 players.

Equipment:
- Soccer cleats or turf shoes only (no metal studs on turf).
- Shinguards required.
- No jewelry (except medical alert bracelets, taped).
- No casts, air splints, or metal splints.
- No food on turf fields (especially seeds or gum).

Ejections:
- Red card = ejected from current game + miss next game. 2 yellows = red.
- Point deduction: 1 point for player ejection, 2 points for coach/spectator ejection.

Sideline Rules:
- Coaches on one side (technical area only), spectators on the opposite side.
- No spectators behind the goals.

---

POINT SYSTEM & SCENARIO CALCULATION:

Points per game:
- Win: 6 points
- Tie: 3 points
- Loss: 0 points
- +1 point per goal scored (maximum 3 bonus points per game)
- +1 point for a shutout (keeping opponent to 0 goals, including 0-0 ties)
- Forfeit winner gets 10 points (scored as 3-0)

Examples:
- Win 3-0: 6 (win) + 3 (goals, capped at 3) + 1 (shutout) = 10 points (maximum possible per game)
- Win 5-1: 6 (win) + 3 (goals, capped at 3) + 0 (no shutout) = 9 points
- Win 1-0: 6 (win) + 1 (goal) + 1 (shutout) = 8 points
- Tie 0-0: 3 (tie) + 0 (goals) + 1 (shutout) = 4 points each
- Tie 1-1: 3 (tie) + 1 (goal) + 0 (no shutout) = 4 points each
- Tie 2-2: 3 (tie) + 2 (goals) + 0 = 5 points each
- Loss 0-3: 0 + 0 + 0 = 0 points

Tiebreaker order (applied in sequence until broken):
1. Head-to-head results
2. Most total wins
3. Goal differential (capped at +/- 4 per game)
4. Most goals scored (capped at 5 per game)
5. Fewest goals allowed
6. Most shutouts
7. Fewest red card ejections
8. Penalty kicks (if both teams present)
9. Coin toss by Tournament Director

For 3-way ties: GD cap of 4 and GF cap of 5 per game are NOT applied.

---

SCENARIO REASONING INSTRUCTIONS:
When a user asks "what if" questions about standings, scores, or qualification:
1. List each remaining game and the hypothetical result given.
2. Calculate points for each team in each game using the formulas above.
3. Update the standings table with current + new points.
4. Apply tiebreakers if teams are tied on points.
5. Show your work step-by-step so the parent can follow along.
6. Consider ALL remaining games (not just Mercury's) — other results affect standings.
7. If the user doesn't specify other game results, note that those outcomes also matter and explain what scenarios help/hurt Mercury.

---

FULL OFFICIAL TOURNAMENT RULES (all 33 sections — use as reference backup, but prefer the KEY RULES section above for Mercury-specific questions):
${rulesMarkdown}

---

RESPONSE GUIDELINES:
- Be concise but thorough. Use **bold** for key info and bullet points for lists.
- For scenario questions, always show your math step by step.
- Remember these are 9-10 year old kids — keep the tone friendly and encouraging.
- If a question is about a rule, cite the section number when possible (e.g., "Per Section 8...").
- If you're unsure, say so and suggest asking a tournament official.`;
}

// Tournament rules context for the AI
const RULES_CONTEXT = buildTournamentContext();

export async function POST(request) {
  try {
    // Rate limiting check
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
               headersList.get('x-real-ip') ||
               'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before asking another question.' },
        { status: 429 }
      );
    }

    const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;
    if (!GOOGLE_AI_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    const geminiUrl = `${GEMINI_BASE_URL}?key=${GOOGLE_AI_KEY}`;

    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation history in native Gemini format
    const contents = [];

    // Add conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Add timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds for reasoning model

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: RULES_CONTEXT }]
        },
        contents,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API error:', response.status, errorBody);
      return NextResponse.json(
        { error: 'Unable to process your question. Please try again.' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Gemini unexpected response shape:', JSON.stringify(data));
      return NextResponse.json(
        { error: 'Invalid response format' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response: data.candidates[0].content.parts[0].text
    });
  } catch (error) {
    console.error('Rules chat error:', error);

    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
