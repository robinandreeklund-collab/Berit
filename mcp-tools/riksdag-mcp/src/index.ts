#!/usr/bin/env node

/**
 * Riksdag MCP Server v1.0
 *
 * 15 tools for Swedish parliament and government data.
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
  formatDokumentLista,
  formatPersonLista,
  formatAnförandeLista,
  formatVoteringLista,
  formatDokument,
  formatG0vDokument,
  formatKalender,
  formatUtskott,
} from './formatter.js';
import { DOKTYP, PARTIER, REGERING_DOKTYP, UTSKOTT } from './types.js';
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

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// MCP Server class
// ---------------------------------------------------------------------------

export class RiksdagMCPServer {
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
              action: 'Använd ett av de 15 tillgängliga verktygen.',
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
        // ── Sök ──────────────────────────────────────────────────────────
        case 'riksdag_sok_dokument': {
          const qp = new URLSearchParams();
          if (params.query) qp.set('sok', String(params.query));
          if (params.doktyp) qp.set('doktyp', String(params.doktyp));
          if (params.rm) qp.set('rm', String(params.rm));
          if (params.from_date) qp.set('from', String(params.from_date));
          if (params.to_date) qp.set('tom', String(params.to_date));
          qp.set('sz', String(params.limit || 20));
          qp.set('utformat', 'json');
          const { data } = await client.riksdagen(`/dokumentlista/?${qp.toString()}`);
          result = formatDokumentLista(data);
          break;
        }

        case 'riksdag_sok_ledamoter': {
          const qp = new URLSearchParams();
          if (params.namn) qp.set('fnamn', String(params.namn));
          if (params.parti) qp.set('parti', String(params.parti));
          if (params.valkrets) qp.set('valkrets', String(params.valkrets));
          if (params.status === 'all') {
            // No filter
          } else {
            qp.set('rdlstatus', 'tjg');
          }
          qp.set('utformat', 'json');
          const { data } = await client.riksdagen(`/personlista/?${qp.toString()}`, 24 * 60 * 60 * 1000);
          result = formatPersonLista(data);
          break;
        }

        case 'riksdag_sok_anforanden': {
          const qp = new URLSearchParams();
          if (params.query) qp.set('sok', String(params.query));
          if (params.talare) qp.set('talare', String(params.talare));
          if (params.parti) qp.set('parti', String(params.parti));
          if (params.rm) qp.set('rm', String(params.rm));
          qp.set('sz', String(params.limit || 20));
          qp.set('utformat', 'json');
          const { data } = await client.riksdagen(`/anforandelista/?${qp.toString()}`);
          result = formatAnförandeLista(data);
          break;
        }

        case 'riksdag_sok_voteringar': {
          const qp = new URLSearchParams();
          if (params.rm) qp.set('rm', String(params.rm));
          if (params.beteckning) qp.set('bet', String(params.beteckning));
          if (params.parti) qp.set('parti', String(params.parti));
          qp.set('sz', String(params.limit || 20));
          qp.set('utformat', 'json');
          const { data } = await client.riksdagen(`/voteringlista/?${qp.toString()}`);
          result = formatVoteringLista(data);
          break;
        }

        // ── Hämta ────────────────────────────────────────────────────────
        case 'riksdag_hamta_dokument': {
          const dokId = params.dok_id as string;
          if (!dokId) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange dok_id.' }) }],
              isError: true,
            };
          }
          const { data } = await client.riksdagen(`/dokument/${dokId}.json`);
          result = formatDokument(data);
          break;
        }

        case 'riksdag_hamta_ledamot': {
          const intressentId = params.intressent_id as string;
          if (!intressentId) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange intressent_id.' }) }],
              isError: true,
            };
          }
          const qp = new URLSearchParams();
          qp.set('iid', intressentId);
          qp.set('utformat', 'json');
          const { data } = await client.riksdagen(`/personlista/?${qp.toString()}`, 24 * 60 * 60 * 1000);
          result = formatPersonLista(data);
          break;
        }

        case 'riksdag_hamta_motioner': {
          const qp = new URLSearchParams();
          qp.set('doktyp', 'mot');
          if (params.rm) qp.set('rm', String(params.rm));
          qp.set('sz', String(params.limit || 20));
          qp.set('sort', 'datum');
          qp.set('sortorder', 'desc');
          qp.set('utformat', 'json');
          const { data } = await client.riksdagen(`/dokumentlista/?${qp.toString()}`);
          result = formatDokumentLista(data);
          break;
        }

        case 'riksdag_hamta_propositioner': {
          const qp = new URLSearchParams();
          qp.set('doktyp', 'prop');
          if (params.rm) qp.set('rm', String(params.rm));
          qp.set('sz', String(params.limit || 20));
          qp.set('sort', 'datum');
          qp.set('sortorder', 'desc');
          qp.set('utformat', 'json');
          const { data } = await client.riksdagen(`/dokumentlista/?${qp.toString()}`);
          result = formatDokumentLista(data);
          break;
        }

        case 'riksdag_hamta_utskott': {
          result = formatUtskott();
          break;
        }

        // ── Regering ─────────────────────────────────────────────────────
        case 'riksdag_regering_sok': {
          const type = (params.type as string) || 'pressmeddelanden';
          const { data } = await client.g0v(type, {
            query: params.query as string,
            limit: (params.limit as number) || 20,
          });
          result = formatG0vDokument(data);
          break;
        }

        case 'riksdag_regering_dokument': {
          const documentId = params.document_id as string;
          if (!documentId) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange document_id.' }) }],
              isError: true,
            };
          }
          const type = (params.type as string) || 'pressmeddelanden';
          const { data } = await client.g0v(type);
          const items = Array.isArray(data) ? data : [];
          const doc = items.find((d: unknown) => {
            const item = d as Record<string, unknown>;
            return item.id === documentId || item.title === documentId;
          });
          if (doc) {
            result = formatG0vDokument([doc]);
          } else {
            result = { markdown: `_Dokumentet "${documentId}" hittades inte._`, count: 0, raw: [] };
          }
          break;
        }

        case 'riksdag_regering_departement': {
          const departement = params.departement as string;
          const limit = (params.limit as number) || 20;
          const { data } = await client.g0v('pressmeddelanden', { limit: 100 });
          const items = Array.isArray(data) ? data : [];
          let filtered = items;
          if (departement) {
            const search = departement.toLowerCase();
            filtered = items.filter((d: unknown) => {
              const item = d as Record<string, unknown>;
              return String(item.department || '').toLowerCase().includes(search);
            });
          }
          result = formatG0vDokument(filtered.slice(0, limit));
          break;
        }

        // ── Kalender & Analys ────────────────────────────────────────────
        case 'riksdag_kalender': {
          const from = (params.from as string) || today();
          const to = (params.to as string) || daysFromNow(7);
          const qp = new URLSearchParams();
          qp.set('from', from);
          qp.set('tom', to);
          qp.set('utformat', 'json');
          const { data } = await client.riksdagen(`/kalenderlista/?${qp.toString()}`);
          result = formatKalender(data);
          break;
        }

        case 'riksdag_kombinerad_sok': {
          const query = params.query as string;
          if (!query) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange query.' }) }],
              isError: true,
            };
          }
          const limit = (params.limit as number) || 10;

          // Search Riksdagen documents
          const rdQp = new URLSearchParams();
          rdQp.set('sok', query);
          rdQp.set('sz', String(limit));
          rdQp.set('utformat', 'json');

          const [rdResult, govResult] = await Promise.allSettled([
            client.riksdagen(`/dokumentlista/?${rdQp.toString()}`),
            client.g0v('pressmeddelanden', { query, limit }),
          ]);

          const parts: string[] = ['# Kombinerad sökning: ' + query, ''];

          // Riksdagen results
          parts.push('## Riksdagen');
          if (rdResult.status === 'fulfilled') {
            const rdFormatted = formatDokumentLista(rdResult.value.data);
            parts.push(rdFormatted.markdown);
          } else {
            parts.push('_Kunde inte söka i Riksdagen._');
          }

          parts.push('');

          // Government results
          parts.push('## Regeringskansliet');
          if (govResult.status === 'fulfilled') {
            const govFormatted = formatG0vDokument(govResult.value.data);
            parts.push(govFormatted.markdown);
          } else {
            parts.push('_Kunde inte söka i Regeringskansliet._');
          }

          const rdCount = rdResult.status === 'fulfilled' ? formatDokumentLista(rdResult.value.data).count : 0;
          const govCount = govResult.status === 'fulfilled' ? formatG0vDokument(govResult.value.data).count : 0;

          result = {
            markdown: parts.join('\n'),
            count: rdCount + govCount,
            raw: [],
          };
          break;
        }

        case 'riksdag_statistik': {
          const lines: string[] = [
            '## Tillgängliga datakällor',
            '',
            '### Riksdagen (data.riksdagen.se)',
            '',
            '| Datakälla | Beskrivning |',
            '| --- | --- |',
            '| Dokumentlista | Motioner, propositioner, betänkanden, etc. |',
            '| Personlista | Riksdagsledamöter |',
            '| Anförandelista | Tal och debatter i kammaren |',
            '| Voteringlista | Omröstningar |',
            '| Kalenderlista | Debatter, utskottsmöten, voteringar |',
            '',
            '### Dokumenttyper',
            '',
            ...Object.entries(DOKTYP).map(([k, v]) => `- **${k}** — ${v}`),
            '',
            '### Regeringskansliet (g0v.se)',
            '',
            ...Object.entries(REGERING_DOKTYP).map(([k, v]) => `- **${k}** — ${v}`),
            '',
            '### Partier',
            '',
            ...Object.entries(PARTIER).map(([k, v]) => `- **${k}** — ${v}`),
          ];

          result = {
            markdown: lines.join('\n'),
            count: Object.keys(DOKTYP).length + Object.keys(REGERING_DOKTYP).length,
            raw: [],
          };
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
                  ? 'Dokumentet hittades inte. Försök INTE anropa samma verktyg igen.'
                  : 'Verktyget misslyckades. Försök INTE anropa samma verktyg igen. Presentera tillgänglig information eller förklara felet för användaren.',
              suggestions: [
                'Kontrollera att dok_id eller intressent_id är korrekt',
                'Datumformat: YYYY-MM-DD',
                `Dokumenttyper: ${Object.entries(DOKTYP).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')}`,
                `Partier: ${Object.entries(PARTIER).map(([k, v]) => `${k}=${v}`).join(', ')}`,
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
      name: 'Riksdag MCP Server',
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

  const mcpServer = new RiksdagMCPServer();

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
  console.error('Riksdag MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
