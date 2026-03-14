#!/usr/bin/env node

/**
 * Riksbank MCP Server v1.0
 *
 * 8 tools for Swedish economic data via Riksbank REST APIs.
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
  formatObservations,
  formatGroupObservations,
  formatCrossRate,
  formatSwestr,
  formatForecasts,
  formatForecastsUnavailable,
  formatIndicators,
} from './formatter.js';
import { SERIES_IDS, CURRENCY_SERIES, GROUP_IDS } from './types.js';
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
// Input schema generators
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function oneYearAgo(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// MCP Server class
// ---------------------------------------------------------------------------

export class RiksbankMCPServer {
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

      switch (tool.id) {
        case 'riksbank_ranta_styrranta': {
          const serieId = (params.serieId as string) || 'SECBREPOEFF';
          const from = (params.fromDate as string) || oneYearAgo();
          const to = (params.toDate as string) || today();
          const { data } = await client.swea(`/Observations/${serieId}/${from}/${to}`);
          result = formatObservations(data, SERIES_IDS[serieId] || serieId);
          break;
        }

        case 'riksbank_ranta_marknadsrantor': {
          const groupId = (params.groupId as string) || '3';
          const { data } = await client.swea(`/Observations/Latest/ByGroup/${groupId}`);
          result = formatGroupObservations(data);
          break;
        }

        case 'riksbank_valuta_kurser': {
          const valuta = (params.valuta as string)?.toUpperCase();
          const from = params.fromDate as string;
          const to = params.toDate as string;

          if (valuta && CURRENCY_SERIES[valuta] && from && to) {
            // Specific currency with date range
            const serieId = CURRENCY_SERIES[valuta];
            const { data } = await client.swea(`/Observations/${serieId}/${from}/${to}`);
            result = formatObservations(data, `${valuta}/SEK`);
          } else if (valuta && CURRENCY_SERIES[valuta]) {
            // Specific currency, latest
            const serieId = CURRENCY_SERIES[valuta];
            const { data } = await client.swea(`/Observations/Latest/${serieId}`);
            result = formatObservations(Array.isArray(data) ? data : [data], `${valuta}/SEK`);
          } else {
            // All currencies
            const { data } = await client.swea('/Observations/Latest/ByGroup/130');
            result = formatGroupObservations(data);
          }
          break;
        }

        case 'riksbank_valuta_korskurser': {
          const v1 = (params.valuta1 as string)?.toUpperCase();
          const v2 = (params.valuta2 as string)?.toUpperCase();
          if (!v1 || !v2) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange valuta1 och valuta2.' }) }],
              isError: true,
            };
          }
          const s1 = CURRENCY_SERIES[v1] || `SEK${v1}PMI`;
          const s2 = CURRENCY_SERIES[v2] || `SEK${v2}PMI`;
          const datum = (params.datum as string) || today();
          const { data } = await client.swea(`/CrossRates/${s1}/${s2}/${datum}`);
          result = formatCrossRate(data);
          break;
        }

        case 'riksbank_swestr': {
          const from = params.fromDate as string;
          const to = params.toDate as string;
          if (from && to) {
            const { data } = await client.swestr(`/all/SWESTR?fromDate=${from}&toDate=${to}`);
            result = formatSwestr(data);
          } else {
            const { data } = await client.swestr('/latest/SWESTR');
            result = formatSwestr(data);
          }
          break;
        }

        case 'riksbank_prognos_inflation': {
          const indikator = (params.indikator as string) || 'CPIF';
          try {
            const { data } = await client.forecasts(`/forecasts?indicator=${indikator}`);
            const forecastData = data as Record<string, unknown>;
            result = formatForecasts(forecastData.values || data);
          } catch {
            result = formatForecastsUnavailable('inflation', indikator);
          }
          break;
        }

        case 'riksbank_prognos_bnp': {
          const indikator = (params.indikator as string) || 'GDP';
          try {
            const { data } = await client.forecasts(`/forecasts?indicator=${indikator}`);
            const forecastData = data as Record<string, unknown>;
            result = formatForecasts(forecastData.values || data);
          } catch {
            result = formatForecastsUnavailable('BNP', indikator);
          }
          break;
        }

        case 'riksbank_prognos_ovrigt': {
          const indikator = params.indikator as string;
          try {
            if (indikator) {
              const { data } = await client.forecasts(`/forecasts?indicator=${indikator}`);
              const forecastData = data as Record<string, unknown>;
              result = formatForecasts(forecastData.values || data);
            } else {
              const { data } = await client.forecasts('/indicators');
              result = formatIndicators(data);
            }
          } catch {
            result = formatForecastsUnavailable('makroprognos', indikator || 'alla');
          }
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
                  ? 'Serie eller indikator hittades inte. Försök INTE anropa samma verktyg igen.'
                  : 'Verktyget misslyckades. Försök INTE anropa samma verktyg igen. Presentera tillgänglig information eller förklara felet för användaren.',
              suggestions: [
                'Kontrollera att serie-ID eller indikator-ID är korrekt',
                'Datumformat: YYYY-MM-DD',
                `Vanliga serier: ${Object.entries(SERIES_IDS).slice(0, 4).map(([k, v]) => `${k}=${v}`).join(', ')}`,
                `Grupper: ${Object.entries(GROUP_IDS).map(([k, v]) => `${k}=${v}`).join(', ')}`,
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
      name: 'Riksbank MCP Server',
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

  const mcpServer = new RiksbankMCPServer();

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
  console.error('Riksbank MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
