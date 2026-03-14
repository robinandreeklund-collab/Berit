/**
 * Elpris API client.
 *
 * Connects to elprisetjustnu.se — open API for Swedish spot prices.
 * No authentication required.
 *
 * Features:
 * - In-memory cache with differentiated TTL (15 min current, 24h historical)
 * - Exponential backoff retry on network errors
 */

const DEFAULT_BASE_URL = 'https://www.elprisetjustnu.se';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const CACHE_TTL_CURRENT_MS = 15 * 60 * 1000; // 15 minutes
const CACHE_TTL_HISTORICAL_MS = 24 * 60 * 60 * 1000; // 24 hours

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

export interface ElprisClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  cacheTtlCurrentMs?: number;
  cacheTtlHistoricalMs?: number;
}

export class ElprisApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private cacheTtlCurrentMs: number;
  private cacheTtlHistoricalMs: number;
  private cache = new MemoryCache();

  constructor(opts: ElprisClientOptions = {}) {
    this.baseUrl = opts.baseUrl || process.env.ELPRIS_BASE_URL || DEFAULT_BASE_URL;
    this.timeoutMs = opts.timeoutMs || Number(process.env.ELPRIS_TIMEOUT) * 1000 || DEFAULT_TIMEOUT_MS;
    this.cacheTtlCurrentMs = opts.cacheTtlCurrentMs || CACHE_TTL_CURRENT_MS;
    this.cacheTtlHistoricalMs = opts.cacheTtlHistoricalMs || CACHE_TTL_HISTORICAL_MS;
  }

  /** Fetch prices for a specific date and zone. */
  async getPrices(year: string, monthDay: string, zone: string, isHistorical = false): Promise<{ data: unknown; cached: boolean }> {
    const path = `/api/v1/prices/${year}/${monthDay}_${zone}.json`;
    const url = `${this.baseUrl}${path}`;
    const ttl = isHistorical ? this.cacheTtlHistoricalMs : this.cacheTtlCurrentMs;
    return this._fetch(url, ttl);
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

    throw new Error(lastError || 'Elpris API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton for shared use
let _client: ElprisApiClient | null = null;

export function getApiClient(): ElprisApiClient {
  if (!_client) {
    _client = new ElprisApiClient();
  }
  return _client;
}
