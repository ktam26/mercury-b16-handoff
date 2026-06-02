#!/usr/bin/env tsx
/**
 * Standalone server entry point for the MCP server.
 * Supports both stdio and HTTP transports via MCP_TRANSPORT env var.
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { logServerEvent } from './logger';
import { createMcpServer } from './server';

const PORT = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : process.env.MCP_PORT
  ? parseInt(process.env.MCP_PORT, 10)
  : 3001;
const HOST = process.env.HOST || process.env.MCP_HOST || '0.0.0.0';
const PATH = process.env.MCP_PATH || '/mcp';
const MCP_ENABLED = process.env.MCP_ENABLED === 'true';

const DEFAULT_ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function registerShutdownHandlers(cleanup: () => Promise<void> | void) {
  const shutdown = async (signal: NodeJS.Signals) => {
    logServerEvent('server_stopping', { signal });
    await cleanup();
    logServerEvent('server_stopped', { signal });
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

function sendJsonRpcError(res: ServerResponse, statusCode: number, errorCode: number, message: string) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: errorCode, message }, id: null }));
}

function getRequestPath(req: IncomingMessage): string {
  try {
    const url = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`);
    return url.pathname;
  } catch {
    return req.url ?? '';
  }
}

function getCorsOrigin(req: IncomingMessage): string | null {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return null;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const raw = Buffer.concat(chunks).toString('utf-8').trim();

  if (!raw) {
    return undefined;
  }

  return JSON.parse(raw);
}

async function handleStatelessMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  parsedBody: unknown
) {
  const mcpServer = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await mcpServer.connect(transport);
    await transport.handleRequest(Object.assign(req, { body: parsedBody }), res, parsedBody);
  } finally {
    await transport.close();
    await mcpServer.close();
  }
}

async function startStdioTransport() {
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
  const mcpServer = createMcpServer();
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  logServerEvent('server_started_stdio', {});
  registerShutdownHandlers(() => mcpServer.close());
}

async function main() {
  // Use stdio transport if requested
  if (process.env.MCP_TRANSPORT === 'stdio') {
    await startStdioTransport();
    return;
  }

  logServerEvent('server_starting', { host: HOST, port: PORT, path: PATH });

  if (!MCP_ENABLED) {
    const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      const pathname = getRequestPath(req);

      if (pathname === '/') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ service: 'mcp', enabled: false }));
        return;
      }

      if (pathname === '/health') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }

      if (pathname === PATH) {
        res.statusCode = 503;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'MCP is temporarily disabled for privacy.',
          })
        );
        return;
      }

      res.statusCode = 404;
      res.setHeader('content-type', 'text/plain');
      res.end('Not Found');
    });

    httpServer.listen(PORT, HOST, () => {
      logServerEvent('server_started_disabled', {
        url: `http://${HOST}:${PORT}${PATH}`,
        reason: 'MCP_ENABLED is not set to true',
      });
    });

    httpServer.on('error', (error) => {
      logServerEvent('server_error', { error: error.message });
    });

    registerShutdownHandlers(() => { httpServer.close(); });
    return;
  }

  // Create HTTP server that delegates to transport
  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const pathname = getRequestPath(req);

    // Log all incoming requests for debugging
    logServerEvent('http_request', {
      method: req.method,
      path: pathname,
    });

    // Set CORS headers for allowed origins
    const allowedOrigin = getCorsOrigin(req);
    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, mcp-protocol-version');
    res.setHeader('Access-Control-Expose-Headers', 'mcp-protocol-version');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    // Health check endpoint
    if (pathname === '/health') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    // Only handle requests to the MCP path
    if (pathname !== PATH) {
      res.statusCode = 404;
      res.setHeader('content-type', 'text/plain');
      res.end('Not Found');
      return;
    }

    // Handle both GET and POST requests as per MCP spec
    if (req.method === 'GET') {
      // GET requests are used for SSE streams
      logServerEvent('http_get_request', { path: pathname });

      try {
        await handleStatelessMcpRequest(req, res, undefined);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        logServerEvent('http_request_failed', { method: 'GET', message });

        if (!res.headersSent) {
          sendJsonRpcError(res, 500, -32603, message);
        }
      }
      return;
    }

    if (req.method === 'POST') {
      let parsedBody: unknown;
      try {
        parsedBody = await readJsonBody(req);
        logServerEvent('http_post_request', { path: pathname, hasBody: parsedBody !== undefined });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid request body';
        sendJsonRpcError(res, 400, -32600, message);
        return;
      }

      try {
        await handleStatelessMcpRequest(req, res, parsedBody);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        logServerEvent('http_request_failed', { method: 'POST', message });

        if (!res.headersSent) {
          sendJsonRpcError(res, 500, -32603, message);
        }
      }
      return;
    }

    // Unsupported method
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    res.end('Method Not Allowed');
  });

  httpServer.listen(PORT, HOST, () => {
    logServerEvent('server_started', { url: `http://${HOST}:${PORT}${PATH}` });
  });

  httpServer.on('error', (error) => {
    logServerEvent('server_error', { error: error.message });
  });

  registerShutdownHandlers(async () => {
    httpServer.close();
  });
}

main().catch((error) => {
  logServerEvent('server_start_failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
