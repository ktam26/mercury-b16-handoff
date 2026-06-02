# MCP Server — Almaden Mercury B16

MCP server that exposes team data (schedule, roster, stats) over the Model Context Protocol.

## Tools

1. **get_next_match** - Next upcoming game with countdown
2. **list_schedule** - Team schedule with past/future games
3. **get_roster** - Complete team roster
4. **get_player_stats** - Player or team statistics

## Development

```bash
# Build
npm run appsdk:build

# Run locally (HTTP on port 3001)
npm run appsdk:dev

# Run in stdio mode (for Claude Desktop/Code)
MCP_TRANSPORT=stdio npm run appsdk:dev
```

The HTTP server runs at `http://localhost:3001/mcp` by default.

## Connecting to Claude

**Claude Code (stdio)**:
```bash
claude mcp add almaden --command "npm run appsdk:dev" --args "--cwd /path/to/mercury-b16-app"
```

**Claude Code (remote HTTP)**:
```bash
claude mcp add almaden --transport http --url https://mercury-b16-app.onrender.com/mcp
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP server port |
| `HOST` | `0.0.0.0` | HTTP server host |
| `MCP_TRANSPORT` | `http` | Transport mode: `http` or `stdio` |
| `MCP_ENABLED` | `false` | Must be `true` to enable MCP traffic |
| `ALLOWED_ORIGINS` | (none) | Comma-separated CORS origins |
| `NODE_ENV` | `development` | Environment mode |

## Endpoints

- `POST /mcp` - MCP protocol endpoint
- `GET /health` - Health check (returns 200 when server is running)

## Deployment

Deployed to **Render** via Docker. See `DEPLOYMENT.md` in the project root for details.

## Data Updates

Edit JSON files in `data/`, then rebuild and restart:
```bash
npm run appsdk:build && npm run appsdk:start
```

On Render, pushing data changes to `main` triggers auto-redeploy via the deploy workflow.
