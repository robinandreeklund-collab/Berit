/**
 * 4 tool definitions for the Visit Sweden MCP server.
 */

import { ENTITY_TYPES } from './types.js';

// ---------------------------------------------------------------------------
// ToolDefinition interface
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  api: 'visitsweden';
  endpoint: string;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 4 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: 'visitsweden_search',
    name: 'Sök Visit Sweden',
    description:
      'Sök efter platser, evenemang, boenden eller restauranger i Sverige via Visit Sweden.\n\n' +
      '**Användningsfall:** Hitta turistmål, hotell, restauranger eller evenemang i Sverige.\n' +
      '**Returnerar:** Lista med namn, beskrivning, typ och ID.\n' +
      '**Exempel:** "Sevärdheter i Göteborg", "Hotell i Kiruna", "Restauranger nära Visby"',
    category: 'sok',
    api: 'visitsweden',
    endpoint: '/store/search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm — plats, stad, aktivitet eller nyckelord (t.ex. "vandring Jämtland", "Göteborg").',
        },
        type: {
          type: 'string',
          enum: Object.keys(ENTITY_TYPES),
          description:
            'Typ av resultat. Tillgängliga: ' +
            Object.entries(ENTITY_TYPES)
              .map(([k, v]) => `${k}=${v}`)
              .join(', '),
        },
        region: {
          type: 'string',
          description: 'Region att filtrera på (t.ex. "stockholm", "skane", "dalarna").',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (1-100). Standard: 20.',
        },
      },
      required: ['query'],
    },
  },
  {
    id: 'visitsweden_get_details',
    name: 'Hämta detaljer',
    description:
      'Hämta fullständig information om en specifik post (boende, restaurang, evenemang, plats) via dess ID.\n\n' +
      '**Användningsfall:** Visa all info om ett specifikt hotell, evenemang eller attraktion.\n' +
      '**Returnerar:** Fullständig info med namn, beskrivning, adress, kontakt, öppettider.\n' +
      '**Exempel:** Anropas med ett entry-ID från visitsweden_search.',
    category: 'detaljer',
    api: 'visitsweden',
    endpoint: '/store/{contextId}/metadata/{entryId}',
    inputSchema: {
      type: 'object',
      properties: {
        entryId: {
          type: 'string',
          description: 'Unikt ID för posten (hämtas från visitsweden_search-resultat).',
        },
      },
      required: ['entryId'],
    },
  },
  {
    id: 'visitsweden_search_events',
    name: 'Sök evenemang',
    description:
      'Sök efter evenemang med datumfilter.\n\n' +
      '**Användningsfall:** Hitta evenemang som pågår eller kommer att ske i en viss stad/region.\n' +
      '**Returnerar:** Lista med evenemang, datum, plats och beskrivning.\n' +
      '**Exempel:** "Vad händer i Malmö nästa helg?", "Evenemang i Stockholm i juni"',
    category: 'evenemang',
    api: 'visitsweden',
    endpoint: '/store/search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm för evenemang (t.ex. stad, aktivitet, festival).',
        },
        region: {
          type: 'string',
          description: 'Region att filtrera på (t.ex. "stockholm", "skane").',
        },
        fromDate: {
          type: 'string',
          description: 'Startdatum (YYYY-MM-DD). Standard: idag.',
        },
        toDate: {
          type: 'string',
          description: 'Slutdatum (YYYY-MM-DD). Standard: 30 dagar framåt.',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (1-100). Standard: 20.',
        },
      },
      required: ['query'],
    },
  },
  {
    id: 'visitsweden_nearby',
    name: 'Nära mig / nära plats',
    description:
      'Hitta attraktioner, boenden eller restauranger nära en specifik plats.\n\n' +
      '**Användningsfall:** Hitta sevärdheter eller hotell nära en stad eller koordinat.\n' +
      '**Returnerar:** Lista med namn, typ, avstånd och beskrivning.\n' +
      '**Exempel:** "Sevärdheter nära Hjo", "Hotell nära Vänern", "Restauranger nära Kalmar"',
    category: 'nara',
    api: 'visitsweden',
    endpoint: '/store/search',
    inputSchema: {
      type: 'object',
      properties: {
        place: {
          type: 'string',
          description: 'Platsnamn att söka nära (t.ex. "Hjo", "Visby", "Abisko").',
        },
        type: {
          type: 'string',
          enum: Object.keys(ENTITY_TYPES),
          description:
            'Typ av resultat att visa. Tillgängliga: ' +
            Object.entries(ENTITY_TYPES)
              .map(([k, v]) => `${k}=${v}`)
              .join(', '),
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (1-50). Standard: 10.',
        },
      },
      required: ['place'],
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
