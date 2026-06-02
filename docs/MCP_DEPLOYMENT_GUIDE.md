# MCP Server Deployment Guide

**Product Requirement Document & Implementation Guide**

## Executive Summary

This guide covers deploying the Almaden Mercury B16 Apps SDK (MCP server) to production on Fly.io, enabling ChatGPT integration without affecting the existing Next.js web application.

### Key Facts
- ✅ **Web app unaffected** - Continues to deploy to Vercel as before
- ✅ **Simple monorepo** - Both apps share code via same repository
- ✅ **Independent deployments** - Each app deploys separately
- ✅ **Minimal configuration** - 3 config files, ~100 lines total

---

## Architecture Overview

### Current State
```
mercury-b16-app/
├── app/              # Next.js web app → Deploys to Vercel
├── components/       # React components (web app)
├── lib/              # Shared utilities (both apps use)
├── data/             # JSON data (both apps use)
├── appsdk/           # MCP server → Will deploy to Fly.io
│   ├── server.ts
│   ├── server-entry.ts
│   ├── serializers/
│   └── widgets/
└── package.json      # Shared dependencies
```

### Deployment Architecture
```
┌─────────────────────────────────────────────┐
│  Single Git Repository (monorepo)          │
│  mercury-b16-app/                          │
│                                            │
│  ┌──────────────┐      ┌──────────────┐  │
│  │  Next.js App │      │  MCP Server  │  │
│  │  /app        │      │  /appsdk     │  │
│  └───────┬──────┘      └───────┬──────┘  │
│          │                     │          │
└──────────┼─────────────────────┼──────────┘
           │                     │
           ▼                     ▼
    ┌──────────────┐      ┌──────────────┐
    │   Vercel     │      │   Fly.io     │
    │ (existing)   │      │   (new)      │
    └──────────────┘      └──────────────┘
           │                     │
           ▼                     ▼
    Web App Users        ChatGPT Users
```

### Why This Works
- **Shared code** - Both apps use `/data` and `/lib` from the same repo
- **Independent builds** - Vercel builds Next.js, Fly.io builds Node.js MCP server
- **No conflicts** - Each platform only deploys what it needs

---

## Prerequisites

### Required Accounts
- [x] Fly.io account (free tier available)
- [x] Fly.io CLI installed

### Install Fly.io CLI
```bash
# macOS
brew install flyctl

# Or download from https://fly.io/docs/hands-on/install-flyctl/
```

### Authentication
```bash
flyctl auth login
```

---

## Deployment Steps

### Step 1: Create Deployment Configuration Files

- [x] 1.1 Create `appsdk/fly.toml`
- [x] 1.2 Create `appsdk/Dockerfile`
- [x] 1.3 Create `.dockerignore`

#### 1.1 Create `appsdk/fly.toml`

```toml
# Fly.io deployment configuration
app = "mercury-b16-mcp"  # Change this to your preferred app name
primary_region = "sjc"   # Change to your preferred region

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  NODE_ENV = "production"
  MCP_PATH = "/mcp"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

  [[http_service.checks]]
    interval = "30s"
    timeout = "5s"
    grace_period = "10s"
    method = "GET"
    path = "/"
```

#### 1.2 Create `appsdk/Dockerfile`

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run appsdk:build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/appsdk/dist ./appsdk/dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080
CMD ["node", "appsdk/dist/server-entry.js"]
```

#### 1.3 Create `.dockerignore` (if not exists)

```
node_modules
.next
.git
.env*.local
*.log
.DS_Store
*.md
docs/
.github/
.vercel/
app/
components/
public/
styles/
next.config.js
tsconfig.json
inspector.config.json
```

### Step 2: Update MCP Server for Production

- [x] 2.1 Update `appsdk/server-entry.ts`

#### 2.1 Update `appsdk/server-entry.ts`

Add environment variable support for PORT:

```typescript
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = process.env.HOST || '0.0.0.0';
```

Updated to support both platform-provided `PORT`/`HOST` variables and legacy `MCP_PORT`/`MCP_HOST` for local tooling. ✓

### Step 3: Test Locally

- [x] 3.1 Build the server (`npm run appsdk:build`)
- [ ] 3.2 Run the production build locally (`node appsdk/dist/server-entry.js`)
- [ ] 3.3 Test MCP endpoint with curl

> Note: Local port binding is blocked in the current sandbox environment (`listen EPERM`), so server runtime and curl verification remain outstanding.

Build and test the production setup locally:

```bash
# Build the server
npm run appsdk:build

