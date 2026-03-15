#!/usr/bin/env node

/**
 * Trafikanalys MCP Server v1.0
 *
 * 8 tools for Swedish transport statistics via Trafikanalys REST APIs.
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
import { TOOL_DEFINITIONS, getToolById } from './tools.js';
import { getApiClient } from './api-client.js';
import {
  formatProducts,
  formatProductStructure,
  formatDataResults,
} from './formatter.js';
import { PRODUCT_CODES, MEASURE_IDS, DIMENSION_IDS } from './types.js';
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
// Query builder helpers
// ---------------------------------------------------------------------------

function buildQuery(product: string, measure: string, filters: Record<string, string | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'lang') continue; // lang is not part of the query string
    if (value !== undefined && value !== '') {
      parts.push(`${key}:${value}`);
    } else if (value === '') {
      // Empty value means "split by this dimension"
      parts.push(key);
    }
  }
  const filterStr = parts.join('|');
  return measure
    ? `${product}|${measure}|${filterStr}`
    : `${product}||${filterStr}`;
}

// ---------------------------------------------------------------------------
// MCP Server class
// ---------------------------------------------------------------------------

export class TrafikanalysMCPServer {
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
              action: 'Använd ett av de 8 tillgängliga verktygen.',
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
      const params = args || {};
      const client = getApiClient();
      let result: { markdown: string; count: number; raw: unknown[] };
      const lang = (params.lang as string) || undefined;

      switch (tool.id) {
        case 'trafa_list_products': {
          const { data } = await client.structure(undefined, lang);
          result = formatProducts(data);
          break;
        }

        case 'trafa_get_product_structure': {
          const product = params.product as string;
          if (!product) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange produktkod (t.ex. "t10016").' }) }],
              isError: true,
            };
          }
          const { data } = await client.structure(product, lang);
          result = formatProductStructure(data);
          break;
        }

        case 'trafa_query_data': {
          const query = params.query as string;
          if (!query) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange frågesträng (t.ex. "t10016|itrfslut|ar:2024").' }) }],
              isError: true,
            };
          }
          const { data } = await client.data(query, lang);
          result = formatDataResults(data);
          break;
        }

        case 'trafa_cars_in_traffic': {
          const filters: Record<string, string | undefined> = {};
          filters.ar = (params.ar as string) || 'senaste';
          if (params.drivm !== undefined) filters.drivm = (params.drivm as string) || '';
          if (params.agarkat !== undefined) filters.agarkat = (params.agarkat as string) || '';
          const query = buildQuery('t10016', 'itrfslut', filters);
          const { data } = await client.data(query, lang);
          result = formatDataResults(data);
          break;
        }

        case 'trafa_new_registrations': {
          const filters: Record<string, string | undefined> = {};
          filters.ar = (params.ar as string) || 'senaste';
          if (params.drivm !== undefined) filters.drivm = (params.drivm as string) || '';
          const query = buildQuery('t10016', 'nyregunder', filters);
          const { data } = await client.data(query, lang);
          result = formatDataResults(data);
          break;
        }

        case 'trafa_vehicle_km': {
          const filters: Record<string, string | undefined> = {};
          filters.ar = (params.ar as string) || 'senaste';
          const query = buildQuery('t0401', 'fordonkm', filters);
          const { data } = await client.data(query, lang);
          result = formatDataResults(data);
          break;
        }

        case 'trafa_rail_transport': {
          const filters: Record<string, string | undefined> = {};
          filters.ar = (params.ar as string) || 'senaste';
          const query = buildQuery('t0603', '', filters);
          const { data } = await client.data(query, lang);
          result = formatDataResults(data);
          break;
        }

        case 'trafa_air_traffic': {
          const filters: Record<string, string | undefined> = {};
          filters.ar = (params.ar as string) || 'senaste';
          const query = buildQuery('t0501', '', filters);
          const { data } = await client.data(query, lang);
          result = formatDataResults(data);
          break;
        }

        default:
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `Verktyg ej implementerat: ${tool.id}` }) }],
            isError: true,
          };
      }

      const response: Record<string, unknown> = {
        verktyg: tool.id,
        kategori: tool.category,
        antal: result.count,
        data: result.markdown,
      };

      // Include raw JSON for small result sets
      if (result.count <= 5) {
        response.raw = result.raw;
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
              action: message.includes('429')
                ? 'API:t är överbelastat. Försök INTE igen — presentera vad du har eller välj ett annat verktyg.'
                : message.includes('404')
                  ? 'Produkt eller fråga hittades inte. Försök INTE anropa samma verktyg igen.'
                  : 'Verktyget misslyckades. Försök INTE anropa samma verktyg igen. Presentera tillgänglig information eller förklara felet för användaren.',
              suggestions: [
                'Kontrollera att produktkoden är korrekt',
                'Frågeformat: PRODUKT|MÅTT|DIMENSION:värde1,värde2',
                `Vanliga produkter: ${Object.entries(PRODUCT_CODES).slice(0, 4).map(([k, v]) => `${k}=${v}`).join(', ')}`,
                `Mått: ${Object.entries(MEASURE_IDS).map(([k, v]) => `${k}=${v}`).join(', ')}`,
              ],
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
      name: 'Trafikanalys MCP Server',
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

  const mcpServer = new TrafikanalysMCPServer();

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
  console.error('Trafikanalys MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
