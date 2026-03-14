#!/usr/bin/env node

/**
 * NVV MCP Server v1.0
 *
 * 8 tools for Swedish protected nature areas via Naturvardsverket REST APIs.
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
  formatOmraden,
  formatOmradeDetalj,
  formatArter,
  formatNaturtyper,
  formatSyften,
  formatNmdKlasser,
  formatUppslag,
} from './formatter.js';
import { LAN_CODES, KOMMUN_CODES, SPECIES_GROUPS } from './types.js';
import { LLM_INSTRUCTIONS } from './instructions.js';
import { prompts, getPromptById, generatePromptMessages } from './prompts.js';
import { resources, getResourceContent } from './resources.js';

// ---------------------------------------------------------------------------
// Call tracker -- prevents LLM from looping the same tool
// ---------------------------------------------------------------------------

interface CallRecord {
  count: number;
  firstCall: number;
}

const CALL_LIMIT = 3;
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
        message: `Verktyget ${toolId} har anropats ${CALL_LIMIT} ganger inom 5 minuter. Vanta ${waitSec}s eller prova ett annat verktyg.`,
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
// Fuzzy lookup helper
// ---------------------------------------------------------------------------

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const t = target.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return t.includes(q) || q.includes(t);
}

// ---------------------------------------------------------------------------
// MCP Server class
// ---------------------------------------------------------------------------

export class NvvMCPServer {
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
              error: `Okant verktyg: ${name}`,
              action: 'Anvand ett av de 8 tillgangliga verktygen.',
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
        case 'nvv_uppslag': {
          const typ = (params.typ as string) || 'lan';
          const namn = params.namn as string;
          if (!namn) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange "namn" att soka efter.' }) }],
              isError: true,
            };
          }

          const matches: Array<{ kod: string; namn: string }> = [];

          if (typ === 'lan' || typ === 'län') {
            for (const [kod, lanNamn] of Object.entries(LAN_CODES)) {
              if (fuzzyMatch(namn, lanNamn) || fuzzyMatch(namn, kod)) {
                matches.push({ kod, namn: lanNamn });
              }
            }
          } else {
            for (const [kod, kommunNamn] of Object.entries(KOMMUN_CODES)) {
              if (fuzzyMatch(namn, kommunNamn) || fuzzyMatch(namn, kod)) {
                matches.push({ kod, namn: kommunNamn });
              }
            }
          }

          result = formatUppslag(matches);
          break;
        }

        case 'nvv_sok_nationella': {
          const queryParams: string[] = [];
          if (params.lan) queryParams.push(`lan=${params.lan}`);
          if (params.kommun) queryParams.push(`kommun=${params.kommun}`);
          const qs = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
          const { data } = await client.national(`/omrade/nolinks${qs}`);
          const items = Array.isArray(data) ? data : [];
          const limit = (params.limit as number) || 50;
          const limited = items.slice(0, limit);
          result = formatOmraden(limited, 'Nationellt skyddat');
          break;
        }

        case 'nvv_sok_natura2000': {
          const queryParams: string[] = [];
          if (params.lan) queryParams.push(`lan=${params.lan}`);
          if (params.kommun) queryParams.push(`kommun=${params.kommun}`);
          const qs = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
          const { data } = await client.n2000(`/omrade/nolinks${qs}`);
          const items = Array.isArray(data) ? data : [];
          const limit = (params.limit as number) || 50;
          const limited = items.slice(0, limit);
          result = formatOmraden(limited, 'Natura 2000');
          break;
        }

        case 'nvv_detalj_nationellt': {
          const id = params.id as string;
          if (!id) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange "id" for omradet.' }) }],
              isError: true,
            };
          }
          const include = (params.include as string) || 'all';
          const sections: string[] = [];

          if (include === 'all' || include === 'basic') {
            const { data } = await client.national(`/omrade/${id}/Gallande`);
            const detaljResult = formatOmradeDetalj(data);
            sections.push(detaljResult.markdown);
          }

          if (include === 'all' || include === 'purposes') {
            const { data } = await client.national(`/omrade/${id}/Gallande/syften`);
            const syftenResult = formatSyften(data);
            if (syftenResult.count > 0) {
              sections.push('\n### Syften\n' + syftenResult.markdown);
            }
          }

          if (include === 'all' || include === 'land_cover') {
            const { data } = await client.national(`/omrade/${id}/Gallande/nmdklasser`);
            const nmdResult = formatNmdKlasser(data);
            if (nmdResult.count > 0) {
              sections.push('\n### Marktacke (NMD)\n' + nmdResult.markdown);
            }
          }

          result = {
            markdown: sections.join('\n'),
            count: 1,
            raw: [],
          };
          break;
        }

        case 'nvv_detalj_natura2000': {
          const kod = params.kod as string;
          if (!kod) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange "kod" for omradet.' }) }],
              isError: true,
            };
          }
          const include = (params.include as string) || 'all';
          const sections: string[] = [];

          if (include === 'all' || include === 'basic') {
            const { data } = await client.n2000(`/omrade/${kod}`);
            const detaljResult = formatOmradeDetalj(data);
            sections.push(detaljResult.markdown);
          }

          if (include === 'all' || include === 'species') {
            const { data } = await client.n2000(`/omrade/${kod}/arter`);
            const arterResult = formatArter(data);
            if (arterResult.count > 0) {
              sections.push('\n### Arter\n' + arterResult.markdown);
            }
          }

          if (include === 'all' || include === 'habitats') {
            const { data } = await client.n2000(`/omrade/${kod}/naturtyper`);
            const naturtyperResult = formatNaturtyper(data);
            if (naturtyperResult.count > 0) {
              sections.push('\n### Naturtyper\n' + naturtyperResult.markdown);
            }
          }

          result = {
            markdown: sections.join('\n'),
            count: 1,
            raw: [],
          };
          break;
        }

        case 'nvv_detalj_ramsar': {
          const id = params.id as string;
          if (!id) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange "id" for omradet.' }) }],
              isError: true,
            };
          }
          const { data } = await client.ramsar(`/ramsar/${id}`);
          result = formatOmradeDetalj(data);
          break;
        }

        case 'nvv_sok_alla': {
          const limit = (params.limit as number) || 30;
          const queryParams: string[] = [];
          if (params.lan) queryParams.push(`lan=${params.lan}`);
          if (params.kommun) queryParams.push(`kommun=${params.kommun}`);
          const qs = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

          const sections: string[] = [];

          // National
          try {
            const { data: natData } = await client.national(`/omrade/nolinks${qs}`);
            const natItems = Array.isArray(natData) ? natData.slice(0, limit) : [];
            const natResult = formatOmraden(natItems, 'Nationellt skyddat');
            sections.push(`### Nationellt skyddade omraden (${natResult.count} st)\n${natResult.markdown}`);
          } catch {
            sections.push('### Nationellt skyddade omraden\n_Kunde inte hamta data._');
          }

          // Natura 2000
          try {
            const { data: n2kData } = await client.n2000(`/omrade/nolinks${qs}`);
            const n2kItems = Array.isArray(n2kData) ? n2kData.slice(0, limit) : [];
            const n2kResult = formatOmraden(n2kItems, 'Natura 2000');
            sections.push(`### Natura 2000-omraden (${n2kResult.count} st)\n${n2kResult.markdown}`);
          } catch {
            sections.push('### Natura 2000-omraden\n_Kunde inte hamta data._');
          }

          // Ramsar
          try {
            const { data: ramData } = await client.ramsar(`/ramsar/nolinks${qs}`);
            const ramItems = Array.isArray(ramData) ? ramData.slice(0, limit) : [];
            const ramResult = formatOmraden(ramItems, 'Ramsar');
            sections.push(`### Ramsar-vatmarker (${ramResult.count} st)\n${ramResult.markdown}`);
          } catch {
            sections.push('### Ramsar-vatmarker\n_Kunde inte hamta data._');
          }

          result = {
            markdown: sections.join('\n\n'),
            count: sections.length,
            raw: [],
          };
          break;
        }

        case 'nvv_arter': {
          const kod = params.kod as string;
          if (!kod) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange "kod" for Natura 2000-omradet.' }) }],
              isError: true,
            };
          }
          const { data } = await client.n2000(`/omrade/${kod}/arter`);
          let items = Array.isArray(data) ? data : [];

          // Filter by species group if specified
          const grupp = params.grupp as string;
          if (grupp) {
            items = items.filter((item: Record<string, unknown>) => {
              const itemGrupp = String(item.grupp || '').toUpperCase();
              return itemGrupp === grupp.toUpperCase();
            });
          }

          result = formatArter(items);
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
                ? 'API:t ar overbelastat. Forsok INTE igen -- presentera vad du har eller valj ett annat verktyg.'
                : message.includes('404')
                  ? 'Omrade eller resurs hittades inte. Forsok INTE anropa samma verktyg igen.'
                  : 'Verktyget misslyckades. Forsok INTE anropa samma verktyg igen. Presentera tillganglig information eller forklara felet for anvandaren.',
              suggestions: [
                'Kontrollera att omrades-ID eller kod ar korrekt',
                'Anvand nvv_uppslag for att hitta ratt kommun-/lanskod',
                'Nationella ID:n ar numeriska, Natura 2000-koder borjar med "SE"',
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
      name: 'NVV MCP Server',
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

  const mcpServer = new NvvMCPServer();

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
  console.error('NVV MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
