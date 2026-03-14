/**
 * 8 tool definitions for the Riksbank MCP server.
 *
 * Each tool includes a full JSON Schema `inputSchema` so the LLM knows
 * exactly which parameters to provide for successful API requests.
 */

import { SERIES_IDS, GROUP_IDS, CURRENCY_SERIES } from './types.js';

// ---------------------------------------------------------------------------
// Shared descriptions
// ---------------------------------------------------------------------------

const SERIES_DESCRIPTION =
  'Serie-ID. Vanliga serier: ' +
  Object.entries(SERIES_IDS)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

const GROUP_DESCRIPTION =
  'Grupp-ID. Tillgängliga grupper: ' +
  Object.entries(GROUP_IDS)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

const CURRENCY_DESCRIPTION =
  'Valutakod (3 bokstäver). Tillgängliga: ' +
  Object.keys(CURRENCY_SERIES).join(', ');

// ---------------------------------------------------------------------------
// ToolDefinition interface
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  api: 'swea' | 'swestr' | 'forecasts';
  endpoint: string;
  defaultParams?: Record<string, string>;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 8 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Räntor (2) ──────────────────────────────────────────────────────────
  {
    id: 'riksbank_ranta_styrranta',
    name: 'Riksbanken Styrränta',
    description:
      'Hämta aktuell styrränta (reporänta) och historik.\n\n' +
      '**Användningsfall:** Se nuvarande reporänta eller historiska ändringar.\n' +
      '**Returnerar:** Datum, räntesats.\n' +
      '**Exempel:** "Vad är styrräntan?", "Reporäntans utveckling senaste 5 åren"',
    category: 'ranta',
    api: 'swea',
    endpoint: '/Observations/{seriesId}/{fromDate}/{toDate}',
    defaultParams: { seriesId: 'SECBREPOEFF' },
    inputSchema: {
      type: 'object',
      properties: {
        fromDate: {
          type: 'string',
          description: 'Startdatum (YYYY-MM-DD). Standard: 1 år sedan. Exempel: "2024-01-01".',
        },
        toDate: {
          type: 'string',
          description: 'Slutdatum (YYYY-MM-DD). Standard: idag. Exempel: "2025-12-31".',
        },
      },
    },
  },
  {
    id: 'riksbank_ranta_marknadsrantor',
    name: 'Riksbanken Marknadsräntor',
    description:
      'Hämta marknadsräntor: STIBOR, statsobligationer, bostadsräntor.\n\n' +
      '**Användningsfall:** Se aktuella STIBOR-satser, obligationsräntor eller bostadsräntor.\n' +
      '**Returnerar:** Serie, datum, räntesats.\n' +
      '**Exempel:** "STIBOR 3 månader", "Räntan på statsobligationer"',
    category: 'ranta',
    api: 'swea',
    endpoint: '/Observations/Latest/ByGroup/{groupId}',
    defaultParams: { groupId: '3' },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'string',
          enum: Object.keys(GROUP_IDS),
          description: GROUP_DESCRIPTION,
        },
      },
    },
  },

  // ── Valuta (2) ─────────────────────────────────────────────────────────
  {
    id: 'riksbank_valuta_kurser',
    name: 'Riksbanken Valutakurser',
    description:
      'Hämta aktuella och historiska valutakurser mot SEK.\n\n' +
      '**Användningsfall:** Se kronkursen mot EUR, USD eller annan valuta.\n' +
      '**Returnerar:** Valutapar, datum, kurs.\n' +
      '**Exempel:** "EUR/SEK", "Dollarkursen idag", "Kronans utveckling"',
    category: 'valuta',
    api: 'swea',
    endpoint: '/Observations/Latest/ByGroup/{groupId}',
    defaultParams: { groupId: '130' },
    inputSchema: {
      type: 'object',
      properties: {
        valuta: {
          type: 'string',
          enum: Object.keys(CURRENCY_SERIES),
          description: CURRENCY_DESCRIPTION + '. Utelämna för att visa alla valutor.',
        },
        fromDate: {
          type: 'string',
          description: 'Startdatum (YYYY-MM-DD) för historisk data. Exempel: "2024-01-01".',
        },
        toDate: {
          type: 'string',
          description: 'Slutdatum (YYYY-MM-DD). Exempel: "2025-12-31".',
        },
      },
    },
  },
  {
    id: 'riksbank_valuta_korskurser',
    name: 'Riksbanken Korskurser',
    description:
      'Beräkna korskurs mellan två valutor via SEK.\n\n' +
      '**Användningsfall:** Se växelkurs mellan t.ex. EUR och USD via Riksbankens data.\n' +
      '**Returnerar:** Korskurs, datum.\n' +
      '**Exempel:** "EUR/USD korskurs", "GBP mot NOK"',
    category: 'valuta',
    api: 'swea',
    endpoint: '/CrossRates/{seriesId1}/{seriesId2}/{date}',
    inputSchema: {
      type: 'object',
      properties: {
        valuta1: {
          type: 'string',
          enum: Object.keys(CURRENCY_SERIES),
          description: 'Första valutan. ' + CURRENCY_DESCRIPTION,
        },
        valuta2: {
          type: 'string',
          enum: Object.keys(CURRENCY_SERIES),
          description: 'Andra valutan. ' + CURRENCY_DESCRIPTION,
        },
        datum: {
          type: 'string',
          description: 'Datum (YYYY-MM-DD). Standard: senaste tillgängliga.',
        },
      },
      required: ['valuta1', 'valuta2'],
    },
  },

  // ── SWESTR (1) ─────────────────────────────────────────────────────────
  {
    id: 'riksbank_swestr',
    name: 'Riksbanken SWESTR',
    description:
      'Hämta SWESTR — svensk dagslåneränta (referensränta).\n\n' +
      '**Användningsfall:** Se aktuell SWESTR-ränta eller historik.\n' +
      '**Returnerar:** Ränta, datum, percentiler, volym, antal transaktioner.\n' +
      '**Exempel:** "SWESTR idag", "Dagslåneräntan senaste veckan"',
    category: 'swestr',
    api: 'swestr',
    endpoint: '/latest/SWESTR',
    inputSchema: {
      type: 'object',
      properties: {
        fromDate: {
          type: 'string',
          description: 'Startdatum (YYYY-MM-DD) för historik. Utelämna för senaste värdet.',
        },
        toDate: {
          type: 'string',
          description: 'Slutdatum (YYYY-MM-DD). Krävs om fromDate anges.',
        },
      },
    },
  },

  // ── Prognoser (3) ──────────────────────────────────────────────────────
  {
    id: 'riksbank_prognos_inflation',
    name: 'Riksbanken Inflationsprognos',
    description:
      'Hämta Riksbankens inflationsprognoser (KPI, KPIF).\n\n' +
      '**OBS:** Riksbankens prognos-API (forecasts/v1) kan vara tillfälligt otillgängligt.\n' +
      '**Användningsfall:** Se inflationsprognos och utfall.\n' +
      '**Returnerar:** Indikator, datum, prognos, utfall.\n' +
      '**Exempel:** "Inflationsprognos", "KPIF-prognos"',
    category: 'prognos',
    api: 'forecasts',
    endpoint: '/forecasts',
    inputSchema: {
      type: 'object',
      properties: {
        indikator: {
          type: 'string',
          enum: ['CPI', 'CPIF'],
          description: 'Inflationsindikator. CPI=Konsumentprisindex, CPIF=KPI med fast ränta (standard: CPIF).',
        },
      },
    },
  },
  {
    id: 'riksbank_prognos_bnp',
    name: 'Riksbanken BNP-prognos',
    description:
      'Hämta Riksbankens BNP-prognoser och utfall.\n\n' +
      '**OBS:** Riksbankens prognos-API (forecasts/v1) kan vara tillfälligt otillgängligt.\n' +
      '**Användningsfall:** Se BNP-tillväxtprognoser.\n' +
      '**Returnerar:** Datum, prognos, utfall.\n' +
      '**Exempel:** "BNP-prognos", "Tillväxtprognos Sverige"',
    category: 'prognos',
    api: 'forecasts',
    endpoint: '/forecasts',
    inputSchema: {
      type: 'object',
      properties: {
        indikator: {
          type: 'string',
          enum: ['GDP'],
          description: 'BNP-indikator. Standard: GDP.',
        },
      },
    },
  },
  {
    id: 'riksbank_prognos_ovrigt',
    name: 'Riksbanken Makroprognoser',
    description:
      'Hämta övriga makroekonomiska prognoser (arbetslöshet, reporänteprognos m.m.).\n\n' +
      '**OBS:** Riksbankens prognos-API (forecasts/v1) kan vara tillfälligt otillgängligt.\n' +
      '**Användningsfall:** Se prognoser för arbetslöshet, reporänta, eller lista tillgängliga indikatorer.\n' +
      '**Returnerar:** Indikator, datum, prognos, utfall.\n' +
      '**Exempel:** "Arbetslöshetsprognos", "Vilka prognoser finns?"',
    category: 'prognos',
    api: 'forecasts',
    endpoint: '/indicators',
    inputSchema: {
      type: 'object',
      properties: {
        indikator: {
          type: 'string',
          description: 'Indikator-ID att hämta prognos för. Utelämna för att lista alla tillgängliga indikatorer.',
        },
      },
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
