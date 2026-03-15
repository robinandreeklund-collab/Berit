/**
 * 10 tool definitions for the KB MCP server.
 *
 * Each tool includes a full JSON Schema `inputSchema` so the LLM knows
 * exactly which parameters to provide for successful API requests.
 */

import { LIBRIS_SEARCH_FIELDS, KSAMSOK_ITEM_TYPES, SWEDISH_COUNTIES } from './types.js';

// ---------------------------------------------------------------------------
// Shared descriptions
// ---------------------------------------------------------------------------

const SEARCH_FIELDS_DESCRIPTION =
  'Tillgängliga sökfält i Libris: ' +
  Object.entries(LIBRIS_SEARCH_FIELDS)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

const ITEM_TYPES_DESCRIPTION =
  'Vanliga objekttyper i K-samsök: ' +
  Object.entries(KSAMSOK_ITEM_TYPES)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

const COUNTIES_DESCRIPTION =
  'Svenska län: ' + SWEDISH_COUNTIES.join(', ');

// ---------------------------------------------------------------------------
// ToolDefinition interface
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  api: 'libris' | 'ksamsok' | 'swepub';
  endpoint: string;
  defaultParams?: Record<string, string>;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 10 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Libris sökning (4) ──────────────────────────────────────────────────
  {
    id: 'kb_libris_search',
    name: 'KB Libris Sökning',
    description:
      'Fritextsökning i Libris — Sveriges nationella bibliotekskatalog (böcker, tidskrifter, e-resurser).\n\n' +
      '**Användningsfall:** Hitta böcker, tidskrifter och andra publikationer i svenska bibliotek.\n' +
      '**Returnerar:** Titel, författare, år, förlag, ISBN, typ.\n' +
      '**Exempel:** "Astrid Lindgren", "svenska krig 1700-talet", "machine learning"',
    category: 'libris',
    api: 'libris',
    endpoint: '/xsearch',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Fritextsökning. Söker i titel, författare, ämnesord m.m. Exempel: "Selma Lagerlöf", "klimatförändring".',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (1-200). Standard: 10.',
        },
      },
      required: ['query'],
    },
  },
  {
    id: 'kb_libris_search_author',
    name: 'KB Libris Författarsökning',
    description:
      'Sök böcker efter författare i Libris.\n\n' +
      '**Användningsfall:** Hitta alla verk av en specifik författare.\n' +
      '**Returnerar:** Titel, författare, år, förlag, ISBN.\n' +
      '**Exempel:** "Vilhelm Moberg", "Karin Boye", "August Strindberg"',
    category: 'libris',
    api: 'libris',
    endpoint: '/xsearch',
    defaultParams: { field: 'AUTHOR' },
    inputSchema: {
      type: 'object',
      properties: {
        author: {
          type: 'string',
          description: 'Författarnamn. Exempel: "Astrid Lindgren", "Henning Mankell".',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (1-200). Standard: 10.',
        },
      },
      required: ['author'],
    },
  },
  {
    id: 'kb_libris_search_title',
    name: 'KB Libris Titelsökning',
    description:
      'Sök böcker efter titel i Libris.\n\n' +
      '**Användningsfall:** Hitta en specifik bok med dess titel.\n' +
      '**Returnerar:** Titel, författare, år, förlag, ISBN.\n' +
      '**Exempel:** "Pippi Långstrump", "Röda rummet", "Män som hatar kvinnor"',
    category: 'libris',
    api: 'libris',
    endpoint: '/xsearch',
    defaultParams: { field: 'TITLE' },
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Boktitel att söka efter. Exempel: "Doktor Glas", "Kallocain".',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (1-200). Standard: 10.',
        },
      },
      required: ['title'],
    },
  },
  {
    id: 'kb_libris_search_isbn',
    name: 'KB Libris ISBN-sökning',
    description:
      'Sök en specifik bok med ISBN i Libris.\n\n' +
      '**Användningsfall:** Hitta en bok med dess ISBN-nummer.\n' +
      '**Returnerar:** Titel, författare, år, förlag, fullständig post.\n' +
      '**Exempel:** "9789113071749", "91-29-65834-5"',
    category: 'libris',
    api: 'libris',
    endpoint: '/xsearch',
    defaultParams: { field: 'ISBN' },
    inputSchema: {
      type: 'object',
      properties: {
        isbn: {
          type: 'string',
          description: 'ISBN-nummer (10 eller 13 siffror, med eller utan bindestreck). Exempel: "9789113071749".',
        },
      },
      required: ['isbn'],
    },
  },

  // ── Libris avancerad (2) ────────────────────────────────────────────────
  {
    id: 'kb_libris_find',
    name: 'KB Libris Avancerad Sökning',
    description:
      'Avancerad sökning i Libris med operatorer och fältspecifika sökningar (JSON-LD).\n\n' +
      '**Användningsfall:** Komplexa sökningar med AND, OR, NOT och fältfilter.\n' +
      '**Returnerar:** Detaljerade bibliografiska poster i JSON-LD-format.\n' +
      '**Exempel:** "title:klimat AND year:2024", "author:Lindgren AND type:Text"\n\n' +
      SEARCH_FIELDS_DESCRIPTION,
    category: 'libris',
    api: 'libris',
    endpoint: '/find',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Avancerad söksträng. Stöder operatorer: AND, OR, NOT, fält:värde. Exempel: "title:Pippi AND author:Lindgren".',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (1-200). Standard: 10.',
        },
      },
      required: ['query'],
    },
  },
  {
    id: 'kb_libris_holdings',
    name: 'KB Libris Beståndsuppgifter',
    description:
      'Visa vilka bibliotek som har en viss bok (beståndsuppgifter).\n\n' +
      '**Användningsfall:** Se på vilka bibliotek en bok finns tillgänglig.\n' +
      '**Returnerar:** Biblioteksnamn, sigel, hyllplacering.\n' +
      '**Exempel:** Ange post-ID från en Libris-sökning',
    category: 'libris',
    api: 'libris',
    endpoint: '/{id}/data.jsonld',
    inputSchema: {
      type: 'object',
      properties: {
        recordId: {
          type: 'string',
          description: 'Libris post-ID. Kan vara kort-ID (t.ex. "bib/12345") eller fullständig URI. Erhålls från andra Libris-sökningar.',
        },
      },
      required: ['recordId'],
    },
  },

  // ── K-samsök (3) ────────────────────────────────────────────────────────
  {
    id: 'kb_ksamsok_search',
    name: 'KB K-samsök Sökning',
    description:
      'Sök i K-samsök — Sveriges aggregator för kulturarvsobjekt (83 institutioner).\n\n' +
      '**Användningsfall:** Hitta kulturarvsobjekt som foton, fornlämningar, konstverk, byggnader.\n' +
      '**Returnerar:** Objektnamn, typ, institution, beskrivning, bild-URL.\n' +
      '**Exempel:** "vikingatid", "runsten", "Carl Larsson"\n\n' +
      ITEM_TYPES_DESCRIPTION,
    category: 'ksamsok',
    api: 'ksamsok',
    endpoint: '/search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'CQL-söksträng. Fritext eller fältspecifik: "text=viking", "itemType=foto AND text=stockholm". ' + ITEM_TYPES_DESCRIPTION,
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (1-500). Standard: 10.',
        },
      },
      required: ['query'],
    },
  },
  {
    id: 'kb_ksamsok_search_location',
    name: 'KB K-samsök Platssökning',
    description:
      'Sök kulturarvsobjekt efter geografisk plats (län eller kommun).\n\n' +
      '**Användningsfall:** Hitta kulturarv i ett specifikt område.\n' +
      '**Returnerar:** Objektnamn, typ, institution, plats.\n' +
      '**Exempel:** "Gotland", "Uppsala kommun", "Skåne fornlämningar"\n\n' +
      COUNTIES_DESCRIPTION,
    category: 'ksamsok',
    api: 'ksamsok',
    endpoint: '/search',
    inputSchema: {
      type: 'object',
      properties: {
        county: {
          type: 'string',
          description: 'Länsnamn. ' + COUNTIES_DESCRIPTION,
        },
        municipality: {
          type: 'string',
          description: 'Kommunnamn. Exempel: "Göteborg", "Uppsala", "Lund".',
        },
        query: {
          type: 'string',
          description: 'Ytterligare sökord att kombinera med plats. Exempel: "kyrka", "fornlämning".',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (1-500). Standard: 10.',
        },
      },
    },
  },
  {
    id: 'kb_ksamsok_get_object',
    name: 'KB K-samsök Hämta Objekt',
    description:
      'Hämta detaljerad information om ett specifikt kulturarvsobjekt.\n\n' +
      '**Användningsfall:** Visa fullständig information om ett K-samsök-objekt.\n' +
      '**Returnerar:** Fullständig post med metadata, beskrivning, bilder, relationer.\n' +
      '**Exempel:** Ange objekt-ID från en K-samsök-sökning',
    category: 'ksamsok',
    api: 'ksamsok',
    endpoint: '/getObject',
    inputSchema: {
      type: 'object',
      properties: {
        objectId: {
          type: 'string',
          description: 'K-samsök objekt-URI. Erhålls från K-samsök-sökresultat. Exempel: "raa/fmi/10028600550001".',
        },
      },
      required: ['objectId'],
    },
  },

  // ── Swepub (1) ──────────────────────────────────────────────────────────
  {
    id: 'kb_swepub_search',
    name: 'KB Swepub Sökning',
    description:
      'Sök svenska forskningspublikationer i Swepub.\n\n' +
      '**Användningsfall:** Hitta vetenskapliga artiklar, avhandlingar och rapporter från svenska lärosäten.\n' +
      '**Returnerar:** Titel, författare, år, källa, typ.\n' +
      '**Exempel:** "artificiell intelligens", "klimatanpassning", "CRISPR"',
    category: 'swepub',
    api: 'swepub',
    endpoint: '/xsearch',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Söksträng för forskningspublikationer. Söker i titel, författare, ämnesord. Exempel: "machine learning", "hållbar utveckling".',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (1-200). Standard: 10.',
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
