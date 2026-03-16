#!/usr/bin/env node

/**
 * SCB MCP Server — v3.0
 *
 * 7-tool pipeline for Swedish official statistics:
 *   Discovery:  scb_search, scb_browse
 *   Inspection: scb_inspect, scb_codelist
 *   Data:       scb_preview, scb_validate, scb_fetch
 *
 * Plus utility tools: scb_find_region_code, scb_search_regions, scb_check_usage
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'url';
import { SCBApiClient } from './api-client.js';
import { resources, getResourceContent } from './resources.js';
import { ALL_REGIONS, searchRegions, findRegion, REGION_STATS, normalizeForSearch } from './regions.js';
import { LLM_INSTRUCTIONS, STATISTICS_CATEGORIES, WORKFLOW_TEMPLATES, USAGE_TIPS, getCategoryDescriptions } from './instructions.js';
import { SUBJECT_TREE, findSubjectNode, getSubjectChildren, getSearchKeywords, formatSubjectTree } from './subjects.js';

// ============================================================================
// CONSTANTS AND HELPERS
// ============================================================================

const SUPPORTED_LANGUAGES = ['sv', 'en'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
const DEFAULT_LANGUAGE: SupportedLanguage = 'sv';
const MAX_PAGE_SIZE = 100;

function validateLanguage(language: string | undefined): { valid: boolean; language: SupportedLanguage; warning?: string } {
  if (!language) return { valid: true, language: DEFAULT_LANGUAGE };
  const langLower = language.toLowerCase() as SupportedLanguage;
  if (SUPPORTED_LANGUAGES.includes(langLower)) return { valid: true, language: langLower };
  return {
    valid: false,
    language: DEFAULT_LANGUAGE,
    warning: `Språk '${language}' stöds inte. Använder '${DEFAULT_LANGUAGE}'.`,
  };
}

function jsonResponse(data: any) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResponse(type: string, message: string, suggestions: string[] = []) {
  return jsonResponse({ error: { type, message }, suggestions });
}

// ============================================================================
// MCP SERVER
// ============================================================================

// Per-tool call counter to prevent infinite loops from LLMs
const MAX_CALLS_PER_TOOL = 8;

class CallTracker {
  private calls: Map<string, number> = new Map();
  private lastReset: number = Date.now();
  private readonly RESET_INTERVAL = 5 * 60 * 1000; // Reset every 5 minutes

  track(toolName: string, tableId?: string): { allowed: boolean; count: number } {
    // Reset if enough time has passed (new conversation likely)
    if (Date.now() - this.lastReset > this.RESET_INTERVAL) {
      this.calls.clear();
      this.lastReset = Date.now();
    }
    const key = tableId ? `${toolName}:${tableId}` : toolName;
    const count = (this.calls.get(key) || 0) + 1;
    this.calls.set(key, count);
    return { allowed: count <= MAX_CALLS_PER_TOOL, count };
  }

  reset() {
    this.calls.clear();
    this.lastReset = Date.now();
  }
}

export class SCBMCPServer {
  private server: Server;
  private apiClient: SCBApiClient;
  private callTracker: CallTracker;

  constructor() {
    this.server = new Server(
      { name: 'SCB MCP Server', version: '3.0.0' },
      { capabilities: { tools: {}, resources: {}, prompts: {} } }
    );
    this.apiClient = new SCBApiClient();
    this.callTracker = new CallTracker();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: this.getTools() }));

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const content = getResourceContent(uri);
      if (!content) throw new Error(`Resource not found: ${uri}`);
      return { contents: [{ uri, mimeType: content.mimeType, text: content.content }] };
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'get_started',
          description: 'Introduktion till SCB MCP Server — börja här',
        },
        {
          name: 'find_population_data',
          description: 'Guide: hitta befolkningsstatistik',
          arguments: [{ name: 'municipality', description: 'Kommunnamn', required: false }],
        },
      ],
    }));

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return this.getPrompt(name, args || {});
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.callTool(name, args);
    });
  }

  // ==========================================================================
  // TOOL DEFINITIONS — 7 core + 3 utility
  // ==========================================================================

  public getTools(): Tool[] {
    return [
      // ---- DISCOVERY ----
      {
        name: 'scb_search',
        description: 'Sök efter statistiktabeller i SCB:s databas. Använd SVENSKA söktermer för bäst resultat. Exempel: "befolkning", "arbetslöshet", "inkomst".',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Sökterm (svenska rekommenderas)' },
            category: { type: 'string', description: 'Filtrera: population, labour, economy, housing, environment, education, health, transport' },
            pageSize: { type: 'number', description: 'Resultat per sida (max 100)', default: 20 },
            pageNumber: { type: 'number', description: 'Sidnummer', default: 1 },
            language: { type: 'string', description: '"sv" (standard) eller "en"', default: 'sv' },
          },
        },
        annotations: { title: 'Sök tabeller', readOnlyHint: true, openWorldHint: true },
      },
      {
        name: 'scb_browse',
        description:
          'Navigera SCB:s ämnesområdesträd i 3 nivåer. REKOMMENDERAT arbetsflöde:\n' +
          '1. Utan subjectCode → visa alla 20+ ämnesområden (nivå 1)\n' +
          '2. Med t.ex. "BE" → visa underområden (nivå 2: BE0101=Befolkningsstatistik, BE0401=Framskrivningar)\n' +
          '3. Med t.ex. "BE0101A" → visa tabeller i det ämnet (Folkmängd)\n\n' +
          'Vanliga koder: BE=Befolkning, AM=Arbetsmarknad, NR=Nationalräkenskaper, HE=Hushållens ekonomi, BO=Boende, UF=Utbildning, MI=Miljö, PR=Priser, OE=Offentlig ekonomi, TK=Transport',
        inputSchema: {
          type: 'object',
          properties: {
            subjectCode: {
              type: 'string',
              description: 'Ämnesområdeskod. Nivå 1: "BE", "AM". Nivå 2: "BE0101". Nivå 3: "BE0101A". Utelämna för att se alla nivå 1.',
            },
            pageSize: { type: 'number', description: 'Max antal tabeller vid nivå 3', default: 50 },
            language: { type: 'string', description: '"sv" (standard) eller "en"', default: 'sv' },
          },
        },
        annotations: { title: 'Bläddra ämnesområden', readOnlyHint: true, openWorldHint: true },
      },
      // ---- INSPECTION ----
      {
        name: 'scb_inspect',
        description: 'Hämta komplett metadata för en tabell: alla variabler, deras värden, eliminationsdefaults, tidsperioder och kontaktinformation. Kombinerar tidigare scb_get_table_info + scb_get_table_variables.',
        inputSchema: {
          type: 'object',
          properties: {
            tableId: { type: 'string', description: 'Tabell-ID (t.ex. "TAB638", "TAB5663")' },
            language: { type: 'string', description: '"sv" (standard) eller "en"', default: 'sv' },
          },
          required: ['tableId'],
        },
        annotations: { title: 'Inspektera tabell', readOnlyHint: true, openWorldHint: true },
      },
      {
        name: 'scb_codelist',
        description: 'Utforska kodlistan för en specifik variabel i en tabell. T.ex. alla regionkoder, SNI-koder, SSYK-koder. Stödjer filtrering.',
        inputSchema: {
          type: 'object',
          properties: {
            tableId: { type: 'string', description: 'Tabell-ID' },
            variable: { type: 'string', description: 'Variabelkod (t.ex. "Region", "Kon", "Tid", "SNI2007")' },
            filter: { type: 'string', description: 'Filtrera koder (t.ex. "Stockholm", "2024")' },
            language: { type: 'string', description: '"sv" (standard) eller "en"', default: 'sv' },
          },
          required: ['tableId', 'variable'],
        },
        annotations: { title: 'Visa kodlista', readOnlyHint: true, openWorldHint: true },
      },
      // ---- DATA ----
      // NOTE: scb_validate and scb_preview are hidden from tool list to prevent
      // LLM loops, but their handlers remain active for backwards compatibility.
      // scb_fetch has built-in auto-complete so validate is not needed.
      {
        name: 'scb_fetch',
        description: 'Hämta statistikdata. Returnerar BÅDE strukturerad JSON och en markdown-tabell. Auto-kompletterar saknade variabler. Hanterar batching för stora queries automatiskt.',
        inputSchema: {
          type: 'object',
          properties: {
            tableId: { type: 'string', description: 'Tabell-ID' },
            selection: {
              type: 'object',
              description: 'Selektion: {"Region": ["1480"], "Tid": ["TOP(5)"]}. Saknade variabler fylls i automatiskt.',
              additionalProperties: { type: 'array', items: { type: 'string' } },
            },
            language: { type: 'string', description: '"sv" (standard) eller "en"', default: 'sv' },
          },
          required: ['tableId'],
        },
        annotations: { title: 'Hämta data', readOnlyHint: true, openWorldHint: true },
      },
      // ---- UTILITY ----
      {
        name: 'scb_find_region_code',
        description: 'Hitta regionkod för en kommun/län. Fuzzy-matching: "Goteborg" → "Göteborg" (1480). ALLTID kör detta innan du använder regionkoder.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Kommun- eller länsnamn' },
            tableId: { type: 'string', description: 'Valfritt: verifiera kod mot specifik tabell' },
            language: { type: 'string', description: '"sv" (standard) eller "en"', default: 'sv' },
          },
          required: ['query'],
        },
        annotations: { title: 'Hitta regionkod', readOnlyHint: true, openWorldHint: false },
      },
      {
        name: 'scb_search_regions',
        description: 'Sök bland alla 312 svenska regioner (1 rike, 21 län, 290 kommuner). Fuzzy-matching stöds.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Regionnamn eller kod' },
          },
          required: ['query'],
        },
        annotations: { title: 'Sök regioner', readOnlyHint: true, openWorldHint: false },
      },
      {
        name: 'scb_check_usage',
        description: 'Visa aktuell API-användning och rate limit-status.',
        inputSchema: { type: 'object', properties: {} },
        annotations: { title: 'API-status', readOnlyHint: true, openWorldHint: false },
      },
    ];
  }

  // ==========================================================================
  // TOOL DISPATCH
  // ==========================================================================

  public async callTool(name: string, args: any) {
    try {
      // Track calls to prevent infinite loops from LLMs
      // Use tableId for data tools, subjectCode for browse, query for search/region
      const contextKey = args?.tableId || args?.table_id || args?.subjectCode || args?.query;
      const { allowed, count } = this.callTracker.track(name, contextKey);
      if (!allowed) {
        return jsonResponse({
          error: 'STOPP — du har redan anropat detta verktyg flera gånger med samma tabell.',
          action: 'Presentera resultaten du redan har för användaren NU. Anropa INGA fler SCB-verktyg.',
          call_count: count,
          max_allowed: MAX_CALLS_PER_TOOL,
        });
      }

      switch (name) {
        // Discovery
        case 'scb_search': case 'scb_search_tables': return await this.handleSearch(args);
        case 'scb_browse': return await this.handleBrowse(args);
        // Inspection
        case 'scb_inspect': case 'scb_get_table_info': case 'scb_get_table_variables': return await this.handleInspect(args);
        case 'scb_codelist': return await this.handleCodelist(args);
        // Data
        case 'scb_preview': case 'scb_preview_data': return await this.handlePreview(args);
        case 'scb_validate': case 'scb_test_selection': return await this.handleValidate(args);
        case 'scb_fetch': case 'scb_get_table_data': return await this.handleFetch(args);
        // Utility
        case 'scb_find_region_code': return await this.handleFindRegionCode(args);
        case 'scb_search_regions': return await this.handleSearchRegions(args);
        case 'scb_check_usage': case 'scb_get_api_status': return await this.handleCheckUsage();
        default:
          throw new Error(`Okänt verktyg: ${name}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return jsonResponse({
        error: msg,
        action: 'Om detta verktyg redan har misslyckats, försök INTE igen. Presentera vad du har eller prova ett annat verktyg.',
      });
    }
  }

  // ==========================================================================
  // HANDLER IMPLEMENTATIONS
  // ==========================================================================

  // ---- scb_search ----
  private async handleSearch(args: any) {
    const langValidation = validateLanguage(args.language);
    const language = langValidation.language;
    let pageSize = Math.min(args.pageSize || 20, MAX_PAGE_SIZE);

    const result = await this.apiClient.searchTables({ ...args, language, pageSize });

    // Category filtering
    const categoryKeywords: Record<string, string[]> = {
      population: ['befolkning', 'population', 'folk', 'födelse', 'dödsfall', 'migration', 'ålder', 'kön'],
      labour: ['arbete', 'sysselsättning', 'arbetslös', 'yrke', 'lön', 'employment'],
      economy: ['bnp', 'gdp', 'ekonomi', 'inkomst', 'skatt', 'pris', 'inflation', 'handel', 'företag'],
      housing: ['bostad', 'boende', 'lägenhet', 'hus', 'hyra', 'fastighet', 'byggnation'],
      environment: ['miljö', 'utsläpp', 'klimat', 'energi', 'avfall', 'vatten'],
      education: ['utbildning', 'skola', 'student', 'elev', 'universitet', 'examen'],
      health: ['hälsa', 'sjukvård', 'sjukdom', 'vård', 'dödsorsak'],
      transport: ['transport', 'trafik', 'fordon', 'bil', 'kollektivtrafik', 'flyg', 'järnväg'],
    };

    let filteredTables = result.tables;
    if (args.category && categoryKeywords[args.category.toLowerCase()]) {
      const keywords = categoryKeywords[args.category.toLowerCase()];
      filteredTables = result.tables.filter(table => {
        const text = [table.label, table.description || '', ...(table.variableNames || [])].join(' ').toLowerCase();
        return keywords.some(kw => text.includes(kw));
      });
    }

    // Relevance ranking: boost tables where query appears in title, prefer recent and non-discontinued
    if (args.query) {
      const queryLower = args.query.toLowerCase();
      const queryTerms = queryLower.split(/\s+/).filter((t: string) => t.length > 2);
      filteredTables = [...filteredTables].sort((a, b) => {
        const scoreTable = (t: typeof a) => {
          let score = 0;
          const title = (t.label || '').toLowerCase();
          // Strong boost for title starting with query
          if (title.startsWith(queryLower)) score += 100;
          // Boost for exact query match in title
          if (title.includes(queryLower)) score += 50;
          // Boost per query term found in title
          for (const term of queryTerms) {
            if (title.includes(term)) score += 20;
          }
          // Boost for recent data (still active)
          if (!t.discontinued) score += 10;
          // Boost for tables with region variable (commonly wanted)
          if (t.variableNames?.some((v: string) => v.toLowerCase() === 'region')) score += 5;
          // Slight boost for newer last period
          if (t.lastPeriod) {
            const year = parseInt(t.lastPeriod.replace(/\D.*/, ''), 10);
            if (!isNaN(year) && year >= 2023) score += 5;
          }
          return score;
        };
        return scoreTable(b) - scoreTable(a);
      });
    }

    const displayTables = filteredTables.slice(0, pageSize);

    return jsonResponse({
      query: { search_term: args.query || null, category: args.category || null, language: language },
      tables: displayTables.map(t => ({
        id: t.id,
        title: t.label,
        description: t.description || null,
        period: { start: t.firstPeriod || null, end: t.lastPeriod || null },
        variables: t.variableNames || [],
        updated: t.updated || null,
        discontinued: t.discontinued || false,
      })),
      pagination: {
        current_page: result.page.pageNumber,
        total_pages: result.page.totalPages,
        total_results: result.page.totalElements,
        showing: displayTables.length,
      },
    });
  }

  // ---- scb_browse ----
  private async handleBrowse(args: any) {
    const pageSize = Math.min(args.pageSize || 50, MAX_PAGE_SIZE);
    const subjectCode = args.subjectCode?.trim();

    // Build the v1 navigation path from the subject code
    // e.g. "BE0101A" → ["BE", "BE0101", "BE0101A"]
    const pathSegments = this.buildNavPath(subjectCode);

    // Call v1 navigation API
    const items = await this.apiClient.navigateV1(pathSegments);

    // Separate folders and tables
    const folders = items.filter(i => i.type === 'l');
    const tables = items.filter(i => i.type === 't');

    if (tables.length > 0) {
      // Leaf node — return table listing
      // For each v1 table, try to find the v2 table ID via search
      const v2Tables = await this.mapV1TablesToV2(tables.slice(0, pageSize), pathSegments);

      return jsonResponse({
        level: 'tables',
        subject_code: subjectCode || null,
        path: pathSegments,
        tables: v2Tables,
        total_tables: tables.length,
        tips: [
          'Använd scb_inspect med ett tabell-ID (TABxxx) för att se variabler och värden',
          'Sedan scb_fetch för att hämta data',
        ],
      });
    }

    if (folders.length > 0) {
      // Non-leaf node — return child folders
      return jsonResponse({
        level: pathSegments.length + 1,
        parent: subjectCode || 'root',
        path: pathSegments,
        children: folders.map(f => ({
          code: f.id,
          label: f.text,
        })),
        total: folders.length,
        tips: pathSegments.length === 0
          ? ['Välj ett ämnesområde, t.ex. scb_browse({subjectCode: "BE"}) för Befolkning']
          : [`Bläddra djupare, t.ex. scb_browse({subjectCode: "${folders[0].id}"})`],
      });
    }

    return jsonResponse({
      error: `Inga resultat hittades för "${subjectCode}". Kontrollera koden.`,
      tips: ['Börja med scb_browse() utan argument för att se alla ämnesområden'],
    });
  }

  /**
   * Build v1 navigation path segments from a subject code.
   * "BE0101A" → ["BE", "BE0101", "BE0101A"]
   * "BE0101"  → ["BE", "BE0101"]
   * "BE"      → ["BE"]
   * undefined → []
   */
  private buildNavPath(code?: string): string[] {
    if (!code) return [];
    const parts: string[] = [];
    // Level 1: first 2 chars (e.g. "BE")
    if (code.length >= 2) parts.push(code.slice(0, 2));
    // Level 2: first 6 chars (e.g. "BE0101")
    if (code.length >= 4) parts.push(code.slice(0, 6).replace(/0+$/, '') || code.slice(0, 4));
    // Level 3+: full code (e.g. "BE0101A")
    if (code.length > 6) parts.push(code);
    // Deduplicate in case of short codes
    return [...new Set(parts)];
  }

  /**
   * Map v1 table items to v2 table IDs via v2 search API.
   * Uses title-based matching with path filtering.
   */
  private async mapV1TablesToV2(
    v1Tables: Array<{ id: string; text: string; updated?: string }>,
    subjectPath: string[]
  ): Promise<Array<{ v1_id: string; v2_id: string | null; title: string; updated: string | null }>> {
    const leafCode = subjectPath[subjectPath.length - 1]?.toUpperCase();

    // Collect all v2 tables matching this subject by doing a few targeted searches
    const v2Candidates: Array<{ id: string; label: string; paths?: any[] }> = [];
    const seen = new Set<string>();

    // Extract unique search terms from v1 titles
    const searchTerms = new Set<string>();
    for (const t of v1Tables) {
      // Use first meaningful words from title, e.g. "Folkmängden" from "Folkmängden efter region..."
      const firstWord = t.text.split(/\s+/)[0];
      if (firstWord && firstWord.length > 3) searchTerms.add(firstWord);
    }

    // Search v2 API with each unique term
    for (const term of [...searchTerms].slice(0, 4)) {
      try {
        const result = await this.apiClient.searchTables({ query: term, pageSize: 100, lang: 'sv' });
        for (const t of result.tables) {
          if (seen.has(t.id)) continue;
          // Only keep tables matching our subject path
          const matchesPath = leafCode && t.paths?.some(p =>
            p.some(segment => segment.id?.toUpperCase() === leafCode)
          );
          if (matchesPath) {
            v2Candidates.push(t);
            seen.add(t.id);
          }
        }
      } catch {
        // Ignore failed searches
      }
    }

    // Now match each v1 table to a v2 candidate by title similarity
    return v1Tables.map(v1 => {
      const v1Title = v1.text.replace(/\s+/g, ' ').trim();
      // Normalize: strip year ranges like "År 1968 - 2024" for matching
      const v1Norm = v1Title.replace(/\.\s*År\s+.*$/, '').trim().toLowerCase();

      let bestMatch: { id: string; score: number } | null = null;
      for (const v2 of v2Candidates) {
        const v2Norm = (v2.label || '').replace(/\.\s*År\s+.*$/, '').trim().toLowerCase();
        // Score: how many characters match from start
        let matchLen = 0;
        for (let i = 0; i < Math.min(v1Norm.length, v2Norm.length); i++) {
          if (v1Norm[i] === v2Norm[i]) matchLen++;
          else break;
        }
        const score = matchLen / Math.max(v1Norm.length, v2Norm.length, 1);
        if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { id: v2.id, score };
        }
      }

      return {
        v1_id: v1.id,
        v2_id: bestMatch?.id || null,
        title: v1Title,
        updated: v1.updated || null,
      };
    });
  }

  // ---- scb_inspect ----
  private async handleInspect(args: { tableId: string; language?: string }) {
    const langValidation = validateLanguage(args.language);
    const language = langValidation.language;

    const metadata = await this.apiClient.getTableMetadata(args.tableId, language);

    const variables = Object.entries(metadata.dimension || {}).map(([code, def]) => {
      const allValues = Object.entries(def.category.index)
        .map(([valCode, idx]) => ({
          code: valCode,
          label: def.category.label?.[valCode] || valCode,
          index: idx as number,
        }))
        .sort((a, b) => a.index - b.index);

      return {
        code,
        label: def.label,
        total_values: allValues.length,
        elimination: def.extension?.elimination || false,
        elimination_default: def.extension?.eliminationValueCode || null,
        sample_values: allValues.slice(0, 15).map(v => ({ code: v.code, label: v.label })),
        has_more: allValues.length > 15,
      };
    });

    const totalCells = (metadata.size || []).reduce((a: number, b: number) => a * b, 1);

    return jsonResponse({
      table_id: args.tableId,
      table_name: metadata.label,
      source: metadata.source || 'Statistiska centralbyrån',
      updated: metadata.updated || null,
      total_cells: totalCells,
      variables,
      contacts: metadata.extension?.contact?.map(c => ({
        name: c.name, email: c.mail, phone: c.phone,
      })) || [],
      notes: metadata.extension?.notes?.map(n => n.text) || [],
      tips: [
        'Använd scb_codelist för att se ALLA värden för en variabel',
        'Använd scb_validate för att testa din selektion innan scb_fetch',
        `Exempel: scb_fetch({tableId: "${args.tableId}", selection: {${variables[0] ? `"${variables[0].code}": ["${variables[0].sample_values[0]?.code || '*'}"]` : ''}}})`,
      ],
    });
  }

  // ---- scb_codelist ----
  private async handleCodelist(args: { tableId: string; variable: string; filter?: string; language?: string }) {
    const langValidation = validateLanguage(args.language);
    const language = langValidation.language;

    const result = await this.apiClient.getCodelist(args.tableId, args.variable, args.filter, language);

    return jsonResponse({
      table_id: args.tableId,
      variable: result.variable,
      variable_label: result.label,
      total_codes: result.totalCodes,
      showing: result.codes.length,
      filtered: !!args.filter,
      elimination: result.elimination,
      elimination_default: result.eliminationDefault,
      codes: result.codes,
      usage_example: result.codes.length > 0
        ? { [result.variable]: [result.codes[0].code] }
        : null,
    });
  }

  // ---- scb_preview ----
  private async handlePreview(args: { tableId: string; selection?: Record<string, string[]>; language?: string }) {
    const langValidation = validateLanguage(args.language);
    const language = langValidation.language;

    // Force small preview: override time dimension to TOP(1)
    const previewSelection = { ...(args.selection || {}) };
    if (!previewSelection.Tid) {
      previewSelection.Tid = ['TOP(1)'];
    }

    const { dataset, decoded, autoCompleted } = await this.apiClient.getTableData(
      args.tableId,
      Object.keys(previewSelection).length > 0 ? previewSelection : undefined,
      language
    );

    // Limit markdown to 50 rows for preview
    const previewMarkdown = decoded.totalRows > 50
      ? decoded.markdown.split('\n').slice(0, 52).join('\n') + `\n\n*Förhandsgranskning: visar 50 av ${decoded.totalRows} rader*`
      : decoded.markdown;

    return jsonResponse({
      table_id: args.tableId,
      table_name: decoded.metadata.tableName,
      preview: true,
      auto_completed: autoCompleted,
      total_rows: decoded.totalRows,
      markdown_table: previewMarkdown,
      dimensions: decoded.metadata.dimensions,
      tips: [
        'Använd scb_fetch för fullständig data',
        'Ange mer specifika filter i selection för att begränsa resultatet',
      ],
    });
  }

  // ---- scb_validate ----
  private async handleValidate(args: { tableId: string; selection?: Record<string, string[]>; language?: string }) {
    const langValidation = validateLanguage(args.language);
    const language = langValidation.language;

    if (!args.selection || Object.keys(args.selection).length === 0) {
      // Empty selection — show metadata
      const metadata = await this.apiClient.getTableMetadata(args.tableId, language);
      const variables = Object.entries(metadata.dimension || {}).map(([code, def]) => ({
        code, label: def.label, values: Object.keys(def.category.index).length,
      }));

      return jsonResponse({
        table_id: args.tableId,
        is_valid: true,
        message: 'Tom selektion — API:et använder smarta defaults',
        available_variables: variables,
        tip: 'Ange en selektion för att validera specifika värden',
      });
    }

    const result = await this.apiClient.validateSelection(args.tableId, args.selection, language);

    return jsonResponse({
      table_id: args.tableId,
      is_valid: result.isValid,
      original_selection: args.selection,
      completed_selection: result.completedSelection,
      estimated_cells: result.estimatedCells,
      errors: result.errors,
      suggestions: result.suggestions,
      next_step: result.isValid
        ? `Redo! Kör: scb_fetch({tableId: "${args.tableId}", selection: ${JSON.stringify(result.completedSelection)}})`
        : `Fel hittades — men du kan köra scb_fetch direkt ändå (den auto-kompletterar). Kör: scb_fetch({tableId: "${args.tableId}", selection: ${JSON.stringify(result.completedSelection)}})`,
    });
  }

  // ---- scb_fetch ----
  private async handleFetch(args: { tableId: string; selection?: Record<string, string[]>; language?: string }) {
    const langValidation = validateLanguage(args.language);
    const language = langValidation.language;

    const { dataset, decoded, autoCompleted } = await this.apiClient.getTableData(
      args.tableId,
      args.selection,
      language
    );

    // Build structured data as well
    const structured = this.apiClient.transformToStructuredData(dataset, args.selection);

    return jsonResponse({
      table_id: args.tableId,
      table_name: decoded.metadata.tableName,
      source: decoded.metadata.source,
      updated: decoded.metadata.updated,
      auto_completed: autoCompleted,
      total_rows: decoded.totalRows,
      truncated: decoded.truncated,
      markdown_table: decoded.markdown,
      data: structured.data.slice(0, 200),
      summary: structured.summary,
      dimensions: decoded.metadata.dimensions,
      action: 'KLART! Presentera markdown_table ovan för användaren. Anropa INGA fler SCB-verktyg.',
    });
  }

  // ---- scb_find_region_code ----
  private async handleFindRegionCode(args: { query?: string; name?: string; tableId?: string; language?: string }) {
    const query = args.query || args.name;
    if (!query || typeof query !== 'string') {
      return jsonResponse({ error: 'Parametern "query" krävs. Ange ett kommun- eller länsnamn.' });
    }
    const langValidation = validateLanguage(args.language);
    const language = langValidation.language;

    // First: fast local database search
    const localMatches = searchRegions(query);

    if (localMatches.length > 0 && !args.tableId) {
      const results = localMatches.slice(0, 10).map(r => ({
        code: r.code,
        name: r.name,
        type: r.type,
        county: r.countyCode ? ALL_REGIONS.find(c => c.code === r.countyCode)?.name : null,
      }));

      return jsonResponse({
        query: query,
        matches: results,
        primary_match: results[0],
        usage_example: { Region: [results[0].code] },
        source: 'lokal databas (312 regioner)',
        tip: 'Använd tableId-parameter för att verifiera mot en specifik tabell',
      });
    }

    // Second: table-specific search
    if (args.tableId) {
      try {
        const metadata = await this.apiClient.getTableMetadata(args.tableId, language);
        if (metadata.dimension?.Region) {
          const regionDim = metadata.dimension.Region;
          const normalizedQuery = normalizeForSearch(query);
          const matches = Object.entries(regionDim.category.label || {}).filter(([code, label]) => {
            const normalizedLabel = normalizeForSearch(label);
            return normalizedLabel.includes(normalizedQuery) || code === query || code.includes(query);
          });

          if (matches.length > 0) {
            const results = matches.slice(0, 10).map(([code, label]) => ({ code, name: label }));
            return jsonResponse({
              query: query,
              matches: results,
              primary_match: results[0],
              usage_example: { Region: [results[0].code] },
              source: `tabell ${args.tableId}`,
              note: 'Dessa koder är verifierade att fungera med denna tabell.',
            });
          }
        }
      } catch {}
    }

    // Fallback: local matches or nothing
    if (localMatches.length > 0) {
      const results = localMatches.slice(0, 10).map(r => ({
        code: r.code, name: r.name, type: r.type,
      }));
      return jsonResponse({
        query: query,
        matches: results,
        primary_match: results[0],
        usage_example: { Region: [results[0].code] },
        source: 'lokal databas (fallback)',
      });
    }

    return jsonResponse({
      query: query,
      matches: [],
      error: `Ingen region hittades för "${query}"`,
      tips: [
        'Försök med svenskt namn: "Göteborg" istället för "Gothenburg"',
        'Fuzzy-matching fungerar: "Goteborg" hittar "Göteborg"',
        'Prova delnamn: "kung" hittar "Kungälv"',
      ],
    });
  }

  // ---- scb_search_regions ----
  private async handleSearchRegions(args: { query: string }) {
    if (!args.query || typeof args.query !== 'string') {
      return jsonResponse({ error: 'Parametern "query" krävs. Ange ett regionnamn eller kod.' });
    }
    const matches = searchRegions(args.query);

    if (matches.length === 0) {
      return jsonResponse({
        query: args.query,
        matches: [],
        message: `Ingen region matchar "${args.query}"`,
        database: { total: REGION_STATS.total, counties: REGION_STATS.counties, municipalities: REGION_STATS.municipalities },
      });
    }

    return jsonResponse({
      query: args.query,
      total_matches: matches.length,
      regions: matches.slice(0, 20).map(r => ({
        code: r.code,
        name: r.name,
        type: r.type,
        county: r.countyCode ? ALL_REGIONS.find(c => c.code === r.countyCode)?.name : null,
      })),
      usage_example: { Region: [matches[0].code] },
    });
  }

  // ---- scb_check_usage ----
  private async handleCheckUsage() {
    const usage = this.apiClient.getUsageInfo();
    const rl = usage.rateLimitInfo;

    return jsonResponse({
      requests_made: usage.requestCount,
      max_calls: rl?.maxCalls || 30,
      remaining: rl?.remaining ?? (30 - usage.requestCount),
      window_started: usage.windowStart.toISOString(),
      reset_time: rl?.resetTime?.toISOString() || null,
      time_window_seconds: rl?.timeWindow || 10,
    });
  }

  // ==========================================================================
  // PROMPTS
  // ==========================================================================

  private getPrompt(name: string, args: Record<string, string>) {
    switch (name) {
      case 'get_started':
        return {
          messages: [{
            role: 'user',
            content: { type: 'text', text: LLM_INSTRUCTIONS },
          }],
        };
      case 'find_population_data': {
        const muni = args.municipality || 'Göteborg';
        return {
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: `Hämta befolkningsstatistik för ${muni}.\n\n` +
                `1. scb_find_region_code({query: "${muni}"})\n` +
                `2. scb_search({query: "befolkning"})\n` +
                `3. scb_inspect({tableId: "TAB638"})\n` +
                `4. scb_validate({tableId: "TAB638", selection: {Region: ["<kod>"], Tid: ["TOP(5)"]}})\n` +
                `5. scb_fetch({tableId: "TAB638", selection: <komplett selektion>})`,
            },
          }],
        };
      }
      default:
        return { messages: [{ role: 'user', content: { type: 'text', text: 'Okänd prompt.' } }] };
    }
  }

  // ==========================================================================
  // STDIO TRANSPORT
  // ==========================================================================

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SCB MCP Server v3.0.0 running on stdio');
  }
}

// Main entry point
const server = new SCBMCPServer();
server.run().catch(console.error);
