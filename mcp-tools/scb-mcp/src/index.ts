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

export class SCBMCPServer {
  private server: Server;
  private apiClient: SCBApiClient;

  constructor() {
    this.server = new Server(
      { name: 'SCB MCP Server', version: '3.0.0' },
      { capabilities: { tools: {}, resources: {}, prompts: {} } }
    );
    this.apiClient = new SCBApiClient();
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
        description: 'Utforska SCB:s statistikträd. Bläddra bland ämnesområden (t.ex. "BE" = befolkning, "AM" = arbetsmarknad, "NR" = nationalräkenskaper).',
        inputSchema: {
          type: 'object',
          properties: {
            subjectCode: { type: 'string', description: 'Ämnesområdeskod (t.ex. "BE", "AM", "NR", "MI"). Utelämna för alla.' },
            pageSize: { type: 'number', description: 'Max antal tabeller', default: 20 },
            language: { type: 'string', default: 'sv' },
          },
        },
        annotations: { title: 'Bläddra statistik', readOnlyHint: true, openWorldHint: true },
      },
      // ---- INSPECTION ----
      {
        name: 'scb_inspect',
        description: 'Hämta komplett metadata för en tabell: alla variabler, deras värden, eliminationsdefaults, tidsperioder och kontaktinformation. Kombinerar tidigare scb_get_table_info + scb_get_table_variables.',
        inputSchema: {
          type: 'object',
          properties: {
            tableId: { type: 'string', description: 'Tabell-ID (t.ex. "TAB638", "TAB5663")' },
            language: { type: 'string', default: 'sv' },
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
            language: { type: 'string', default: 'sv' },
          },
          required: ['tableId', 'variable'],
        },
        annotations: { title: 'Visa kodlista', readOnlyHint: true, openWorldHint: true },
      },
      // ---- DATA ----
      {
        name: 'scb_preview',
        description: 'Förhandsgranska data (max ~50 rader). Säkert sätt att testa en query innan fullständig hämtning.',
        inputSchema: {
          type: 'object',
          properties: {
            tableId: { type: 'string', description: 'Tabell-ID' },
            selection: {
              type: 'object',
              description: 'Valfri selektion: {"VariabelKod": ["värde1", "värde2"]}. Använd "*" för alla, "TOP(N)" för senaste N.',
              additionalProperties: { type: 'array', items: { type: 'string' } },
            },
            language: { type: 'string', default: 'sv' },
          },
          required: ['tableId'],
        },
        annotations: { title: 'Förhandsgranska', readOnlyHint: true, openWorldHint: true },
      },
      {
        name: 'scb_validate',
        description: 'Validera och auto-komplettera en selektion UTAN att hämta data. Fyller i saknade variabler med smarta defaults. Kör detta innan scb_fetch för att undvika fel.',
        inputSchema: {
          type: 'object',
          properties: {
            tableId: { type: 'string', description: 'Tabell-ID' },
            selection: {
              type: 'object',
              description: 'Selektion att validera. Saknade variabler fylls i automatiskt.',
              additionalProperties: { type: 'array', items: { type: 'string' } },
            },
            language: { type: 'string', default: 'sv' },
          },
          required: ['tableId'],
        },
        annotations: { title: 'Validera selektion', readOnlyHint: true, openWorldHint: true },
      },
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
            language: { type: 'string', default: 'sv' },
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
            language: { type: 'string', default: 'sv' },
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
      return { content: [{ type: 'text' as const, text: `Fel: ${error instanceof Error ? error.message : String(error)}` }] };
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
    const langValidation = validateLanguage(args.language);
    const language = langValidation.language;
    const pageSize = Math.min(args.pageSize || 20, MAX_PAGE_SIZE);

    const result = await this.apiClient.browseTables({
      subjectCode: args.subjectCode,
      pageSize,
      lang: language,
    });

    // Group by subject code path
    const grouped: Record<string, any[]> = {};
    for (const table of result.tables) {
      const subject = table.subjectCode || table.paths?.[0]?.[0]?.id || 'Övrigt';
      if (!grouped[subject]) grouped[subject] = [];
      grouped[subject].push({
        id: table.id,
        title: table.label,
        period: { start: table.firstPeriod, end: table.lastPeriod },
        updated: table.updated,
      });
    }

    return jsonResponse({
      subject_filter: args.subjectCode || null,
      language: language,
      subjects: Object.entries(grouped).map(([code, tables]) => ({
        code,
        tables: tables.slice(0, 10),
        total_tables: tables.length,
      })),
      total_tables: result.tables.length,
      tips: [
        'Använd subjectCode för att bläddra djupare: "BE" = befolkning, "AM" = arbetsmarknad',
        'Använd scb_inspect med ett tabell-ID för att se variabler och värden',
      ],
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
      data: structured.data.slice(0, 200), // Limit JSON data to 200 records
      summary: structured.summary,
      dimensions: decoded.metadata.dimensions,
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
