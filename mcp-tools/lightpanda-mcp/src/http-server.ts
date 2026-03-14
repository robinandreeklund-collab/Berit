#!/usr/bin/env node

/**
 * Lightpanda MCP HTTP Server — Express-based Streamable HTTP MCP transport.
 *
 * Endpoints:
 *   GET  /health  → { status: 'ok', timestamp }
 *   GET  /mcp     → Server info + capabilities
 *   POST /mcp     → JSON-RPC 2.0 dispatcher
 *   GET  /        → Server documentation
 */

import express from 'express';
import cors from 'cors';
import { LightpandaMCPServer } from './index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  }),
);
app.use(express.json());

// Handle JSON parse errors
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in (err as unknown as Record<string, unknown>)) {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error: Invalid JSON' },
    });
  }
  next();
});

// Create MCP server instance
const mcpServer = new LightpandaMCPServer();

// ── OPTIONS /mcp ────────────────────────────────────────────────────────────
app.options('/mcp', (req, res) => {
  res.status(204).end();
});

// ── GET /mcp ────────────────────────────────────────────────────────────────
app.get('/mcp', (req, res) => {
  res.json({
    protocol: 'mcp',
    version: '1.0.0',
    name: 'Lightpanda MCP Server',
    description:
      'Webbsurfning, sökning och datautvinning via Lightpanda headless browser — 12 verktyg med full JavaScript-rendering',
    authentication: 'none',
    transport: 'http',
    capabilities: {
      tools: true,
      resources: false,
      prompts: false,
    },
    tools: mcpServer.getTools().length,
    connection: {
      method: 'POST',
      endpoint: '/mcp',
      content_type: 'application/json',
      format: 'MCP JSON-RPC 2.0',
    },
    compatibility: {
      platforms: ['web', 'desktop', 'cli'],
      clients: ['Claude Code', 'Claude Desktop', 'ChatGPT', 'Gemini', 'Custom MCP clients'],
    },
    requirements: {
      lightpanda:
        'Requires Lightpanda browser running on LIGHTPANDA_CDP_URL (default: ws://localhost:9222)',
      start: 'docker run -d -p 9222:9222 lightpanda/browser:nightly',
    },
  });
});

// ── POST /mcp ───────────────────────────────────────────────────────────────
app.post('/mcp', async (req, res) => {
  try {
    const { jsonrpc, id, method, params } = req.body;

    if (jsonrpc !== '2.0') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id: id || null,
        error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
      });
    }

    // initialize
    if (method === 'initialize') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'Lightpanda MCP Server', version: '1.0.0' },
        },
      });
    }

    // notifications/initialized
    if (method === 'notifications/initialized') {
      return res.status(204).end();
    }

    // tools/list
    if (method === 'tools/list') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: { tools: mcpServer.getTools() },
      });
    }

    // tools/call
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      const result = await mcpServer.callTool(name, args);
      return res.status(200).json({ jsonrpc: '2.0', id, result });
    }

    // Method not found
    return res.status(200).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(200).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error',
      },
    });
  }
});

// ── GET /health ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── GET / ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'Lightpanda MCP Server',
    version: '1.0.0',
    description: 'Webbsurfning, sökning och datautvinning via Lightpanda headless browser',
    tools: 12,
    categories: ['navigation', 'content', 'interaction', 'advanced', 'output'],
    endpoints: {
      mcp: '/mcp',
      health: '/health',
    },
    requirements: {
      lightpanda: 'docker run -d -p 9222:9222 lightpanda/browser:nightly',
      env: 'LIGHTPANDA_CDP_URL (default: ws://localhost:9222)',
    },
  });
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Lightpanda MCP HTTP Server running on port ${PORT}`);
  console.log(`Info endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
