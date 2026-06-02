# Mercury B16 Team App

A team app for a youth soccer team: schedule, live-calculated standings, game results with goal/assist/keeper stats and minute-by-minute timelines, season archives, photo albums, tournament views, and an AI "Ask Mercury" assistant. Built as a installable PWA.

**Stack:** Next.js 16 · React 19 · Tailwind 4 · deployed on Vercel. Optional MCP server (Render) exposes team data to Claude. A weekly GitHub Actions job scrapes schedule/standings from GotSport.

---

## 📖 If you're taking this over

Two guides cover everything:

1. **[HANDOFF.md](HANDOFF.md)** — one-time setup: get your own API keys, claim the Vercel/Render deploys, enable the scraper. **Start here.**
2. **[NEW_SEASON.md](NEW_SEASON.md)** — each season: roll into a new Fall/Spring season (`npm run new-season`), find your new GotSport IDs, and update results/stats.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # add your API keys (see HANDOFF.md)
npm run dev                         # http://localhost:3000
```

## Common commands

| Command | What it does |
|---|---|
| `npm run dev` | Run the app locally |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run scrape` | Pull schedule + standings from GotSport into `data/games.json` |
| `npm run new-season` | Roll the app into a new season (see [NEW_SEASON.md](NEW_SEASON.md)) |
| `npm run appsdk:dev` | Run the MCP server locally (optional) |

## How data works

All team data is plain JSON in `data/` — no database.

| File | Holds |
|---|---|
| `data/games.json` | The **current** season's games + results |
| `data/seasons/<id>.json` | Archived past seasons |
| `data/roster.json` | Player roster |
| `data/team-info.json` | Team name, colors, GotSport links |
| `config/gotsport.json` | GotSport event/team/group IDs (single source of truth) |
| `lib/seasons.js` | Registers which seasons appear as tabs |

Editing results, adding logos, and the game schema are documented in **[NEW_SEASON.md → Updating results & stats](NEW_SEASON.md#updating-results--stats-during-the-season)**.

## More docs

- `docs/GOTSPORT_SCRAPER.md` — how the scraper works and troubleshooting
- `docs/MCP_DEPLOYMENT_GUIDE.md`, `docs/RENDER_DEPLOYMENT.md` — the optional MCP server
- `API_DOCUMENTATION.md` — internal API routes
