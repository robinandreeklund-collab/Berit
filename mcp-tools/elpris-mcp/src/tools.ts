/**
 * 4 tool definitions for the Elpris MCP server.
 */

import { PRICE_ZONES } from './types.js';

// ---------------------------------------------------------------------------
// Shared descriptions
// ---------------------------------------------------------------------------

const ZONE_DESCRIPTION =
  'Priszon. Tillgängliga: ' +
  Object.entries(PRICE_ZONES)
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
  api: 'elprisetjustnu';
  endpoint: string;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 4 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: 'elpris_idag',
    name: 'Elpris Idag',
    description:
      'Hämta dagens elpriser (spotpriser) per zon.\n\n' +
      '**Användningsfall:** Se vad elen kostar idag per timme.\n' +
      '**Returnerar:** Timpris i SEK/kWh och EUR/kWh (exkl. moms och avgifter).\n' +
      '**Exempel:** "Vad kostar elen idag?", "Elpriser Stockholm", "Spotpris SE3"',
    category: 'pris',
    api: 'elprisetjustnu',
    endpoint: '/api/v1/prices/{year}/{month}-{day}_{zone}.json',
    inputSchema: {
      type: 'object',
      properties: {
        zon: {
          type: 'string',
          enum: Object.keys(PRICE_ZONES),
          description: ZONE_DESCRIPTION + '. Standard: SE3 (Stockholm).',
        },
      },
    },
  },
  {
    id: 'elpris_imorgon',
    name: 'Elpris Imorgon',
    description:
      'Hämta morgondagens elpriser (spotpriser) per zon.\n\n' +
      '**OBS:** Morgondagens priser publiceras normalt efter kl 13:00.\n' +
      '**Användningsfall:** Se vad elen kommer att kosta imorgon.\n' +
      '**Returnerar:** Timpris i SEK/kWh och EUR/kWh (exkl. moms och avgifter).\n' +
      '**Exempel:** "Elpris imorgon", "Vad kostar elen imorgon i Malmö?"',
    category: 'pris',
    api: 'elprisetjustnu',
    endpoint: '/api/v1/prices/{year}/{month}-{day}_{zone}.json',
    inputSchema: {
      type: 'object',
      properties: {
        zon: {
          type: 'string',
          enum: Object.keys(PRICE_ZONES),
          description: ZONE_DESCRIPTION + '. Standard: SE3 (Stockholm).',
        },
      },
    },
  },
  {
    id: 'elpris_historik',
    name: 'Elpris Historik',
    description:
      'Hämta historiska elpriser för en specifik zon och datumintervall.\n\n' +
      '**Användningsfall:** Se elprisutveckling under en period.\n' +
      '**Returnerar:** Dagliga snittpriser i SEK/kWh.\n' +
      '**OBS:** Max 31 dagars intervall per anrop. Data från 2022-11-01.\n' +
      '**Exempel:** "Elpriser förra veckan", "Elprisutveckling januari 2025"',
    category: 'historik',
    api: 'elprisetjustnu',
    endpoint: '/api/v1/prices/{year}/{month}-{day}_{zone}.json',
    inputSchema: {
      type: 'object',
      properties: {
        zon: {
          type: 'string',
          enum: Object.keys(PRICE_ZONES),
          description: ZONE_DESCRIPTION,
        },
        fromDate: {
          type: 'string',
          description: 'Startdatum (YYYY-MM-DD). Tidigast 2022-11-01.',
        },
        toDate: {
          type: 'string',
          description: 'Slutdatum (YYYY-MM-DD). Max 31 dagar efter startdatum.',
        },
      },
      required: ['zon', 'fromDate', 'toDate'],
    },
  },
  {
    id: 'elpris_jamforelse',
    name: 'Elpris Zonjämförelse',
    description:
      'Jämför elpriser mellan alla fyra svenska priszoner för ett datum.\n\n' +
      '**Användningsfall:** Se prisskillnader mellan norr och söder.\n' +
      '**Returnerar:** Snittpriser per zon i SEK/kWh.\n' +
      '**Exempel:** "Jämför elpriser mellan zonerna", "Prisskillnad norr/söder"',
    category: 'jamforelse',
    api: 'elprisetjustnu',
    endpoint: '/api/v1/prices/{year}/{month}-{day}_{zone}.json',
    inputSchema: {
      type: 'object',
      properties: {
        datum: {
          type: 'string',
          description: 'Datum att jämföra (YYYY-MM-DD). Standard: idag.',
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
