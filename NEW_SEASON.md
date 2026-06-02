# New Season Guide

Each new season (Fall, Spring, …) the team plays in a **new GotSport event**, so the app needs to: archive the season that just ended, start a fresh schedule, and point the scraper at the new event. There's a script for the mechanical parts and two things only you can do (find the new GotSport IDs, decide the cron). Budget ~10 minutes.

---

## TL;DR

```bash
npm run new-season     # interactive — archives old season, creates the new tab, updates IDs
npm run dev            # verify the new tab appears and the old season still renders
npm run scrape         # pull the new schedule from GotSport into data/games.json
git add -A && git commit -m "Start Fall 2026 season"
git push               # Vercel auto-deploys
```

---

## Step 1 — Find your new GotSport IDs

Open your team's schedule on GotSport. The URL contains the three IDs the app needs:

```
https://system.gotsport.com/org_event/events/49370/schedules?team=3800359
                                            ^^^^^                ^^^^^^^
                                            eventId              teamId
```

And the standings/results URL gives the third:

```
https://system.gotsport.com/org_event/events/49370/results?group=435945
                                            ^^^^^             ^^^^^^
                                            eventId           groupId
```

So you need: **eventId**, **teamId**, **groupId**. Have them ready for the script.

> Tip: `eventId` is the league/season event; `teamId` is your team within it; `groupId` is your division/bracket (used for standings). They all change when the team enters a new event.

## Step 2 — Run the rollover

```bash
npm run new-season
```

It will:
1. Detect the season that's ending (the one backed by `data/games.json`) and ask for the **new** season id (e.g. `fall-2026`), label, and full label.
2. Ask for the new GotSport `eventId` / `teamId` / `groupId` (press Enter to keep a value that hasn't changed).
3. Show a plan and wait for you to confirm before writing anything.

On confirm it:
- Copies `data/games.json` → `data/seasons/<old-season>.json` (archives the finished season)
- Rewrites `lib/seasons.js` so the **new season becomes the default tab** and the old one keeps its own tab
- Resets `data/games.json` to an empty schedule `[]`
- Writes the new IDs to `config/gotsport.json` and refreshes the links in `data/team-info.json`

Nothing is written until you confirm, and it won't overwrite an existing archive without asking.

## Step 3 — Seed the new schedule

```bash
npm run scrape
```

This reads the new IDs from `config/gotsport.json`, fetches the schedule + standings from GotSport, and fills `data/games.json`. Run `npm run dev` and confirm the new season's games appear.

> If `scrape` pulls nothing, double-check the IDs in `config/gotsport.json` against the GotSport URL (Step 1) — wrong IDs fetch an empty schedule.

## Step 4 — Commit

```bash
git add -A
git commit -m "Start Fall 2026 season"
git push
```

Vercel auto-deploys on push. Done.

---

## Adjusting the cron

The scraper runs weekly via `.github/workflows/scrape-gotsport.yml`:

```yaml
on:
  schedule:
    - cron: '0 7 * * 2'   # Every Tuesday 07:00 UTC
```

If your games are on different days, change the cron (it's UTC). Format is `minute hour day-of-month month day-of-week`. Examples:
- `0 7 * * 1` — Mondays 7 AM UTC
- `0 15 * * 2` — Tuesdays 3 PM UTC

You can also trigger it manually anytime from the repo's **Actions** tab (**Run workflow**).

---

## Manual fallback (if you don't want to use the script)

The script just automates these edits — you can do them by hand:

1. **Archive:** copy `data/games.json` to `data/seasons/<old-season-id>.json` (e.g. `spring-2026.json`).
2. **Register seasons** in `lib/seasons.js`:
   ```js
   import currentGamesData from '@/data/games.json';
   import spring2026Games from '@/data/seasons/spring-2026.json';   // ← add import for archived season
   import fall2025Games from '@/data/seasons/fall-2025.json';

   export const SEASONS = [
     { id: 'fall-2026',   label: 'Fall 26',   fullLabel: 'Fall 2026',   data: currentGamesData },  // ← new, on top
     { id: 'spring-2026', label: 'Spring 26', fullLabel: 'Spring 2026', data: spring2026Games },   // ← was currentGamesData
     { id: 'fall-2025',   label: 'Fall 25',   fullLabel: 'Fall 2025',   data: fall2025Games },
   ];
   ```
   The new season is `SEASONS[0]` and uses `currentGamesData` (games.json). The season that just ended now imports its archived file.
3. **Reset** `data/games.json` to `[]`.
4. **Update IDs** in `config/gotsport.json` and the links in `data/team-info.json`.

---

## Updating results & stats during the season

No script needed — edit `data/games.json` directly, then commit. The weekly scraper fills in scores, schedule changes, and opponent records automatically; you add the things it can't get (goal scorers, assists, goalkeepers, minute-by-minute timeline).

### Game result shape

```jsonc
{
  "id": "game-011",
  "result": {
    "us": 4,
    "them": 2,
    "goalScorers": ["Player Name (2)", "Other Player (1)"],   // "(n)" = goals that game
    "assists":     ["Player Name (1)"],
    "goalkeepers": [
      { "name": "Keeper One", "half": 1, "goalsAllowed": 1, "saves": 4 },
      { "name": "Keeper Two", "half": 2, "goalsAllowed": 1, "saves": 6 }
    ],
    "timeline": [
      { "minute": 3,  "type": "goal", "team": "mercury",  "scorer": "Player Name", "assist": "Other Player", "videoTimestamp": 285 },
      { "minute": 23, "type": "goal", "team": "opponent" }
    ]
  }
}
```

- `team` in the timeline is `"mercury"` (us) or `"opponent"`. `videoTimestamp` (seconds into the game video) is optional.
- Leave `"result": null` for games not yet played.
- The home page calculates the record, goals for/against, and standings automatically from completed games — you don't edit those by hand.

### Adding an opponent logo

1. Save the logo to `public/images/logos/<opponent-name>.png` (lowercase, hyphens).
2. Set it in the game's `teamLogos` (`home`/`away`).

### Photo album

After photos are posted, set the game's `photoAlbumUrl` to the album link.
