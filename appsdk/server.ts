/**
 * Almaden Mercury B16 Apps SDK MCP server
 * Exposes team data via the Model Context Protocol.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import * as gameSerializer from './serializers/game-serializer';
import * as rosterSerializer from './serializers/roster-serializer';
import * as statsSerializer from './serializers/stats-serializer';
import * as tournamentSerializer from './serializers/tournament-serializer';
import * as albumSerializer from './serializers/album-serializer';
import * as seasonSerializer from './serializers/season-serializer';
import { logToolInvocation } from './logger';

const SERVER_NAME = 'almaden-mercury-b16';
const SERVER_VERSION = '1.0.0';

type ToolResult = CallToolResult;

async function handleToolInvocation(
  tool: string,
  args: unknown,
  executor: () => Promise<ToolResult> | ToolResult
): Promise<ToolResult> {
  const start = Date.now();

  try {
    const result = await executor();
    logToolInvocation({
      tool,
      args,
      durationMs: Date.now() - start,
      success: true,
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logToolInvocation({
      tool,
      args,
      durationMs: Date.now() - start,
      success: false,
      error: message,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${tool}: ${message}`,
        },
      ],
      isError: true,
    };
  }
}

function toToolResult(serialized: { content: string }): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: serialized.content,
      },
    ],
  };
}

export function createMcpServer() {
  const server = new McpServer(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: { listChanged: true },
      },
    }
  );

  // Tools
  server.registerTool(
    'get_next_match',
    {
      title: 'Show next match',
      description: 'Get information about the next upcoming game, including opponent, kickoff time, and location details.',
      inputSchema: z.object({}),
    },
    async (args) =>
      handleToolInvocation('get_next_match', args, async () => {
        const nextGame = gameSerializer.getNextGame();

        if (!nextGame) {
          return toToolResult({ content: 'No upcoming games scheduled.' });
        }

        const result = gameSerializer.serializeNextMatch(nextGame);
        return toToolResult(result);
      })
  );

  server.registerTool(
    'list_schedule',
    {
      title: 'List schedule',
      description: 'Get the team schedule with game IDs, past results, and upcoming fixtures. Use game IDs with get_game_details for full detail including goal scorers.',
      inputSchema: z.object({
        includePast: z.boolean().optional().default(true),
        limit: z.number().optional().default(10),
      }),
    },
    async (args) =>
      handleToolInvocation('list_schedule', args, async () => {
        const includePast = args.includePast ?? true;
        const limit = args.limit ?? 10;

        const result = gameSerializer.serializeSchedule({
          includePast,
          upcomingLimit: limit,
          pastLimit: Math.max(5, limit),
        });

        return toToolResult(result);
      })
  );

  server.registerTool(
    'get_roster',
    {
      title: 'Get team roster',
      description: 'Retrieve the current team roster with jersey numbers.',
      inputSchema: z.object({}),
    },
    async (args) =>
      handleToolInvocation('get_roster', args, async () => {
        const result = rosterSerializer.serializeRoster();
        return toToolResult(result);
      })
  );

  server.registerTool(
    'get_player_stats',
    {
      title: 'Get player stats',
      description: 'Return season statistics for a specific player or an overall team summary.',
      inputSchema: z.object({
        playerId: z.string().optional(),
      }),
    },
    async (args) =>
      handleToolInvocation('get_player_stats', args, async () => {
        const result = args.playerId
          ? statsSerializer.serializePlayerStats(args.playerId)
          : statsSerializer.serializeTeamStats();

        return toToolResult(result);
      })
  );

  server.registerTool(
    'get_game_details',
    {
      title: 'Get game details',
      description: 'Get full details for a specific game including score, goal scorers, assists, goalkeeper stats, video links, and location.',
      inputSchema: z.object({ gameId: z.string() }),
    },
    async (args) =>
      handleToolInvocation('get_game_details', args, async () => {
        const result = gameSerializer.serializeGameDetail(args.gameId);

        if (result.content.startsWith('Game not found')) {
          return {
            content: [{ type: 'text' as const, text: result.content }],
            isError: true,
          };
        }

        return toToolResult(result);
      })
  );

  server.registerTool(
    'get_season_record',
    {
      title: 'Get season record',
      description: 'Get the team win/loss/tie record, goal differential, and win rate for the current or a specified season.',
      inputSchema: z.object({ seasonId: z.string().optional() }),
    },
    async (args) =>
      handleToolInvocation('get_season_record', args, async () => {
        const result = seasonSerializer.serializeSeasonRecord(args.seasonId);
        return toToolResult(result);
      })
  );

  server.registerTool(
    'get_recent_form',
    {
      title: 'Get recent form',
      description: 'Get results of the last N games including scores, goal scorers, and assists. Use game IDs with get_game_details for video links and goalkeeper stats.',
      inputSchema: z.object({ count: z.number().optional().default(5) }),
    },
    async (args) =>
      handleToolInvocation('get_recent_form', args, async () => {
        const result = gameSerializer.serializeRecentForm(args.count ?? 5);
        return toToolResult(result);
      })
  );

  server.registerTool(
    'get_goalkeeper_stats',
    {
      title: 'Get goalkeeper stats',
      description: 'Get goalkeeper performance stats including games played, goals allowed, GAA, and clean sheets.',
      inputSchema: z.object({}),
    },
    async (args) =>
      handleToolInvocation('get_goalkeeper_stats', args, async () => {
        const result = gameSerializer.serializeGoalkeeperStats();
        return toToolResult(result);
      })
  );

  server.registerTool(
    'get_tournament',
    {
      title: 'Get tournament details',
      description: 'Get full details for a tournament including bracket, game results, field assignments, and location info.',
      inputSchema: z.object({ tournamentId: z.string().optional() }),
    },
    async (args) =>
      handleToolInvocation('get_tournament', args, async () => {
        const result = tournamentSerializer.serializeTournament(args.tournamentId);

        return toToolResult(result);
      })
  );

  server.registerTool(
    'list_tournaments',
    {
      title: 'List tournaments',
      description: 'List all tournaments the team has participated in.',
      inputSchema: z.object({}),
    },
    async (args) =>
      handleToolInvocation('list_tournaments', args, async () => {
        const result = tournamentSerializer.serializeTournamentList();
        return toToolResult(result);
      })
  );

  server.registerTool(
    'list_photo_albums',
    {
      title: 'List photo albums',
      description: 'List all photo albums with links to view photos.',
      inputSchema: z.object({}),
    },
    async (args) =>
      handleToolInvocation('list_photo_albums', args, async () => {
        const result = albumSerializer.serializeAlbums();
        return toToolResult(result);
      })
  );

  server.registerTool(
    'list_seasons',
    {
      title: 'List seasons',
      description: 'List all available seasons with their date ranges.',
      inputSchema: z.object({}),
    },
    async (args) =>
      handleToolInvocation('list_seasons', args, async () => {
        const result = seasonSerializer.serializeSeasons();
        return toToolResult(result);
      })
  );

  return server;
}
