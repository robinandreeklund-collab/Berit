/**
 * Visit Sweden API client.
 *
 * Connects to data.visitsweden.com — EntryStore-based linked data platform.
 * No authentication required for public data (public:true).
 *
 * Features:
 * - In-memory cache with differentiated TTL
 * - Exponential backoff retry on network errors
 */

const DEFAULT_BASE_URL = 'https://data.visitsweden.com';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const CACHE_TTL_SEARCH_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_TTL_DETAILS_MS = 60 * 60 * 1000; // 1 hour

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

export interface VisitSwedenClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

export class VisitSwedenApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private cache = new MemoryCache();

  constructor(opts: VisitSwedenClientOptions = {}) {
    this.baseUrl = opts.baseUrl || process.env.VISITSWEDEN_BASE_URL || DEFAULT_BASE_URL;
    this.timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
  }

  /** Search for entries by query and optional type/region filters. */
  async search(params: {
    query: string;
    type?: string;
    region?: string;
    limit?: number;
    fromDate?: string;
    toDate?: string;
  }): Promise<{ data: unknown; cached: boolean }> {
    const searchParams = new URLSearchParams();
    searchParams.set('type', 'solr');

    // Build the Solr query
    const queryParts: string[] = [`public:true`];
    if (params.query) {
      queryParts.push(`title:*${params.query}* OR description:*${params.query}*`);
    }
    if (params.type) {
      queryParts.push(`rdfType:*schema.org/${params.type}`);
    }
    if (params.region) {
      queryParts.push(`metadata.predicate_*region*:"${params.region}"`);
    }
    if (params.fromDate) {
      queryParts.push(`metadata.predicate_*startDate*:[${params.fromDate}T00:00:00Z TO *]`);
    }
    if (params.toDate) {
      queryParts.push(`metadata.predicate_*endDate*:[* TO ${params.toDate}T23:59:59Z]`);
    }

    searchParams.set('query', queryParts.join(' AND '));
    searchParams.set('limit', String(params.limit || 20));
    searchParams.set('rdfFormat', 'application/ld+json');

    const url = `${this.baseUrl}/store/search?${searchParams.toString()}`;
    return this._fetch(url, CACHE_TTL_SEARCH_MS);
  }

  /** Get details for a specific entry by ID. */
  async getDetails(entryId: string): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.baseUrl}/store/9/metadata/${entryId}?format=application/ld+json`;
    return this._fetch(url, CACHE_TTL_DETAILS_MS);
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
          headers: { Accept: 'application/json, application/ld+json' },
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

    throw new Error(lastError || 'Visit Sweden API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton
let _client: VisitSwedenApiClient | null = null;

export function getApiClient(): VisitSwedenApiClient {
  if (!_client) {
    _client = new VisitSwedenApiClient();
  }
  return _client;
}
