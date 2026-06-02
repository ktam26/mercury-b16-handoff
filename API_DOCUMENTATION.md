# Mercury B16 Team App - API Documentation

## Overview

This API provides programmatic access to team data for AI agents, scrapers, and integrations. All endpoints return JSON and are designed for easy machine-readable access.

**Base URL:** `https://your-app-domain.vercel.app/api`

## Current Status

Public data endpoints are temporarily disabled for privacy.

- `GET /api/games`
- `GET /api/games/[id]`
- `GET /api/team`
- `GET /api/stats`

These endpoints currently return `410 Gone`.

---

## 🔒 Security & Privacy

### Data Protection
All API endpoints are **sanitized** to protect player privacy:

✅ **INCLUDED (Public Data):**
- Team name, colors, age group (birth year only)
- Game schedules, scores, locations
- Player names (only for goal scorers - already public info)
- Season statistics

❌ **EXCLUDED (Private Data):**
- Player birthdates (individual dates)
- US Club Soccer IDs
- Contact information (phone, email)
- Home addresses
- Any personally identifiable information (PII)

---

## API Endpoints

### 1. Get All Games
**Endpoint:** `GET /api/games`

Returns all games with optional filtering.

**Query Parameters:**
- `filter` (optional): `"all"` | `"upcoming"` | `"past"` (default: `"all"`)

**Example Requests:**
```bash
# Get all games
curl https://your-app.vercel.app/api/games

# Get only upcoming games
curl https://your-app.vercel.app/api/games?filter=upcoming

# Get past games
curl https://your-app.vercel.app/api/games?filter=past
```

**Response Format:**
```json
{
  "success": true,
  "count": 8,
  "filter": "all",
  "games": [
    {
      "id": "game-001",
      "date": "2025-09-07",
      "time": "2:15 PM",
      "opponent": "Santa Clara Rush 2016B Cougars - Blue",
      "opponentRecord": "1-3-0",
      "mercuryRecord": "0-0-0",
      "location": {
        "name": "Pioneer High School",
        "field": "Field 1C",
        "address": "1485 Blossom Hill Rd, San Jose, CA 95123",
        "googleMapsUrl": "https://www.google.com/maps/...",
        "embedUrl": "https://www.google.com/maps/embed?..."
      },
      "homeAway": "home",
      "jersey": "black",
      "socks": "black",
      "result": {
        "us": 3,
        "them": 1,
        "goalScorers": ["Arthur Yao (1)", "Jackson Kammah (1)", "Matias Carrillo (1)"],
        "assists": ["Tiago Pires (1)"]
      },
      "weatherUrl": "https://weather.com/...",
      "gotsportUrl": "https://system.gotsport.com/...",
      "photoAlbumUrl": null
    }
  ]
}
```

---

### 2. Get Single Game
**Endpoint:** `GET /api/games/[id]`

Returns detailed information for a specific game.

**Path Parameters:**
- `id` (required): Game ID (e.g., `game-001`)

**Example Requests:**
```bash
# Get game-001 details
curl https://your-app.vercel.app/api/games/game-001

# Get game-004 details
curl https://your-app.vercel.app/api/games/game-004
```

**Response Format:**
```json
{
  "success": true,
  "game": {
    "id": "game-001",
    "date": "2025-09-07",
    "time": "2:15 PM",
    "opponent": "Santa Clara Rush 2016B Cougars - Blue",
    "location": { ... },
    "result": { ... }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Game not found"
}
```

---

### 3. Get Team Information
**Endpoint:** `GET /api/team`

Returns team information, season statistics, and next game info.

**Example Request:**
```bash
curl https://your-app.vercel.app/api/team
```

**Response Format:**
```json
{
  "success": true,
  "team": {
    "name": "Almaden Mercury Black B16",
    "shortName": "Almaden Mercury Black 16",
    "ageGroup": "U10B (2016 birth year)",
    "colors": {
      "primary": "kelly-green",
      "secondary": "black",
      "accent": "white"
    },
    "links": {
      "gotsportSchedule": "https://system.gotsport.com/...",
      "gotsportStandings": "https://system.gotsport.com/..."
    }
  },
  "seasonStats": {
    "record": {
      "wins": 1,
      "losses": 1,
      "ties": 1,
      "gamesPlayed": 3,
      "winPercentage": 33
    },
    "goals": {
      "for": 7,
      "against": 9,
      "differential": -2,
      "avgPerGame": "2.3"
    },
    "recentForm": [
      {
        "date": "2025-09-07",
        "opponent": "Santa Clara Rush",
        "score": "3-1",
        "result": "W"
      }
    ]
  },
  "nextGame": {
    "id": "game-004",
    "date": "2025-10-12",
    "time": "3:30 PM",
    "opponent": "Los Gatos United 2016B Academy Black",
    "location": "Pioneer High School",
    "homeAway": "home"
  }
}
```

---

### 4. Get Player Statistics
**Endpoint:** `GET /api/stats`

Returns player performance statistics **WITHOUT** birthdates or IDs.

