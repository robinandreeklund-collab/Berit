/**
 * Krisinformation API client.
 *
 * Connects to api.krisinformation.se/v3 — open API, no authentication.
 *
 * Features:
 * - In-memory cache with 5 min TTL (crisis data updates frequently)
 * - Exponential backoff retry on network errors
 */

const DEFAULT_BASE_URL = 'https://api.krisinformation.se';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const CACHE_TTL_NEWS_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_VMA_MS = 2 * 60 * 1000; // 2 minutes (VMA is critical)

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

export interface KrisinformationClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

export class KrisinformationApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private cache = new MemoryCache();

  constructor(opts: KrisinformationClientOptions = {}) {
    this.baseUrl = opts.baseUrl || process.env.KRISINFORMATION_BASE_URL || DEFAULT_BASE_URL;
    this.timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
  }

  /** Fetch crisis news articles. */
  async getNews(params: { county?: string; days?: number }): Promise<{ data: unknown; cached: boolean }> {
    const searchParams = new URLSearchParams();
    if (params.county) searchParams.set('counties', params.county);
    if (params.days) searchParams.set('days', String(params.days));
    const qs = searchParams.toString();
    const url = `${this.baseUrl}/v3/news${qs ? '?' + qs : ''}`;
    return this._fetch(url, CACHE_TTL_NEWS_MS);
  }

  /** Fetch active VMA alerts. */
  async getVmas(params: { county?: string }): Promise<{ data: unknown; cached: boolean }> {
    const searchParams = new URLSearchParams();
    if (params.county) searchParams.set('counties', params.county);
    const qs = searchParams.toString();
    const url = `${this.baseUrl}/v3/vmas${qs ? '?' + qs : ''}`;
    return this._fetch(url, CACHE_TTL_VMA_MS);
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

    throw new Error(lastError || 'Krisinformation API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let _client: KrisinformationApiClient | null = null;

export function getApiClient(): KrisinformationApiClient {
  if (!_client) {
    _client = new KrisinformationApiClient();
  }
  return _client;
}
