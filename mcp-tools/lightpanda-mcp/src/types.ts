/**
 * Types and constants for the Lightpanda MCP server.
 *
 * CDP (Chrome DevTools Protocol) types for WebSocket communication
 * with the Lightpanda headless browser.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// CDP Protocol Types
// ---------------------------------------------------------------------------

export interface CDPMessage {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  sessionId?: string;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

export interface CDPResponse {
  id: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

export interface CDPEvent {
  method: string;
  params?: Record<string, unknown>;
  sessionId?: string;
}

export interface BrowserSession {
  browserContextId: string;
  targetId: string;
  sessionId: string;
  currentUrl: string;
}

export interface VersionInfo {
  Browser: string;
  'Protocol-Version': string;
  webSocketDebuggerUrl: string;
}

// ---------------------------------------------------------------------------
// Tool Input Schemas (Zod)
// ---------------------------------------------------------------------------

export const NavigateInputSchema = z.object({
  url: z.string().describe('URL att navigera till. Måste inkludera schema (https://).'),
});

export const SearchInputSchema = z.object({
  query: z.string().describe('Sökfråga att söka efter på webben via DuckDuckGo.'),
  max_results: z.number().optional().describe('Max antal resultat (standard: 5, max: 10).'),
});

export const MarkdownInputSchema = z.object({
  url: z.string().optional().describe('URL att hämta som markdown. Om tom används aktuell sida.'),
});

export const LinksInputSchema = z.object({
  url: z.string().optional().describe('URL att hämta länkar från. Om tom används aktuell sida.'),
});

export const ClickInputSchema = z.object({
  selector: z.string().describe('CSS-selektor för elementet att klicka på.'),
});

export const ExecuteJsInputSchema = z.object({
  expression: z.string().describe('JavaScript-uttryck att köra på aktuell sida.'),
});

export const FillFormInputSchema = z.object({
  selector: z.string().describe('CSS-selektor för formulärfältet.'),
  value: z.string().describe('Värde att fylla i.'),
});

export const ExtractDataInputSchema = z.object({
  selector: z.string().describe('CSS-selektor för element att extrahera data från.'),
  attributes: z.array(z.string()).optional().describe('Attribut att extrahera (t.ex. ["href", "src"]). Om tom extraheras textinnehåll.'),
});

export const FetchApiInputSchema = z.object({
  url: z.string().describe('API-URL att hämta.'),
  method: z.string().optional().describe('HTTP-metod (GET, POST, etc.). Standard: GET.'),
  headers: z.record(z.string()).optional().describe('HTTP-headers att skicka.'),
  body: z.string().optional().describe('Request body (för POST/PUT).'),
});

export const WaitForInputSchema = z.object({
  selector: z.string().describe('CSS-selektor att vänta på.'),
  timeout: z.number().optional().describe('Timeout i millisekunder (standard: 5000).'),
});

export const GetTextInputSchema = z.object({
  selector: z.string().describe('CSS-selektor för element att hämta text från.'),
});

export const ScreenshotInputSchema = z.object({
  url: z.string().optional().describe('URL att ta screenshot av. Om tom används aktuell sida.'),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default Lightpanda CDP URL. */
export const DEFAULT_CDP_URL = 'ws://localhost:9222';

/** Default Lightpanda HTTP URL (for /json/version endpoint). */
export const DEFAULT_HTTP_URL = 'http://localhost:9222';

/** Max timeout for page load in seconds. */
export const PAGE_LOAD_TIMEOUT_S = 10;

/** Fallback timeout for Page.loadEventFired. */
export const LOAD_EVENT_FALLBACK_TIMEOUT_S = 5;

/** Max content length for markdown output. */
export const MAX_CONTENT_LENGTH = 8192;

/** Max search results. */
export const MAX_SEARCH_RESULTS = 10;

/** Default search results count. */
export const DEFAULT_SEARCH_RESULTS = 5;

/** DuckDuckGo HTML search URL. */
export const DUCKDUCKGO_URL = 'https://html.duckduckgo.com/html/';