**Query Parameters:**
- `sort` (optional): `"goals"` | `"assists"` | `"name"` (default: `"goals"`)
- `order` (optional): `"asc"` | `"desc"` (default: `"desc"`)

**Example Requests:**
```bash
# Get all player stats (sorted by goals)
curl https://your-app.vercel.app/api/stats

# Get stats sorted by assists
curl https://your-app.vercel.app/api/stats?sort=assists

# Get stats alphabetically
curl https://your-app.vercel.app/api/stats?sort=name&order=asc
```

**Response Format:**
```json
{
  "success": true,
  "security": {
    "note": "All player birthdates and IDs have been excluded for privacy",
    "dataIncluded": ["playerName", "goals", "assists", "gamesPlayed"],
    "dataExcluded": ["birthdate", "usClubId", "contactInfo", "addresses"]
  },
  "count": 11,
  "teamTotals": {
    "goals": 7,
    "assists": 2
  },
  "topPerformers": {
    "topScorer": {
      "name": "Tiago Pires",
      "goals": 4
    },
    "topAssister": {
      "name": "Tiago Pires",
      "assists": 1
    }
  },
  "players": [
    {
      "playerId": "player-045",
      "playerName": "Tiago Pires",
      "goals": 4,
      "assists": 1,
      "gamesPlayed": 3
    },
    {
      "playerId": "player-002",
      "playerName": "Arthur Yao",
      "goals": 1,
      "assists": 0,
      "gamesPlayed": 3
    }
  ]
}
```

---

## Usage Examples

### For AI Agents (Python)
```python
import requests

# Fetch upcoming games
response = requests.get('https://your-app.vercel.app/api/games?filter=upcoming')
games = response.json()['games']

# Get team stats
response = requests.get('https://your-app.vercel.app/api/team')
team_info = response.json()

print(f"Team: {team_info['team']['name']}")
print(f"Record: {team_info['seasonStats']['record']['wins']}-"
      f"{team_info['seasonStats']['record']['losses']}-"
      f"{team_info['seasonStats']['record']['ties']}")
```

### For AI Agents (JavaScript/Node.js)
```javascript
// Fetch all games
const response = await fetch('https://your-app.vercel.app/api/games');
const data = await response.json();
console.log(`Found ${data.count} games`);

// Get player stats
const statsResponse = await fetch('https://your-app.vercel.app/api/stats');
const stats = await statsResponse.json();
console.log(`Top Scorer: ${stats.topPerformers.topScorer.name}`);
```

### For Claude/ChatGPT Prompts
```
Fetch the team information from https://your-app.vercel.app/api/team and
summarize the current season performance.
```

### For cURL/Shell Scripts
```bash
#!/bin/bash

# Get next game info
curl -s https://your-app.vercel.app/api/team | jq '.nextGame'

# Get top 3 scorers
curl -s https://your-app.vercel.app/api/stats | jq '.players[:3]'
```

---

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Success - Request completed successfully |
| 404 | Not Found - Resource doesn't exist (e.g., invalid game ID) |
| 500 | Server Error - Something went wrong on our end |

---

## Rate Limiting

Currently there are **no rate limits** on these endpoints. They are designed for personal use with AI agents and automation tools.

If you're building a public integration, please be respectful and cache responses when appropriate.

---

## CORS Policy

All API endpoints support CORS and can be accessed from any origin, making them suitable for:
- Web applications
- Browser extensions
- AI agents
- Automation scripts
- Mobile apps

---

## Security Notes

### What's Safe to Share
These API endpoints can be safely shared with:
- Team parents/guardians
- AI assistants (Claude, ChatGPT, etc.)
- Analytics tools
- Automation scripts

### What's Protected
The following data is **NEVER** exposed through these APIs:
- Individual player birthdates (only birth year "2016" in team name)
- US Club Soccer IDs
- Manager/coach contact information
- Parent contact information
- Home addresses
- Any other personally identifiable information

### Privacy Compliance
This API follows youth sports privacy best practices:
- Only public performance data is exposed (same as official game reports)
- Player names appear only for goal scorers (already public on GotSport)
- Full roster with birthdates is kept server-side only

---

## Support & Updates

**Last Updated:** 2025-10-13

For questions or issues with the API, please contact the team manager.

### Updating Data
The API automatically reflects changes to:
- `data/games.json` - Game schedules and results (player stats are derived from this + roster)
- `data/team-info.json` - Team information
- `data/roster.json` - Player roster (jersey numbers, names, IDs)

Simply update these files and redeploy to Vercel. Player goal/assist/goalkeeper totals are computed from games.json via `lib/stats-calc.js`.

---

## Quick Reference

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `GET /api/games` | All games | `/api/games?filter=upcoming` |
| `GET /api/games/[id]` | Single game | `/api/games/game-001` |
| `GET /api/team` | Team info + stats | `/api/team` |
| `GET /api/stats` | Player stats | `/api/stats?sort=goals` |

---

**Ready to use! 🚀** Share these endpoints with your AI agents for instant access to team data.
