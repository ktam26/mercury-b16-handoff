# Mercury B16 Team App

A team app for a youth soccer team: schedule, live-calculated standings, game results with goal/assist/keeper stats and minute-by-minute timelines, season archives, photo albums, and tournament views. It's an installable PWA with an AI "Ask Mercury" assistant built in, and it can also expose team data to Claude or ChatGPT over MCP.

**Stack:** Next.js 16 · React 19 · Tailwind 4 · deployed on Vercel. Optional MCP server (Render) exposes team data to Claude/ChatGPT. A weekly GitHub Actions job scrapes schedule/standings from GotSport.

---

## 📖 Taking over this app?

Start with **[HANDOFF.md](HANDOFF.md)** — it walks a new owner through getting your own API keys, claiming the deployments, and understanding what runs where.

## Quick start

**Prerequisites:** Node 20+ and npm.

```bash
npm install
cp .env.local.example .env.local   # add your API keys (see HANDOFF.md)
npm run dev                         # http://localhost:3000
```

## Find the right guide

| You want to... | Read |
|---|---|
| Record a game result or update stats | [docs/NEW_SEASON.md → Updating results & stats](docs/NEW_SEASON.md#updating-results--stats-during-the-season) |
| Start a new season | [docs/NEW_SEASON.md](docs/NEW_SEASON.md) |
| Take over ownership, deploys, or keys | [HANDOFF.md](HANDOFF.md) |
| Deploy or fix the MCP server | [docs/RENDER_DEPLOYMENT.md](docs/RENDER_DEPLOYMENT.md) + [appsdk/README.md](appsdk/README.md) |
| Fix a broken scraper | [docs/GOTSPORT_SCRAPER.md](docs/GOTSPORT_SCRAPER.md) |
| Use the JSON API | [docs/API.md](docs/API.md) |

## Repository map

```
app/                    Next.js pages (schedule, game detail, stats, photos, season, tournament, API routes)
components/             React components (GameCard, ScheduleTabs, RulesChat, etc.)
lib/                    Shared logic: stats calculations, season/tournament registration, utils
data/                   The team's actual data — see below
config/gotsport.json    GotSport event/team/group IDs (single source of truth)
scripts/                Scraper scripts, season rollover script, image generators
appsdk/                 MCP server source (exposes team data to Claude/ChatGPT) — see appsdk/README.md
.github/workflows/      CI jobs — see below
docs/                   All other guides: new season, JSON API, MCP deployment, scraper
```

### `data/` — the files you'll actually edit

| File | Holds |
|---|---|
| `data/games.json` | The **current** season's games + results |
| `data/seasons/<id>.json` | Archived past seasons |
| `data/roster.json` | Player roster |
| `data/team-info.json` | Team name, colors, GotSport links |
| `data/tournaments/` | Tournament-specific data |

### `.github/workflows/`

| Workflow | Trigger |
|---|---|
| `scrape-gotsport.yml` | Weekly cron (Tuesdays 7 AM UTC) + manual — pulls schedule/standings from GotSport |
| `scrape-tournament.yml` | One-off crons hardcoded to a specific tournament's game times + manual |
| `deploy-mcp.yml` | On push to `main` when `data/`, `appsdk/`, or `lib/` change — triggers the Render deploy hook for the MCP server |

## How data flows

The weekly GitHub Actions scraper (`scrape-gotsport.yml`) pulls the latest schedule and standings from GotSport and commits changes to `data/*.json`. That commit triggers a Vercel redeploy of the web app automatically. If `data/`, `appsdk/`, or `lib/` changed, `deploy-mcp.yml` also fires and redeploys the MCP server on Render. Goal scorers, assists, and other detail the scraper can't get are added by hand directly to `data/games.json` (see [docs/NEW_SEASON.md → Updating results & stats](docs/NEW_SEASON.md#updating-results--stats-during-the-season)).

## Common commands

| Command | What it does |
|---|---|
| `npm run dev` | Run the app locally |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run scrape` | Pull schedule + standings from GotSport into `data/games.json` |
| `npm run scrape:tournament` | Pull live tournament data into `data/tournament.json` |
| `npm run new-season` | Roll the app into a new season (see [docs/NEW_SEASON.md](docs/NEW_SEASON.md)) |
| `npm run appsdk:dev` | Run the MCP server locally (optional) |
| `npm run lint` | Run ESLint |

## How data works

All team data is plain JSON in `data/` — no database. `lib/seasons.js` registers which seasons appear as tabs, and `lib/stats-calc.js` derives standings and player stats from completed games — you never edit those by hand.
