/**
 * Trafikverket Open API v2 client.
 *
 * Sends XML requests to https://api.trafikinfo.trafikverket.se/v2/data.json
 * with <LOGIN authenticationkey="..."> and <QUERY objecttype="..." schemaversion="...">.
 *
 * Features:
 * - In-memory cache with configurable TTL
 * - Exponential backoff retry on 429 / network errors
 * - Schema version fallback
 * - Rate limit tracking
 */

const TRAFIKVERKET_BASE_URL =
  'https://api.trafikinfo.trafikverket.se/v2/data.json';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: unknown;
  expires: number;
}

class MemoryCache {
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
// XML helpers
// ---------------------------------------------------------------------------

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface QueryOptions {
  objecttype: string;
  schemaVersion?: string;
  namespace?: string;
  limit?: number;
  filter?: FilterClause | null;
  include?: string[];
}

export interface FilterClause {
  operator: 'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'LIKE' | 'EXISTS' | 'IN' | 'WITHIN';
  name: string;
  value: string;
}

function buildQueryXml(apiKey: string, opts: QueryOptions): string {
  const schema = opts.schemaVersion || '1.0';
  const ns = opts.namespace ? ` namespace="${escapeXml(opts.namespace)}"` : '';
  const limit = opts.limit ?? 10;

  let filterXml = '';
  if (opts.filter) {
    const { operator, name, value } = opts.filter;
    filterXml = `<FILTER><${operator} name="${escapeXml(name)}" value="${escapeXml(value)}" /></FILTER>`;
  }

  let includeXml = '';
  if (opts.include && opts.include.length > 0) {
    includeXml = opts.include.map((f) => `<INCLUDE>${escapeXml(f)}</INCLUDE>`).join('');
  }

  return (
    `<REQUEST>` +
    `<LOGIN authenticationkey="${escapeXml(apiKey)}" />` +
    `<QUERY objecttype="${escapeXml(opts.objecttype)}"${ns}` +
    ` schemaversion="${escapeXml(schema)}" limit="${limit}">` +
    `${filterXml}${includeXml}` +
    `</QUERY>` +
    `</REQUEST>`
  );
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

export interface TrafikverketClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  cacheTtlMs?: number;
  defaultSchemaVersion?: string;
  schemaFallbacks?: string[];
}

export interface TrafikverketResponse {
  RESPONSE: {
    RESULT: Array<Record<string, unknown>>;
  };
}

export class TrafikverketApiClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;
  private cacheTtlMs: number;
  private defaultSchemaVersion: string;
  private schemaFallbacks: string[];
  private cache = new MemoryCache();

  constructor(opts: TrafikverketClientOptions = {}) {
    this.apiKey = opts.apiKey || process.env.TRAFIKVERKET_API_KEY || '';
    this.baseUrl = opts.baseUrl || TRAFIKVERKET_BASE_URL;
    this.timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.cacheTtlMs = opts.cacheTtlMs || CACHE_TTL_MS;
    this.defaultSchemaVersion = opts.defaultSchemaVersion || process.env.TRAFIKVERKET_SCHEMA_VERSION || '1.0';
    this.schemaFallbacks = opts.schemaFallbacks || (process.env.TRAFIKVERKET_SCHEMA_VERSION_FALLBACKS || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  /**
   * Execute a query against the Trafikverket API.
   * Returns the parsed JSON response.
   */
  async query(opts: QueryOptions): Promise<{ data: TrafikverketResponse; cached: boolean }> {
    if (!this.apiKey) {
      throw new Error('TRAFIKVERKET_API_KEY saknas. Sätt miljövariabeln TRAFIKVERKET_API_KEY.');
    }

    const schemaVersion = opts.schemaVersion || this.defaultSchemaVersion;
    const queryOpts = { ...opts, schemaVersion };

    // Try primary schema version
    try {
      return await this._executeQuery(queryOpts);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : String(err);

      // Try schema fallbacks if ResourceNotFound
      if (errorText.includes('ResourceNotFound') || errorText.includes('ObjectType not found')) {
        for (const fallback of this.schemaFallbacks) {
          if (fallback === schemaVersion) continue;
          try {
            return await this._executeQuery({ ...queryOpts, schemaVersion: fallback });
          } catch (fallbackErr) {
            const fbText = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
            if (!fbText.includes('ResourceNotFound') && !fbText.includes('ObjectType not found')) {
              throw fallbackErr;
            }
          }
        }
      }
      throw err;
    }
  }

  private async _executeQuery(opts: QueryOptions): Promise<{ data: TrafikverketResponse; cached: boolean }> {
    const xmlBody = buildQueryXml(this.apiKey, opts);
    const cacheKey = xmlBody;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { data: cached as TrafikverketResponse, cached: true };
    }

    // Execute with retry
    let lastError: string | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/xml',
            Accept: 'application/json',
          },
          body: xmlBody,
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

        const data = (await response.json()) as TrafikverketResponse;

        // Cache successful response
        this.cache.set(cacheKey, data, this.cacheTtlMs);

        return { data, cached: false };
      } catch (err) {
        if (err instanceof Error && (err.message.startsWith('HTTP 4') || err.message.includes('ResourceNotFound'))) {
          throw err;
        }
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < MAX_RETRIES - 1) {
          await sleep(500 * 2 ** attempt);
        }
      }
    }

    throw new Error(lastError || 'Trafikverket API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton for shared use
let _client: TrafikverketApiClient | null = null;

export function getApiClient(): TrafikverketApiClient {
  if (!_client) {
    _client = new TrafikverketApiClient();
  }
  return _client;
}

export { buildQueryXml, escapeXml, MemoryCache };
