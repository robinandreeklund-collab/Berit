#!/usr/bin/env node

/**
 * SMHI MCP HTTP Server — Express-based Streamable HTTP MCP transport.
 *
 * Endpoints:
 *   GET  /health  → { status: 'ok', timestamp }
 *   GET  /mcp     → Server info + capabilities
 *   POST /mcp     → JSON-RPC 2.0 dispatcher
 *   GET  /        → Server documentation
 */

import express from 'express';
import cors from 'cors';
import { SmhiMCPServer } from './index.js';
import { prompts, getPromptById, generatePromptMessages } from './prompts.js';
import { resources, getResourceContent } from './resources.js';

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
const mcpServer = new SmhiMCPServer();

// ── OPTIONS /mcp ────────────────────────────────────────────────────────────
app.options('/mcp', (req, res) => {
  res.status(204).end();
});

// ── GET /mcp ────────────────────────────────────────────────────────────────
app.get('/mcp', (req, res) => {
  res.json({
    protocol: 'mcp',
    version: '1.0.0',
    name: 'SMHI MCP Server',
    description: 'Väder-, hydrologisk-, oceanografisk- och brandriskdata från SMHI — 10 verktyg',
    authentication: 'none',
    transport: 'http',
    capabilities: {
      tools: true,
      resources: true,
      prompts: true,
    },
    tools: mcpServer.getTools().length,
    resources: resources.length,
    prompts: prompts.length,
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
          capabilities: { tools: {}, prompts: {}, resources: {} },
          serverInfo: { name: 'SMHI MCP Server', version: '1.0.0' },
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

    // prompts/list
    if (method === 'prompts/list') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: { prompts },
      });
    }

    // prompts/get
    if (method === 'prompts/get') {
      const { name, arguments: args } = params;
      const prompt = getPromptById(name);
      if (!prompt) {
        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Prompt not found: ${name}` },
        });
      }
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: { messages: generatePromptMessages(name, args || {}) },
      });
    }

    // resources/list
    if (method === 'resources/list') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: { resources },
      });
    }

    // resources/read
    if (method === 'resources/read') {
      const { uri } = params;
      const content = getResourceContent(uri);
      if (!content) {
        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Resource not found: ${uri}` },
        });
      }
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          contents: [{ uri, mimeType: content.mimeType, text: content.content }],
        },
      });
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
    name: 'SMHI MCP Server',
    version: '1.0.0',
    description: 'Väder-, hydrologisk-, oceanografisk- och brandriskdata från SMHI',
    tools: 10,
    categories: ['väderprognoser', 'väderanalyser', 'väderobservationer', 'hydrologi', 'oceanografi', 'brandrisk'],
    endpoints: {
      mcp: '/mcp',
      health: '/health',
    },
    source: 'SMHI Open Data (opendata.smhi.se)',
  });
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`SMHI MCP HTTP Server running on port ${PORT}`);
  console.log(`Info endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
