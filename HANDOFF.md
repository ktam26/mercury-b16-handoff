# Handoff Guide

*Part of the Mercury B16 app docs — see the [README](README.md) for the full guide index.*

This app was built and run by the previous manager. This guide walks a new owner through taking it over: getting your own API keys, claiming the deployments, and understanding what runs where. Once you've done this once, day-to-day work is just updating results and rolling seasons (see **[docs/NEW_SEASON.md](docs/NEW_SEASON.md)**).

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

One key powers all the AI features (chat + image generation). It has a free tier.

| Key | Get it at | Powers |
|---|---|---|
| `GOOGLE_AI_KEY` | https://aistudio.google.com/app/apikey | Rules chat / "Ask Mercury" assistant, weather/location image generation, voice assistant |

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
# then edit .env.local and paste your keys
```

`.env.local` is gitignored — **never commit it**. These keys live only on your machine and in Vercel's env settings (Step 2).

> If you skip a key, the feature it powers won't work, but the rest of the app runs fine.

## Step 2 — Claim the Vercel deployment

1. Create a free account at [vercel.com](https://vercel.com) and **Import** this GitHub repo as a new project (framework auto-detects as Next.js).
2. In **Project → Settings → Environment Variables**, add `GOOGLE_AI_KEY` (same value as your `.env.local`).
3. Deploy. After this, every push to `main` auto-deploys.
4. (Optional) Add your custom domain under **Settings → Domains**.

## Step 3 — Enable the GotSport scraper (GitHub Actions)

The weekly scraper (`.github/workflows/scrape-gotsport.yml`) runs every **Tuesday 7 AM UTC**, pulls the latest schedule/standings from GotSport, and commits any changes back to the repo (which triggers a Vercel redeploy).

To turn it on for your repo:
1. Go to the repo's **Actions** tab and enable workflows.
2. **Settings → Actions → General → Workflow permissions** → select **Read and write permissions** (lets the bot commit data updates).

It uses the built-in `GITHUB_TOKEN` — **no personal token to create**. To change the schedule, see [docs/NEW_SEASON.md](docs/NEW_SEASON.md#adjusting-the-cron).

## Step 4 — (Optional) Claim the MCP server on Render

Only needed if you want to expose team data to Claude Desktop/Code. Skip if you don't use it.

1. Create a free account at [render.com](https://render.com) and create a **Web Service** by hand, pointed at this repo. Full step-by-step (build/start commands, env vars) is in **[docs/RENDER_DEPLOYMENT.md](docs/RENDER_DEPLOYMENT.md)**. Note: `render.yaml` in this repo only defines the GotSport scraper cron job — it does not deploy the MCP server, so don't use Render's "New → Blueprint" option for this step.
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
- [ ] Update the GotSport IDs when the next season starts → **[docs/NEW_SEASON.md](docs/NEW_SEASON.md)**

---

## ⚠️ Privacy note — player data

`data/roster.json` contains real player info (names, and in some cases birthdates and US Club IDs). That's fine for the team's own use, but it means **you should decide whether the GitHub repo is public or private.** If you keep it public, consider removing `birthdate` and `usClubId` from `roster.json` (the app does not require them). Photos and results are already public-facing.

---

## MCP server details

- `render.yaml` — the weekly scraper cron config only (does **not** configure the MCP server — see Step 4)
- `appsdk/` — the MCP server source; `appsdk/Dockerfile` builds it
- `.github/workflows/deploy-mcp.yml` — triggers the Render deploy hook when `data/`/`appsdk/`/`lib/` change
- Connect Claude (remote): `claude mcp add team --transport http --url https://<your-render-service>.onrender.com/mcp`
- Connect Claude (local): `claude mcp add team --command "npm run appsdk:dev"`
- Full list of MCP server environment variables: `appsdk/README.md`

See `docs/RENDER_DEPLOYMENT.md` for more.
