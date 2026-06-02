# Render Deployment Guide - MCP Server

**Simple, Git-based deployment for the Almaden Mercury B16 MCP Server**

## Why Render?

✅ **Simpler than Fly.io** - No CLI required, deploy via Git
✅ **Auto-deploys** - Push to GitHub → automatic deployment
✅ **Free tier** - 750 hours/month free (enough for this app)
✅ **Built-in HTTPS** - Free SSL certificates
✅ **Great UI** - Easier management than CLI tools

---

## Prerequisites

### Required
- GitHub account (to host your code)
- Render account (sign up at [render.com](https://render.com) - free)

### Setup Time
- **First deployment**: ~20 minutes
- **Subsequent deploys**: Automatic on git push

---

## Deployment Steps

### Step 1: Push Code to GitHub

If you haven't already:

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Add MCP server deployment config"

# Create GitHub repo and push
git remote add origin https://github.com/your-username/mercury-b16-app.git
git push -u origin main
```

### Step 2: Create Render Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository:
   - Click **"Connect GitHub"**
   - Authorize Render
   - Select `mercury-b16-app` repository

### Step 3: Configure the Service

Render will detect your `render.yaml` file automatically. Verify these settings:

#### Basic Settings
- **Name**: `mercury-b16-mcp` (or your choice)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: Leave blank (uses repo root)

#### Build & Deploy
- **Build Command**: `npm ci && npm run appsdk:build`
- **Start Command**: `node appsdk/dist/server-entry.js`

#### Instance Type
- **Plan**: **Free** (sufficient for this app)

### Step 4: Environment Variables

Render automatically provides `PORT`. Add these variables:

- `NODE_ENV` = `production` (already set in render.yaml)
- `MCP_ENABLED` = `true` (required for `/mcp` tool traffic)
- `MCP_PATH` = `/mcp` (already set in render.yaml)

### Step 5: Deploy!

Click **"Create Web Service"**

Render will:
1. Clone your repository
2. Run `npm ci && npm run appsdk:build`
3. Start the server with `node appsdk/dist/server-entry.js`
4. Assign a URL like `https://mercury-b16-mcp.onrender.com`

**Deployment time**: ~3-5 minutes

---

## Your MCP Server URL

After deployment completes, your server will be available at:

```
https://your-app-name.onrender.com/mcp
```

Find it in the Render dashboard under your service details.

---

## Testing the Deployment

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector \
  --transport streamable-http \
  --server-url https://your-app.onrender.com/mcp \
  -- https://your-app.onrender.com/mcp
```

### Verify Tools Work

In the Inspector, test all 4 tools:
1. ✅ `get_next_match` - Next upcoming game
2. ✅ `list_schedule` - Past results + upcoming games
3. ✅ `get_roster` - Team roster with jersey numbers
4. ✅ `get_player_stats` - Player or team statistics

All should return data successfully!

---

## Configure ChatGPT

Once deployed and tested:

1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to **Apps** section
3. Click **Create new app**
4. Enter details:
   - **Name**: Almaden Mercury B16
   - **Description**: Youth soccer team information and statistics
   - **MCP Server URL**: `https://your-app.onrender.com/mcp`
5. Submit for review or test immediately

---

## Automatic Deploys (The Magic Part!)

**Every time you push to GitHub, Render auto-deploys!**

```bash
# Update team data
vi data/games.json

# Commit and push
git add data/games.json
git commit -m "Update game schedule"
git push origin main

# Render automatically:
# 1. Detects the push
# 2. Rebuilds the app
# 3. Deploys the new version
# ~3 minutes later, your changes are live!
```

No commands to run. No manual deploys. Just push!

---

## Monitoring & Logs

### View Logs

In Render dashboard:
1. Click on your service
2. Go to **"Logs"** tab
3. See real-time logs

### Check Status

Dashboard shows:
- **Service status**: Running/Stopped
- **Last deploy**: Time and commit
- **Health checks**: Passing/Failing
- **Metrics**: CPU/Memory usage

---

## Troubleshooting

### Build Fails

**Check**:
1. Logs in Render dashboard
2. Verify `npm run appsdk:build` works locally
3. Check `render.yaml` configuration

**Common issue**: Missing dependencies
```bash
# Fix locally
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Server Won't Start

**Check logs for**:
- Missing `/data` or `/lib` directories
- Environment variable issues
- Port binding problems (Render provides `PORT` automatically)

### Tools Return Errors

**Verify**:
1. Test locally with `npm run appsdk:dev` first
2. Check `/data` files are in repository
3. Check `/lib/game-utils.js` exists

### Free Tier Sleeping

**Note**: Free tier services sleep after 15 minutes of inactivity.

- **First request**: ~30 second cold start
- **Subsequent requests**: Fast

**Solution**: Upgrade to paid plan ($7/month) for always-on service if needed.

---

## Updating Your MCP Server

```bash
# Make changes to code or data
vi appsdk/server.ts

# Commit and push
git add .
git commit -m "Update MCP tools"
git push

# Render deploys automatically!
```

**That's it!** No manual deployment commands.

---

## Cost

### Free Tier (Current Plan)
- ✅ 750 hours/month
- ✅ Free SSL
- ✅ Auto-deploys from Git
- ⚠️ Service sleeps after 15min inactivity (cold starts)

**Monthly cost**: $0

### Paid Tier (If Needed)
- ✅ Always-on (no sleeping)
- ✅ More CPU/memory
- ✅ Priority support

**Monthly cost**: $7/month

---

## Render vs Fly.io

| Feature | Render | Fly.io |
|---------|--------|--------|
| **Setup** | Web UI only | Requires CLI |
| **Deployment** | Auto from Git | Manual command |
| **Configuration** | Web UI + yaml | fly.toml only |
| **Free tier** | 750 hrs/month | 3 VMs |
| **Cold starts** | Yes (free tier) | Configurable |
| **Ease of use** | ★★★★★ | ★★★☆☆ |

**Recommendation**: Render is simpler for this use case.

---

## Web App Unaffected

✅ Your Next.js web app on Vercel works exactly as before
✅ This deployment only affects the MCP server
✅ Both share `/data` and `/lib` from the same repository

---

## Verification Checklist

After deployment:

- [ ] Render service shows "Live" status
- [ ] Service URL is accessible
- [ ] MCP Inspector connects successfully
- [ ] All 4 tools return data
- [ ] Widgets render (check Resources tab)
- [ ] ChatGPT can connect
- [ ] Web app on Vercel still works

---

## FAQ

### Q: Do I need to manually deploy every time?

**A**: No! Push to GitHub → Render deploys automatically.

### Q: What if I want to use a custom domain?

**A**: Render supports custom domains. Go to service Settings → Custom Domains → Add your domain.

### Q: Can I preview changes before deploying?

**A**: Yes! Use pull request previews:
1. Create a new branch
2. Push to GitHub
3. Open pull request
4. Render creates preview URL automatically

### Q: How do I rollback a bad deploy?

**A**: In Render dashboard:
1. Go to **Events** tab
2. Find previous successful deploy
3. Click **"Rollback"**

### Q: Will this work with my existing Vercel setup?

**A**: Yes! Vercel handles the web app, Render handles the MCP server. They're completely independent.

---

## Next Steps

1. ✅ Create Render account
2. ✅ Push code to GitHub
3. ✅ Connect repository to Render
4. ✅ Deploy (automatically via `render.yaml`)
5. ✅ Test with MCP Inspector
6. ✅ Register with ChatGPT

**Total time**: ~20 minutes from start to ChatGPT integration!

---

## Support

### Documentation
- [Render Docs](https://render.com/docs)
- [MCP Specification](https://modelcontextprotocol.io/specification/)
- [OpenAI Apps SDK](https://platform.openai.com/docs/apps)

### Getting Help
- Render Status: [status.render.com](https://status.render.com)
- Community Forum: [community.render.com](https://community.render.com)

---

**Version**: 1.0
**Last Updated**: 2025-10-14
**Author**: Claude Code
**Status**: Ready for Deployment
