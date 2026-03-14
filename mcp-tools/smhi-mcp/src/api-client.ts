/**
 * SMHI Open Data API client.
 *
 * Connects to 8 SMHI APIs:
 * - metfcst/pmp3g  — Weather forecasts (10 days)
 * - metfcst/snow1g — Snow forecasts
 * - metanalys/mesan2g — Weather analysis (MESAN)
 * - metobs — Meteorological observations
 * - hydroobs — Hydrological observations
 * - ocobs — Oceanographic observations
 * - metfcst/fwif1g — Fire risk forecasts (seasonal, May–Oct)
 * - metanalys/fwia — Fire risk analysis (seasonal, May–Oct)
 *
 * Features:
 * - In-memory cache with differentiated TTL
 * - Exponential backoff retry on network errors
 * - No authentication required (all SMHI APIs are open)
 * - GZIP Accept-Encoding for metfcst
 */

const BASE_URLS = {
  metfcst: 'https://opendata-download-metfcst.smhi.se/api',
  metanalys: 'https://opendata-download-metanalys.smhi.se/api',
  metobs: 'https://opendata-download-metobs.smhi.se/api',
  hydroobs: 'https://opendata-download-hydroobs.smhi.se/api',
  ocobs: 'https://opendata-download-ocobs.smhi.se/api',
} as const;

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;

// Cache TTLs
const CACHE_TTL_FORECAST_MS = 30 * 60 * 1000;     // 30 minutes (forecasts update every 6h)
const CACHE_TTL_ANALYSIS_MS = 15 * 60 * 1000;     // 15 minutes (analyses update hourly)
const CACHE_TTL_OBSERVATION_MS = 5 * 60 * 1000;   // 5 minutes (real-time data)
const CACHE_TTL_METADATA_MS = 60 * 60 * 1000;     // 1 hour (station lists etc.)

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

export interface SmhiClientOptions {
  timeoutMs?: number;
}

export class SmhiApiClient {
  private timeoutMs: number;
  private cache = new MemoryCache();

  constructor(opts: SmhiClientOptions = {}) {
    this.timeoutMs = opts.timeoutMs || Number(process.env.SMHI_TIMEOUT) * 1000 || DEFAULT_TIMEOUT_MS;
  }

  // ── Weather Forecasts ───────────────────────────────────────────────────

  /** Get weather forecast for a point (PMP3g, ~10 days ahead). */
  async getWeatherForecast(lat: number, lon: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${BASE_URLS.metfcst}/category/pmp3g/version/2/geotype/point/lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json`;
    return this._fetch(url, CACHE_TTL_FORECAST_MS);
  }

  /** Get snow forecast for a point. */
  async getSnowForecast(lat: number, lon: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${BASE_URLS.metfcst}/category/snow1g/version/1/geotype/point/lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json`;
    return this._fetch(url, CACHE_TTL_FORECAST_MS);
  }

  // ── Weather Analysis ────────────────────────────────────────────────────

  /** Get MESAN analysis for a point (latest hour). */
  async getMesanAnalysis(lat: number, lon: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${BASE_URLS.metanalys}/category/mesan2g/version/1/geotype/point/lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json`;
    return this._fetch(url, CACHE_TTL_ANALYSIS_MS);
  }

  // ── Meteorological Observations ─────────────────────────────────────────

  /** Get meteorological observations for a station/parameter/period. */
  async getMetobs(parameter: number, station: number, period: string): Promise<{ data: unknown; cached: boolean }> {
    const url = `${BASE_URLS.metobs}/version/1.0/parameter/${parameter}/station/${station}/period/${period}/data.json`;
    return this._fetch(url, CACHE_TTL_OBSERVATION_MS);
  }

  /** List all stations for a given parameter. */
  async getMetobsStations(parameter: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${BASE_URLS.metobs}/version/1.0/parameter/${parameter}.json`;
    return this._fetch(url, CACHE_TTL_METADATA_MS);
  }

  // ── Hydrological Observations ───────────────────────────────────────────

  /** Get hydrological observations for a station/parameter/period. */
  async getHydroobs(parameter: number, station: number, period: string): Promise<{ data: unknown; cached: boolean }> {
    const url = `${BASE_URLS.hydroobs}/version/1.0/parameter/${parameter}/station/${station}/period/${period}/data.json`;
    return this._fetch(url, CACHE_TTL_OBSERVATION_MS);
  }

  // ── Oceanographic Observations ──────────────────────────────────────────

  /** Get oceanographic observations for a station/parameter/period. */
  async getOcobs(parameter: number, station: number, period: string): Promise<{ data: unknown; cached: boolean }> {
    const url = `${BASE_URLS.ocobs}/version/latest/parameter/${parameter}/station/${station}/period/${period}/data.json`;
    return this._fetch(url, CACHE_TTL_OBSERVATION_MS);
  }

  // ── Fire Risk ───────────────────────────────────────────────────────────

  /** Get fire risk forecast (FWI) for a point. */
  async getFireRiskForecast(lat: number, lon: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${BASE_URLS.metfcst}/category/fwif1g/version/1/geotype/point/lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json`;
    return this._fetch(url, CACHE_TTL_FORECAST_MS);
  }

  /** Get fire risk analysis for a point. */
  async getFireRiskAnalysis(lat: number, lon: number): Promise<{ data: unknown; cached: boolean }> {
    const url = `${BASE_URLS.metanalys}/category/fwia/version/1/geotype/point/lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json`;
    return this._fetch(url, CACHE_TTL_ANALYSIS_MS);
  }

  // ── Internal fetch with retry and caching ───────────────────────────────

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
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
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

    throw new Error(lastError || 'SMHI API-anrop misslyckades.');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton for shared use
let _client: SmhiApiClient | null = null;

export function getApiClient(): SmhiApiClient {
  if (!_client) {
    _client = new SmhiApiClient();
  }
  return _client;
}
