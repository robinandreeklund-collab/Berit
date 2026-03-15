/**
 * KB REST API client.
 *
 * Connects to three APIs:
 * - Libris Xsearch (libris.kb.se/xsearch) — books, journals, e-resources
 * - Libris XL (libris.kb.se/find) — advanced bibliographic search (JSON-LD)
 * - K-samsök (kulturarvsdata.se/ksamsok/api) — cultural heritage objects
 * - Swepub (via Libris xsearch with type=swepub) — research publications
 *
 * Features:
 * - In-memory cache with differentiated TTL (1h search results, 24h metadata)
 * - Exponential backoff retry on 429 / network errors
 * - No authentication required (public APIs)
 */

const DEFAULT_LIBRIS_URL = 'https://libris.kb.se';
const DEFAULT_KSAMSOK_URL = 'https://kulturarvsdata.se/ksamsok/api';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const CACHE_TTL_SEARCH_MS = 60 * 60 * 1000; // 1 hour
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

export interface KBClientOptions {
  librisBaseUrl?: string;
  ksamsokBaseUrl?: string;
  timeoutMs?: number;
  cacheTtlSearchMs?: number;
  cacheTtlMetaMs?: number;
}

export class KBApiClient {
  private librisBaseUrl: string;
  private ksamsokBaseUrl: string;
  private timeoutMs: number;
  private cacheTtlSearchMs: number;
  private cacheTtlMetaMs: number;
  private cache = new MemoryCache();

  constructor(opts: KBClientOptions = {}) {
    this.librisBaseUrl = opts.librisBaseUrl || process.env.KB_LIBRIS_BASE_URL || DEFAULT_LIBRIS_URL;
    this.ksamsokBaseUrl = opts.ksamsokBaseUrl || process.env.KB_KSAMSOK_BASE_URL || DEFAULT_KSAMSOK_URL;
    this.timeoutMs = opts.timeoutMs || Number(process.env.KB_TIMEOUT) * 1000 || DEFAULT_TIMEOUT_MS;
    this.cacheTtlSearchMs = opts.cacheTtlSearchMs || Number(process.env.KB_CACHE_TTL_SEARCH) * 1000 || CACHE_TTL_SEARCH_MS;
    this.cacheTtlMetaMs = opts.cacheTtlMetaMs || Number(process.env.KB_CACHE_TTL_META) * 1000 || CACHE_TTL_META_MS;
  }

  /** Fetch from Libris Xsearch API. */
  async libris(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.librisBaseUrl}${path}`;
    return this._fetch(url, cacheTtl ?? this.cacheTtlSearchMs);
  }

  /** Fetch from K-samsök API. */
  async ksamsok(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.ksamsokBaseUrl}${path}`;
    return this._fetch(url, cacheTtl ?? this.cacheTtlSearchMs);
  }

  /** Fetch from Swepub (via Libris Xsearch with type filter). */
  async swepub(path: string, cacheTtl?: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${this.librisBaseUrl}${path}`;
    return this._fetch(url, cacheTtl ?? this.cacheTtlSearchMs);
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

        const contentType = response.headers.get('content-type') || '';
        let data: unknown;

        if (contentType.includes('xml')) {
          // K-samsök returns XML — parse to a simple structure
          const text = await response.text();
          data = parseKsamsokXml(text);
        } else {
          data = await response.json();
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
          await sleep(500 * 2 ** attempt);
        }
      }
    }

    throw new Error(lastError || 'KB API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// ---------------------------------------------------------------------------
// K-samsök XML parser (simple regex-based extraction)
// ---------------------------------------------------------------------------

function parseKsamsokXml(xml: string): unknown {
  // Extract totalHits
  const totalHitsMatch = xml.match(/<totalHits>(\d+)<\/totalHits>/);
  const totalHits = totalHitsMatch ? parseInt(totalHitsMatch[1], 10) : 0;

  // Extract records
  const records: Array<Record<string, string>> = [];
  const recordBlocks = xml.match(/<record>([\s\S]*?)<\/record>/g) || [];

  for (const block of recordBlocks) {
    const record: Record<string, string> = {};

    const fields = [
      'recordId', 'type', 'itemLabel', 'itemDescription', 'itemName',
      'thumbnailUrl', 'presentationUrl', 'institution', 'municipality',
      'county', 'country', 'timeLabel', 'coordinates',
    ];

    for (const field of fields) {
      const match = block.match(new RegExp(`<${field}>([\\s\\S]*?)<\\/${field}>`));
      if (match) {
        record[field] = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
      }
    }

    // Also try to extract from RDF/XML format used in getObject
    const rdfFields = [
      { tag: 'pres:itemLabel', key: 'itemLabel' },
      { tag: 'pres:itemDescription', key: 'itemDescription' },
      { tag: 'pres:itemType', key: 'type' },
      { tag: 'pres:itemName', key: 'itemName' },
      { tag: 'pres:organization', key: 'institution' },
      { tag: 'pres:municipalityName', key: 'municipality' },
      { tag: 'pres:countyName', key: 'county' },
      { tag: 'pres:image', key: 'thumbnailUrl' },
    ];

    for (const { tag, key } of rdfFields) {
      if (!record[key]) {
        const match = block.match(new RegExp(`<${tag.replace(':', '\\:')}[^>]*>([\\s\\S]*?)<\\/${tag.replace(':', '\\:')}>`, 'i'));
        if (match) {
          record[key] = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
        }
      }
    }

    if (Object.keys(record).length > 0) {
      records.push(record);
    }
  }

  return { totalHits, records };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton for shared use
let _client: KBApiClient | null = null;

export function getApiClient(): KBApiClient {
  if (!_client) {
    _client = new KBApiClient();
  }
  return _client;
}
