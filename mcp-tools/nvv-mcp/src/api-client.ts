/**
 * Naturvardsverket REST API client.
 *
 * Connects to three APIs:
 * - National (geodata.naturvardsverket.se/naturvardsregistret/rest/v3/) — protected areas
 * - Natura 2000 (geodata.naturvardsverket.se/n2000/rest/v3/) — EU habitat/species sites
 * - Ramsar (geodata.naturvardsverket.se/internationellakonventioner/rest/v3/) — wetlands
 *
 * Features:
 * - In-memory cache with differentiated TTL (1h area data, 24h reference data)
 * - Exponential backoff retry on 429 / network errors
 * - No authentication required
 */

const DEFAULT_NATIONAL_URL = 'https://geodata.naturvardsverket.se/naturvardsregistret/rest/v3';
const DEFAULT_N2000_URL = 'https://geodata.naturvardsverket.se/n2000/rest/v3';
const DEFAULT_RAMSAR_URL = 'https://geodata.naturvardsverket.se/internationellakonventioner/rest/v3';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const CACHE_TTL_AREA_MS = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_REF_MS = 24 * 60 * 60 * 1000; // 24 hours

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

export interface NvvClientOptions {
  nationalBaseUrl?: string;
  n2000BaseUrl?: string;
  ramsarBaseUrl?: string;
  timeoutMs?: number;
  cacheTtlAreaMs?: number;
  cacheTtlRefMs?: number;
}

export class NvvApiClient {
  private nationalBaseUrl: string;
  private n2000BaseUrl: string;
  private ramsarBaseUrl: string;
  private timeoutMs: number;
  private cacheTtlAreaMs: number;
  private cacheTtlRefMs: number;
  private cache = new MemoryCache();

  constructor(opts: NvvClientOptions = {}) {
    this.nationalBaseUrl = opts.nationalBaseUrl || process.env.NVV_NATIONAL_BASE_URL || DEFAULT_NATIONAL_URL;
    this.n2000BaseUrl = opts.n2000BaseUrl || process.env.NVV_N2000_BASE_URL || DEFAULT_N2000_URL;
    this.ramsarBaseUrl = opts.ramsarBaseUrl || process.env.NVV_RAMSAR_BASE_URL || DEFAULT_RAMSAR_URL;
    this.timeoutMs = opts.timeoutMs || Number(process.env.NVV_TIMEOUT) * 1000 || DEFAULT_TIMEOUT_MS;
    this.cacheTtlAreaMs = opts.cacheTtlAreaMs || Number(process.env.NVV_CACHE_TTL_AREA) * 1000 || CACHE_TTL_AREA_MS;
    this.cacheTtlRefMs = opts.cacheTtlRefMs || Number(process.env.NVV_CACHE_TTL_REF) * 1000 || CACHE_TTL_REF_MS;
  }

  /** Fetch from National protected areas API. */
  async national(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.nationalBaseUrl}${path}`;
    return this._fetch(url, cacheTtl ?? this.cacheTtlAreaMs);
  }

  /** Fetch from Natura 2000 API. */
  async n2000(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.n2000BaseUrl}${path}`;
    return this._fetch(url, cacheTtl ?? this.cacheTtlAreaMs);
  }

  /** Fetch from Ramsar API. */
  async ramsar(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.ramsarBaseUrl}${path}`;
    return this._fetch(url, cacheTtl ?? this.cacheTtlAreaMs);
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

    throw new Error(lastError || 'Naturvardsverket API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton for shared use
let _client: NvvApiClient | null = null;

export function getApiClient(): NvvApiClient {
  if (!_client) {
    _client = new NvvApiClient();
  }
  return _client;
}
