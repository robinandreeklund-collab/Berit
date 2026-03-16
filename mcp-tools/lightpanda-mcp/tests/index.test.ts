/**
 * Integration tests for LightpandaMCPServer.callTool().
 *
 * Uses vitest module mocking to replace the CDP client with a fake that
 * returns canned responses, so we can verify every tool handler end-to-end
 * without a real Lightpanda browser.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TOOL_DEFINITIONS } from '../src/tools.js';

// ---------------------------------------------------------------------------
// Mock the CDP client module
// ---------------------------------------------------------------------------

const mockEvaluate = vi.fn().mockResolvedValue('mock-value');
const mockGetPageHtml = vi.fn().mockResolvedValue(
  '<html><head><title>Test Page</title></head><body><p>Hello world</p><a href="https://a.com">Link A</a></body></html>',
);
const mockIsAvailable = vi.fn().mockResolvedValue(true);

// withSession: connect → create session → navigate → action → cleanup
const mockWithSession = vi.fn().mockImplementation(
  async (_url: string | undefined, action: Function) => {
    const fakeWs = {};
    const fakeSession = {
      browserContextId: 'ctx-1',
      targetId: 'target-1',
      sessionId: 'session-1',
      currentUrl: _url || 'about:blank',
    };
    const fakeMsgId = { value: 0 };
    return action(fakeWs, fakeSession, fakeMsgId);
  },
);

vi.mock('../src/cdp-client.js', () => ({
  getCDPClient: () => ({
    isAvailable: mockIsAvailable,
    withSession: mockWithSession,
    evaluate: mockEvaluate,
    getPageHtml: mockGetPageHtml,
  }),
  CDPClient: vi.fn(),
}));

// Import AFTER mocking
const { LightpandaMCPServer } = await import('../src/index.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseResult(res: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  return JSON.parse(res.content[0].text);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LightpandaMCPServer.callTool', () => {
  let server: InstanceType<typeof LightpandaMCPServer>;

  beforeEach(() => {
    server = new LightpandaMCPServer();
    vi.clearAllMocks();
    mockIsAvailable.mockResolvedValue(true);
    mockEvaluate.mockResolvedValue('mock-value');
    mockGetPageHtml.mockResolvedValue(
      '<html><head><title>Test Page</title></head><body><p>Hello world</p><a href="https://a.com">Link A</a></body></html>',
    );
  });

  // ── Tool definition validation ──────────────────────────────────────────

  describe('tool definitions: url parameter requirements', () => {
    const toolsRequiringUrl = [
      'lightpanda_goto',
      'lightpanda_get_text',
      'lightpanda_click',
      'lightpanda_fill_form',
      'lightpanda_wait_for',
      'lightpanda_execute_js',
      'lightpanda_extract_data',
      'lightpanda_fetch_api',
    ];

    for (const toolId of toolsRequiringUrl) {
      it(`${toolId} should require url parameter`, () => {
        const tool = TOOL_DEFINITIONS.find((t) => t.id === toolId);
        expect(tool).toBeDefined();
        const schema = tool!.inputSchema as { required?: string[]; properties?: Record<string, unknown> };
        expect(schema.properties).toHaveProperty('url');
        expect(schema.required).toContain('url');
      });
    }

    const toolsWithOptionalUrl = ['lightpanda_markdown', 'lightpanda_links', 'lightpanda_screenshot'];

    for (const toolId of toolsWithOptionalUrl) {
      it(`${toolId} should have optional url parameter`, () => {
        const tool = TOOL_DEFINITIONS.find((t) => t.id === toolId);
        expect(tool).toBeDefined();
        const schema = tool!.inputSchema as { required?: string[]; properties?: Record<string, unknown> };
        expect(schema.properties).toHaveProperty('url');
        // url should NOT be in required
        expect(schema.required || []).not.toContain('url');
      });
    }

    it('lightpanda_search should require query (not url)', () => {
      const tool = TOOL_DEFINITIONS.find((t) => t.id === 'lightpanda_search');
      expect(tool).toBeDefined();
      const schema = tool!.inputSchema as { required?: string[] };
      expect(schema.required).toContain('query');
    });
  });

  // ── Unknown tool ────────────────────────────────────────────────────────

  it('should return error for unknown tool', async () => {
    const res = await server.callTool('nonexistent', {});
    expect(res.isError).toBe(true);
    const data = parseResult(res);
    expect(data.error).toContain('Okänt verktyg');
  });

  // ── Lightpanda unavailable ─────────────────────────────────────────────

  it('should return error when Lightpanda is unavailable', async () => {
    mockIsAvailable.mockResolvedValue(false);
    const res = await server.callTool('lightpanda_goto', { url: 'https://example.com' });
    expect(res.isError).toBe(true);
    const data = parseResult(res);
    expect(data.error).toContain('inte tillgänglig');
  });

  // ── Navigation tools ───────────────────────────────────────────────────

  describe('lightpanda_goto', () => {
    it('should navigate and return title', async () => {
      mockEvaluate.mockResolvedValue('My Page');
      const res = await server.callTool('lightpanda_goto', { url: 'https://example.com' });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.verktyg).toBe('lightpanda_goto');
      expect(data.url).toBe('https://example.com');
      expect(data.title).toBe('My Page');
      expect(mockWithSession).toHaveBeenCalledWith('https://example.com', expect.any(Function));
    });

    it('should require url parameter', async () => {
      const res = await server.callTool('lightpanda_goto', {});
      expect(res.isError).toBe(true);
      const data = parseResult(res);
      expect(data.error).toContain('Saknade parametrar');
    });
  });

  describe('lightpanda_search', () => {
    it('should search and return results', async () => {
      mockGetPageHtml.mockResolvedValue(
        '<a class="result__a" href="https://r.com">Result</a><a class="result__snippet">A snippet</a>',
      );
      const res = await server.callTool('lightpanda_search', { query: 'test query' });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.verktyg).toBe('lightpanda_search');
      expect(data.query).toBe('test query');
      expect(data.resultat).toBeInstanceOf(Array);
    });

    it('should require query parameter', async () => {
      const res = await server.callTool('lightpanda_search', {});
      expect(res.isError).toBe(true);
    });
  });

  // ── Content tools ──────────────────────────────────────────────────────

  describe('lightpanda_markdown', () => {
    it('should return markdown content', async () => {
      const res = await server.callTool('lightpanda_markdown', { url: 'https://example.com' });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.verktyg).toBe('lightpanda_markdown');
      expect(data.title).toBe('Test Page');
      expect(data.content).toBeTruthy();
      expect(mockWithSession).toHaveBeenCalledWith('https://example.com', expect.any(Function));
    });

    it('should work without url (uses about:blank)', async () => {
      const res = await server.callTool('lightpanda_markdown', {});
      expect(res.isError).toBeUndefined();
      expect(mockWithSession).toHaveBeenCalledWith('about:blank', expect.any(Function));
    });
  });

  describe('lightpanda_links', () => {
    it('should return links from page', async () => {
      mockEvaluate.mockResolvedValue(JSON.stringify([{ text: 'Link A', href: 'https://a.com' }]));
      const res = await server.callTool('lightpanda_links', { url: 'https://example.com' });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.verktyg).toBe('lightpanda_links');
      expect(data.links).toHaveLength(1);
      expect(data.links[0].href).toBe('https://a.com');
    });
  });

  describe('lightpanda_get_text', () => {
    it('should extract text from selector', async () => {
      mockEvaluate.mockResolvedValue('Extracted text');
      const res = await server.callTool('lightpanda_get_text', {
        url: 'https://example.com',
        selector: '.article',
      });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.verktyg).toBe('lightpanda_get_text');
      expect(data.selector).toBe('.article');
      expect(data.text).toBe('Extracted text');
      expect(mockWithSession).toHaveBeenCalledWith('https://example.com', expect.any(Function));
    });

    it('should require url and selector', async () => {
      const res1 = await server.callTool('lightpanda_get_text', { selector: '.x' });
      expect(res1.isError).toBe(true);

      const res2 = await server.callTool('lightpanda_get_text', { url: 'https://example.com' });
      expect(res2.isError).toBe(true);
    });
  });

  // ── Interaction tools ──────────────────────────────────────────────────

  describe('lightpanda_click', () => {
    it('should click element on specified url', async () => {
      mockEvaluate.mockResolvedValue('Klickade på element');
      const res = await server.callTool('lightpanda_click', {
        url: 'https://example.com',
        selector: '.btn',
      });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.verktyg).toBe('lightpanda_click');
      expect(data.selector).toBe('.btn');
      expect(data.status).toBe('Klickade på element');
      expect(mockWithSession).toHaveBeenCalledWith('https://example.com', expect.any(Function));
    });

    it('should require url and selector', async () => {
      const res = await server.callTool('lightpanda_click', { selector: '.btn' });
      expect(res.isError).toBe(true);
    });
  });

  describe('lightpanda_fill_form', () => {
    it('should fill form field', async () => {
      mockEvaluate.mockResolvedValue('Fyllde i värde');
      const res = await server.callTool('lightpanda_fill_form', {
        url: 'https://example.com',
        selector: '#search',
        value: 'test',
      });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.verktyg).toBe('lightpanda_fill_form');
      expect(data.value).toBe('test');
      expect(mockWithSession).toHaveBeenCalledWith('https://example.com', expect.any(Function));
    });

    it('should require url, selector and value', async () => {
      const res = await server.callTool('lightpanda_fill_form', { selector: '#s', value: 'v' });
      expect(res.isError).toBe(true);
    });
  });

  describe('lightpanda_wait_for', () => {
    it('should wait for element', async () => {
      mockEvaluate.mockResolvedValue('Element hittat');
      const res = await server.callTool('lightpanda_wait_for', {
        url: 'https://example.com',
        selector: '.loaded',
      });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.verktyg).toBe('lightpanda_wait_for');
      expect(data.status).toBe('Element hittat');
      expect(mockWithSession).toHaveBeenCalledWith('https://example.com', expect.any(Function));
    });

    it('should require url and selector', async () => {
      const res = await server.callTool('lightpanda_wait_for', { selector: '.x' });
      expect(res.isError).toBe(true);
    });
  });

  // ── Advanced tools ─────────────────────────────────────────────────────

  describe('lightpanda_execute_js', () => {
    it('should execute JavaScript on specified url', async () => {
      mockEvaluate.mockResolvedValue('42');
      const res = await server.callTool('lightpanda_execute_js', {
        url: 'https://example.com',
        expression: '21 + 21',
      });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.verktyg).toBe('lightpanda_execute_js');
      expect(data.result).toBe('42');
      expect(mockWithSession).toHaveBeenCalledWith('https://example.com', expect.any(Function));
    });

    it('should require url and expression', async () => {
      const res = await server.callTool('lightpanda_execute_js', { expression: '1+1' });
      expect(res.isError).toBe(true);
    });
  });

  describe('lightpanda_extract_data', () => {
    it('should extract data from elements', async () => {
      mockEvaluate.mockResolvedValue(
        JSON.stringify([
          { text: 'Item 1', tag: 'div' },
          { text: 'Item 2', tag: 'div' },
        ]),
      );
      const res = await server.callTool('lightpanda_extract_data', {
        url: 'https://example.com',
        selector: '.item',
      });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.verktyg).toBe('lightpanda_extract_data');
      expect(data.antal).toBe(2);
      expect(data.data).toHaveLength(2);
      expect(mockWithSession).toHaveBeenCalledWith('https://example.com', expect.any(Function));
    });

    it('should support attributes parameter', async () => {
      mockEvaluate.mockResolvedValue(
        JSON.stringify([{ href: '/page', text: 'Link' }]),
      );
      const res = await server.callTool('lightpanda_extract_data', {
        url: 'https://example.com',
        selector: 'a',
        attributes: ['href'],
      });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.data[0].href).toBe('/page');
    });

    it('should require url and selector', async () => {
      const res = await server.callTool('lightpanda_extract_data', { selector: '.x' });
      expect(res.isError).toBe(true);
    });
  });

  describe('lightpanda_fetch_api', () => {
    it('should fetch API data', async () => {
      mockEvaluate.mockResolvedValue('{"key": "value"}');
      const res = await server.callTool('lightpanda_fetch_api', {
        url: 'https://api.example.com/data',
        method: 'GET',
      });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.verktyg).toBe('lightpanda_fetch_api');
      expect(data.method).toBe('GET');
      expect(data.response).toBe('{"key": "value"}');
      // fetch_api navigates to about:blank, then uses fetch()
      expect(mockWithSession).toHaveBeenCalledWith('about:blank', expect.any(Function));
    });

    it('should require url parameter', async () => {
      const res = await server.callTool('lightpanda_fetch_api', {});
      expect(res.isError).toBe(true);
    });
  });

  // ── Output tools ───────────────────────────────────────────────────────

  describe('lightpanda_screenshot', () => {
    it('should attempt screenshot', async () => {
      // screenshot uses raw CDP, the mock won't produce real data
      const res = await server.callTool('lightpanda_screenshot', { url: 'https://example.com' });
      expect(res.isError).toBeUndefined();
      const data = parseResult(res);
      expect(data.verktyg).toBe('lightpanda_screenshot');
    });
  });

  // ── Rate limiting ──────────────────────────────────────────────────────

  describe('rate limiting', () => {
    it('should allow 30 calls within the window', async () => {
      mockEvaluate.mockResolvedValue('My Page');
      for (let i = 0; i < 30; i++) {
        const res = await server.callTool('lightpanda_goto', { url: 'https://example.com' });
        expect(res.isError).toBeUndefined();
      }
    });

    it('should block after 30 calls to the same tool', async () => {
      mockEvaluate.mockResolvedValue('My Page');
      for (let i = 0; i < 30; i++) {
        await server.callTool('lightpanda_goto', { url: 'https://example.com' });
      }
      const res = await server.callTool('lightpanda_goto', { url: 'https://example.com' });
      expect(res.isError).toBe(true);
      const data = parseResult(res);
      expect(data.error).toContain('anropats');
    });

    it('should track limits per tool independently', async () => {
      mockEvaluate.mockResolvedValue('value');
      // Use up goto limit
      for (let i = 0; i < 30; i++) {
        await server.callTool('lightpanda_goto', { url: 'https://example.com' });
      }
      // markdown should still work
      const res = await server.callTool('lightpanda_markdown', { url: 'https://example.com' });
      expect(res.isError).toBeUndefined();
    });
  });

  // ── withSession receives correct url ───────────────────────────────────

  describe('all tools pass url to withSession', () => {
    const toolCalls: Array<{ tool: string; args: Record<string, unknown>; expectedUrl: string }> = [
      { tool: 'lightpanda_goto', args: { url: 'https://a.com' }, expectedUrl: 'https://a.com' },
      { tool: 'lightpanda_search', args: { query: 'test' }, expectedUrl: 'https://html.duckduckgo.com/html/?q=test' },
      { tool: 'lightpanda_markdown', args: { url: 'https://b.com' }, expectedUrl: 'https://b.com' },
      { tool: 'lightpanda_markdown', args: {}, expectedUrl: 'about:blank' },
      { tool: 'lightpanda_links', args: { url: 'https://c.com' }, expectedUrl: 'https://c.com' },
      { tool: 'lightpanda_get_text', args: { url: 'https://d.com', selector: '.x' }, expectedUrl: 'https://d.com' },
      { tool: 'lightpanda_click', args: { url: 'https://e.com', selector: '.x' }, expectedUrl: 'https://e.com' },
      { tool: 'lightpanda_fill_form', args: { url: 'https://f.com', selector: '.x', value: 'v' }, expectedUrl: 'https://f.com' },
      { tool: 'lightpanda_wait_for', args: { url: 'https://g.com', selector: '.x' }, expectedUrl: 'https://g.com' },
      { tool: 'lightpanda_execute_js', args: { url: 'https://h.com', expression: '1' }, expectedUrl: 'https://h.com' },
      { tool: 'lightpanda_extract_data', args: { url: 'https://i.com', selector: '.x' }, expectedUrl: 'https://i.com' },
      { tool: 'lightpanda_fetch_api', args: { url: 'https://api.com/data' }, expectedUrl: 'about:blank' },
    ];

    for (const { tool, args, expectedUrl } of toolCalls) {
      it(`${tool} should pass "${expectedUrl}" to withSession`, async () => {
        mockEvaluate.mockResolvedValue('mock');
        mockGetPageHtml.mockResolvedValue('<html><head><title>T</title></head><body></body></html>');
        await server.callTool(tool, args);
        expect(mockWithSession).toHaveBeenCalledWith(expectedUrl, expect.any(Function));
      });
    }
  });
});
