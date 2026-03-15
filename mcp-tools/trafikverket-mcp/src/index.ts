#!/usr/bin/env node

/**
 * Trafikverket MCP Server v1.0
 *
 * 22 tools for real-time Swedish traffic data via Trafikverket Open API.
 * Supports both stdio and HTTP transports.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFINITIONS, getToolById, type ToolDefinition } from './tools.js';
import { getApiClient, type FilterClause, type QueryOptions } from './api-client.js';
import { SWEDISH_COUNTIES } from './types.js';
import { formatResponse } from './formatter.js';
import { LLM_INSTRUCTIONS } from './instructions.js';
import { prompts, getPromptById, generatePromptMessages } from './prompts.js';
import { resources, getResourceContent } from './resources.js';

// ---------------------------------------------------------------------------
// Call tracker — prevents LLM from looping the same tool
// ---------------------------------------------------------------------------

interface CallRecord {
  count: number;
  firstCall: number;
}

const CALL_LIMIT = 8;
const CALL_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

class CallTracker {
  private records = new Map<string, CallRecord>();

  check(toolId: string): { allowed: boolean; message?: string } {
    const now = Date.now();
    const record = this.records.get(toolId);

    if (!record || now - record.firstCall > CALL_WINDOW_MS) {
      this.records.set(toolId, { count: 1, firstCall: now });
      return { allowed: true };
    }

    if (record.count >= CALL_LIMIT) {
      const waitSec = Math.ceil((record.firstCall + CALL_WINDOW_MS - now) / 1000);
      return {
        allowed: false,
        message: `Verktyget ${toolId} har anropats ${CALL_LIMIT} gånger inom 5 minuter. Vänta ${waitSec}s eller prova ett annat verktyg.`,
      };
    }

    record.count++;
    return { allowed: true };
  }

  reset(): void {
    this.records.clear();
  }
}

// ---------------------------------------------------------------------------
// Tool input → API query mapping
// ---------------------------------------------------------------------------

function buildFilter(
  tool: ToolDefinition,
  args: Record<string, unknown>,
): FilterClause | null {
  const plats = (args.plats as string)?.trim();
  const station = (args.station as string)?.trim();
  const lan = (args.lan as string)?.trim();
  const id = (args.id as string)?.trim();

  // Trafikverket API v2 LIKE uses regex patterns, not SQL/glob wildcards.
  // Use .*value.* for substring matching (not *value*).
  const likePattern = (value: string): string => `.*${escapeRegex(value)}.*`;

  switch (tool.filterType) {
    case 'location':
      if (plats) return { operator: 'LIKE', name: tool.filterField, value: likePattern(plats) };
      if (lan) return { operator: 'EQ', name: 'Deviation.CountyNo', value: lan };
      return null;

    case 'station':
      if (station) return { operator: 'LIKE', name: tool.filterField, value: likePattern(station) };
      return null;

    case 'weather':
      // WeatherMeasurepoint does not support CountyNo as a query filter.
      // For county searches, search by county name in the station Name field instead.
      if (plats) return { operator: 'LIKE', name: tool.filterField, value: likePattern(plats) };
      if (lan) {
        const countyName = SWEDISH_COUNTIES[lan];
        if (countyName) {
          // Extract short name (e.g. "Stockholms län" → "Stockholm")
          const shortName = countyName.replace(/s?\s+län$/, '');
          return { operator: 'LIKE', name: tool.filterField, value: likePattern(shortName) };
        }
      }
      return null;

    case 'camera':
      if (plats) return { operator: 'LIKE', name: tool.filterField, value: likePattern(plats) };
      if (lan) return { operator: 'EQ', name: 'CountyNo', value: lan };
      return null;

    case 'camera_id':
      if (id) return { operator: 'EQ', name: 'Id', value: id };
      return null;

    case 'county':
      if (lan) return { operator: 'EQ', name: 'CountyNo', value: lan };
      if (plats) return { operator: 'LIKE', name: 'LocationText', value: likePattern(plats) };
      return null;

    default:
      return null;
  }
}

/** Escape special regex characters in user input for safe LIKE patterns. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// ---------------------------------------------------------------------------
// MCP Server class
// ---------------------------------------------------------------------------

export class TrafikverketMCPServer {
  private callTracker = new CallTracker();

  getTools(): Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }> {
    return TOOL_DEFINITIONS.map((tool) => ({
      name: tool.id,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  async callTool(
    name: string,
    args: Record<string, unknown> | undefined,
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    const tool = getToolById(name);
    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: `Okänt verktyg: ${name}`,
              action: 'Använd ett av de 22 tillgängliga verktygen.',
              available: TOOL_DEFINITIONS.map((t) => t.id),
            }),
          },
        ],
        isError: true,
      };
    }

    // Check call limit
    const check = this.callTracker.check(tool.id);
    if (!check.allowed) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: check.message }) }],
        isError: true,
      };
    }

    try {
      const filter = buildFilter(tool, args || {});
      const limit = Math.min(Math.max(Number(args?.limit) || 10, 1), 50);

      const queryOpts: QueryOptions = {
        objecttype: tool.objecttype,
        schemaVersion: tool.schemaVersion,
        namespace: tool.namespace,
        limit,
        filter,
      };

      const client = getApiClient();
      const { data, cached } = await client.query(queryOpts);

      const { markdown, count, raw } = formatResponse(data, tool.objecttype, tool.id);

      const response: Record<string, unknown> = {
        verktyg: tool.id,
        kategori: tool.category,
        antal: count,
        cache: cached,
        data: markdown,
      };

      // Include raw JSON for small result sets
      if (count <= 5) {
        response.raw = raw;
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: message.length > 500 ? message.slice(0, 497) + '...' : message,
              verktyg: tool.id,
              action: message.includes('API_KEY')
                ? 'Sätt miljövariabeln TRAFIKVERKET_API_KEY. Försök INTE anropa verktyget igen.'
                : message.includes('429')
                  ? 'API:t är överbelastat. Försök INTE igen — presentera vad du har eller välj ett annat verktyg.'
                  : 'Verktyget misslyckades. Försök INTE anropa samma verktyg igen. Presentera tillgänglig information eller förklara felet för användaren.',
            }),
          },
        ],
        isError: true,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Stdio transport (for CLI clients)
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const server = new Server(
    {
      name: 'Trafikverket MCP Server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    },
  );

  const mcpServer = new TrafikverketMCPServer();

  // Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: mcpServer.getTools(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await mcpServer.callTool(name, args as Record<string, unknown>);
  });

  // Prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts,
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const prompt = getPromptById(name);
    if (!prompt) throw new Error(`Prompt hittades inte: ${name}`);
    return { messages: generatePromptMessages(name, (args || {}) as Record<string, string>) };
  });

  // Resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources,
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const content = getResourceContent(uri);
    if (!content) throw new Error(`Resurs hittades inte: ${uri}`);
    return {
      contents: [{ uri, mimeType: content.mimeType, text: content.content }],
    };
  });

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Trafikverket MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
