/**
 * Lightpanda CDP (Chrome DevTools Protocol) client.
 *
 * Connects to the Lightpanda headless browser via WebSocket and provides
 * high-level methods for browser automation.
 *
 * CDP flow: connect → Target.createBrowserContext → Target.createTarget
 *           → Target.attachToTarget → Page.navigate → waitForLoad
 *           → Runtime.evaluate → cleanup
 */

import WebSocket from 'ws';
import {
  DEFAULT_CDP_URL,
  DEFAULT_HTTP_URL,
  LOAD_EVENT_FALLBACK_TIMEOUT_S,
  PAGE_LOAD_TIMEOUT_S,
} from './types.js';
import type { BrowserSession, CDPResponse, VersionInfo } from './types.js';

// ---------------------------------------------------------------------------
// CDP Client
// ---------------------------------------------------------------------------

export interface CDPClientOptions {
  httpUrl?: string;
  cdpUrl?: string;
  timeoutMs?: number;
}

export class CDPClient {
  private httpUrl: string;
  private cdpUrl: string;
  private timeoutMs: number;

  constructor(opts: CDPClientOptions = {}) {
    this.httpUrl = opts.httpUrl || process.env.LIGHTPANDA_URL || DEFAULT_HTTP_URL;
    this.cdpUrl = opts.cdpUrl || process.env.LIGHTPANDA_CDP_URL || DEFAULT_CDP_URL;
    this.timeoutMs = opts.timeoutMs || PAGE_LOAD_TIMEOUT_S * 1000;
  }

  /**
   * Get the WebSocket URL from Lightpanda's /json/version endpoint.
   * Falls back to constructing a URL from the configured CDP URL.
   */
  async getWsUrl(): Promise<string> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${this.httpUrl}/json/version`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = (await response.json()) as VersionInfo;
        if (data.webSocketDebuggerUrl) {
          // Lightpanda returns ws://0.0.0.0:9222/ which is unreachable from
          // Docker containers.  Rewrite the host/port to match the configured
          // cdpUrl so that host.docker.internal (or any override) is honoured.
          try {
            const returned = new URL(data.webSocketDebuggerUrl);
            const configured = new URL(this.cdpUrl);
            returned.hostname = configured.hostname;
            returned.port = configured.port;
            return returned.toString();
          } catch {
            return data.webSocketDebuggerUrl;
          }
        }
      }
    } catch {
      // Fall through to fallback
    }

    return this.cdpUrl;
  }

  /**
   * Check if the Lightpanda browser is reachable.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${this.httpUrl}/json/version`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Create a new browser session (context + target + attached session).
   */
  async createSession(ws: WebSocket, msgId: { value: number }): Promise<BrowserSession> {
    // Step 1: Create browser context
    msgId.value++;
    const contextResp = await this._sendAndWait(ws, msgId.value, {
      method: 'Target.createBrowserContext',
    });
    const browserContextId = contextResp?.result?.browserContextId as string;
    if (!browserContextId) {
      throw new Error('Failed to create browser context');
    }

    // Step 2: Create target (page)
    msgId.value++;
    const targetResp = await this._sendAndWait(ws, msgId.value, {
      method: 'Target.createTarget',
      params: { url: 'about:blank', browserContextId },
    });
    const targetId = targetResp?.result?.targetId as string;
    if (!targetId) {
      throw new Error('Failed to create page target');
    }

    // Step 3: Attach to target
    msgId.value++;
    const attachResp = await this._sendAndWait(ws, msgId.value, {
      method: 'Target.attachToTarget',
      params: { targetId, flatten: true },
    });
    const sessionId = attachResp?.result?.sessionId as string;
    if (!sessionId) {
      throw new Error('Failed to attach to target');
    }

    return { browserContextId, targetId, sessionId, currentUrl: 'about:blank' };
  }

  /**
   * Navigate to a URL within a session.
   */
  async navigate(
    ws: WebSocket,
    session: BrowserSession,
    url: string,
    msgId: { value: number },
  ): Promise<void> {
    msgId.value++;
    await this._sendAndWait(
      ws,
      msgId.value,
      {
        method: 'Page.navigate',
        params: { url },
      },
      session.sessionId,
    );

    // Wait for page load event
    await this._waitForEvent(ws, 'Page.loadEventFired', LOAD_EVENT_FALLBACK_TIMEOUT_S * 1000);

    session.currentUrl = url;
  }

