#!/usr/bin/env node

/**
 * SMHI MCP Server v1.0
 *
 * 10 tools for Swedish weather, hydrology, oceanography and fire risk data
 * via SMHI Open Data APIs.
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
  formatWeatherForecast,
  formatSnowForecast,
  formatMesanAnalysis,
  formatMetobs,
  formatStationList,
  formatHydroobs,
  formatHydroPrediction,
  formatOcobs,
  formatFireRiskForecast,
  formatFireRiskAnalysis,
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
// MCP Server class
// ---------------------------------------------------------------------------

export class SmhiMCPServer {
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
      let result: { markdown: string; count: number; raw: unknown };

      switch (tool.id) {
        // ── Väderprognoser ──────────────────────────────────────────────
        case 'smhi_vaderprognoser_metfcst': {
          const lat = params.latitude as number;
          const lon = params.longitude as number;
          if (!lat || !lon) {
            return this._missingParamsError('latitude och longitude');
          }
          const { data } = await client.getWeatherForecast(lat, lon);
          result = formatWeatherForecast(data);
          break;
        }

        case 'smhi_vaderprognoser_snow': {
          const lat = params.latitude as number;
          const lon = params.longitude as number;
          if (!lat || !lon) {
            return this._missingParamsError('latitude och longitude');
          }
          const { data } = await client.getSnowForecast(lat, lon);
          result = formatSnowForecast(data);
          break;
        }

        // ── Väderanalyser ───────────────────────────────────────────────
        case 'smhi_vaderanalyser_mesan': {
          const lat = params.latitude as number;
          const lon = params.longitude as number;
          if (!lat || !lon) {
            return this._missingParamsError('latitude och longitude');
          }
          const { data } = await client.getMesanAnalysis(lat, lon);
          result = formatMesanAnalysis(data);
          break;
        }

        // ── Väderobservationer ───────────────────────────────────────────
        case 'smhi_vaderobservationer_metobs': {
          const parameter = params.parameter as number;
          const station = params.station as number;
          const period = (params.period as string) || 'latest-day';
          if (!parameter || !station) {
            return this._missingParamsError('parameter och station');
          }
          const { data } = await client.getMetobs(parameter, station, period);
          result = formatMetobs(data);
          break;
        }

        case 'smhi_vaderobservationer_stationer': {
          const parameter = params.parameter as number;
          if (!parameter) {
            return this._missingParamsError('parameter');
          }
          const { data } = await client.getMetobsStations(parameter);
          result = formatStationList(data);
          break;
        }

        // ── Hydrologi ───────────────────────────────────────────────────
        case 'smhi_hydrologi_hydroobs': {
          const parameter = params.parameter as number;
          const station = params.station as number;
          const period = (params.period as string) || 'latest-day';
          if (!parameter || !station) {
            return this._missingParamsError('parameter och station');
          }
          const { data } = await client.getHydroobs(parameter, station, period);
          result = formatHydroobs(data);
          break;
        }

        case 'smhi_hydrologi_pthbv': {
          const lat = params.latitude as number;
          const lon = params.longitude as number;
          if (!lat || !lon) {
            return this._missingParamsError('latitude och longitude');
          }
          const { data } = await client.getHydroPrediction(lat, lon);
          result = formatHydroPrediction(data);
          break;
        }

        // ── Oceanografi ─────────────────────────────────────────────────
        case 'smhi_oceanografi_ocobs': {
          const parameter = params.parameter as number;
          const station = params.station as number;
          const period = (params.period as string) || 'latest-day';
          if (!parameter || !station) {
            return this._missingParamsError('parameter och station');
          }
          const { data } = await client.getOcobs(parameter, station, period);
          result = formatOcobs(data);
          break;
        }

        // ── Brandrisk ───────────────────────────────────────────────────
        case 'smhi_brandrisk_fwif': {
          const lat = params.latitude as number;
          const lon = params.longitude as number;
          if (!lat || !lon) {
            return this._missingParamsError('latitude och longitude');
          }
          const { data } = await client.getFireRiskForecast(lat, lon);
          result = formatFireRiskForecast(data);
          break;
        }

        case 'smhi_brandrisk_fwia': {
          const lat = params.latitude as number;
          const lon = params.longitude as number;
          if (!lat || !lon) {
            return this._missingParamsError('latitude och longitude');
          }
          const { data } = await client.getFireRiskAnalysis(lat, lon);
          result = formatFireRiskAnalysis(data);
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
                  ? 'Data hittades inte. Kontrollera koordinater, station-ID eller parameter-ID. Försök INTE anropa samma verktyg igen.'
                  : 'Verktyget misslyckades. Försök INTE anropa samma verktyg igen. Presentera tillgänglig information eller förklara felet för användaren.',
              tips: [
                'Kontrollera att koordinater är inom Sverige (lat 55-70, lon 10-25)',
                'Metobs/Hydroobs/Ocobs kräver giltigt stations-ID',
                'Använd smhi_vaderobservationer_stationer för att hitta stationer',
                'Prognoser/analyser kräver bara lat/lon',
              ],
            }),
          },
        ],
        isError: true,
      };
    }
  }

  private _missingParamsError(
    params: string,
  ): { content: Array<{ type: string; text: string }>; isError: boolean } {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: `Saknade parametrar: ${params}`,
            action: `Ange ${params} och försök igen.`,
          }),
        },
      ],
      isError: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Stdio transport (for CLI clients)
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const server = new Server(
    {
      name: 'SMHI MCP Server',
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

  const mcpServer = new SmhiMCPServer();

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
  console.error('SMHI MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
