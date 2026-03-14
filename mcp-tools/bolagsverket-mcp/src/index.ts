#!/usr/bin/env node

/**
 * Bolagsverket MCP Server v1.0
 *
 * 6 tools for Swedish company data via Bolagsverket Värdefulla datamängder API.
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
  formatOrganisation,
  formatGrunddata,
  formatFunktionarer,
  formatRegistrering,
  formatDokumentlista,
  formatDokument,
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

export class BolagsverketMCPServer {
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
              action: 'Använd ett av de 6 tillgängliga verktygen.',
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
        case 'bolagsverket_uppslag': {
          const orgNr = params.organisationsnummer as string;
          if (!orgNr) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange organisationsnummer (10 siffror).' }) }],
              isError: true,
            };
          }
          const { data } = await client.lookupOrganisation(orgNr);
          result = formatOrganisation(data);
          break;
        }

        case 'bolagsverket_grunddata': {
          const orgNr = params.organisationsnummer as string;
          if (!orgNr) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange organisationsnummer.' }) }],
              isError: true,
            };
          }
          const { data } = await client.lookupOrganisation(orgNr);
          result = formatGrunddata(data);
          break;
        }

        case 'bolagsverket_styrelse': {
          const orgNr = params.organisationsnummer as string;
          if (!orgNr) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange organisationsnummer.' }) }],
              isError: true,
            };
          }
          const { data } = await client.lookupOrganisation(orgNr);
          result = formatFunktionarer(data);
          break;
        }

        case 'bolagsverket_registrering': {
          const orgNr = params.organisationsnummer as string;
          if (!orgNr) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange organisationsnummer.' }) }],
              isError: true,
            };
          }
          const { data } = await client.lookupOrganisation(orgNr);
          result = formatRegistrering(data);
          break;
        }

        case 'bolagsverket_dokumentlista': {
          const orgNr = params.organisationsnummer as string;
          if (!orgNr) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange organisationsnummer.' }) }],
              isError: true,
            };
          }
          const { data } = await client.getDocuments(orgNr);
          result = formatDokumentlista(data);
          break;
        }

        case 'bolagsverket_dokument': {
          const dokumentId = params.dokumentId as string;
          if (!dokumentId) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Ange dokumentId (från bolagsverket_dokumentlista).' }) }],
              isError: true,
            };
          }
          const { data } = await client.getDocument(dokumentId);
          result = formatDokument(data);
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
                ? 'API:t är överbelastat (60 req/min). Försök INTE igen.'
                : message.includes('OAuth') || message.includes('CLIENT_ID')
                  ? 'OAuth 2.0-uppgifter saknas. Registrera gratis: gw.api.bolagsverket.se'
                  : message.includes('404')
                    ? 'Organisation hittades inte. Kontrollera organisationsnumret.'
                    : 'Verktyget misslyckades. Försök INTE anropa samma verktyg igen.',
              suggestions: [
                'Organisationsnummer: 10 siffror (t.ex. "5566778899")',
                'Sökning stöds ENBART via organisationsnummer',
                'Kräver BOLAGSVERKET_CLIENT_ID och BOLAGSVERKET_CLIENT_SECRET',
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
      name: 'Bolagsverket MCP Server',
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

  const mcpServer = new BolagsverketMCPServer();

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
  console.error('Bolagsverket MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
