/**
 * Riksbank REST API client.
 *
 * Connects to three APIs:
 * - SWEA (api.riksbank.se/swea/v1/) — interest rates and exchange rates
 * - SWESTR (api.riksbank.se/swestr/v1/) — overnight reference rate
 * - Forecasts (api.riksbank.se/forecasts/v1/) — macroeconomic projections
 *
 * Features:
 * - In-memory cache with differentiated TTL (1h rates, 24h metadata)
 * - Exponential backoff retry on 429 / network errors
 * - Optional API key (works anonymously at 5 req/min)
 */

const DEFAULT_SWEA_URL = 'https://api.riksbank.se/swea/v1';
const DEFAULT_SWESTR_URL = 'https://api.riksbank.se/swestr/v1';
const DEFAULT_FORECASTS_URL = 'https://api.riksbank.se/forecasts/v1';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const CACHE_TTL_RATES_MS = 60 * 60 * 1000; // 1 hour
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

export interface RiksbankClientOptions {
  apiKey?: string;
  sweaBaseUrl?: string;
  swestrBaseUrl?: string;
  forecastsBaseUrl?: string;
  timeoutMs?: number;
  cacheTtlRatesMs?: number;
  cacheTtlMetaMs?: number;
}

export class RiksbankApiClient {
  private apiKey: string;
  private sweaBaseUrl: string;
  private swestrBaseUrl: string;
  private forecastsBaseUrl: string;
  private timeoutMs: number;
  private cacheTtlRatesMs: number;
  private cacheTtlMetaMs: number;
  private cache = new MemoryCache();

  constructor(opts: RiksbankClientOptions = {}) {
    this.apiKey = opts.apiKey || process.env.RIKSBANK_API_KEY || '';
    this.sweaBaseUrl = opts.sweaBaseUrl || process.env.RIKSBANK_SWEA_BASE_URL || DEFAULT_SWEA_URL;
    this.swestrBaseUrl = opts.swestrBaseUrl || process.env.RIKSBANK_SWESTR_BASE_URL || DEFAULT_SWESTR_URL;
    this.forecastsBaseUrl = opts.forecastsBaseUrl || process.env.RIKSBANK_FORECASTS_BASE_URL || DEFAULT_FORECASTS_URL;
    this.timeoutMs = opts.timeoutMs || Number(process.env.RIKSBANK_TIMEOUT) * 1000 || DEFAULT_TIMEOUT_MS;
    this.cacheTtlRatesMs = opts.cacheTtlRatesMs || Number(process.env.RIKSBANK_CACHE_TTL_RATES) * 1000 || CACHE_TTL_RATES_MS;
    this.cacheTtlMetaMs = opts.cacheTtlMetaMs || Number(process.env.RIKSBANK_CACHE_TTL_META) * 1000 || CACHE_TTL_META_MS;
  }

  /** Fetch from SWEA API. */
  async swea(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.sweaBaseUrl}${path}`;
    return this._fetch(url, cacheTtl ?? this.cacheTtlRatesMs);
  }

  /** Fetch from SWESTR API. */
  async swestr(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.swestrBaseUrl}${path}`;
    return this._fetch(url, cacheTtl ?? this.cacheTtlRatesMs);
  }

  /** Fetch from Forecasts API. */
  async forecasts(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.forecastsBaseUrl}${path}`;
    return this._fetch(url, cacheTtl ?? this.cacheTtlMetaMs);
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
        if (this.apiKey) {
          headers['Ocp-Apim-Subscription-Key'] = this.apiKey;
        }

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

    throw new Error(lastError || 'Riksbank API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton for shared use
let _client: RiksbankApiClient | null = null;

export function getApiClient(): RiksbankApiClient {
  if (!_client) {
    _client = new RiksbankApiClient();
  }
  return _client;
}
