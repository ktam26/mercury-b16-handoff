# GotSport Automated Scraper

Automated weekly scraper for Almaden FC Mercury B16 Black team data from GotSport.

## Overview

This scraper automatically fetches and updates:
- **League Standings** - Current position, points, wins/losses/draws, goals
- **Game Scores** - Updates scores in `games.json` while preserving all manually entered data
- **Change Detection** - Tracks and logs all changes between runs

**Important:** The scraper ONLY updates scores from GotSport. All manually entered data (goal scorers, assists, locations, jersey colors, photo albums, etc.) is preserved.

## Quick Start

### Manual Run

```bash
npm run scrape
```

The scraper will:
1. Fetch current standings and schedule from GotSport
2. Update scores in `data/games.json` (preserving all manual data)
3. Compare with previous data and detect changes
4. Log all changes detected
5. Save raw scraped data to `data/gotsport-data.json`
6. Append change log to `data/gotsport-changes.json`

## Automated Scheduling

### Option 1: GitHub Actions (Recommended)

The workflow is already configured in `.github/workflows/scrape-gotsport.yml`.

**Features:**
- Runs every Tuesday at 7 AM UTC (12 AM Pacific during daylight time)
- Automatically commits data changes
- Creates GitHub issue with change summary
- Can be manually triggered from Actions tab

**Setup:**
1. Ensure the repository is pushed to GitHub
2. GitHub Actions will automatically run on schedule
3. Check the "Actions" tab to see runs
4. Enable issues if you want automated notifications

**Manual Trigger:**
1. Go to Actions tab on GitHub
2. Select "Scrape GotSport Data"
3. Click "Run workflow"

### Option 2: Render Cron Job

If deploying to Render, the cron job is configured in `render.yaml`.

**Setup:**
1. Push to Render
2. The cron job will automatically be created
3. Check Render dashboard → "gotsport-scraper" service
4. View logs to see scraper runs

**Schedule:** Every Tuesday at 7 AM UTC (12 AM Pacific)

### Option 3: Local Cron

For running on your own server:

```bash
# Edit crontab
crontab -e

# Add this line (runs every Tuesday at 12 AM Pacific)
0 7 * * 2 cd /path/to/mercury-b16-app && npm run scrape
```

## Data Files

### `data/games.json` (Updated by Scraper)

Your main game data file. The scraper ONLY updates the `result.us` and `result.them` scores. All other data is preserved:
- ✅ Goal scorers and assists - PRESERVED
- ✅ Location details (addresses, maps) - PRESERVED
- ✅ Jersey/sock colors - PRESERVED
- ✅ Photo album URLs - PRESERVED
- ✅ All other manually entered data - PRESERVED

### `data/gotsport-data.json` (Raw Scraped Data)

Contains the latest scraped data for comparison:

```json
{
  "timestamp": "2025-10-14T07:31:01.268Z",
  "standings": [
    {
      "position": 5,
      "team": "Almaden FC Almaden FC Mercury B16 Black",
      "matchesPlayed": 4,
      "wins": 1,
      "losses": 2,
      "draws": 1,
      "goalsFor": 9,
      "goalsAgainst": 12,
      "goalDifference": -3,
      "points": 4
    }
    // ... other teams
  ],
  "schedule": [
    {
      "matchNumber": "17589",
      "date": "Nov 08, 2025",
      "time": "11:00 AM PST",
      "homeTeam": "West Valley Soccer Club West Valley United 016B Red",
      "awayTeam": "Almaden FC Almaden FC Mercury B16 Black",
      "score": "-",
      "location": "Latimer School - 9v9 Turf Field",
      "division": "Silver - Region 2 North"
    }
    // ... other matches
  ]
}
```

### `data/gotsport-changes.json`

Keeps a log of all detected changes (last 100 entries):

```json
[
  {
    "timestamp": "2025-10-14T07:31:01.270Z",
    "changes": [
      "⚽ Match 17589 rescheduled: Oct 12, 2025 → Nov 08, 2025",
      "⚽ Almaden FC Almaden FC Mercury B16 Black points changed: 3 → 4",
      "⚽ Almaden FC Almaden FC Mercury B16 Black moved from position 6 to 5"
    ]
  }
]
```

## Change Detection

The scraper detects and logs:

### Standings Changes
- Position changes in league table
- Points updates
- Win/loss/draw record changes
- New teams added

### Schedule Changes
- New matches scheduled
- Score updates
- Date/time changes (rescheduled matches)
- Location changes
- Status updates (Scheduled, Rescheduled, etc.)

**Note:** Changes for Almaden FC Mercury B16 Black are marked with ⚽ emoji

## URLs Monitored

- **Results/Standings:** `https://system.gotsport.com/org_event/events/44142/results?group=384051`
  - Male U10 - Silver - Region 2 North league standings

- **Team Schedule:** `https://system.gotsport.com/org_event/events/44142/schedules?team=3231307`
  - Almaden FC Mercury B16 Black specific schedule

## Technical Details

### Technologies
- **axios** - HTTP requests
- **cheerio** - HTML parsing
- **TypeScript** - Type-safe scraping

### Why Not Playwright?
Initially considered Playwright, but switched to axios + cheerio because:
- ✅ Much faster (milliseconds vs seconds)
- ✅ Lighter weight (~1MB vs ~200MB)
- ✅ No browser binaries needed
- ✅ Better for CI/CD environments
- ✅ GotSport pages are server-rendered HTML

### Error Handling
- Graceful failure with error logging
- Preserves previous data on scrape failure
- Logs are visible in CI/CD console

## Customization

### Change Schedule

**GitHub Actions** - Edit `.github/workflows/scrape-gotsport.yml`:
```yaml
schedule:
  - cron: '0 7 * * 2'  # Every Tuesday at 7 AM UTC (12 AM Pacific)
```

**Render** - Edit `render.yaml`:
```yaml
schedule: "0 7 * * 2"  # Every Tuesday at 7 AM UTC (12 AM Pacific)
```

**Cron syntax:**
- `0 7 * * 2` - Every Tuesday at 7 AM UTC (12 AM Pacific)
- `0 7 * * *` - Every day at 7 AM UTC
- `0 7 * * 1,3,5` - Every Monday, Wednesday, Friday at 7 AM UTC

**Note:** Cron uses UTC time. Pacific time conversions:
- 12:00 AM PDT (daylight) = 7:00 AM UTC
- 12:00 AM PST (standard) = 8:00 AM UTC

### Add More URLs

Edit `scripts/scrape-gotsport.ts`:

```typescript
const RESULTS_URL = 'https://system.gotsport.com/...';
const SCHEDULE_URL = 'https://system.gotsport.com/...';
```

### Customize Change Detection

Edit the `detectChanges()` function in `scripts/scrape-gotsport.ts` to add/remove detection logic.

## Troubleshooting

### Scraper fails
1. Check if GotSport URLs are still valid
2. Verify the HTML structure hasn't changed
3. Check console logs for error details

### No changes detected
- Normal if standings/schedule haven't updated
- Scraper will still save timestamp

### GitHub Action not running
1. Check if Actions are enabled (Settings → Actions)
2. Verify workflow file syntax
3. Check Actions tab for error logs

## Future Enhancements

Potential improvements:
- Email notifications on changes
- Slack/Discord webhooks
- Historical data analytics
- More detailed match statistics
- Multi-team support
