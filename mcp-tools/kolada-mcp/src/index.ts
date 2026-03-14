#!/usr/bin/env node

/**
 * Kolada MCP Server v1.0
 *
 * 10 tools for Swedish municipality statistics via Kolada API v2.
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
  formatKpiLista,
  formatKommunLista,
  formatEnhetLista,
  formatKpiData,
  formatKpiDetalj,
  formatKommunGrupper,
  formatTrend,
} from './formatter.js';
import { POPULAR_KPIS, COMMON_MUNICIPALITIES } from './types.js';
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
// Date helpers
// ---------------------------------------------------------------------------

function currentYear(): number {
  return new Date().getFullYear();
}

// ---------------------------------------------------------------------------
// MCP Server class
// ---------------------------------------------------------------------------

export class KoladaMCPServer {
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
        case 'kolada_sok_nyckeltal': {
          const query = encodeURIComponent(String(params.query || ''));
          const limit = Number(params.limit) || 20;
          const { data } = await client.getMeta(`/kpi?title=${query}`);
          const response = data as Record<string, unknown>;
          const values = Array.isArray(response.values) ? response.values.slice(0, limit) : [];
          result = formatKpiLista({ values });
          break;
        }

        case 'kolada_sok_kommun': {
          const query = encodeURIComponent(String(params.query || ''));
          const limit = Number(params.limit) || 20;
          const { data } = await client.getMeta(`/municipality?title=${query}`);
          const response = data as Record<string, unknown>;
          const values = Array.isArray(response.values) ? response.values.slice(0, limit) : [];
          result = formatKommunLista({ values });
          break;
        }

        case 'kolada_sok_enhet': {
          const query = encodeURIComponent(String(params.query || ''));
          const kommun = params.kommun as string;
          const limit = Number(params.limit) || 20;
          let path = `/ou?title=${query}`;
          if (kommun) {
            path += `&municipality=${kommun}`;
          }
          const { data } = await client.getMeta(path);
          const response = data as Record<string, unknown>;
          const values = Array.isArray(response.values) ? response.values.slice(0, limit) : [];
          result = formatEnhetLista({ values });
          break;
        }

        case 'kolada_data_kommun': {
          const kpiId = String(params.kpi_id);
          const kommunId = String(params.kommun_id);
          const fromYear = params.from_year as string;
          const toYear = params.to_year as string;
          let path = `/data/municipality/${kommunId}/kpi/${kpiId}`;
          if (fromYear && toYear) {
            path += `?from_date=${fromYear}&to_date=${toYear}`;
          } else if (fromYear) {
            path += `?from_date=${fromYear}`;
          } else if (toYear) {
            path += `?to_date=${toYear}`;
          }
          const { data } = await client.getData(path);
          const kpiLabel = POPULAR_KPIS[kpiId];
          result = formatKpiData(data, kpiLabel);
          break;
        }

        case 'kolada_data_alla_kommuner': {
          const kpiId = String(params.kpi_id);
          const year = String(params.year);
          const { data } = await client.getData(`/data/permunicipality/${kpiId}/${year}`);
          const kpiLabel = POPULAR_KPIS[kpiId];
          result = formatKpiData(data, kpiLabel);
          break;
        }

        case 'kolada_data_enhet': {
          const kpiId = String(params.kpi_id);
          const year = String(params.year);
          const { data } = await client.getData(`/data/perou/${kpiId}/${year}`);
          const kpiLabel = POPULAR_KPIS[kpiId];
          result = formatKpiData(data, kpiLabel);
          break;
        }

        case 'kolada_nyckeltal_detalj': {
          const kpiId = String(params.kpi_id);
          const { data } = await client.getMeta(`/kpi/${kpiId}`);
          result = formatKpiDetalj(data);
          break;
        }

        case 'kolada_jamfor_kommuner': {
          const kpiId = String(params.kpi_id);
          const kommunIds = String(params.kommun_ids);
          const year = params.year as string;
          let path = `/data/municipality/${kommunIds}/kpi/${kpiId}`;
          if (year) {
            path += `?from_date=${year}&to_date=${year}`;
          }
          const { data } = await client.getData(path);
          const kpiLabel = POPULAR_KPIS[kpiId];
          result = formatKpiData(data, kpiLabel);
          break;
        }

        case 'kolada_trend': {
          const kpiId = String(params.kpi_id);
          const kommunId = String(params.kommun_id);
          const numYears = Number(params.years) || 5;
          const toYear = currentYear();
          const fromYear = toYear - numYears;
          const path = `/data/municipality/${kommunId}/kpi/${kpiId}?from_date=${fromYear}&to_date=${toYear}`;
          const { data } = await client.getData(path);
          const kpiLabel = POPULAR_KPIS[kpiId];
          result = formatTrend(data, kpiLabel);
          break;
        }

        case 'kolada_kommungrupper': {
          const { data } = await client.getMeta('/municipality_groups');
          result = formatKommunGrupper(data);
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
      if (result.count <= 10) {
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
                  ? 'Nyckeltal eller kommun hittades inte. Försök INTE anropa samma verktyg igen.'
                  : 'Verktyget misslyckades. Försök INTE anropa samma verktyg igen. Presentera tillgänglig information eller förklara felet för användaren.',
              suggestions: [
                'Kontrollera att nyckeltal-ID eller kommun-ID är korrekt',
                'Använd kolada_sok_nyckeltal för att hitta rätt ID',
                'Använd kolada_sok_kommun för att hitta rätt kommun-ID',
                `Vanliga nyckeltal: ${Object.entries(POPULAR_KPIS).slice(0, 4).map(([k, v]) => `${k}=${v}`).join(', ')}`,
                `Vanliga kommuner: ${Object.entries(COMMON_MUNICIPALITIES).slice(0, 4).map(([k, v]) => `${k}=${v}`).join(', ')}`,
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
      name: 'Kolada MCP Server',
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

  const mcpServer = new KoladaMCPServer();

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
  console.error('Kolada MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
