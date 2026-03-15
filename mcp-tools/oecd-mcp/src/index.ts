#!/usr/bin/env node

/**
 * OECD MCP Server v1.0
 *
 * 9 tools for international statistical data via OECD SDMX API.
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
  formatDataflows,
  formatDataStructure,
  formatSDMXData,
  formatCategories,
  formatCategoriesDetailed,
  formatPopularDatasets,
} from './formatter.js';
import {
  OECD_CATEGORIES,
  KNOWN_DATAFLOWS,
  DATAFLOW_MAP,
  CATEGORY_MAP,
} from './types.js';
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

function fiveYearsAgo(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 5);
  return d.getFullYear().toString();
}

// ---------------------------------------------------------------------------
// MCP Server class
// ---------------------------------------------------------------------------

export class OECDMCPServer {
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
              action: 'Använd ett av de 9 tillgängliga verktygen.',
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

      switch (tool.id) {
        // ── Search dataflows ───────────────────────────────────────────
        case 'oecd_search_dataflows': {
          const keyword = (params.keyword as string || '').toLowerCase();
          if (!keyword) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange ett sökord (keyword).' }) }],
              isError: true,
            };
          }

          // Search in known dataflows first
          const matches = KNOWN_DATAFLOWS.filter((d) =>
            d.id.toLowerCase().includes(keyword) ||
            d.name.toLowerCase().includes(keyword) ||
            d.nameEn.toLowerCase().includes(keyword) ||
            d.description.toLowerCase().includes(keyword)
          );

          // Also search in category example dataflows
          const categoryMatches = OECD_CATEGORIES.filter((c) =>
            c.name.toLowerCase().includes(keyword) ||
            c.nameEn.toLowerCase().includes(keyword) ||
            c.description.toLowerCase().includes(keyword)
          ).flatMap((c) => c.exampleDataflows.map((dfId) => ({
            id: dfId,
            name: c.name,
            description: `Exempeldataset i kategori: ${c.name} (${c.nameEn})`,
            category: c.id,
          })));

          // Deduplicate
          const seen = new Set(matches.map((m) => m.id));
          const allMatches = [
            ...matches.map((m) => ({ id: m.id, name: m.name, description: m.description, category: m.category })),
            ...categoryMatches.filter((m) => !seen.has(m.id)),
          ];

          if (allMatches.length === 0) {
            // Try SDMX API search
            try {
              const { data } = await client.metadata(`/dataflow/OECD?references=none`);
              const response = data as Record<string, unknown>;
              const dataStructures = response.data as Record<string, unknown> | undefined;
              const dataflows = (dataStructures?.dataflows || []) as Array<Record<string, unknown>>;
              const apiMatches = dataflows
                .filter((df) => {
                  const name = String(df.name || '').toLowerCase();
                  const desc = String(df.description || '').toLowerCase();
                  const id = String(df.id || '').toLowerCase();
                  return name.includes(keyword) || desc.includes(keyword) || id.includes(keyword);
                })
                .slice(0, 20)
                .map((df) => ({
                  id: String(df.id),
                  name: String(df.name || ''),
                  description: String(df.description || ''),
                  category: '—',
                }));

              const result = formatDataflows(apiMatches);
              return {
                content: [{ type: 'text', text: JSON.stringify({ verktyg: tool.id, sökord: keyword, antal: result.count, data: result.markdown }) }],
              };
            } catch {
              return {
                content: [{ type: 'text', text: JSON.stringify({ verktyg: tool.id, sökord: keyword, antal: 0, data: `_Inga dataset hittades för "${keyword}". Prova ett annat sökord på engelska._` }) }],
              };
            }
          }

          const result = formatDataflows(allMatches);
          return {
            content: [{ type: 'text', text: JSON.stringify({ verktyg: tool.id, sökord: keyword, antal: result.count, data: result.markdown }, null, 2) }],
          };
        }

        // ── List dataflows by category ─────────────────────────────────
        case 'oecd_list_dataflows': {
          const categoryId = params.category as string;

          if (categoryId) {
            const cat = CATEGORY_MAP[categoryId];
            if (!cat) {
              return {
                content: [{ type: 'text', text: JSON.stringify({ error: `Okänd kategori: ${categoryId}`, tillgängliga: OECD_CATEGORIES.map((c) => c.id) }) }],
                isError: true,
              };
            }

            const catDataflows = KNOWN_DATAFLOWS
              .filter((d) => d.category === categoryId)
              .map((d) => ({ id: d.id, name: d.name, description: d.description, category: d.category }));

            // Add example dataflows from category
            const seen = new Set(catDataflows.map((d) => d.id));
            for (const dfId of cat.exampleDataflows) {
              if (!seen.has(dfId)) {
                catDataflows.push({ id: dfId, name: '—', description: `Exempeldataset i ${cat.name}`, category: categoryId });
              }
            }

            const result = formatDataflows(catDataflows);
            return {
              content: [{ type: 'text', text: JSON.stringify({ verktyg: tool.id, kategori: cat.name, antal: result.count, data: result.markdown }, null, 2) }],
            };
          }

          // No category specified — show all known dataflows grouped
          const result = formatDataflows(
            KNOWN_DATAFLOWS.map((d) => ({ id: d.id, name: d.name, description: d.description, category: d.category })),
          );
          return {
            content: [{ type: 'text', text: JSON.stringify({ verktyg: tool.id, antal: result.count, data: result.markdown }, null, 2) }],
          };
        }

        // ── Search indicators ──────────────────────────────────────────
        case 'oecd_search_indicators': {
          const keyword = (params.keyword as string || '').toLowerCase();
          const categoryFilter = params.category as string;

          if (!keyword) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange ett sökord (keyword).' }) }],
              isError: true,
            };
          }

          // Search known dataflows for indicator-like matches
          let searchSpace = KNOWN_DATAFLOWS;
          if (categoryFilter) {
            searchSpace = searchSpace.filter((d) => d.category === categoryFilter);
          }

          const matches = searchSpace.filter((d) =>
            d.description.toLowerCase().includes(keyword) ||
            d.name.toLowerCase().includes(keyword) ||
            d.nameEn.toLowerCase().includes(keyword)
          );

          const result = formatDataflows(
            matches.map((d) => ({ id: d.id, name: d.name, description: d.description, category: d.category })),
          );

          const response: Record<string, unknown> = {
            verktyg: tool.id,
            sökord: keyword,
            antal: result.count,
            data: result.markdown,
          };

          if (result.count === 0) {
            response.tips = 'Prova att söka på engelska (t.ex. "unemployment" istället för "arbetslöshet"). Använd oecd_search_dataflows för bredare sökning.';
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
          };
        }

        // ── Get data structure ─────────────────────────────────────────
        case 'oecd_get_data_structure': {
          const dataflowId = params.dataflow_id as string;
          if (!dataflowId) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange dataflow_id (t.ex. "QNA", "MEI").' }) }],
              isError: true,
            };
          }

          // Fetch structure by querying data with lastNObservations=1 to get structure
          const known = DATAFLOW_MAP[dataflowId];
          const ref = known?.sdmxRef || `OECD.SDD.NAD,DSD_NAMAIN1@DF_${dataflowId}`;
          const { data } = await client.sdmx(
            `/data/${ref}/all?lastNObservations=1&format=jsondata`,
            undefined,
          );

          const result = formatDataStructure(data, dataflowId);
          return {
            content: [{ type: 'text', text: JSON.stringify({ verktyg: tool.id, dataset: dataflowId, data: result.markdown }, null, 2) }],
          };
        }

        // ── Get dataflow URL ───────────────────────────────────────────
        case 'oecd_get_dataflow_url': {
          const dataflowId = params.dataflow_id as string;
          const filter = params.filter as string;

          if (!dataflowId) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange dataflow_id.' }) }],
              isError: true,
            };
          }

          const baseExplorerUrl = 'https://data-explorer.oecd.org';
          let url = `${baseExplorerUrl}/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=${dataflowId}&df[ag]=OECD`;
          if (filter) {
            url += `&dq=${encodeURIComponent(filter)}`;
          }

          const known = DATAFLOW_MAP[dataflowId];
          const response: Record<string, unknown> = {
            verktyg: tool.id,
            dataset: dataflowId,
            url,
          };
          if (known) {
            response.namn = known.name;
            response.beskrivning = known.description;
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
          };
        }

        // ── Get categories ─────────────────────────────────────────────
        case 'oecd_get_categories': {
          const result = formatCategories();
          return {
            content: [{ type: 'text', text: JSON.stringify({ verktyg: tool.id, antal: result.count, data: result.markdown }, null, 2) }],
          };
        }

        // ── List categories detailed ───────────────────────────────────
        case 'oecd_list_categories_detailed': {
          const result = formatCategoriesDetailed();
          return {
            content: [{ type: 'text', text: JSON.stringify({ verktyg: tool.id, antal: result.count, data: result.markdown }, null, 2) }],
          };
        }

        // ── Get popular datasets ───────────────────────────────────────
        case 'oecd_get_popular_datasets': {
          const result = formatPopularDatasets();
          return {
            content: [{ type: 'text', text: JSON.stringify({ verktyg: tool.id, antal: result.count, data: result.markdown }, null, 2) }],
          };
        }

        // ── Query data — THE MAIN TOOL ─────────────────────────────────
        case 'oecd_query_data': {
          const dataflowId = params.dataflow_id as string;
          if (!dataflowId) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange dataflow_id (t.ex. "QNA", "MEI").' }) }],
              isError: true,
            };
          }

          const filter = (params.filter as string) || 'all';
          const startPeriod = (params.start_period as string) || fiveYearsAgo();
          const endPeriod = params.end_period as string;
          let lastN = params.last_n_observations as number | undefined;

          // Enforce limits
          if (lastN !== undefined) {
            lastN = Math.min(Math.max(1, lastN), 1000);
          } else {
            lastN = 100;
          }

          // Build SDMX data query URL using known reference or default pattern
          const known = DATAFLOW_MAP[dataflowId];
          const ref = known?.sdmxRef || `OECD.SDD.NAD,DSD_NAMAIN1@DF_${dataflowId}`;
          let path = `/data/${ref}/${filter}?format=jsondata`;
          path += `&startPeriod=${startPeriod}`;
          if (endPeriod) {
            path += `&endPeriod=${endPeriod}`;
          }
          path += `&lastNObservations=${lastN}`;

          const { data } = await client.sdmx(path);
          const result = formatSDMXData(data, dataflowId);

          const response: Record<string, unknown> = {
            verktyg: tool.id,
            dataset: dataflowId,
            filter,
            antal: result.count,
            data: result.markdown,
          };

          // Include raw JSON for small result sets
          if (result.count <= 10 && result.raw.length > 0) {
            response.raw = result.raw;
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
          };
        }

        default:
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `Verktyg ej implementerat: ${tool.id}` }) }],
            isError: true,
          };
      }
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
                  ? 'Dataset eller filter hittades inte. Kör oecd_get_data_structure för att se korrekt filterformat.'
                  : 'Verktyget misslyckades. Försök INTE anropa samma verktyg igen. Presentera tillgänglig information eller förklara felet.',
              suggestions: [
                'Kör oecd_get_data_structure för att se korrekt dimensionsordning',
                'Kör oecd_search_dataflows för att hitta rätt dataset-ID',
                'Vanliga dataset: QNA, MEI, HEALTH_STAT, HPI, IDD',
                'Vanliga landskoder: SWE, NOR, DNK, FIN, DEU, USA',
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
      name: 'OECD MCP Server',
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

  const mcpServer = new OECDMCPServer();

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
  console.error('OECD MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
