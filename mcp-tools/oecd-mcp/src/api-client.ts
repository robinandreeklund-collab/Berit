/**
 * OECD SDMX REST API client.
 *
 * Connects to the OECD SDMX API (sdmx.oecd.org/public/rest).
 *
 * Features:
 * - In-memory cache with differentiated TTL (1h data, 24h metadata)
 * - Exponential backoff retry on 429 / network errors
 * - Rate limiting (1.5s between requests)
 * - No authentication required
 */

const DEFAULT_BASE_URL = 'https://sdmx.oecd.org/public/rest';
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 4;
const CACHE_TTL_DATA_MS = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_META_MS = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_MS = 1500; // 1.5s between requests

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

export interface OECDClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  cacheTtlDataMs?: number;
  cacheTtlMetaMs?: number;
}

export class OECDApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private cacheTtlDataMs: number;
  private cacheTtlMetaMs: number;
  private cache = new MemoryCache();
  private lastRequestTime = 0;

  constructor(opts: OECDClientOptions = {}) {
    this.baseUrl = opts.baseUrl || process.env.OECD_BASE_URL || DEFAULT_BASE_URL;
    this.timeoutMs = opts.timeoutMs || Number(process.env.OECD_TIMEOUT) * 1000 || DEFAULT_TIMEOUT_MS;
    this.cacheTtlDataMs = opts.cacheTtlDataMs || CACHE_TTL_DATA_MS;
    this.cacheTtlMetaMs = opts.cacheTtlMetaMs || CACHE_TTL_META_MS;
  }

  /**
   * Fetch from the SDMX API with a given path.
   * Paths should NOT include the base URL.
   * Example: /data/OECD.SDD.NAD,DSD_NAMAIN10@QNA/SWE.GDP..Q
   */
  async sdmx(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.baseUrl}${path}`;
    return this._fetch(url, cacheTtl ?? this.cacheTtlDataMs);
  }

  /** Fetch metadata (longer cache). */
  async metadata(path: string): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.baseUrl}${path}`;
    return this._fetch(url, this.cacheTtlMetaMs);
  }

  private async _rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < RATE_LIMIT_MS) {
      await sleep(RATE_LIMIT_MS - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  private async _fetch(url: string, cacheTtl: number): Promise<{ data: unknown; cached: boolean }> {
    // Check cache
    const cached = this.cache.get(url);
    if (cached) {
      return { data: cached, cached: true };
    }

    // Rate limit
    await this._rateLimit();

    let lastError: string | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const headers: Record<string, string> = {
          Accept: 'application/vnd.sdmx.data+json;version=2.0.0',
        };

        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseFloat(retryAfter) * 1000 : 2000 * 2 ** attempt;
          await sleep(delay);
          continue;
        }

        if (!response.ok) {
          const body = await response.text();
          lastError = `HTTP ${response.status}: ${body.slice(0, 500)}`;

          // Don't retry client errors (except 429)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(lastError);
          }

          await sleep(1000 * 2 ** attempt);
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        let data: unknown;

        if (contentType.includes('json')) {
          data = await response.json();
        } else {
          // Some SDMX endpoints return XML; parse as text
          data = await response.text();
        }

        // Cache successful response
        this.cache.set(url, data, cacheTtl);

        return { data, cached: false };
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('HTTP 4')) {
          throw err;
        }
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < MAX_RETRIES - 1) {
          await sleep(1000 * 2 ** attempt);
        }
      }
    }

    throw new Error(lastError || 'OECD SDMX API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton for shared use
let _client: OECDApiClient | null = null;

export function getApiClient(): OECDApiClient {
  if (!_client) {
    _client = new OECDApiClient();
  }
  return _client;
}
