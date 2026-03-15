/**
 * 7 tool definitions for the Upphandlingsdata MCP server.
 *
 * Each tool includes a full JSON Schema `inputSchema` so the LLM knows
 * exactly which parameters to provide for successful API requests.
 */

import { CRITERIA_TYPES, LOV_REGIONS } from './types.js';

// ---------------------------------------------------------------------------
// Shared descriptions
// ---------------------------------------------------------------------------

const CRITERIA_TYPE_DESCRIPTION =
  'Typ av kriterium. Tillgängliga: ' +
  Object.entries(CRITERIA_TYPES)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

const LOV_REGION_DESCRIPTION =
  'Filtrera på region/län. Tillgängliga: ' +
  LOV_REGIONS.join(', ');

// ---------------------------------------------------------------------------
// ToolDefinition interface
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  api: 'uhm' | 'ted';
  endpoint: string;
  defaultParams?: Record<string, string>;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 7 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Översikt (1) ────────────────────────────────────────────────────────
  {
    id: 'uhm_overview',
    name: 'Upphandlingsmyndigheten Översikt',
    description:
      'Visa översikt av alla tillgängliga API:er och verktyg.\n\n' +
      '**Användningsfall:** Få en överblick av vilka datakällor och verktyg som finns.\n' +
      '**Returnerar:** Lista med alla API:er, deras syften och tillgängliga verktyg.\n' +
      '**Exempel:** "Vilka upphandlingsverktyg finns?", "Översikt upphandlingsdata"',
    category: 'oversikt',
    api: 'uhm',
    endpoint: '/overview',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ── Webbplatssökning (1) ─────────────────────────────────────────────────
  {
    id: 'uhm_search_website',
    name: 'Sök upphandlingsmyndigheten.se',
    description:
      'Sök på upphandlingsmyndigheten.se efter guider, rapporter, nyheter.\n\n' +
      '**Användningsfall:** Hitta information om offentlig upphandling, regler, vägledningar.\n' +
      '**Returnerar:** Sökresultat med titel, URL, beskrivning.\n' +
      '**Exempel:** "Vägledning LOU", "Upphandlingsregler", "Direktupphandling gränsvärde"',
    category: 'sok',
    api: 'uhm',
    endpoint: '/upphandlingsmyndigheten/search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm. Exempel: "direktupphandling", "LOU", "ramavtal".',
        },
        pageSize: {
          type: 'number',
          description: 'Antal resultat per sida (standard: 10, max: 50).',
        },
        page: {
          type: 'number',
          description: 'Sidnummer (standard: 1).',
        },
      },
      required: ['query'],
    },
  },

  // ── Frågeportalen (1) ───────────────────────────────────────────────────
  {
    id: 'uhm_search_questions',
    name: 'Sök Frågeportalen',
    description:
      'Sök i Frågeportalen — vanliga frågor och svar om offentlig upphandling.\n\n' +
      '**Användningsfall:** Hitta svar på juridiska frågor om upphandling, LOU, LUF.\n' +
      '**Returnerar:** Frågor med titel, URL, beskrivning, kategori.\n' +
      '**Exempel:** "Får man ställa krav på miljö?", "Avbryta upphandling", "Överprövning"',
    category: 'sok',
    api: 'uhm',
    endpoint: '/questionportal/autocomplete',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm för frågor. Exempel: "avbryta upphandling", "överprövning".',
        },
        pageSize: {
          type: 'number',
          description: 'Antal resultat per sida (standard: 10, max: 50).',
        },
        page: {
          type: 'number',
          description: 'Sidnummer (standard: 1).',
        },
      },
      required: ['query'],
    },
  },

  // ── LOV / Valfrihetssystem (1) ──────────────────────────────────────────
  {
    id: 'uhm_search_lov',
    name: 'Sök LOV-annonser',
    description:
      'Sök annonser i Valfrihetssystem (LOV) — kommunernas valfrihetssystem.\n\n' +
      '**Användningsfall:** Hitta LOV-möjligheter inom vård, omsorg, hemtjänst.\n' +
      '**Returnerar:** Annonser med titel, kommun, region, kategori, status.\n' +
      '**Exempel:** "Hemtjänst Stockholm", "LOV äldreomsorg", "Vårdval Skåne"',
    category: 'lov',
    api: 'uhm',
    endpoint: '/hitta-lov/search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm (valfritt). Exempel: "hemtjänst", "äldreomsorg", "ledsagning".',
        },
        pageSize: {
          type: 'number',
          description: 'Antal resultat per sida (standard: 10, max: 50).',
        },
        page: {
          type: 'number',
          description: 'Sidnummer (standard: 1).',
        },
        region: {
          type: 'string',
          enum: LOV_REGIONS,
          description: LOV_REGION_DESCRIPTION,
        },
      },
    },
  },

  // ── Hållbarhetskriterier (2) ────────────────────────────────────────────
  {
    id: 'uhm_search_criteria',
    name: 'Sök hållbarhetskriterier',
    description:
      'Sök bland Upphandlingsmyndighetens hållbarhetskriterier för upphandling.\n\n' +
      '**Användningsfall:** Hitta miljökrav, sociala krav, arbetsrättsliga villkor.\n' +
      '**Returnerar:** Kriterier med titel, typ, kategori, nivå.\n' +
      '**Exempel:** "Miljökrav fordon", "Sociala krav städning", "Ekologisk mat"',
    category: 'kriterier',
    api: 'uhm',
    endpoint: '/upphandlingsmyndigheten/criteriaservice/search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm för kriterier. Exempel: "fordon", "mat", "IT".',
        },
        pageSize: {
          type: 'number',
          description: 'Antal resultat (standard: 10, max: 50).',
        },
        type: {
          type: 'string',
          enum: Object.keys(CRITERIA_TYPES),
          description: CRITERIA_TYPE_DESCRIPTION,
        },
      },
    },
  },
  {
    id: 'uhm_get_criteria_categories',
    name: 'Lista kriteriekategorier',
    description:
      'Visa alla tillgängliga kategorier för hållbarhetskriterier.\n\n' +
      '**Användningsfall:** Se vilka produktområden som har färdiga kriterier.\n' +
      '**Returnerar:** Lista med kategorier och antal kriterier.\n' +
      '**Exempel:** "Vilka kriteriekategorier finns?", "Områden med hållbarhetskriterier"',
    category: 'kriterier',
    api: 'uhm',
    endpoint: '/upphandlingsmyndigheten/criteriaservice/filter',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ── TED / EU-upphandling (1) ────────────────────────────────────────────
  {
    id: 'uhm_search_ted',
    name: 'Sök EU TED-annonser',
    description:
      'Sök bland EU:s upphandlingsannonser (TED) — svenska upphandlingar.\n\n' +
      '**Användningsfall:** Hitta EU-upphandlingar från svenska myndigheter.\n' +
      '**Returnerar:** Annonser med titel, beskrivning, organisation, referensnummer.\n' +
      '**Exempel:** "IT-tjänster", "Byggentreprenad", "Konsulttjänster"',
    category: 'ted',
    api: 'ted',
    endpoint: '/notices/search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökfråga. Filtreras automatiskt till svenska upphandlingar (CY=SWE). Exempel: "IT", "bygg", "konsult".',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 10, max: 100).',
        },
        scope: {
          type: 'string',
          enum: ['latest', 'active'],
          description: 'Sökscope: "latest" = senaste, "active" = pågående (standard: "latest").',
        },
      },
      required: ['query'],
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
