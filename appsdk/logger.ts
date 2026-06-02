/**
 * Lightweight structured logging utilities for the Apps SDK server.
 */

type LogLevel = 'info' | 'error';

interface BaseLogEntry {
  level: LogLevel;
  timestamp: string;
  source: 'appsdk-server';
  event: string;
  [key: string]: unknown;
}

function emit(entry: BaseLogEntry) {
  // Always stderr — stdout is reserved for MCP protocol in stdio mode
  console.error(JSON.stringify(entry));
}

export function logServerEvent(event: string, details: Record<string, unknown> = {}) {
  emit({
    level: 'info',
    timestamp: new Date().toISOString(),
    source: 'appsdk-server',
    event,
    ...details,
  });
}

export function logToolInvocation(details: {
  tool: string;
  durationMs: number;
  success: boolean;
  args?: unknown;
  error?: string;
}) {
  emit({
    level: details.success ? 'info' : 'error',
    timestamp: new Date().toISOString(),
    source: 'appsdk-server',
    event: 'tool_invocation',
    tool: details.tool,
    durationMs: details.durationMs,
    success: details.success,
    ...(details.args !== undefined ? { args: details.args } : {}),
    ...(details.error ? { error: details.error } : {}),
  });
}

export function logResourceError(resourceUri: string, error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  emit({
    level: 'error',
    timestamp: new Date().toISOString(),
    source: 'appsdk-server',
    event: 'resource_error',
    resourceUri,
    error: errorMessage,
  });
}