  /**
   * Execute JavaScript in the page context.
   */
  async evaluate(
    ws: WebSocket,
    session: BrowserSession,
    expression: string,
    msgId: { value: number },
  ): Promise<string> {
    msgId.value++;
    const result = await this._sendAndWait(
      ws,
      msgId.value,
      {
        method: 'Runtime.evaluate',
        params: { expression, returnByValue: true },
      },
      session.sessionId,
    );

    if (result?.result) {
      const inner = result.result as Record<string, unknown>;
      if (inner.result && typeof inner.result === 'object') {
        const evalResult = inner.result as Record<string, unknown>;
        if ('value' in evalResult) {
          return String(evalResult.value ?? '');
        }
      }
    }

    return '';
  }

  /**
   * Get the full page HTML.
   */
  async getPageHtml(
    ws: WebSocket,
    session: BrowserSession,
    msgId: { value: number },
  ): Promise<string> {
    return this.evaluate(ws, session, 'document.documentElement.outerHTML', msgId);
  }

  /**
   * Clean up a browser session (close target, dispose context).
   */
  async cleanupSession(
    ws: WebSocket,
    session: BrowserSession,
    msgId: { value: number },
  ): Promise<void> {
    try {
      if (session.targetId) {
        msgId.value++;
        ws.send(
          JSON.stringify({
            id: msgId.value,
            method: 'Target.closeTarget',
            params: { targetId: session.targetId },
          }),
        );
      }
      if (session.browserContextId) {
        msgId.value++;
        ws.send(
          JSON.stringify({
            id: msgId.value,
            method: 'Target.disposeBrowserContext',
            params: { browserContextId: session.browserContextId },
          }),
        );
      }
    } catch {
      // Best effort cleanup
    }
  }

  /**
   * Connect to the Lightpanda browser via WebSocket.
   */
  async connect(): Promise<WebSocket> {
    const wsUrl = await this.getWsUrl();
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error(`WebSocket connection to ${wsUrl} timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      ws.on('open', () => {
        clearTimeout(timeout);
        resolve(ws);
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(
          new Error(
            `Could not connect to Lightpanda at ${wsUrl}. ` +
              `Ensure Lightpanda is running (docker run -d -p 9222:9222 lightpanda/browser:nightly). ` +
              `Error: ${err.message}`,
          ),
        );
      });
    });
  }

  /**
   * Execute a full operation: connect → create session → navigate → action → cleanup → close.
   */
  async withSession<T>(
    url: string | undefined,
    action: (ws: WebSocket, session: BrowserSession, msgId: { value: number }) => Promise<T>,
  ): Promise<T> {
    const ws = await this.connect();
    const msgId = { value: 0 };

    try {
      const session = await this.createSession(ws, msgId);

      try {
        if (url) {
          await this.navigate(ws, session, url, msgId);
        }
        return await action(ws, session, msgId);
      } finally {
        await this.cleanupSession(ws, session, msgId);
      }
    } finally {
      ws.close();
    }
  }

  // ── Internal helpers ────────────────────────────────────────────────────

  private _sendAndWait(
    ws: WebSocket,
    id: number,
    msg: { method: string; params?: Record<string, unknown> },
    sessionId?: string,
  ): Promise<CDPResponse | null> {
    return new Promise((resolve) => {
      const payload: Record<string, unknown> = { id, ...msg };
      if (sessionId) payload.sessionId = sessionId;

      const deadline = Date.now() + this.timeoutMs;
      const handler = (data: WebSocket.Data) => {
        try {
          const parsed = JSON.parse(data.toString()) as Record<string, unknown>;
          if (parsed.id === id) {
            ws.off('message', handler);
            resolve(parsed as unknown as CDPResponse);
          }
        } catch {
          // Skip malformed messages
        }

        if (Date.now() > deadline) {
          ws.off('message', handler);
          resolve(null);
        }
      };

      ws.on('message', handler);
      ws.send(JSON.stringify(payload));

      // Safety timeout
      setTimeout(() => {
        ws.off('message', handler);
        resolve(null);
      }, this.timeoutMs);
    });
  }

  private _waitForEvent(ws: WebSocket, eventName: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      const handler = (data: WebSocket.Data) => {
        try {
          const parsed = JSON.parse(data.toString()) as Record<string, unknown>;
          if (parsed.method === eventName) {
            ws.off('message', handler);
            resolve();
          }
        } catch {
          // Skip
        }
      };

      ws.on('message', handler);

      // Fallback timeout — proceed even if event never fires
      setTimeout(() => {
        ws.off('message', handler);
        resolve();
      }, timeoutMs);
    });
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _client: CDPClient | null = null;

export function getCDPClient(): CDPClient {
  if (!_client) {
    _client = new CDPClient();
  }
  return _client;
}
