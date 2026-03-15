/**
 * Upphandlingsdata REST API client.
 *
 * Connects to two APIs:
 * - UHM (upphandlingsmyndigheten.se/api/sv/) — Swedish procurement authority
 * - TED (api.ted.europa.eu/v3/) — EU procurement notices
 *
 * Features:
 * - In-memory cache with differentiated TTL (1h search, 24h metadata)
 * - Exponential backoff retry on 429 / network errors
 * - No authentication required (public APIs)
 */

const DEFAULT_UHM_URL = 'https://www.upphandlingsmyndigheten.se/api/sv';
const DEFAULT_TED_URL = 'https://api.ted.europa.eu/v3';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const CACHE_TTL_SEARCH_MS = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_META_MS = 24 * 60 * 60 * 1000; // 24 hours

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

export interface UpphandlingsdataClientOptions {
  uhmBaseUrl?: string;
  tedBaseUrl?: string;
  timeoutMs?: number;
  cacheTtlSearchMs?: number;
  cacheTtlMetaMs?: number;
}

export class UpphandlingsdataApiClient {
  private uhmBaseUrl: string;
  private tedBaseUrl: string;
  private timeoutMs: number;
  private cacheTtlSearchMs: number;
  private cacheTtlMetaMs: number;
  private cache = new MemoryCache();

  constructor(opts: UpphandlingsdataClientOptions = {}) {
    this.uhmBaseUrl = opts.uhmBaseUrl || process.env.UHM_BASE_URL || DEFAULT_UHM_URL;
    this.tedBaseUrl = opts.tedBaseUrl || process.env.TED_BASE_URL || DEFAULT_TED_URL;
    this.timeoutMs = opts.timeoutMs || Number(process.env.UHM_TIMEOUT) * 1000 || DEFAULT_TIMEOUT_MS;
    this.cacheTtlSearchMs = opts.cacheTtlSearchMs || Number(process.env.UHM_CACHE_TTL_SEARCH) * 1000 || CACHE_TTL_SEARCH_MS;
    this.cacheTtlMetaMs = opts.cacheTtlMetaMs || Number(process.env.UHM_CACHE_TTL_META) * 1000 || CACHE_TTL_META_MS;
  }

  /** Fetch from UHM API (GET). */
  async uhm(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.uhmBaseUrl}${path}`;
    return this._fetchGet(url, cacheTtl ?? this.cacheTtlSearchMs);
  }

  /** Fetch from TED API (POST). */
  async ted(body: Record<string, unknown>, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.tedBaseUrl}/notices/search`;
    const cacheKey = `${url}:${JSON.stringify(body)}`;
    return this._fetchPost(url, cacheKey, body, cacheTtl ?? this.cacheTtlSearchMs);
  }

  /** Fetch metadata (longer cache). */
  async uhmMeta(path: string): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.uhmBaseUrl}${path}`;
    return this._fetchGet(url, this.cacheTtlMetaMs);
  }

  private async _fetchGet(url: string, cacheTtl: number): Promise<{ data: unknown; cached: boolean }> {
    // Check cache
    const cached = this.cache.get(url);
    if (cached) {
      return { data: cached, cached: true };
    }

    let lastError: string | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const headers: Record<string, string> = {
          Accept: 'application/json',
        };

        const response = await fetch(url, {
          method: 'GET',
          headers,
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

          // Don't retry client errors (except 429)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(lastError);
          }

          await sleep(500 * 2 ** attempt);
          continue;
        }

        const data = await response.json();

        // Cache successful response
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

    throw new Error(lastError || 'Upphandlingsdata API-anrop misslyckades.');
  }

  private async _fetchPost(url: string, cacheKey: string, body: Record<string, unknown>, cacheTtl: number): Promise<{ data: unknown; cached: boolean }> {
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { data: cached, cached: true };
    }

    let lastError: string | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const headers: Record<string, string> = {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        };

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
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
          const respBody = await response.text();
          lastError = `HTTP ${response.status}: ${respBody}`;

          // Don't retry client errors (except 429)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(lastError);
          }

          await sleep(500 * 2 ** attempt);
          continue;
        }

        const data = await response.json();

        // Cache successful response
        this.cache.set(cacheKey, data, cacheTtl);

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

    throw new Error(lastError || 'TED API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton for shared use
let _client: UpphandlingsdataApiClient | null = null;

export function getApiClient(): UpphandlingsdataApiClient {
  if (!_client) {
    _client = new UpphandlingsdataApiClient();
  }
  return _client;
}
