#!/usr/bin/env node

/**
 * Elpris MCP Server v1.0
 *
 * 4 tools for Swedish electricity spot prices via elprisetjustnu.se.
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
  formatHourlyPrices,
  formatDailyAverages,
  formatZoneComparison,
} from './formatter.js';
import { PRICE_ZONES } from './types.js';
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

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function parseDateParts(dateStr: string): { year: string; monthDay: string } {
  const [year, month, day] = dateStr.split('-');
  return { year, monthDay: `${month}-${day}` };
}

function daysBetween(from: string, to: string): number {
  const f = new Date(from);
  const t = new Date(to);
  return Math.ceil((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// MCP Server class
// ---------------------------------------------------------------------------

export class ElprisMCPServer {
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
              action: 'Använd ett av de 4 tillgängliga verktygen.',
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
        case 'elpris_idag': {
          const zone = ((params.zon as string) || 'SE3').toUpperCase();
          const dateStr = today();
          const { year, monthDay } = parseDateParts(dateStr);
          const { data } = await client.getPrices(year, monthDay, zone);
          result = formatHourlyPrices(data, zone);
          break;
        }

        case 'elpris_imorgon': {
          const zone = ((params.zon as string) || 'SE3').toUpperCase();
          const dateStr = tomorrow();
          const { year, monthDay } = parseDateParts(dateStr);
          try {
            const { data } = await client.getPrices(year, monthDay, zone);
            result = formatHourlyPrices(data, zone);
          } catch {
            result = {
              markdown:
                `**Morgondagens priser är ännu inte publicerade för ${zone}.**\n\n` +
                'Priser publiceras normalt efter kl 13:00. Försök igen senare.\n\n' +
                'Använd `elpris_idag` för att se dagens priser istället.',
              count: 0,
              raw: [],
            };
          }
          break;
        }

        case 'elpris_historik': {
          const zone = ((params.zon as string) || 'SE3').toUpperCase();
          const fromDate = params.fromDate as string;
          const toDate = params.toDate as string;

          if (!fromDate || !toDate) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange fromDate och toDate (YYYY-MM-DD).' }) }],
              isError: true,
            };
          }

          const days = daysBetween(fromDate, toDate);
          if (days > 31) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Max 31 dagars intervall. Ange ett kortare datumintervall.' }) }],
              isError: true,
            };
          }

          const dailyData: Array<{ date: string; zone: string; avgSek: number; avgEur: number; minSek: number; maxSek: number; count: number }> = [];

          for (let i = 0; i <= days; i++) {
            const dateStr = addDays(fromDate, i);
            const { year, monthDay } = parseDateParts(dateStr);
            try {
              const { data } = await client.getPrices(year, monthDay, zone, true);
              const items = Array.isArray(data) ? data : [];
              if (items.length > 0) {
                const sekPrices = items.map((p: Record<string, unknown>) => p.SEK_per_kWh as number);
                const eurPrices = items.map((p: Record<string, unknown>) => p.EUR_per_kWh as number);
                dailyData.push({
                  date: dateStr,
                  zone,
                  avgSek: sekPrices.reduce((a: number, b: number) => a + b, 0) / sekPrices.length,
                  avgEur: eurPrices.reduce((a: number, b: number) => a + b, 0) / eurPrices.length,
                  minSek: Math.min(...sekPrices),
                  maxSek: Math.max(...sekPrices),
                  count: items.length,
                });
              }
            } catch {
              // Skip days with no data
            }
          }

          result = formatDailyAverages(dailyData);
          break;
        }

        case 'elpris_jamforelse': {
          const dateStr = (params.datum as string) || today();
          const { year, monthDay } = parseDateParts(dateStr);
          const zones = Object.keys(PRICE_ZONES);
          const zoneData: Array<{ zone: string; zoneName: string; avgSek: number; minSek: number; maxSek: number; count: number }> = [];

          for (const zone of zones) {
            try {
              const { data } = await client.getPrices(year, monthDay, zone);
              const items = Array.isArray(data) ? data : [];
              if (items.length > 0) {
                const sekPrices = items.map((p: Record<string, unknown>) => p.SEK_per_kWh as number);
                zoneData.push({
                  zone,
                  zoneName: PRICE_ZONES[zone],
                  avgSek: sekPrices.reduce((a: number, b: number) => a + b, 0) / sekPrices.length,
                  minSek: Math.min(...sekPrices),
                  maxSek: Math.max(...sekPrices),
                  count: items.length,
                });
              }
            } catch {
              // Skip zones with no data
            }
          }

          result = formatZoneComparison(zoneData);
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
        notering: 'Priser exkluderar moms och avgifter (elnätsavgift, energiskatt).',
      };

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
                  ? 'Data finns inte för detta datum/zon. Försök INTE anropa samma verktyg igen.'
                  : 'Verktyget misslyckades. Försök INTE anropa samma verktyg igen.',
              suggestions: [
                'Kontrollera datum (YYYY-MM-DD)',
                'Giltiga zoner: SE1, SE2, SE3, SE4',
                'Data tillgänglig från 2022-11-01',
                'Morgondagens priser publiceras efter kl 13:00',
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
      name: 'Elpris MCP Server',
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

  const mcpServer = new ElprisMCPServer();

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
  console.error('Elpris MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
