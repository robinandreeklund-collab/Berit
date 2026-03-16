/**
 * Kolada REST API client.
 *
 * Connects to the Kolada API v3 (api.kolada.se/v3/)
 * — Swedish municipality and county council statistics from RKA.
 *
 * Features:
 * - In-memory cache with differentiated TTL (30min data, 24h metadata)
 * - Exponential backoff retry on 429 / network errors
 * - No API key required (open API)
 */

const DEFAULT_BASE_URL = 'https://api.kolada.se/v3';
const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_RETRIES = 4;
const CACHE_TTL_DATA_MS = 30 * 60 * 1000; // 30 minutes
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

export interface KoladaClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  cacheTtlDataMs?: number;
  cacheTtlMetaMs?: number;
}

export class KoladaApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private cacheTtlDataMs: number;
  private cacheTtlMetaMs: number;
  private cache = new MemoryCache();

  constructor(opts: KoladaClientOptions = {}) {
    this.baseUrl = opts.baseUrl || process.env.KOLADA_BASE_URL || DEFAULT_BASE_URL;
    this.timeoutMs = opts.timeoutMs || Number(process.env.KOLADA_TIMEOUT) * 1000 || DEFAULT_TIMEOUT_MS;
    this.cacheTtlDataMs = opts.cacheTtlDataMs || Number(process.env.KOLADA_CACHE_TTL_DATA) * 1000 || CACHE_TTL_DATA_MS;
    this.cacheTtlMetaMs = opts.cacheTtlMetaMs || Number(process.env.KOLADA_CACHE_TTL_META) * 1000 || CACHE_TTL_META_MS;
  }

  /** Fetch data (KPI values) — cached 30 min. */
  async getData(path: string): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.baseUrl}${path}`;
    return this._fetch(url, this.cacheTtlDataMs);
  }

  /** Fetch metadata (KPI definitions, municipalities) — cached 24h. */
  async getMeta(path: string): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.baseUrl}${path}`;
    return this._fetch(url, this.cacheTtlMetaMs);
  }

  /** General GET method. */
  async get(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.baseUrl}${path}`;
    return this._fetch(url, cacheTtl ?? this.cacheTtlDataMs);
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

    throw new Error(lastError || 'Kolada API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton for shared use
let _client: KoladaApiClient | null = null;

export function getApiClient(): KoladaApiClient {
  if (!_client) {
    _client = new KoladaApiClient();
  }
  return _client;
}