# Test the build
node appsdk/dist/server-entry.js

# Should see:
# {"level":"info","timestamp":"...","source":"appsdk-server","event":"server_started","url":"http://0.0.0.0:3001/mcp"}
```

Test with curl:
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

### Step 4: Deploy to Fly.io

- [ ] 4.1 Create the Fly.io app
- [ ] 4.2 Deploy
- [ ] 4.3 Verify deployment

#### 4.1 Create the Fly.io App

```bash
cd appsdk
flyctl launch

# Answer the prompts:
# - App name: mercury-b16-mcp (or your choice)
# - Region: Choose closest to you
# - PostgreSQL: No
# - Redis: No
```

This will:
- Create the app on Fly.io
- Use your `fly.toml` configuration
- Not deploy yet (we'll do that manually)

#### 4.2 Deploy

```bash
flyctl deploy
```

This will:
1. Build the Docker image
2. Push it to Fly.io
3. Deploy to your app
4. Start the server

Wait for deployment to complete (~2-5 minutes).

#### 4.3 Verify Deployment

```bash
# Check status
flyctl status

# Check logs
flyctl logs

# Get the URL
flyctl info
```

Your MCP server URL will be: `https://mercury-b16-mcp.fly.dev/mcp`

### Step 5: Test Production Deployment

- [ ] 5.1 Test with MCP Inspector
- [ ] 5.2 Test tools in MCP Inspector

#### 5.1 Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector \
  --transport streamable-http \
  --server-url https://your-app.fly.dev/mcp \
  -- https://your-app.fly.dev/mcp
```

#### 5.2 Test Tools

In the Inspector:
1. Connect to the server
2. Test `get_next_match`
3. Test `list_schedule`
4. Test `get_roster`
5. Test `get_player_stats`

All should return data successfully.

### Step 6: Configure ChatGPT

- [ ] 6.1 Get your MCP server URL
- [ ] 6.2 Register with OpenAI

#### 6.1 Get Your MCP Server URL

```bash
flyctl info
```

Copy the hostname (e.g., `mercury-b16-mcp.fly.dev`)

#### 6.2 Register with OpenAI

1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to **Apps** section
3. Click **Create new app**
4. Enter your app details:
   - **Name**: Almaden Mercury B16
   - **Description**: Youth soccer team information and statistics
   - **MCP Server URL**: `https://mercury-b16-mcp.fly.dev/mcp`

5. Submit for review (if required) or test immediately

---

## Verification Checklist

After deployment, verify:

- [ ] Fly.io app is running (`flyctl status` shows "running")
- [ ] MCP server responds to health checks
- [ ] All 4 tools work in MCP Inspector
- [ ] Widget resources load correctly
- [ ] ChatGPT can connect to the server
- [ ] Web app on Vercel is unaffected

---

## Maintenance & Updates

### Updating the MCP Server

```bash
cd appsdk
flyctl deploy
```

That's it! The monorepo means you can update data files, utilities, and the MCP server in one commit, then deploy.

### Viewing Logs

```bash
# Live logs
flyctl logs

# Last 100 lines
flyctl logs --limit 100
```

### Scaling

```bash
# Add more instances
flyctl scale count 2

# Change machine size
flyctl scale vm shared-cpu-1x
```

### Monitoring

```bash
# Check metrics
flyctl metrics

# Check status
flyctl status
```

---

## Troubleshooting

### Build Fails

**Problem**: Docker build fails

**Solutions**:
1. Check that `npm run appsdk:build` works locally
2. Verify `appsdk/dist/` directory is created
3. Check Dockerfile paths are correct

### Server Won't Start

**Problem**: App deploys but doesn't respond

**Solutions**:
1. Check logs: `flyctl logs`
2. Verify PORT environment variable is set
3. Check server binds to `0.0.0.0`, not `localhost`

### Tools Don't Work

**Problem**: MCP server responds but tools return errors

