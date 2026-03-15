/**
 * Polisen API client.
 *
 * Connects to polisen.se/api/events — open JSON API, updated every 5-10 min.
 * No authentication required.
 *
 * Features:
 * - In-memory cache with 3 min TTL (police data updates frequently)
 * - Exponential backoff retry on network errors
 */

const DEFAULT_BASE_URL = 'https://polisen.se';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const CACHE_TTL_EVENTS_MS = 3 * 60 * 1000; // 3 minutes

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: unknown;
  expires: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry>();

  get(key: string): unknown | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: unknown, ttl: number): void {
    this.store.set(key, { data, expires: Date.now() + ttl });
  }

  clear(): void {
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

export interface PolisenClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

export class PolisenApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private cache = new MemoryCache();

  constructor(opts: PolisenClientOptions = {}) {
    this.baseUrl = opts.baseUrl || process.env.POLISEN_BASE_URL || DEFAULT_BASE_URL;
    this.timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
  }

  /** Fetch police events, optionally filtered by location and type. */
  async getEvents(params: {
    location?: string;
    type?: string;
    limit?: number;
  }): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.baseUrl}/api/events`;
    const result = await this._fetch(url, CACHE_TTL_EVENTS_MS);

    // Filter client-side since the API doesn't support query params
    let events = Array.isArray(result.data) ? result.data : [];

    if (params.location) {
      const loc = params.location.toLowerCase();
      events = events.filter((e: Record<string, unknown>) => {
        const eventLoc = e.location as Record<string, unknown> | undefined;
        if (!eventLoc) return false;
        const locName = (eventLoc.name as string || '').toLowerCase();
        const eventName = (e.name as string || '').toLowerCase();
        return locName.includes(loc) || eventName.includes(loc);
      });
    }

    if (params.type) {
      const type = params.type.toLowerCase();
      events = events.filter((e: Record<string, unknown>) => {
        const eventType = (e.type as string || '').toLowerCase();
        return eventType.includes(type);
      });
    }

    const limit = params.limit || 20;
    events = events.slice(0, limit);

    return { data: events, cached: result.cached };
  }

  private async _fetch(url: string, cacheTtl: number): Promise<{ data: unknown; cached: boolean }> {
    const cached = this.cache.get(url);
    if (cached) {
      return { data: cached, cached: true };
    }

    let lastError: string | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseFloat(retryAfter) * 1000 : 500 * 2 ** attempt;
          await sleep(delay);
          continue;
        }

        if (!response.ok) {
          const body = await response.text();
          lastError = `HTTP ${response.status}: ${body}`;

          if (response.status >= 400 && response.status < 500) {
            throw new Error(lastError);
          }

          await sleep(500 * 2 ** attempt);
          continue;
        }

        const data = await response.json();
        this.cache.set(url, data, cacheTtl);
        return { data, cached: false };
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('HTTP 4')) {
          throw err;
        }
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < MAX_RETRIES - 1) {
          await sleep(500 * 2 ** attempt);
        }
      }
    }

    throw new Error(lastError || 'Polisen API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let _client: PolisenApiClient | null = null;

export function getApiClient(): PolisenApiClient {
  if (!_client) {
    _client = new PolisenApiClient();
  }
  return _client;
}
