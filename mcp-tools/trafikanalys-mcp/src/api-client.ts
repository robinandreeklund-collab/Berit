/**
 * Trafikanalys REST API client.
 *
 * Connects to the Trafikanalys API (api.trafa.se/api/):
 * - Structure endpoint — list products and get dimensions/measures
 * - Data endpoint — query statistical data
 *
 * Features:
 * - In-memory cache with differentiated TTL (1h data, 24h metadata)
 * - Exponential backoff retry on 429 / network errors
 * - No authentication required
 */

const DEFAULT_BASE_URL = 'https://api.trafa.se/api';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const CACHE_TTL_DATA_MS = 60 * 60 * 1000; // 1 hour
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

export interface TrafikanalysClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  cacheTtlDataMs?: number;
  cacheTtlMetaMs?: number;
}

export class TrafikanalysApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private cacheTtlDataMs: number;
  private cacheTtlMetaMs: number;
  private cache = new MemoryCache();

  constructor(opts: TrafikanalysClientOptions = {}) {
    this.baseUrl = opts.baseUrl || process.env.TRAFA_BASE_URL || DEFAULT_BASE_URL;
    this.timeoutMs = opts.timeoutMs || Number(process.env.TRAFA_TIMEOUT) * 1000 || DEFAULT_TIMEOUT_MS;
    this.cacheTtlDataMs = opts.cacheTtlDataMs || Number(process.env.TRAFA_CACHE_TTL_DATA) * 1000 || CACHE_TTL_DATA_MS;
    this.cacheTtlMetaMs = opts.cacheTtlMetaMs || Number(process.env.TRAFA_CACHE_TTL_META) * 1000 || CACHE_TTL_META_MS;
  }

  /** Fetch product list or product structure. */
  async structure(query?: string, lang?: string): Promise<{ data: unknown; cached: boolean }> {
    let url = `${this.baseUrl}/structure`;
    const params: string[] = [];
    if (query) params.push(`query=${encodeURIComponent(query)}`);
    if (lang) params.push(`lang=${encodeURIComponent(lang)}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return this._fetch(url, this.cacheTtlMetaMs);
  }

  /** Fetch statistical data. */
  async data(query: string, lang?: string): Promise<{ data: unknown; cached: boolean }> {
    let url = `${this.baseUrl}/data?query=${encodeURIComponent(query)}`;
    if (lang) url += `&lang=${encodeURIComponent(lang)}`;
    return this._fetch(url, this.cacheTtlDataMs);
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

    throw new Error(lastError || 'Trafikanalys API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton for shared use
let _client: TrafikanalysApiClient | null = null;

export function getApiClient(): TrafikanalysApiClient {
  if (!_client) {
    _client = new TrafikanalysApiClient();
  }
  return _client;
}
