# Handoff Guide

This app was built and run by the previous manager. This guide walks a new owner through taking it over: getting your own API keys, claiming the deployments, and understanding what runs where. Once you've done this once, day-to-day work is just updating results and rolling seasons (see **[NEW_SEASON.md](NEW_SEASON.md)**).

> The previous owner's API keys are **not** in this repo and have been revoked. You bring your own (all free tiers). Nothing here will work against someone else's account.

---

## What runs where

| Piece | Platform | How it deploys |
|---|---|---|
| Web app (Next.js PWA) | **Vercel** | Auto-deploys on every push to `main` |
| MCP server (optional — exposes team data to Claude) | **Render** | Auto-deploys when `data/`, `appsdk/`, or `lib/` change |
| Weekly GotSport scraper | **GitHub Actions** (cron) | Runs in CI, commits updated data back to the repo |

You can run the web app without the MCP server and without the scraper — they're independent.

---

## Step 1 — Get your own API keys

Two keys power the AI features (chat + image generation). Both have free tiers.

| Key | Get it at | Powers |
|---|---|---|
| `GOOGLE_AI_KEY` | https://aistudio.google.com/app/apikey | Weather/location image generation, voice assistant |
| `XAI_API_KEY` | https://x.ai/api | Rules chat / "Ask Mercury" assistant |

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
# then edit .env.local and paste your keys
```

`.env.local` is gitignored — **never commit it**. These keys live only on your machine and in Vercel's env settings (Step 2).

> If you skip a key, the feature it powers won't work, but the rest of the app runs fine.

## Step 2 — Claim the Vercel deployment

1. Create a free account at [vercel.com](https://vercel.com) and **Import** this GitHub repo as a new project (framework auto-detects as Next.js).
2. In **Project → Settings → Environment Variables**, add `GOOGLE_AI_KEY` and `XAI_API_KEY` (same values as your `.env.local`).
3. Deploy. After this, every push to `main` auto-deploys.
4. (Optional) Add your custom domain under **Settings → Domains**.

## Step 3 — Enable the GotSport scraper (GitHub Actions)

The weekly scraper (`.github/workflows/scrape-gotsport.yml`) runs every **Tuesday 7 AM UTC**, pulls the latest schedule/standings from GotSport, and commits any changes back to the repo (which triggers a Vercel redeploy).

To turn it on for your repo:
1. Go to the repo's **Actions** tab and enable workflows.
2. **Settings → Actions → General → Workflow permissions** → select **Read and write permissions** (lets the bot commit data updates).

It uses the built-in `GITHUB_TOKEN` — **no personal token to create**. To change the schedule, see [NEW_SEASON.md](NEW_SEASON.md#adjusting-the-cron).

## Step 4 — (Optional) Claim the MCP server on Render

Only needed if you want to expose team data to Claude Desktop/Code. Skip if you don't use it.

1. Create a free account at [render.com](https://render.com), **New → Blueprint**, point it at this repo (it reads `render.yaml`).
2. To auto-redeploy the MCP server when data changes, add a `RENDER_DEPLOY_HOOK_URL` secret in **GitHub repo → Settings → Secrets and variables → Actions** (get the URL from Render → your service → Settings → Deploy Hook). See [DEPLOYMENT details below](#mcp-server-details).

---

## First-run checklist

```bash
npm install        # install dependencies (Node 20+)
npm run dev        # http://localhost:3000 — should render with all current data
```

If the app loads with the current roster and season, you're set. Then:
- [ ] Keys in `.env.local` (Step 1)
- [ ] Vercel project + env vars (Step 2)
- [ ] Actions enabled with write permission (Step 3)
- [ ] Update the GotSport IDs when the next season starts → **[NEW_SEASON.md](NEW_SEASON.md)**

---

## ⚠️ Privacy note — player data

`data/roster.json` contains real player info (names, and in some cases birthdates and US Club IDs). That's fine for the team's own use, but it means **you should decide whether the GitHub repo is public or private.** If you keep it public, consider removing `birthdate` and `usClubId` from `roster.json` (the app does not require them). Photos and results are already public-facing.

---

## MCP server details

- `render.yaml` — Render service + the weekly scraper cron config
- `appsdk/` — the MCP server source; `appsdk/Dockerfile` builds it
- `.github/workflows/deploy-mcp.yml` — triggers the Render deploy hook when `data/`/`appsdk/`/`lib/` change
- Connect Claude (remote): `claude mcp add team --transport http --url https://<your-render-service>.onrender.com/mcp`
- Connect Claude (local): `claude mcp add team --command "npm run appsdk:dev"`

See `docs/MCP_DEPLOYMENT_GUIDE.md` and `docs/RENDER_DEPLOYMENT.md` for more.
