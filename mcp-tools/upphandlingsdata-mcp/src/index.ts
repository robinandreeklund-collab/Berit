#!/usr/bin/env node

/**
 * Upphandlingsdata MCP Server v1.0
 *
 * 7 tools for Swedish public procurement data via UHM and TED APIs.
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
  formatSearchResults,
  formatQuestionResults,
  formatLOVResults,
  formatCriteriaResults,
  formatCriteriaCategories,
  formatTEDResults,
} from './formatter.js';
import { CRITERIA_TYPES } from './types.js';
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

const CALL_LIMIT = 30;
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
// Overview data
// ---------------------------------------------------------------------------

const OVERVIEW_DATA = {
  server: 'Upphandlingsdata MCP Server v1.0',
  description: 'Svensk upphandlingsdata från Upphandlingsmyndigheten och EU TED',
  apis: [
    {
      name: 'Upphandlingsmyndigheten (UHM)',
      baseUrl: 'https://www.upphandlingsmyndigheten.se/api/sv',
      authentication: 'Ingen (publikt API)',
      endpoints: [
        { path: '/upphandlingsmyndigheten/search', description: 'Sök webbplatsinnehåll' },
        { path: '/questionportal/autocomplete', description: 'Sök i Frågeportalen' },
        { path: '/hitta-lov/search', description: 'Sök LOV-annonser' },
        { path: '/upphandlingsmyndigheten/criteriaservice/search', description: 'Sök hållbarhetskriterier' },
        { path: '/upphandlingsmyndigheten/criteriaservice/filter', description: 'Lista kriteriekategorier' },
      ],
    },
    {
      name: 'EU TED (Tenders Electronic Daily)',
      baseUrl: 'https://api.ted.europa.eu/v3',
      authentication: 'Ingen (publikt API)',
      endpoints: [
        { path: '/notices/search', description: 'Sök EU-upphandlingsannonser (POST)' },
      ],
    },
  ],
  tools: TOOL_DEFINITIONS.map((t) => ({ id: t.id, name: t.name, category: t.category })),
};

// ---------------------------------------------------------------------------
// MCP Server class
// ---------------------------------------------------------------------------

export class UpphandlingsdataMCPServer {
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
              action: 'Använd ett av de 7 tillgängliga verktygen.',
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

      switch (tool.id) {
        case 'uhm_overview': {
          return {
            content: [{ type: 'text', text: JSON.stringify(OVERVIEW_DATA, null, 2) }],
          };
        }

        case 'uhm_search_website': {
          const query = encodeURIComponent((params.query as string) || '');
          const pageSize = (params.pageSize as number) || 10;
          const page = (params.page as number) || 1;
          if (!query) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange en sökterm (query).' }) }],
              isError: true,
            };
          }
          const { data } = await client.uhm(`/upphandlingsmyndigheten/search?query=${query}&pageSize=${pageSize}&page=${page}`);
          result = formatSearchResults(data);
          break;
        }

        case 'uhm_search_questions': {
          const query = encodeURIComponent((params.query as string) || '');
          const pageSize = (params.pageSize as number) || 10;
          const page = (params.page as number) || 1;
          if (!query) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange en sökterm (query).' }) }],
              isError: true,
            };
          }
          const { data } = await client.uhm(`/questionportal/autocomplete?query=${query}&pageSize=${pageSize}&page=${page}`);
          result = formatQuestionResults(data);
          break;
        }

        case 'uhm_search_lov': {
          const query = params.query ? encodeURIComponent(params.query as string) : '';
          const pageSize = (params.pageSize as number) || 10;
          const page = (params.page as number) || 1;
          const region = params.region ? encodeURIComponent(params.region as string) : '';
          let path = `/hitta-lov/search?pageSize=${pageSize}&page=${page}`;
          if (query) path += `&query=${query}`;
          if (region) path += `&region=${region}`;
          const { data } = await client.uhm(path);
          result = formatLOVResults(data);
          break;
        }

        case 'uhm_search_criteria': {
          const query = params.query ? encodeURIComponent(params.query as string) : '';
          const pageSize = (params.pageSize as number) || 10;
          const type = params.type ? encodeURIComponent(params.type as string) : '';
          let path = `/upphandlingsmyndigheten/criteriaservice/search?pageSize=${pageSize}`;
          if (query) path += `&query=${query}`;
          if (type) path += `&type=${type}`;
          const { data } = await client.uhm(path);
          result = formatCriteriaResults(data);
          break;
        }

        case 'uhm_get_criteria_categories': {
          const { data } = await client.uhmMeta('/upphandlingsmyndigheten/criteriaservice/filter');
          result = formatCriteriaCategories(data);
          break;
        }

        case 'uhm_search_ted': {
          const query = (params.query as string) || '';
          const limit = (params.limit as number) || 10;
          const scope = (params.scope as string) || 'latest';
          if (!query) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange en sökfråga (query).' }) }],
              isError: true,
            };
          }
          const tedBody = {
            query: `CY=SWE AND ${query}`,
            fields: ['BT-21-Procedure', 'BT-22-Procedure', 'BT-500-Organization-Company', 'ND-Root'],
            limit,
            scope,
          };
          const { data } = await client.ted(tedBody);
          result = formatTEDResults(data);
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
                  ? 'Sökresultat hittades inte. Försök INTE anropa samma verktyg igen.'
                  : 'Verktyget misslyckades. Försök INTE anropa samma verktyg igen. Presentera tillgänglig information eller förklara felet för användaren.',
              suggestions: [
                'Kontrollera att söktermen är korrekt',
                'Prova en bredare sökterm',
                `Tillgängliga kriterietyper: ${Object.entries(CRITERIA_TYPES).map(([k, v]) => `${k}=${v}`).join(', ')}`,
                'TED-sökningar filtreras automatiskt till svenska upphandlingar',
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
      name: 'Upphandlingsdata MCP Server',
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

  const mcpServer = new UpphandlingsdataMCPServer();

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
  console.error('Upphandlingsdata MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
