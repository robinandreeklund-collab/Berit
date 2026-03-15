/**
 * SCB API Client — v2.0
 *
 * Persistent HTTP client with metadata caching, auto-complete,
 * JSON-stat2 markdown decoding, and batch support.
 */

import {
  ConfigResponse,
  ConfigResponseSchema,
  TablesResponse,
  TablesResponseSchema,
  Dataset,
  DatasetSchema,
  RateLimitInfo,
} from './types.js';
import { autoCompleteSelection, estimateCellCount } from './autocomplete.js';
import { decodeJsonStat2ToMarkdown, type DecodedTable } from './jsonstat2.js';
import { createBatchPlan, mergeDatasets } from './batch.js';

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class MetadataCache {
  private store = new Map<string, CacheEntry<Dataset>>();
  private configCache: CacheEntry<ConfigResponse> | null = null;

  getMetadata(key: string): Dataset | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  setMetadata(key: string, data: Dataset): void {
    this.store.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  getConfig(): ConfigResponse | null {
    if (!this.configCache) return null;
    if (Date.now() > this.configCache.expiresAt) {
      this.configCache = null;
      return null;
    }
    return this.configCache.data;
  }

  setConfig(data: ConfigResponse): void {
    this.configCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  }

  clear(): void {
    this.store.clear();
    this.configCache = null;
  }
}

// ---------------------------------------------------------------------------
// HTTP helpers — use native fetch (Node 18+ built-in with keep-alive)
// ---------------------------------------------------------------------------

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent': 'SCB-MCP-Client/2.0',
};

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class SCBApiClient {
  private baseUrl: string;
  private rateLimitInfo: RateLimitInfo | null = null;
  private requestCount = 0;
  private windowStartTime = new Date();
  private cache = new MetadataCache();

  constructor(baseUrl = 'https://statistikdatabasen.scb.se/api/v2') {
    this.baseUrl = baseUrl;
  }

  // -----------------------------------------------------------------------
  // Rate limiting
  // -----------------------------------------------------------------------

  private async initializeRateLimit(): Promise<void> {
    if (this.rateLimitInfo) return;

    try {
      const url = `${this.baseUrl}/config`;
      const response = await fetch(url, { headers: DEFAULT_HEADERS });

      if (!response.ok) {
        this.rateLimitInfo = { remaining: 30, resetTime: new Date(Date.now() + 10000), maxCalls: 30, timeWindow: 10 };
        return;
      }

      const data = await response.json();
      const config = ConfigResponseSchema.parse(data);

      this.rateLimitInfo = {
        remaining: config.maxCallsPerTimeWindow,
        resetTime: new Date(Date.now() + config.timeWindow * 1000),
        maxCalls: config.maxCallsPerTimeWindow,
        timeWindow: config.timeWindow,
      };
    } catch {
      this.rateLimitInfo = { remaining: 30, resetTime: new Date(Date.now() + 10000), maxCalls: 30, timeWindow: 10 };
    }
  }

  private async checkRateLimit(): Promise<void> {
    if (!this.rateLimitInfo) {
      await this.initializeRateLimit();
    }

    const now = new Date();

    if (now >= this.rateLimitInfo!.resetTime) {
      this.requestCount = 0;
      this.windowStartTime = now;
      this.rateLimitInfo!.resetTime = new Date(now.getTime() + this.rateLimitInfo!.timeWindow * 1000);
      this.rateLimitInfo!.remaining = this.rateLimitInfo!.maxCalls;
    }

    if (this.requestCount >= this.rateLimitInfo!.maxCalls) {
      const waitTime = this.rateLimitInfo!.resetTime.getTime() - now.getTime();
      throw new Error(`Rate limit: vänta ${Math.ceil(waitTime / 1000)}s (${this.requestCount}/${this.rateLimitInfo!.maxCalls})`);
    }
  }

  private trackRequest(): void {
    this.requestCount++;
    if (this.rateLimitInfo) {
      this.rateLimitInfo.remaining = Math.max(0, this.rateLimitInfo.maxCalls - this.requestCount);
    }
  }

  // -----------------------------------------------------------------------
  // Core HTTP
  // -----------------------------------------------------------------------

  private async makeRequest<T>(endpoint: string, schema: any): Promise<T> {
    await this.checkRateLimit();

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, { headers: DEFAULT_HEADERS });
    this.trackRequest();

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit (429). Vänta och försök igen.');
      }
      let errorDetails = '';
      try {
        const errorText = await response.text();
        if (!errorText.includes('<!DOCTYPE')) {
          errorDetails = `: ${errorText.substring(0, 200)}`;
        }
      } catch {}
      throw new Error(`API fel: ${response.status} ${response.statusText}${errorDetails}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Förväntat JSON men fick ${contentType}. Svar: ${text.substring(0, 100)}...`);
    }

    const data = await response.json();
    return schema.parse(data);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  async getConfig(): Promise<ConfigResponse> {
    const cached = this.cache.getConfig();
    if (cached) return cached;
    const config = await this.makeRequest<ConfigResponse>('/config', ConfigResponseSchema);
    this.cache.setConfig(config);
    return config;
  }

  async searchTables(params: {
    query?: string;
    pastDays?: number;
    includeDiscontinued?: boolean;
    pageNumber?: number;
    pageSize?: number;
    lang?: string;
  } = {}): Promise<TablesResponse> {
    const searchParams = new URLSearchParams();

    if (params.query) searchParams.set('query', params.query);
    if (params.pastDays) searchParams.set('pastDays', params.pastDays.toString());
    if (params.includeDiscontinued !== undefined) searchParams.set('includeDiscontinued', params.includeDiscontinued.toString());
    if (params.pageNumber) searchParams.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params.lang) searchParams.set('lang', params.lang);

    return this.makeRequest(`/tables?${searchParams.toString()}`, TablesResponseSchema);
  }

  /**
   * Get table metadata (cached with 5 min TTL)
   */
  async getTableMetadata(tableId: string, lang = 'sv'): Promise<Dataset> {
    const cacheKey = `${tableId}:${lang}`;
    const cached = this.cache.getMetadata(cacheKey);
    if (cached) return cached;

    const metadata = await this.makeRequest<Dataset>(`/tables/${tableId}/metadata?lang=${lang}`, DatasetSchema);
    this.cache.setMetadata(cacheKey, metadata);
    return metadata;
  }

  /**
   * Get table data with auto-complete and markdown decoding
   */
  async getTableData(
    tableId: string,
    selection?: Record<string, string[]>,
    lang = 'sv'
  ): Promise<{ dataset: Dataset; decoded: DecodedTable; autoCompleted: boolean }> {
    const metadata = await this.getTableMetadata(tableId, lang);

    // Auto-complete missing variables
    let finalSelection = selection;
    let autoCompleted = false;

    if (selection && Object.keys(selection).length > 0) {
      const result = autoCompleteSelection(metadata, selection);
      finalSelection = result.selection;
      autoCompleted = result.addedVariables.length > 0;
    }

    // Estimate cells and check for batching
    let dataset: Dataset;

    if (finalSelection) {
      const estimated = estimateCellCount(metadata, finalSelection);
      const config = await this.getConfig();
      const maxCells = config.maxDataCells;

      const batchPlan = createBatchPlan(metadata, finalSelection, maxCells, estimated);

      if (batchPlan) {
        // Execute batches sequentially
        const datasets: Dataset[] = [];
        for (const batch of batchPlan.batches) {
          const ds = await this.fetchData(tableId, batch.selection, lang);
          datasets.push(ds);
        }
        dataset = mergeDatasets(datasets, batchPlan.splitDimension);
      } else {
        dataset = await this.fetchData(tableId, finalSelection, lang);
      }
    } else {
      const endpoint = `/tables/${tableId}/data?lang=${lang}&outputFormat=json-stat2`;
      dataset = await this.makeRequest(endpoint, DatasetSchema);
    }

    const decoded = decodeJsonStat2ToMarkdown(dataset);

    return { dataset, decoded, autoCompleted };
  }

  /**
   * Validate a selection against table metadata with auto-complete
   */
  async validateSelection(
    tableId: string,
    selection: Record<string, string[]>,
    lang = 'sv'
  ): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
    completedSelection: Record<string, string[]>;
    estimatedCells: number;
  }> {
    const metadata = await this.getTableMetadata(tableId, lang);
    const result = autoCompleteSelection(metadata, selection);

    const errors: string[] = [];
    const suggestions: string[] = [];

    if (metadata.dimension) {
      const availableVariables = Object.keys(metadata.dimension);

      for (const [varCode, values] of Object.entries(selection)) {
        if (!availableVariables.includes(varCode)) {
          const similar = availableVariables.filter(v =>
            v.toLowerCase().includes(varCode.toLowerCase()) ||
            metadata.dimension![v].label.toLowerCase().includes(varCode.toLowerCase())
          );
          errors.push(`Variabel "${varCode}" finns inte i tabellen`);
          if (similar.length > 0) {
            suggestions.push(`Menade du: ${similar.map(v => `"${v}"`).join(', ')}?`);
          } else {
            suggestions.push(`Tillgängliga variabler: ${availableVariables.join(', ')}`);
          }
          continue;
        }

        const dimDef = metadata.dimension[varCode];
        const availableValues = Object.keys(dimDef.category.index);

        for (const value of values) {
          if (value === '*' || value.match(/^(TOP|BOTTOM|RANGE)\(/i)) {
            continue;
          }
          if (!availableValues.includes(value)) {
            errors.push(`Värdet "${value}" finns inte för "${varCode}"`);
            const similarValues = availableValues.filter(v => v.toLowerCase().includes(value.toLowerCase())).slice(0, 3);
            if (similarValues.length > 0) {
              suggestions.push(`För "${varCode}", menade du: ${similarValues.join(', ')}?`);
            }
          }
        }
      }

      const config = await this.getConfig();
      if (result.estimatedCells > config.maxDataCells) {
        suggestions.push(`Queryn estimeras till ${result.estimatedCells.toLocaleString('sv-SE')} celler (max: ${config.maxDataCells.toLocaleString('sv-SE')}). Batching kommer användas.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions: [...suggestions, ...result.warnings],
      completedSelection: result.selection,
      estimatedCells: result.estimatedCells,
    };
  }

  /**
   * Browse tables by subject code (exploratory navigation).
   *
   * Uses the subject node's label as API search text (much better than code),
   * then filters client-side by exact path matching.
   *
   * @param searchLabel - The human-readable label for the subject (e.g., "Folkmängd")
   *   Used as the API query parameter for better results than the code itself.
   */
  async browseTables(params: {
    subjectCode?: string;
    searchLabel?: string;
    pageSize?: number;
    lang?: string;
  } = {}): Promise<TablesResponse> {
    const searchParams = new URLSearchParams();
    // Use the label as query text — much better API results than searching by code
    const queryText = params.searchLabel || params.subjectCode || '*';
    searchParams.set('query', queryText);
    searchParams.set('pageSize', String(params.pageSize || 100));
    if (params.lang) searchParams.set('lang', params.lang);

    const result = await this.makeRequest<TablesResponse>(`/tables?${searchParams.toString()}`, TablesResponseSchema);

    // Client-side filter by exact path matching
    if (params.subjectCode) {
      const code = params.subjectCode.toUpperCase();
      result.tables = result.tables.filter(t =>
        t.subjectCode?.toUpperCase().startsWith(code) ||
        t.paths?.some(p => p.some(segment => segment.id.toUpperCase().startsWith(code)))
      );
    }

    return result;
  }

  /**
   * Get codelist for a specific variable in a table
   */
  async getCodelist(
    tableId: string,
    variableCode: string,
    filter?: string,
    lang = 'sv'
  ): Promise<{
    variable: string;
    label: string;
    totalCodes: number;
    codes: Array<{ code: string; label: string }>;
    elimination: boolean;
    eliminationDefault: string | null;
  }> {
    const metadata = await this.getTableMetadata(tableId, lang);

    if (!metadata.dimension || !metadata.dimension[variableCode]) {
      const match = Object.keys(metadata.dimension || {}).find(
        k => k.toLowerCase() === variableCode.toLowerCase()
      );
      if (!match) {
        const available = Object.keys(metadata.dimension || {}).map(k => `"${k}"`).join(', ');
        throw new Error(`Variabel "${variableCode}" finns inte i tabell ${tableId}. Tillgängliga: ${available}`);
      }
      variableCode = match;
    }

    const dimDef = metadata.dimension![variableCode];
    const labels = dimDef.category.label || {};
    const allCodes = Object.entries(dimDef.category.index)
      .map(([code, idx]) => ({ code, label: labels[code] || code, index: idx as number }))
      .sort((a, b) => a.index - b.index);

    let filteredCodes = allCodes;
    if (filter) {
      const normalizedFilter = filter.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/å/g, 'a');
      filteredCodes = allCodes.filter(c => {
        const normalizedLabel = c.label.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/å/g, 'a');
        return normalizedLabel.includes(normalizedFilter) || c.code.includes(filter);
      });
    }

    return {
      variable: variableCode,
      label: dimDef.label,
      totalCodes: allCodes.length,
      codes: filteredCodes.map(c => ({ code: c.code, label: c.label })),
      elimination: dimDef.extension?.elimination || false,
      eliminationDefault: dimDef.extension?.eliminationValueCode || null,
    };
  }

  // -----------------------------------------------------------------------
  // Region search (delegate to local regions DB — imported by index.ts)
  // -----------------------------------------------------------------------

  async searchRegions(query: string, lang = 'sv'): Promise<Array<{ code: string; name: string; type: string }>> {
    const tablesToSearch = ['TAB6473', 'TAB4422'];
    const results: Array<{ code: string; name: string; type: string }> = [];
    const seen = new Set<string>();

    for (const tableId of tablesToSearch) {
      try {
        const metadata = await this.getTableMetadata(tableId, lang);
        if (!metadata.dimension || !metadata.dimension.Region) continue;

        const regionDef = metadata.dimension.Region;
        const regionCodes = Object.keys(regionDef.category.index);

        for (const code of regionCodes) {
          const label = regionDef.category.label?.[code] || code;
          const key = `${code}:${label}`;
          if (seen.has(key)) continue;

          if (label.toLowerCase().includes(query.toLowerCase()) || code.includes(query)) {
            let type = 'region';
            if (code.length === 2) type = 'county';
            else if (code.length === 4) type = 'municipality';
            else if (code === '00') type = 'country';

            results.push({ code, name: label, type });
            seen.add(key);
          }
        }
      } catch {
        continue;
      }
      if (results.length >= 50) break;
    }

    return results.sort((a, b) => {
      const typeOrder: Record<string, number> = { country: 0, county: 1, municipality: 2, region: 3 };
      if (a.type !== b.type) return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      return a.name.localeCompare(b.name);
    });
  }

  async findRegionCode(
    query: string,
    tableId?: string,
    lang = 'sv'
  ): Promise<{ exact_matches: Array<{ code: string; name: string; type: string; table: string }>; suggestions: string[] }> {
    const exactMatches: Array<{ code: string; name: string; type: string; table: string }> = [];
    const suggestions: string[] = [];
    const tables = tableId ? [tableId] : ['TAB6473', 'TAB4422'];

    for (const tId of tables) {
      try {
        const metadata = await this.getTableMetadata(tId, lang);
        if (!metadata.dimension || !metadata.dimension.Region) continue;

        const regionDef = metadata.dimension.Region;
        const regionCodes = Object.keys(regionDef.category.index);

        for (const code of regionCodes) {
          const label = regionDef.category.label?.[code] || code;
          if (label.toLowerCase() === query.toLowerCase()) {
            let type = 'region';
            if (code.length === 2) type = 'county';
            else if (code.length === 4) type = 'municipality';
            else if (code === '00') type = 'country';
            exactMatches.push({ code, name: label, type, table: tId });
          } else if (label.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push(`${label} (${code})`);
          }
        }
      } catch {
        continue;
      }
    }

    return { exact_matches: exactMatches, suggestions: suggestions.slice(0, 10) };
  }

  // -----------------------------------------------------------------------
  // Utilities
  // -----------------------------------------------------------------------

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  getUsageInfo(): { requestCount: number; windowStart: Date; rateLimitInfo: RateLimitInfo | null } {
    return { requestCount: this.requestCount, windowStart: this.windowStartTime, rateLimitInfo: this.rateLimitInfo };
  }

  transformToStructuredData(jsonStat2Data: Dataset, selection?: Record<string, string[]>): {
    query: any;
    data: Array<Record<string, any>>;
    metadata: any;
    summary: any;
  } {
    const records: Array<Record<string, any>> = [];

    if (!jsonStat2Data.value || !jsonStat2Data.dimension) {
      return {
        query: { selection, table_id: null },
        data: [],
        metadata: { source: jsonStat2Data.source || 'Statistics Sweden', updated: jsonStat2Data.updated, table_name: jsonStat2Data.label },
        summary: { total_records: 0, has_data: false },
      };
    }

    const dimensions = Object.entries(jsonStat2Data.dimension);
    const dimensionSizes = dimensions.map(([_, dimDef]) => Object.keys(dimDef.category.index).length);

    jsonStat2Data.value.forEach((value, flatIndex) => {
      if (value === null) return;

      const record: Record<string, any> = {};
      let temp = flatIndex;
      for (let i = dimensions.length - 1; i >= 0; i--) {
        const [dimName, dimDef] = dimensions[i];
        const dimSize = dimensionSizes[i];
        const dimIndex = temp % dimSize;
        temp = Math.floor(temp / dimSize);

        const codes = Object.keys(dimDef.category.index);
        const code = codes[dimIndex];
        const label = dimDef.category.label ? dimDef.category.label[code] : code;

        const baseName = this.getDimensionBaseName(dimName);
        record[`${baseName}_code`] = code;
        record[`${baseName}_name`] = label || code;
      }
      record.value = value;
      records.push(record);
    });

    const totalRecords = records.length;
    const totalValue = records.reduce((sum, record) => sum + (record.value || 0), 0);
    const nonNullRecords = records.filter(r => r.value !== null && r.value !== undefined);
    const tableId = jsonStat2Data.extension?.px?.tableid || (jsonStat2Data.id ? jsonStat2Data.id[0] : null);

    return {
      query: { selection: selection || {}, table_id: tableId, requested_at: new Date().toISOString() },
      data: records,
      metadata: {
        source: jsonStat2Data.source || 'Statistics Sweden',
        updated: jsonStat2Data.updated,
        table_name: jsonStat2Data.label,
        data_shape: jsonStat2Data.size,
        dimensions: dimensions.map(([name, def]) => ({
          name,
          label: def.label,
          values_count: Object.keys(def.category.index).length,
        })),
      },
      summary: {
        total_records: totalRecords,
        non_null_records: nonNullRecords.length,
        total_value: totalValue,
        has_data: totalRecords > 0,
      },
    };
  }

  getDimensionBaseName(dimName: string): string {
    const nameMapping: Record<string, string> = {
      Region: 'region', Alder: 'age', Kon: 'sex', Tid: 'year',
      UtbildningsNiva: 'education_level', ContentsCode: 'observation_type',
      Sysselsattning: 'employment_status', Civilstand: 'marital_status', Familjetyp: 'family_type',
    };
    return nameMapping[dimName] || dimName.toLowerCase();
  }

  clearCache(): void {
    this.cache.clear();
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  private async fetchData(
    tableId: string,
    selection: Record<string, string[]>,
    lang: string
  ): Promise<Dataset> {
    const url = `${this.baseUrl}/tables/${tableId}/data?lang=${lang}&outputFormat=json-stat2`;
    await this.checkRateLimit();

    const selectionArray = Object.entries(selection).map(([variableCode, valueCodes]) => ({
      variableCode,
      valueCodes: Array.isArray(valueCodes) ? valueCodes : [valueCodes],
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ selection: selectionArray }),
    });

    this.trackRequest();

    if (!response.ok) {
      if (response.status === 429) throw new Error('Rate limit (429). Vänta och försök igen.');
      if (response.status === 403) throw new Error('Förbjuden (403). Queryn ger för många celler. Använd mer specifika filter.');
      if (response.status === 400) {
        let errorText = '';
        try { errorText = await response.text(); } catch {}
        throw new Error(`Felaktig förfrågan (400): ${errorText.substring(0, 200)}`);
      }
      throw new Error(`API fel: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return DatasetSchema.parse(data);
  }
}