**Solutions**:
1. Verify `/data` directory was copied in Docker image
2. Check `/lib` directory exists
3. Test locally first to isolate deployment vs code issues

### CORS Errors

**Problem**: Browser can't connect due to CORS

**Solution**: CORS headers are already configured in `server-entry.ts`. If you need to restrict origins, update:

```typescript
res.setHeader('Access-Control-Allow-Origin', 'https://chatgpt.com');
```

---

## Security Considerations

### Current Security

- ✅ CORS headers configured
- ✅ HTTPS enforced by Fly.io
- ✅ No sensitive data in public responses
- ✅ Read-only data access (no mutations)

### Optional: Add API Key Authentication

If you want to restrict access, add to `appsdk/server-entry.ts`:

```typescript
const API_KEY = process.env.MCP_API_KEY;

// In handleRequest function:
if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
  res.statusCode = 401;
  res.end('Unauthorized');
  return;
}
```

Then set the environment variable:
```bash
flyctl secrets set MCP_API_KEY=your-secret-key
```

---

## Cost Estimate

### Fly.io Pricing (as of 2024)

**Free Tier includes**:
- 3 shared-cpu-1x VMs
- 160GB/month outbound data transfer
- Shared IPv4 address

**Expected usage for this app**:
- 1 VM required
- Minimal traffic (<1GB/month)
- **Cost: FREE** (within free tier limits)

**If exceeding free tier**:
- ~$5-10/month for 1 VM running 24/7

---

## FAQ

### Q: Will this affect my Next.js web app?

**A:** No. The web app deploys to Vercel completely independently. The MCP server deploys to Fly.io. They share code via the git repository but deploy separately.

### Q: How do I update the team data?

**A:** Update the JSON files in `/data`, commit, then:
1. Web app: Deploys automatically to Vercel (no changes needed)
2. MCP server: Run `flyctl deploy` from `/appsdk`

### Q: Can I use a different platform instead of Fly.io?

**A:** Yes! You can deploy to:
- **Render** - Similar to Fly.io, has free tier
- **Railway** - Also has free tier
- **Heroku** - Paid only now
- **Your own VPS** - Run with systemd/PM2

Just adapt the Dockerfile accordingly.

### Q: Do I need to rebuild widgets for every deploy?

**A:** No. Widgets are built once during `npm run appsdk:build` and included in the Docker image.

### Q: How do I test changes before deploying?

**A:** Use the MCP Inspector locally:
```bash
npm run appsdk:dev

# In another terminal:
npx @modelcontextprotocol/inspector \
  --transport streamable-http \
  --server-url http://localhost:3001/mcp \
  -- http://localhost:3001/mcp
```

---

## Architecture Decisions

### Why Monorepo?

**Advantages**:
- Single source of truth for `/data` files
- Shared utilities in `/lib` automatically synchronized
- Atomic updates across both applications
- Simpler development workflow

**Disadvantages**:
- Need path-based CI/CD triggers (optional optimization)
- Single package.json (solvable with workspaces if needed)

**Decision**: Monorepo is the right choice for this use case due to significant code sharing.

### Why Fly.io?

- ✅ Free tier sufficient for this app
- ✅ Excellent Node.js support
- ✅ Simple deployment workflow
- ✅ Built-in HTTPS
- ✅ Fast global edge network
- ✅ Easy monitoring and logs

---

## Next Steps

1. **Test locally** - Ensure build works
2. **Deploy to Fly.io** - Follow steps above
3. **Verify with Inspector** - Test all tools
4. **Register with OpenAI** - Add to ChatGPT
5. **Monitor** - Check logs and usage

---

## Support

### Documentation
- [Fly.io Docs](https://fly.io/docs/)
- [MCP Specification](https://modelcontextprotocol.io/specification/)
- [OpenAI Apps SDK](https://platform.openai.com/docs/apps)

### Logs & Debugging
```bash
# Real-time logs
flyctl logs -a mercury-b16-mcp

# SSH into machine
flyctl ssh console -a mercury-b16-mcp

# Check environment
flyctl ssh console -a mercury-b16-mcp -C "printenv"
```

---

**Version**: 1.0
**Last Updated**: 2025-10-14
**Author**: Claude Code
**Status**: Ready for Implementation
