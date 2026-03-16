#!/usr/bin/env node

/**
 * KB MCP Server v1.0
 *
 * 10 tools for Swedish library and cultural heritage data via KB APIs.
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
  formatLibrisResults,
  formatLibrisFindResults,
  formatLibrisHoldings,
  formatKsamsokResults,
  formatKsamsokObject,
  formatSwepubResults,
} from './formatter.js';
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
// MCP Server class
// ---------------------------------------------------------------------------

export class KBMCPServer {
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
              action: 'Använd ett av de 10 tillgängliga verktygen.',
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
        case 'kb_libris_search': {
          const query = encodeURIComponent(params.query as string || '');
          const limit = (params.limit as number) || 10;
          const { data } = await client.libris(`/xsearch?query=${query}&n=${limit}&format=json&format_extended=true`);
          result = formatLibrisResults(data);
          break;
        }

        case 'kb_libris_search_author': {
          const author = encodeURIComponent(params.author as string || '');
          const limit = (params.limit as number) || 10;
          const { data } = await client.libris(`/xsearch?query=AUTHOR:${author}&n=${limit}&format=json&format_extended=true`);
          result = formatLibrisResults(data);
          break;
        }

        case 'kb_libris_search_title': {
          const title = encodeURIComponent(params.title as string || '');
          const limit = (params.limit as number) || 10;
          const { data } = await client.libris(`/xsearch?query=TITLE:${title}&n=${limit}&format=json&format_extended=true`);
          result = formatLibrisResults(data);
          break;
        }

        case 'kb_libris_search_isbn': {
          const isbn = encodeURIComponent(params.isbn as string || '');
          const { data } = await client.libris(`/xsearch?query=ISBN:${isbn}&n=1&format=json&format_extended=true`);
          result = formatLibrisResults(data);
          break;
        }

        case 'kb_libris_find': {
          const query = encodeURIComponent(params.query as string || '');
          const limit = (params.limit as number) || 10;
          const { data } = await client.libris(`/find?q=${query}&_limit=${limit}`);
          result = formatLibrisFindResults(data);
          break;
        }

        case 'kb_libris_holdings': {
          let recordId = params.recordId as string || '';
          // Ensure the ID ends with data.jsonld path
          if (!recordId.includes('/data.jsonld')) {
            // Normalize: remove leading slash if present
            recordId = recordId.replace(/^\//, '');
            const { data } = await client.libris(`/${recordId}/data.jsonld`);
            result = formatLibrisHoldings(data);
          } else {
            const { data } = await client.libris(`/${recordId}`);
            result = formatLibrisHoldings(data);
          }
          break;
        }

        case 'kb_ksamsok_search': {
          const query = encodeURIComponent(params.query as string || '');
          const limit = (params.limit as number) || 10;
          const { data } = await client.ksamsok(`?method=search&query=${query}&hitsPerPage=${limit}&startRecord=1`);
          result = formatKsamsokResults(data);
          break;
        }

        case 'kb_ksamsok_search_location': {
          const county = params.county as string;
          const municipality = params.municipality as string;
          const extraQuery = params.query as string;
          const limit = (params.limit as number) || 10;

          // Build CQL query
          const cqlParts: string[] = [];
          if (county) cqlParts.push(`countyName="${county}"`);
          if (municipality) cqlParts.push(`municipalityName="${municipality}"`);
          if (extraQuery) cqlParts.push(`text="${extraQuery}"`);

          if (cqlParts.length === 0) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange minst län (county) eller kommun (municipality).' }) }],
              isError: true,
            };
          }

          const cql = encodeURIComponent(cqlParts.join(' AND '));
          const { data } = await client.ksamsok(`?method=search&query=${cql}&hitsPerPage=${limit}&startRecord=1`);
          result = formatKsamsokResults(data);
          break;
        }

        case 'kb_ksamsok_get_object': {
          const objectId = encodeURIComponent(params.objectId as string || '');
          const { data } = await client.ksamsok(`?method=getObject&objectId=${objectId}&format=json`);
          result = formatKsamsokObject(data);
          break;
        }

        case 'kb_swepub_search': {
          const query = encodeURIComponent(params.query as string || '');
          const limit = (params.limit as number) || 10;
          const { data } = await client.swepub(`/xsearch?query=${query}&type=swepub&n=${limit}&format=json`);
          result = formatSwepubResults(data);
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
                  ? 'Post eller objekt hittades inte. Försök INTE anropa samma verktyg igen.'
                  : 'Verktyget misslyckades. Försök INTE anropa samma verktyg igen. Presentera tillgänglig information eller förklara felet för användaren.',
              suggestions: [
                'Kontrollera att sökord eller ID är korrekta',
                'Libris sökfält: TITLE, AUTHOR, ISBN, SUBJECT',
                'K-samsök objekttyper: foto, konstverk, fornlämning, byggnad',
                'Swepub: söker i svenska forskningspublikationer',
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
      name: 'KB MCP Server',
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

  const mcpServer = new KBMCPServer();

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
  console.error('KB MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
