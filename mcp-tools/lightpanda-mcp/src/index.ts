#!/usr/bin/env node

/**
 * Lightpanda MCP Server v1.0
 *
 * 12 tools for web browsing, search and data extraction via
 * Lightpanda headless browser with full JavaScript rendering.
 * Supports both stdio and HTTP transports.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFINITIONS, getToolById } from './tools.js';
import { getCDPClient } from './cdp-client.js';
import { htmlToMarkdown, parseDuckDuckGoResults, extractTitle } from './formatter.js';
import {
  DUCKDUCKGO_URL,
  DEFAULT_SEARCH_RESULTS,
  MAX_SEARCH_RESULTS,
  MAX_CONTENT_LENGTH,
} from './types.js';

// ---------------------------------------------------------------------------
// Call tracker — prevents LLM from looping the same tool
// ---------------------------------------------------------------------------

interface CallRecord {
  count: number;
  firstCall: number;
}

const CALL_LIMIT = 8;
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

export class LightpandaMCPServer {
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
              action: 'Använd ett av de 12 tillgängliga verktygen.',
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
      const client = getCDPClient();

      // Check if Lightpanda is available
      const available = await client.isAvailable();
      if (!available) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Lightpanda webbläsare är inte tillgänglig.',
                action: 'Starta Lightpanda: docker run -d -p 9222:9222 lightpanda/browser:nightly',
              }),
            },
          ],
          isError: true,
        };
      }

      let result: Record<string, unknown>;

      switch (tool.id) {
        // ── Navigation ───────────────────────────────────────────────
        case 'lightpanda_goto': {
          const url = params.url as string;
          if (!url) return this._missingParamsError('url');

          result = await client.withSession(url, async (ws, session, msgId) => {
            const title = await client.evaluate(ws, session, 'document.title', msgId);
            return {
              verktyg: tool.id,
              url: session.currentUrl,
              title: title || '(ingen titel)',
              status: 'Navigerade till sidan',
            };
          });
          break;
        }

        case 'lightpanda_search': {
          const query = params.query as string;
          if (!query) return this._missingParamsError('query');
          const maxResults = Math.min(
            (params.max_results as number) || DEFAULT_SEARCH_RESULTS,
            MAX_SEARCH_RESULTS,
          );

          const searchUrl = `${DUCKDUCKGO_URL}?q=${encodeURIComponent(query)}`;
          result = await client.withSession(searchUrl, async (ws, session, msgId) => {
            const html = await client.getPageHtml(ws, session, msgId);
            const results = parseDuckDuckGoResults(html, maxResults);
            return {
              verktyg: tool.id,
              query,
              antal: results.length,
              resultat: results,
            };
          });
          break;
        }

        // ── Content ──────────────────────────────────────────────────
        case 'lightpanda_markdown': {
          const url = params.url as string | undefined;
          result = await client.withSession(url || 'about:blank', async (ws, session, msgId) => {
            const html = await client.getPageHtml(ws, session, msgId);
            const title = extractTitle(html);
            const markdown = htmlToMarkdown(html);
            return {
              verktyg: tool.id,
              url: session.currentUrl,
              title: title || '(ingen titel)',
              content: markdown,
              length: markdown.length,
            };
          });
          break;
        }

        case 'lightpanda_links': {
          const url = params.url as string | undefined;
          result = await client.withSession(url || 'about:blank', async (ws, session, msgId) => {
            const linksJson = await client.evaluate(
              ws,
              session,
              `JSON.stringify(Array.from(document.querySelectorAll('a[href]')).map(a => ({text: a.textContent?.trim() || '', href: a.href})).filter(l => l.href && !l.href.startsWith('javascript:')).slice(0, 100))`,
              msgId,
            );
            const links = linksJson ? JSON.parse(linksJson) : [];
            return {
              verktyg: tool.id,
              url: session.currentUrl,
              antal: links.length,
              links,
            };
          });
          break;
        }

        case 'lightpanda_get_text': {
          const selector = params.selector as string;
          if (!selector) return this._missingParamsError('selector');

          result = await client.withSession(undefined, async (ws, session, msgId) => {
            const text = await client.evaluate(
              ws,
              session,
              `(() => { const el = document.querySelector(${JSON.stringify(selector)}); return el ? el.textContent?.trim() || '' : 'Element ej hittat: ${selector}'; })()`,
              msgId,
            );
            return {
              verktyg: tool.id,
              selector,
              text: text.slice(0, MAX_CONTENT_LENGTH),
            };
          });
          break;
        }

        // ── Interaction ──────────────────────────────────────────────
        case 'lightpanda_click': {
          const selector = params.selector as string;
          if (!selector) return this._missingParamsError('selector');

          result = await client.withSession(undefined, async (ws, session, msgId) => {
            const clickResult = await client.evaluate(
              ws,
              session,
              `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return 'Element ej hittat: ${selector}'; el.click(); return 'Klickade på element'; })()`,
              msgId,
            );
            return {
              verktyg: tool.id,
              selector,
              status: clickResult,
            };
          });
          break;
        }

        case 'lightpanda_fill_form': {
          const selector = params.selector as string;
          const value = params.value as string;
          if (!selector || value === undefined) return this._missingParamsError('selector, value');

          result = await client.withSession(undefined, async (ws, session, msgId) => {
            const fillResult = await client.evaluate(
              ws,
              session,
              `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return 'Element ej hittat: ${selector}'; el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); return 'Fyllde i värde'; })()`,
              msgId,
            );
            return {
              verktyg: tool.id,
              selector,
              value,
              status: fillResult,
            };
          });
          break;
        }

        case 'lightpanda_wait_for': {
          const selector = params.selector as string;
          if (!selector) return this._missingParamsError('selector');
          const timeout = Math.min((params.timeout as number) || 5000, 30000);

          result = await client.withSession(undefined, async (ws, session, msgId) => {
            const waitResult = await client.evaluate(
              ws,
              session,
              `new Promise((resolve) => {
                const el = document.querySelector(${JSON.stringify(selector)});
                if (el) { resolve('Element hittat'); return; }
                const observer = new MutationObserver(() => {
                  if (document.querySelector(${JSON.stringify(selector)})) {
                    observer.disconnect();
                    resolve('Element hittat');
                  }
                });
                observer.observe(document.body, { childList: true, subtree: true });
                setTimeout(() => { observer.disconnect(); resolve('Timeout: element ej hittat inom ${timeout}ms'); }, ${timeout});
              })`,
              msgId,
            );
            return {
              verktyg: tool.id,
              selector,
              status: waitResult,
            };
          });
          break;
        }

        // ── Advanced ─────────────────────────────────────────────────
        case 'lightpanda_execute_js': {
          const expression = params.expression as string;
          if (!expression) return this._missingParamsError('expression');

          result = await client.withSession(undefined, async (ws, session, msgId) => {
            const jsResult = await client.evaluate(ws, session, expression, msgId);
            return {
              verktyg: tool.id,
              expression: expression.slice(0, 200),
              result: jsResult.slice(0, MAX_CONTENT_LENGTH),
            };
          });
          break;
        }

        case 'lightpanda_extract_data': {
          const selector = params.selector as string;
          if (!selector) return this._missingParamsError('selector');
          const attributes = (params.attributes as string[]) || [];

          const attrJson = JSON.stringify(attributes);
          result = await client.withSession(undefined, async (ws, session, msgId) => {
            const dataJson = await client.evaluate(
              ws,
              session,
              `JSON.stringify(Array.from(document.querySelectorAll(${JSON.stringify(selector)})).slice(0, 50).map(el => {
                const attrs = ${attrJson};
                if (attrs.length > 0) {
                  const obj = {};
                  attrs.forEach(a => { obj[a] = el.getAttribute(a) || ''; });
                  obj['text'] = el.textContent?.trim() || '';
                  return obj;
                }
                return { text: el.textContent?.trim() || '', tag: el.tagName.toLowerCase() };
              }))`,
              msgId,
            );
            const data = dataJson ? JSON.parse(dataJson) : [];
            return {
              verktyg: tool.id,
              selector,
              antal: data.length,
              data,
            };
          });
          break;
        }

        case 'lightpanda_fetch_api': {
          const url = params.url as string;
          if (!url) return this._missingParamsError('url');
          const method = (params.method as string) || 'GET';
          const headers = (params.headers as Record<string, string>) || {};
          const body = params.body as string | undefined;

          result = await client.withSession('about:blank', async (ws, session, msgId) => {
            const fetchOpts = JSON.stringify({
              method,
              headers,
              body: body || undefined,
            });
            const apiResult = await client.evaluate(
              ws,
              session,
              `fetch(${JSON.stringify(url)}, ${fetchOpts}).then(r => r.text()).catch(e => 'Fetch error: ' + e.message)`,
              msgId,
            );
            return {
              verktyg: tool.id,
              url,
              method,
              response: apiResult.slice(0, MAX_CONTENT_LENGTH),
            };
          });
          break;
        }

        // ── Output ───────────────────────────────────────────────────
        case 'lightpanda_screenshot': {
          const url = params.url as string | undefined;
          result = await client.withSession(url || 'about:blank', async (ws, session, msgId) => {
            try {
              msgId.value++;
              const ws2 = ws;
              const screenshotResp = await new Promise<Record<string, unknown> | null>((resolve) => {
                const payload = JSON.stringify({
                  id: msgId.value,
                  sessionId: session.sessionId,
                  method: 'Page.captureScreenshot',
                  params: { format: 'png' },
                });
                const handler = (data: { toString(): string }) => {
                  try {
                    const parsed = JSON.parse(data.toString());
                    if (parsed.id === msgId.value) {
                      ws2.off('message', handler);
                      resolve(parsed);
                    }
                  } catch { /* skip */ }
                };
                ws2.on('message', handler);
                ws2.send(payload);
                setTimeout(() => { ws2.off('message', handler); resolve(null); }, 10000);
              });

              if (screenshotResp?.result && (screenshotResp.result as Record<string, unknown>).data) {
                return {
                  verktyg: tool.id,
                  url: session.currentUrl,
                  format: 'png',
                  data: (screenshotResp.result as Record<string, unknown>).data,
                };
              }
              return {
                verktyg: tool.id,
                error: 'Screenshot stöds inte av Lightpanda eller misslyckades.',
              };
            } catch {
              return {
                verktyg: tool.id,
                error: 'Screenshot stöds inte av Lightpanda.',
              };
            }
          });
          break;
        }

        default:
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: `Verktyg ej implementerat: ${tool.id}` }),
              },
            ],
            isError: true,
          };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
              action: message.includes('Could not connect')
                ? 'Lightpanda är inte igång. Starta med: docker run -d -p 9222:9222 lightpanda/browser:nightly'
                : 'Verktyget misslyckades. Försök INTE anropa samma verktyg igen.',
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
      name: 'Lightpanda MCP Server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const mcpServer = new LightpandaMCPServer();

  // Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: mcpServer.getTools(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await mcpServer.callTool(name, args as Record<string, unknown>);
  });

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Lightpanda MCP Server running on stdio');
}

// Run if executed directly
main().catch(console.error);
