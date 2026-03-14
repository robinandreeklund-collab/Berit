/**
 * 8 tool definitions for the NVV MCP server.
 *
 * Each tool includes a full JSON Schema `inputSchema` so the LLM knows
 * exactly which parameters to provide for successful API requests.
 */

import { LAN_CODES, SPECIES_GROUPS } from './types.js';

// ---------------------------------------------------------------------------
// Shared descriptions
// ---------------------------------------------------------------------------

const LAN_DESCRIPTION =
  'Lanskod (1\u20132 bokstaver). Tillgangliga: ' +
  Object.entries(LAN_CODES)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

const SPECIES_GROUP_DESCRIPTION =
  'Artgrupp. Tillgangliga: ' +
  Object.entries(SPECIES_GROUPS)
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
  api: 'national' | 'n2000' | 'ramsar' | 'local';
  endpoint: string;
  defaultParams?: Record<string, string>;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 8 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // -- Uppslag (1) ----------------------------------------------------------
  {
    id: 'nvv_uppslag',
    name: 'NVV Uppslag',
    description:
      'Sla upp svenska administrativa koder (kommun- och lanskoder).\n\n' +
      '**Anvandningsfall:** Konvertera platsnamn till koder for att anvanda i sokverktyg.\n' +
      '**Returnerar:** Matchande koder och namn.\n' +
      '**Exempel:** "Vilken kod har Stockholms lan?", "Kommun-kod for Malmo"',
    category: 'uppslag',
    api: 'local',
    endpoint: 'local',
    inputSchema: {
      type: 'object',
      properties: {
        typ: {
          type: 'string',
          enum: ['kommun', 'lan'],
          description: 'Typ av uppslag: "kommun" for kommuner, "lan" for lan.',
        },
        namn: {
          type: 'string',
          description: 'Namn att soka efter (del av eller fullstandigt). Exempel: "Stockholm", "Skane".',
        },
      },
      required: ['namn'],
    },
  },

  // -- Sok (2) --------------------------------------------------------------
  {
    id: 'nvv_sok_nationella',
    name: 'NVV Sok Nationella Skyddade Omraden',
    description:
      'Sok nationellt skyddade naturomraden (naturreservat, nationalparker, etc.).\n\n' +
      '**Anvandningsfall:** Hitta skyddade omraden i en kommun eller ett lan.\n' +
      '**Returnerar:** Lista med omraden: ID, namn, typ, areal, lan, kommun.\n' +
      '**Exempel:** "Naturreservat i Stockholms lan", "Skyddade omraden i Goteborg"',
    category: 'sok',
    api: 'national',
    endpoint: '/omrade/nolinks',
    inputSchema: {
      type: 'object',
      properties: {
        kommun: {
          type: 'string',
          description: 'Kommunkod (4 siffror, t.ex. "0180" for Stockholm). Anvand nvv_uppslag for att hitta koder.',
        },
        lan: {
          type: 'string',
          enum: Object.keys(LAN_CODES),
          description: LAN_DESCRIPTION,
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 50).',
        },
      },
    },
  },
  {
    id: 'nvv_sok_natura2000',
    name: 'NVV Sok Natura 2000',
    description:
      'Sok Natura 2000-omraden (EU:s natverk av skyddade naturomraden).\n\n' +
      '**Anvandningsfall:** Hitta Natura 2000-omraden i en kommun eller ett lan.\n' +
      '**Returnerar:** Lista med omraden: kod, namn, areal, lan, kommun.\n' +
      '**Exempel:** "Natura 2000 i Uppsala lan", "EU-skyddade omraden i Skane"',
    category: 'sok',
    api: 'n2000',
    endpoint: '/omrade/nolinks',
    inputSchema: {
      type: 'object',
      properties: {
        kommun: {
          type: 'string',
          description: 'Kommunkod (4 siffror). Anvand nvv_uppslag for att hitta koder.',
        },
        lan: {
          type: 'string',
          enum: Object.keys(LAN_CODES),
          description: LAN_DESCRIPTION,
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 50).',
        },
      },
    },
  },

  // -- Detalj (3) -----------------------------------------------------------
  {
    id: 'nvv_detalj_nationellt',
    name: 'NVV Detalj Nationellt Skyddat Omrade',
    description:
      'Hamta detaljerad information om ett nationellt skyddat naturomrade.\n\n' +
      '**Anvandningsfall:** Se detaljer, syften och marktacke for ett specifikt omrade.\n' +
      '**Returnerar:** Omradesdetaljer, syften, NMD-marktackeklasser.\n' +
      '**Exempel:** "Detaljer om naturreservat 2003456", "Syftet med naturreservat X"',
    category: 'detalj',
    api: 'national',
    endpoint: '/omrade/{id}/Gallande',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Omrades-ID (NVR-ID). Anvand nvv_sok_nationella for att hitta ID.',
        },
        include: {
          type: 'string',
          enum: ['all', 'basic', 'purposes', 'land_cover'],
          description: 'Vad som ska inkluderas. "all"=alla detaljer (standard), "basic"=grunddata, "purposes"=syften, "land_cover"=marktacke.',
        },
      },
      required: ['id'],
    },
  },
  {
    id: 'nvv_detalj_natura2000',
    name: 'NVV Detalj Natura 2000',
    description:
      'Hamta detaljerad information om ett Natura 2000-omrade med arter och naturtyper.\n\n' +
      '**Anvandningsfall:** Se skyddade arter och naturtyper i ett Natura 2000-omrade.\n' +
      '**Returnerar:** Omradesdetaljer, artlista, naturtypslista.\n' +
      '**Exempel:** "Arter i Natura 2000-omrade SE0110001", "Naturtyper i omrade X"',
    category: 'detalj',
    api: 'n2000',
    endpoint: '/omrade/{kod}',
    inputSchema: {
      type: 'object',
      properties: {
        kod: {
          type: 'string',
          description: 'Natura 2000-kod (t.ex. "SE0110001"). Anvand nvv_sok_natura2000 for att hitta koder.',
        },
        include: {
          type: 'string',
          enum: ['all', 'basic', 'species', 'habitats'],
          description: 'Vad som ska inkluderas. "all"=alla detaljer (standard), "basic"=grunddata, "species"=arter, "habitats"=naturtyper.',
        },
      },
      required: ['kod'],
    },
  },
  {
    id: 'nvv_detalj_ramsar',
    name: 'NVV Detalj Ramsar',
    description:
      'Hamta detaljerad information om ett Ramsar-vatmarksomrade.\n\n' +
      '**Anvandningsfall:** Se detaljer om internationellt skyddade vatmarker.\n' +
      '**Returnerar:** Omradesdetaljer: namn, areal, lan, kommun, beslutsdatum.\n' +
      '**Exempel:** "Detaljer om Ramsar-omrade 5", "Information om vatmark X"',
    category: 'detalj',
    api: 'ramsar',
    endpoint: '/ramsar/{id}',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Ramsar-omrades-ID. Anvand nvv_sok_alla for att hitta ID.',
        },
      },
      required: ['id'],
    },
  },

  // -- Oversikt (2) ---------------------------------------------------------
  {
    id: 'nvv_sok_alla',
    name: 'NVV Sok Alla Skyddade Omraden',
    description:
      'Sok i alla tre kallor samtidigt: nationella skyddade omraden, Natura 2000 och Ramsar.\n\n' +
      '**Anvandningsfall:** Fa en oversikt over alla typer av skyddade omraden i ett omrade.\n' +
      '**Returnerar:** Kombinerad lista fran alla tre API:er.\n' +
      '**Exempel:** "Alla skyddade omraden i Gotlands lan", "Skyddad natur i Malmo kommun"',
    category: 'oversikt',
    api: 'national',
    endpoint: 'combined',
    inputSchema: {
      type: 'object',
      properties: {
        kommun: {
          type: 'string',
          description: 'Kommunkod (4 siffror). Anvand nvv_uppslag for att hitta koder.',
        },
        lan: {
          type: 'string',
          enum: Object.keys(LAN_CODES),
          description: LAN_DESCRIPTION,
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat per kalla (standard: 30).',
        },
      },
    },
  },
  {
    id: 'nvv_arter',
    name: 'NVV Skyddade Arter',
    description:
      'Lista skyddade arter i Natura 2000-omraden, filtrerat pa artgrupp.\n\n' +
      '**Anvandningsfall:** Se vilka arter som ar skyddade i ett eller flera Natura 2000-omraden.\n' +
      '**Returnerar:** Artlista med vetenskapligt namn, svenskt namn, grupp, bilaga.\n' +
      '**Exempel:** "Skyddade faglar i Natura 2000", "Vilka daggdjur ar skyddade?"',
    category: 'oversikt',
    api: 'n2000',
    endpoint: '/omrade/{kod}/arter',
    inputSchema: {
      type: 'object',
      properties: {
        kod: {
          type: 'string',
          description: 'Natura 2000-kod (t.ex. "SE0110001"). Anvand nvv_sok_natura2000 for att hitta koder.',
        },
        grupp: {
          type: 'string',
          enum: Object.keys(SPECIES_GROUPS),
          description: SPECIES_GROUP_DESCRIPTION,
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
