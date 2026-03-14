/**
 * 10 tool definitions for the SMHI MCP server.
 *
 * Each tool includes a full JSON Schema `inputSchema` so the LLM knows
 * exactly which parameters to provide for successful API requests.
 */

import { METOBS_PARAMETERS, HYDROOBS_PARAMETERS, OCOBS_PARAMETERS } from './types.js';

// ---------------------------------------------------------------------------
// Shared descriptions
// ---------------------------------------------------------------------------

const METOBS_DESCRIPTION =
  'Parameter-ID. Vanliga: ' +
  Object.entries(METOBS_PARAMETERS)
    .slice(0, 8)
    .map(([k, v]) => `${k}=${v.split('(')[0].trim()}`)
    .join(', ');

const HYDROOBS_DESCRIPTION =
  'Parameter-ID. Tillgängliga: ' +
  Object.entries(HYDROOBS_PARAMETERS)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

const OCOBS_DESCRIPTION =
  'Parameter-ID. Vanliga: ' +
  Object.entries(OCOBS_PARAMETERS)
    .slice(0, 6)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

// ---------------------------------------------------------------------------
// ToolDefinition interface
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  api: string;
  endpoint: string;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 10 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Väderprognoser (2) ──────────────────────────────────────────────────
  {
    id: 'smhi_vaderprognoser_metfcst',
    name: 'SMHI Väderprognos',
    description:
      'Hämta väderprognos för en plats i Sverige (~10 dagar framåt).\n\n' +
      '**Användningsfall:** Se vädret kommande dagar — temperatur, vind, nederbörd, moln.\n' +
      '**Returnerar:** Timvis prognos med temperatur, vind, nederbörd, molnighet, vädersymbol.\n' +
      '**Exempel:** "Vädret i Stockholm imorgon", "Väderprognos Göteborg", "Regnar det i Malmö?"',
    category: 'vaderprognoser',
    api: 'metfcst/pmp3g',
    endpoint: '/category/pmp3g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: {
          type: 'number',
          description: 'Latitud (WGS84). Sverige: 55.0–70.0. Exempel: 59.3293 (Stockholm), 57.7089 (Göteborg), 55.6050 (Malmö).',
          minimum: 55.0,
          maximum: 70.0,
        },
        longitude: {
          type: 'number',
          description: 'Longitud (WGS84). Sverige: 10.0–25.0. Exempel: 18.0686 (Stockholm), 11.9746 (Göteborg), 13.0038 (Malmö).',
          minimum: 10.0,
          maximum: 25.0,
        },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    id: 'smhi_vaderprognoser_snow',
    name: 'SMHI Snöprognos',
    description:
      'Hämta snöprognos för en plats i Sverige.\n\n' +
      '**Användningsfall:** Se snödjup, snöfall och snörelaterade prognoser.\n' +
      '**Returnerar:** Prognosdata för snö.\n' +
      '**Exempel:** "Snöprognos Kiruna", "Kommer det snöa i Östersund?"',
    category: 'vaderprognoser',
    api: 'metfcst/snow1g',
    endpoint: '/category/snow1g/version/1/geotype/point/lon/{lon}/lat/{lat}/data.json',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: {
          type: 'number',
          description: 'Latitud (WGS84). Sverige: 55.0–70.0.',
          minimum: 55.0,
          maximum: 70.0,
        },
        longitude: {
          type: 'number',
          description: 'Longitud (WGS84). Sverige: 10.0–25.0.',
          minimum: 10.0,
          maximum: 25.0,
        },
      },
      required: ['latitude', 'longitude'],
    },
  },

  // ── Väderanalyser (1) ───────────────────────────────────────────────────
  {
    id: 'smhi_vaderanalyser_mesan',
    name: 'SMHI Väderanalys (MESAN)',
    description:
      'Hämta senaste väderanalys (MESAN) för en plats.\n\n' +
      '**Användningsfall:** Se det faktiska vädret just nu baserat på mätdata + modellanalys.\n' +
      '**Returnerar:** Analysdata: temperatur, vind, nederbörd, sikt, moln, vädersymbol.\n' +
      '**Exempel:** "Hur är vädret nu i Stockholm?", "Aktuell temperatur Göteborg"',
    category: 'vaderanalyser',
    api: 'metanalys/mesan2g',
    endpoint: '/category/mesan2g/version/1/geotype/point/lon/{lon}/lat/{lat}/data.json',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: {
          type: 'number',
          description: 'Latitud (WGS84). Sverige: 55.0–70.0.',
          minimum: 55.0,
          maximum: 70.0,
        },
        longitude: {
          type: 'number',
          description: 'Longitud (WGS84). Sverige: 10.0–25.0.',
          minimum: 10.0,
          maximum: 25.0,
        },
      },
      required: ['latitude', 'longitude'],
    },
  },

  // ── Väderobservationer (2) ──────────────────────────────────────────────
  {
    id: 'smhi_vaderobservationer_metobs',
    name: 'SMHI Väderobservationer',
    description:
      'Hämta väderobservationer från en specifik mätstation.\n\n' +
      '**Användningsfall:** Se uppmätt temperatur, vind, nederbörd, etc. vid en station.\n' +
      '**Returnerar:** Mätdata med tidsstämplar och kvalitetsflaggor.\n' +
      '**Exempel:** "Temperatur Bromma senaste timmen", "Nederbörd Lund senaste dygnet"\n' +
      '**Tips:** Använd smhi_vaderobservationer_stationer för att hitta stations-ID.',
    category: 'vaderobservationer',
    api: 'metobs',
    endpoint: '/version/1.0/parameter/{parameter}/station/{station}/period/{period}/data.json',
    inputSchema: {
      type: 'object',
      properties: {
        parameter: {
          type: 'number',
          description: METOBS_DESCRIPTION,
        },
        station: {
          type: 'number',
          description: 'Stations-ID. Vanliga: 97200=Bromma, 98210=Stockholm, 71420=Göteborg, 52350=Malmö, 53430=Lund, 180940=Kiruna.',
        },
        period: {
          type: 'string',
          enum: ['latest-hour', 'latest-day', 'latest-months', 'corrected-archive'],
          description: 'Tidsperiod. latest-hour=senaste timmen, latest-day=senaste dygnet, latest-months=senaste månaderna. Standard: latest-day.',
        },
      },
      required: ['parameter', 'station'],
    },
  },
  {
    id: 'smhi_vaderobservationer_stationer',
    name: 'SMHI Mätstationer',
    description:
      'Lista alla mätstationer som mäter en viss parameter.\n\n' +
      '**Användningsfall:** Hitta stations-ID för en plats, se vilka stationer som mäter en parameter.\n' +
      '**Returnerar:** Lista med stationer: ID, namn, koordinater, höjd, aktiv-status.\n' +
      '**Exempel:** "Vilka stationer mäter temperatur?", "Hitta mätstation nära Umeå"',
    category: 'vaderobservationer',
    api: 'metobs',
    endpoint: '/version/1.0/parameter/{parameter}.json',
    inputSchema: {
      type: 'object',
      properties: {
        parameter: {
          type: 'number',
          description: METOBS_DESCRIPTION,
        },
      },
      required: ['parameter'],
    },
  },

  // ── Hydrologi (2) ──────────────────────────────────────────────────────
  {
    id: 'smhi_hydrologi_hydroobs',
    name: 'SMHI Hydrologiska Observationer',
    description:
      'Hämta hydrologiska observationer (vattenstånd, vattenföring, temperatur).\n\n' +
      '**Användningsfall:** Se aktuellt vattenstånd, vattenföring i vattendrag.\n' +
      '**Returnerar:** Mätdata med tidsstämplar.\n' +
      '**Exempel:** "Vattenstånd i Vänern", "Vattenföring Dalälven"',
    category: 'hydrologi',
    api: 'hydroobs',
    endpoint: '/version/1.0/parameter/{parameter}/station/{station}/period/{period}/data.json',
    inputSchema: {
      type: 'object',
      properties: {
        parameter: {
          type: 'number',
          description: HYDROOBS_DESCRIPTION,
        },
        station: {
          type: 'number',
          description: 'Stations-ID för hydrologisk mätstation.',
        },
        period: {
          type: 'string',
          enum: ['latest-hour', 'latest-day', 'latest-months', 'corrected-archive'],
          description: 'Tidsperiod. Standard: latest-day.',
        },
      },
      required: ['parameter', 'station'],
    },
  },
  {
    id: 'smhi_hydrologi_pthbv',
    name: 'SMHI Hydrologisk Prognos',
    description:
      'Hämta hydrologisk prognos (PT-HBV-modellen) för en plats.\n\n' +
      '**Användningsfall:** Se prognoser för vattenflöde och vattenstånd.\n' +
      '**Returnerar:** Prognosdata med tidssteg.\n' +
      '**Exempel:** "Hydrologisk prognos Dalälven", "Vattenprognos norra Sverige"',
    category: 'hydrologi',
    api: 'pthbv',
    endpoint: '/version/1/geotype/point/lon/{lon}/lat/{lat}/data.json',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: {
          type: 'number',
          description: 'Latitud (WGS84). Sverige: 55.0–70.0.',
          minimum: 55.0,
          maximum: 70.0,
        },
        longitude: {
          type: 'number',
          description: 'Longitud (WGS84). Sverige: 10.0–25.0.',
          minimum: 10.0,
          maximum: 25.0,
        },
      },
      required: ['latitude', 'longitude'],
    },
  },

  // ── Oceanografi (1) ────────────────────────────────────────────────────
  {
    id: 'smhi_oceanografi_ocobs',
    name: 'SMHI Oceanografiska Observationer',
    description:
      'Hämta oceanografiska observationer (havstemperatur, vattenstånd, vågor, salthalt).\n\n' +
      '**Användningsfall:** Se havstemperatur, vattenstånd vid kuststationer, våghöjd.\n' +
      '**Returnerar:** Mätdata med tidsstämplar.\n' +
      '**Exempel:** "Havstemperatur Göteborg", "Vattenstånd Landsort", "Våghöjd Östersjön"',
    category: 'oceanografi',
    api: 'ocobs',
    endpoint: '/version/latest/parameter/{parameter}/station/{station}/period/{period}/data.json',
    inputSchema: {
      type: 'object',
      properties: {
        parameter: {
          type: 'number',
          description: OCOBS_DESCRIPTION,
        },
        station: {
          type: 'number',
          description: 'Stations-ID för oceanografisk mätstation.',
        },
        period: {
          type: 'string',
          enum: ['latest-hour', 'latest-day', 'latest-months'],
          description: 'Tidsperiod. Standard: latest-day.',
        },
      },
      required: ['parameter', 'station'],
    },
  },

  // ── Brandrisk (2) ──────────────────────────────────────────────────────
  {
    id: 'smhi_brandrisk_fwif',
    name: 'SMHI Brandriskprognos',
    description:
      'Hämta brandriskprognos (FWI — Fire Weather Index) för en plats.\n\n' +
      '**Användningsfall:** Se brandrisk och brandväderprognoser.\n' +
      '**Returnerar:** FWI-index, ISI, BUI, FFMC, skogstorka, gräsbrandsrisk per dag.\n' +
      '**Exempel:** "Brandrisk Stockholm", "FWI-prognos Gotland", "Risk för skogsbrand?"',
    category: 'brandrisk',
    api: 'metfcst/fwif1g',
    endpoint: '/category/fwif1g/version/1/geotype/point/lon/{lon}/lat/{lat}/data.json',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: {
          type: 'number',
          description: 'Latitud (WGS84). Sverige: 55.0–70.0.',
          minimum: 55.0,
          maximum: 70.0,
        },
        longitude: {
          type: 'number',
          description: 'Longitud (WGS84). Sverige: 10.0–25.0.',
          minimum: 10.0,
          maximum: 25.0,
        },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    id: 'smhi_brandrisk_fwia',
    name: 'SMHI Brandriskanalys',
    description:
      'Hämta senaste brandriskanalys för en plats.\n\n' +
      '**Användningsfall:** Se aktuell brandrisk baserat på analysdata.\n' +
      '**Returnerar:** Brandriskparametrar: FWI, torkhetsindex, gräsbrandsindex.\n' +
      '**Exempel:** "Aktuell brandrisk Gotland", "Brandriskanalys Småland"',
    category: 'brandrisk',
    api: 'metanalys/fwia',
    endpoint: '/category/fwia/version/1/geotype/point/lon/{lon}/lat/{lat}/data.json',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: {
          type: 'number',
          description: 'Latitud (WGS84). Sverige: 55.0–70.0.',
          minimum: 55.0,
          maximum: 70.0,
        },
        longitude: {
          type: 'number',
          description: 'Longitud (WGS84). Sverige: 10.0–25.0.',
          minimum: 10.0,
          maximum: 25.0,
        },
      },
      required: ['latitude', 'longitude'],
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
