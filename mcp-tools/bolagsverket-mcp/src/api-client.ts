/**
 * Bolagsverket REST API client.
 *
 * Connects to the Värdefulla datamängder API (free, EU transparency requirement).
 * Base URL: https://gw.api.bolagsverket.se/vardefulla-datamangder/v1
 *
 * Features:
 * - OAuth 2.0 authentication (client_credentials flow)
 * - In-memory cache with differentiated TTL
 * - Exponential backoff retry on 429 / network errors
 * - Rate limit: 60 requests/minute
 */

const DEFAULT_BASE_URL = 'https://gw.api.bolagsverket.se/vardefulla-datamangder/v1';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const CACHE_TTL_ORG_MS = 60 * 60 * 1000; // 1 hour
const CACHE_TTL_DOC_MS = 24 * 60 * 60 * 1000; // 24 hours

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

export interface BolagsverketClientOptions {
  baseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  timeoutMs?: number;
  cacheTtlOrgMs?: number;
  cacheTtlDocMs?: number;
}

export class BolagsverketApiClient {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private timeoutMs: number;
  private cacheTtlOrgMs: number;
  private cacheTtlDocMs: number;
  private cache = new MemoryCache();
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(opts: BolagsverketClientOptions = {}) {
    this.baseUrl = opts.baseUrl || process.env.BOLAGSVERKET_BASE_URL || DEFAULT_BASE_URL;
    this.clientId = opts.clientId || process.env.BOLAGSVERKET_CLIENT_ID || '';
    this.clientSecret = opts.clientSecret || process.env.BOLAGSVERKET_CLIENT_SECRET || '';
    this.timeoutMs = opts.timeoutMs || Number(process.env.BOLAGSVERKET_TIMEOUT) * 1000 || DEFAULT_TIMEOUT_MS;
    this.cacheTtlOrgMs = opts.cacheTtlOrgMs || CACHE_TTL_ORG_MS;
    this.cacheTtlDocMs = opts.cacheTtlDocMs || CACHE_TTL_DOC_MS;
  }

  /** Get OAuth 2.0 access token. */
  private async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'Bolagsverket API kräver OAuth 2.0-uppgifter. ' +
        'Ange BOLAGSVERKET_CLIENT_ID och BOLAGSVERKET_CLIENT_SECRET i .env. ' +
        'Gratis registrering: https://gw.api.bolagsverket.se/',
      );
    }

    const tokenUrl = process.env.BOLAGSVERKET_TOKEN_URL || 'https://portal.api.bolagsverket.se/oauth2/token';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Token-hämtning misslyckades: HTTP ${response.status}`);
      }

      const data = await response.json() as { access_token: string; expires_in: number };
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 60s early
      return this.accessToken;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /** Look up organisation by org number (POST). */
  async lookupOrganisation(orgNr: string): Promise<{ data: unknown; cached: boolean }> {
    const cleanNr = orgNr.replace(/[^0-9]/g, '');
    const cacheKey = `org:${cleanNr}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return { data: cached, cached: true };

    const token = await this.getToken();
    const url = `${this.baseUrl}/organisationer`;
    const data = await this._fetchPost(url, { organisationsnummer: cleanNr }, token);

    this.cache.set(cacheKey, data, this.cacheTtlOrgMs);
    return { data, cached: false };
  }

  /** Get document list for an organisation (POST). */
  async getDocuments(orgNr: string): Promise<{ data: unknown; cached: boolean }> {
    const cleanNr = orgNr.replace(/[^0-9]/g, '');
    const cacheKey = `docs:${cleanNr}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return { data: cached, cached: true };

    const token = await this.getToken();
    const url = `${this.baseUrl}/dokumentlista`;
    const data = await this._fetchPost(url, { organisationsnummer: cleanNr }, token);

    this.cache.set(cacheKey, data, this.cacheTtlDocMs);
    return { data, cached: false };
  }

  /** Get a specific document by ID (GET). */
  async getDocument(dokumentId: string): Promise<{ data: unknown; cached: boolean }> {
    const cacheKey = `doc:${dokumentId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return { data: cached, cached: true };

    const token = await this.getToken();
    const url = `${this.baseUrl}/dokument/${dokumentId}`;
    const data = await this._fetchGet(url, token);

    this.cache.set(cacheKey, data, this.cacheTtlDocMs);
    return { data, cached: false };
  }

  /** Check API health (GET). */
  async isAlive(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/isalive`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async _fetchPost(url: string, body: unknown, token: string): Promise<unknown> {
    let lastError: string | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.status === 429) {
          const delay = 500 * 2 ** attempt;
          await sleep(delay);
          continue;
        }

        if (!response.ok) {
          const text = await response.text();
          lastError = `HTTP ${response.status}: ${text}`;
          if (response.status >= 400 && response.status < 500) {
            throw new Error(lastError);
          }
          await sleep(500 * 2 ** attempt);
          continue;
        }

        return await response.json();
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('HTTP 4')) throw err;
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < MAX_RETRIES - 1) await sleep(500 * 2 ** attempt);
      }
    }
    throw new Error(lastError || 'Bolagsverket API-anrop misslyckades.');
  }

  private async _fetchGet(url: string, token: string): Promise<unknown> {
    let lastError: string | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.status === 429) {
          await sleep(500 * 2 ** attempt);
          continue;
        }

        if (!response.ok) {
          const text = await response.text();
          lastError = `HTTP ${response.status}: ${text}`;
          if (response.status >= 400 && response.status < 500) throw new Error(lastError);
          await sleep(500 * 2 ** attempt);
          continue;
        }

        return await response.json();
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('HTTP 4')) throw err;
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < MAX_RETRIES - 1) await sleep(500 * 2 ** attempt);
      }
    }
    throw new Error(lastError || 'Bolagsverket API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton for shared use
let _client: BolagsverketApiClient | null = null;

export function getApiClient(): BolagsverketApiClient {
  if (!_client) {
    _client = new BolagsverketApiClient();
  }
  return _client;
}
