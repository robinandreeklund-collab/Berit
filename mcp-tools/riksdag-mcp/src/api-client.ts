/**
 * Riksdag & Regering REST API client.
 *
 * Connects to two APIs:
 * - Riksdagen (data.riksdagen.se) — documents, members, speeches, votes
 * - g0v.se — government documents (pressmeddelanden, propositioner, etc.)
 *
 * Features:
 * - In-memory cache with differentiated TTL (30 min documents, 24h members)
 * - Exponential backoff retry on 429 / network errors
 * - No API key required (public APIs)
 */

const DEFAULT_RIKSDAGEN_URL = 'https://data.riksdagen.se';
const DEFAULT_G0V_URL = 'https://g0v.se';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const CACHE_TTL_DOCS_MS = 30 * 60 * 1000; // 30 minutes
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

export interface RiksdagClientOptions {
  riksdagenBaseUrl?: string;
  g0vBaseUrl?: string;
  timeoutMs?: number;
  cacheTtlDocsMs?: number;
  cacheTtlMetaMs?: number;
}

export class RiksdagApiClient {
  private riksdagenBaseUrl: string;
  private g0vBaseUrl: string;
  private timeoutMs: number;
  private cacheTtlDocsMs: number;
  private cacheTtlMetaMs: number;
  private cache = new MemoryCache();

  constructor(opts: RiksdagClientOptions = {}) {
    this.riksdagenBaseUrl = opts.riksdagenBaseUrl || process.env.RIKSDAG_BASE_URL || DEFAULT_RIKSDAGEN_URL;
    this.g0vBaseUrl = opts.g0vBaseUrl || process.env.G0V_BASE_URL || DEFAULT_G0V_URL;
    this.timeoutMs = opts.timeoutMs || Number(process.env.RIKSDAG_TIMEOUT) * 1000 || DEFAULT_TIMEOUT_MS;
    this.cacheTtlDocsMs = opts.cacheTtlDocsMs || Number(process.env.RIKSDAG_CACHE_TTL_DOCS) * 1000 || CACHE_TTL_DOCS_MS;
    this.cacheTtlMetaMs = opts.cacheTtlMetaMs || Number(process.env.RIKSDAG_CACHE_TTL_META) * 1000 || CACHE_TTL_META_MS;
  }

  /** Fetch from Riksdagen API. */
  async riksdagen(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.riksdagenBaseUrl}${path}`;
    return this._fetch(url, cacheTtl ?? this.cacheTtlDocsMs);
  }

  /** Fetch from g0v.se API. */
  async g0v(type: string, options?: { query?: string; limit?: number }): Promise<{ data: unknown; cached: boolean }> {
    let url = `${this.g0vBaseUrl}/${type}.json`;
    const params = new URLSearchParams();
    if (options?.query) params.set('q', options.query);
    if (options?.limit) params.set('limit', String(options.limit));
    const qs = params.toString();
    if (qs) url += `?${qs}`;
    return this._fetch(url, this.cacheTtlDocsMs);
  }

  private async _fetch(url: string, cacheTtl: number): Promise<{ data: unknown; cached: boolean }> {
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

    throw new Error(lastError || 'Riksdag API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton for shared use
let _client: RiksdagApiClient | null = null;

export function getApiClient(): RiksdagApiClient {
  if (!_client) {
    _client = new RiksdagApiClient();
  }
  return _client;
}
