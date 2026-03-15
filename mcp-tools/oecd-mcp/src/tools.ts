/**
 * 9 tool definitions for the OECD MCP server.
 *
 * Each tool includes a full JSON Schema `inputSchema` so the LLM knows
 * exactly which parameters to provide for successful API requests.
 */

import { OECD_CATEGORIES, KNOWN_DATAFLOWS } from './types.js';

// ---------------------------------------------------------------------------
// Shared descriptions
// ---------------------------------------------------------------------------

const CATEGORY_IDS = OECD_CATEGORIES.map((c) => c.id);

const CATEGORY_DESCRIPTION =
  'Kategori-ID. Tillgängliga: ' +
  OECD_CATEGORIES.map((c) => `${c.id} (${c.name})`).join(', ');

const DATAFLOW_DESCRIPTION =
  'Dataflow-ID. Vanliga: ' +
  KNOWN_DATAFLOWS.slice(0, 6).map((d) => `${d.id}=${d.name}`).join(', ');

// ---------------------------------------------------------------------------
// ToolDefinition interface
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 9 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // -- Sök & utforska (3) ---------------------------------------------------
  {
    id: 'oecd_search_dataflows',
    name: 'OECD Sök dataset',
    description:
      'Sök bland OECD:s dataset (dataflows) med nyckelord.\n\n' +
      '**Användningsfall:** Hitta dataset för ett ämne, t.ex. "GDP", "health", "education".\n' +
      '**Returnerar:** Lista med matchande dataflow-ID, namn och beskrivning.\n' +
      '**Exempel:** "Sök dataset om BNP", "Hitta hälsodata", "Vilka utbildningsdataset finns?"',
    category: 'search',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Sökord för att hitta dataset (t.ex. "GDP", "health", "education", "unemployment").',
        },
      },
      required: ['keyword'],
    },
  },
  {
    id: 'oecd_list_dataflows',
    name: 'OECD Lista dataset per kategori',
    description:
      'Bläddra bland OECD:s dataset grupperade efter kategori.\n\n' +
      '**Användningsfall:** Se alla dataset inom en kategori, t.ex. Economy, Health.\n' +
      '**Returnerar:** Lista med dataset-ID, namn och beskrivning per kategori.\n' +
      '**Exempel:** "Lista ekonomidataset", "Visa hälsodataset", "Vilka miljödataset finns?"',
    category: 'search',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: CATEGORY_IDS,
          description: CATEGORY_DESCRIPTION,
        },
      },
    },
  },
  {
    id: 'oecd_search_indicators',
    name: 'OECD Sök indikatorer',
    description:
      'Sök bland specifika indikatorer inom OECD:s dataset.\n\n' +
      '**Användningsfall:** Hitta specifika mätvärden som "unemployment rate", "CO2 emissions".\n' +
      '**Returnerar:** Lista med matchande indikatorer, dataset och dimensionsvärden.\n' +
      '**Exempel:** "Hitta arbetslöshetsindikator", "Sök CO2-utsläpp", "Inflationsindikatorer"',
    category: 'search',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Sökord för att hitta indikatorer (t.ex. "unemployment", "inflation", "CO2", "life expectancy").',
        },
        category: {
          type: 'string',
          enum: CATEGORY_IDS,
          description: 'Begränsa sökningen till en specifik kategori. ' + CATEGORY_DESCRIPTION,
        },
      },
      required: ['keyword'],
    },
  },

  // -- Metadata (2) ---------------------------------------------------------
  {
    id: 'oecd_get_data_structure',
    name: 'OECD Dataset metadata & dimensioner',
    description:
      'Hämta metadata och dimensioner för ett specifikt dataset.\n\n' +
      '**Användningsfall:** Förstå datasetets struktur innan du frågar data. Vilka dimensioner, länder och tidsperioder finns?\n' +
      '**Returnerar:** Dimensioner med möjliga värden, beskrivning av datasetet.\n' +
      '**Exempel:** "Visa struktur för QNA", "Vilka dimensioner har MEI?", "Metadata för HEALTH_STAT"\n\n' +
      '**VIKTIGT:** Kör alltid detta verktyg INNAN oecd_query_data för att förstå filterformatet.',
    category: 'metadata',
    inputSchema: {
      type: 'object',
      properties: {
        dataflow_id: {
          type: 'string',
          description: DATAFLOW_DESCRIPTION,
        },
      },
      required: ['dataflow_id'],
    },
  },
  {
    id: 'oecd_get_dataflow_url',
    name: 'OECD Data Explorer-länk',
    description:
      'Generera en direktlänk till OECD Data Explorer för ett dataset.\n\n' +
      '**Användningsfall:** Skapa en klickbar länk som öppnar datasetet i webbläsaren.\n' +
      '**Returnerar:** URL till OECD Data Explorer.\n' +
      '**Exempel:** "Länk till QNA", "Öppna bostadsprisdata i webbläsaren"',
    category: 'metadata',
    inputSchema: {
      type: 'object',
      properties: {
        dataflow_id: {
          type: 'string',
          description: DATAFLOW_DESCRIPTION,
        },
        filter: {
          type: 'string',
          description: 'Valfri filtersträng att inkludera i länken (t.ex. "SWE.GDP..Q").',
        },
      },
      required: ['dataflow_id'],
    },
  },

  // -- Kategorier (2) -------------------------------------------------------
  {
    id: 'oecd_get_categories',
    name: 'OECD Datakategorier',
    description:
      'Lista alla 17 OECD-datakategorier.\n\n' +
      '**Användningsfall:** Få en överblick av tillgängliga ämnesområden.\n' +
      '**Returnerar:** Lista med kategori-ID, namn och beskrivning.\n' +
      '**Exempel:** "Vilka kategorier finns?", "Visa alla ämnesområden"',
    category: 'categories',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    id: 'oecd_list_categories_detailed',
    name: 'OECD Detaljerade kategorier',
    description:
      'Visa detaljerad information om OECD:s datakategorier med exempeldataset.\n\n' +
      '**Användningsfall:** Förstå vilka typer av data som finns inom varje kategori.\n' +
      '**Returnerar:** Detaljerad lista med kategori, beskrivning och exempeldataset.\n' +
      '**Exempel:** "Detaljerad info om kategorier", "Vilka dataset finns per ämne?"',
    category: 'categories',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // -- Populära dataset (1) -------------------------------------------------
  {
    id: 'oecd_get_popular_datasets',
    name: 'OECD Populära dataset',
    description:
      'Visa en kurerad lista med de mest använda OECD-dataseten.\n\n' +
      '**Användningsfall:** Snabb överblick av vanliga dataset med föreslagna filter.\n' +
      '**Returnerar:** Lista med dataset-ID, namn, beskrivning och exempelfilter.\n' +
      '**Exempel:** "Vilka populära dataset finns?", "Visa vanliga OECD-dataset"',
    category: 'popular',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // -- Datahämtning (1) — HUVUDVERKTYGET -----------------------------------
  {
    id: 'oecd_query_data',
    name: 'OECD Hämta statistik',
    description:
      'Hämta faktisk statistisk data från OECD:s SDMX API. DETTA ÄR HUVUDVERKTYGET.\n\n' +
      '**Användningsfall:** Hämta dataserier med filter för land, indikator och tidsperiod.\n' +
      '**Returnerar:** Statistisk data i tabellformat med observationer.\n\n' +
      '**SDMX-filterformat:** Punktseparerade dimensioner i ordning.\n' +
      '- Tom dimension = wildcard (alla värden)\n' +
      '- + separerar multipla värden: SWE+NOR\n' +
      '- Exempel: SWE+NOR.GDP..A = Sverige+Norge, BNP, alla, Årlig\n\n' +
      '**VIKTIGT:** Kör oecd_get_data_structure först för att förstå filterformatet!\n\n' +
      '**Exempel:**\n' +
      '- "BNP för Sverige kvartalsvis" → dataflow_id=QNA, filter=SWE.GDP.VOBARSA.Q\n' +
      '- "Arbetslöshet i Norden" → dataflow_id=LFS_SEXAGE_I_R, filter=SWE+NOR+DNK+FIN..\n' +
      '- "Senaste hälsodata för Sverige" → dataflow_id=HEALTH_STAT, filter=SWE..',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        dataflow_id: {
          type: 'string',
          description: DATAFLOW_DESCRIPTION,
        },
        filter: {
          type: 'string',
          description:
            'Filtersträng med punktseparerade dimensioner. ' +
            '+ för multipla värden, tom för wildcard. ' +
            'Exempel: "SWE+NOR.GDP..A" = Sverige+Norge, GDP, alla, Annual. ' +
            'Kör oecd_get_data_structure först för att se dimensionsordning.',
        },
        start_period: {
          type: 'string',
          description: 'Startperiod (t.ex. "2020", "2020-Q1", "2020-01"). Standard: 5 år sedan.',
        },
        end_period: {
          type: 'string',
          description: 'Slutperiod (t.ex. "2024", "2024-Q4", "2024-12"). Standard: senaste.',
        },
        last_n_observations: {
          type: 'number',
          description: 'Antal senaste observationer per serie. Standard: 100, max: 1000.',
          default: 100,
        },
      },
      required: ['dataflow_id'],
    },
  },
];

/** Look up tool definition by ID (case-insensitive). */
export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.id === id.toLowerCase());
}

/** All tool IDs grouped by category. */
export function getToolsByCategory(): Record<string, ToolDefinition[]> {
  const grouped: Record<string, ToolDefinition[]> = {};
  for (const tool of TOOL_DEFINITIONS) {
    if (!grouped[tool.category]) grouped[tool.category] = [];
    grouped[tool.category].push(tool);
  }
  return grouped;
}
