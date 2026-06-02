"use strict";
/**
 * Lightweight structured logging utilities for the Apps SDK server.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logServerEvent = logServerEvent;
exports.logToolInvocation = logToolInvocation;
exports.logResourceError = logResourceError;
function emit(entry) {
    // Always stderr — stdout is reserved for MCP protocol in stdio mode
    console.error(JSON.stringify(entry));
}
function logServerEvent(event, details = {}) {
    emit({
        level: 'info',
        timestamp: new Date().toISOString(),
        source: 'appsdk-server',
        event,
        ...details,
    });
}
function logToolInvocation(details) {
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
function logResourceError(resourceUri, error) {
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
