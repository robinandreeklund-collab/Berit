/**
 * 4 tool definitions for the Visit Sweden MCP server.
 */

import { ENTITY_TYPES, REGIONS } from './types.js';

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
// Shared descriptions
// ---------------------------------------------------------------------------

const TYPE_DESCRIPTION =
  'Typ av resultat att filtrera på.\n' +
  Object.entries(ENTITY_TYPES)
    .map(([k, v]) => `${k} = ${v}`)
    .join(', ') +
  '.\nLämna tomt för alla typer.';

const REGION_DESCRIPTION =
  'Region att filtrera på (intern nyckel).\n' +
  'Tillgängliga: ' +
  Object.entries(REGIONS)
    .map(([k, v]) => `"${k}" (${v})`)
    .join(', ') +
  '.\nLämna tomt för hela Sverige.';

// ---------------------------------------------------------------------------
// 4 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: 'visitsweden_search',
    name: 'Sök Visit Sweden',
    description:
      'Sök efter platser, evenemang, boenden eller restauranger i Sverige via Visit Swedens öppna dataplattform.\n\n' +
      '**Användningsfall:** Hitta turistmål, hotell, restauranger eller evenemang i Sverige.\n' +
      '**Returnerar:** Lista med namn, typ, beskrivning och entry-ID.\n' +
      '**Tips:** Använd type-parameter för att begränsa till en kategori (t.ex. LodgingBusiness för hotell).\n' +
      '**Exempel:** "Sevärdheter i Göteborg", "Hotell i Kiruna", "Restauranger i Visby"',
    category: 'sok',
    api: 'visitsweden',
    endpoint: '/store/search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm — plats, stad, aktivitet eller nyckelord (t.ex. "vandring Jämtland", "Göteborg", "Kiruna hotell").',
        },
        type: {
          type: 'string',
          enum: Object.keys(ENTITY_TYPES),
          description: TYPE_DESCRIPTION,
        },
        region: {
          type: 'string',
          enum: Object.keys(REGIONS),
          description: REGION_DESCRIPTION,
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat. Standard: 20.',
          minimum: 1,
          maximum: 100,
          default: 20,
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
      '**Kräver:** entry-ID från visitsweden_search-resultat (kolumnen "ID").\n' +
      '**Format:** Ange som "contextId/entryId" (t.ex. "107/16") eller bara entryId.',
    category: 'detaljer',
    api: 'visitsweden',
    endpoint: '/store/{contextId}/metadata/{entryId}',
    inputSchema: {
      type: 'object',
      properties: {
        entryId: {
          type: 'string',
          description: 'Unikt ID för posten. Format: "contextId/entryId" (t.ex. "107/42") eller bara entryId. Hämtas från visitsweden_search-resultat.',
        },
      },
      required: ['entryId'],
    },
  },
  {
    id: 'visitsweden_search_events',
    name: 'Sök evenemang',
    description:
      'Sök efter evenemang i Sverige med datumfilter.\n\n' +
      '**Användningsfall:** Hitta evenemang som pågår eller kommer att ske i en viss stad/region.\n' +
      '**Returnerar:** Lista med evenemang, datum, plats och beskrivning.\n' +
      '**Tips:** Utan datumparametrar söks 30 dagar framåt från idag.\n' +
      '**Exempel:** "Vad händer i Malmö nästa helg?", "Evenemang i Stockholm i juni", "Festivaler i Göteborg"',
    category: 'evenemang',
    api: 'visitsweden',
    endpoint: '/store/search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm för evenemang (t.ex. stad, aktivitet, festival, konsert).',
        },
        region: {
          type: 'string',
          enum: Object.keys(REGIONS),
          description: REGION_DESCRIPTION,
        },
        fromDate: {
          type: 'string',
          description: 'Startdatum i format YYYY-MM-DD. Standard: idag.',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        toDate: {
          type: 'string',
          description: 'Slutdatum i format YYYY-MM-DD. Standard: 30 dagar framåt.',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat. Standard: 20.',
          minimum: 1,
          maximum: 100,
          default: 20,
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
      '**Användningsfall:** Hitta sevärdheter, hotell eller restauranger i närheten av en stad.\n' +
      '**Returnerar:** Lista med namn, typ, beskrivning och entry-ID.\n' +
      '**Tips:** Kombinera med type-parameter (t.ex. place="Visby", type="FoodEstablishment" för restauranger nära Visby).\n' +
      '**Exempel:** "Sevärdheter nära Hjo", "Hotell nära Vänern", "Restauranger nära Kalmar"',
    category: 'nara',
    api: 'visitsweden',
    endpoint: '/store/search',
    inputSchema: {
      type: 'object',
      properties: {
        place: {
          type: 'string',
          description: 'Platsnamn att söka nära (t.ex. "Hjo", "Visby", "Abisko", "Kalmar").',
        },
        type: {
          type: 'string',
          enum: Object.keys(ENTITY_TYPES),
          description: TYPE_DESCRIPTION,
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat. Standard: 10.',
          minimum: 1,
          maximum: 50,
          default: 10,
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
