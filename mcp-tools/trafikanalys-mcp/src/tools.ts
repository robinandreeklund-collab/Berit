/**
 * 8 tool definitions for the Trafikanalys MCP server.
 *
 * Each tool includes a full JSON Schema `inputSchema` so the LLM knows
 * exactly which parameters to provide for successful API requests.
 */

import { PRODUCT_CODES, MEASURE_IDS, DIMENSION_IDS } from './types.js';

// ---------------------------------------------------------------------------
// Shared descriptions
// ---------------------------------------------------------------------------

const PRODUCT_DESCRIPTION =
  'Produktkod. Vanliga produkter: ' +
  Object.entries(PRODUCT_CODES)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

const MEASURE_DESCRIPTION =
  'Måttkod. Vanliga mått: ' +
  Object.entries(MEASURE_IDS)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

const DIMENSION_DESCRIPTION =
  'Dimensionskoder. Vanliga dimensioner: ' +
  Object.entries(DIMENSION_IDS)
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
  api: 'structure' | 'data';
  endpoint: string;
  defaultParams?: Record<string, string>;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 8 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Struktur (2) ──────────────────────────────────────────────────────────
  {
    id: 'trafa_list_products',
    name: 'Trafikanalys Produktlista',
    description:
      'Lista alla tillgängliga statistikprodukter från Trafikanalys.\n\n' +
      '**Användningsfall:** Se vilka statistikprodukter som finns tillgängliga.\n' +
      '**Returnerar:** Produktkod, namn, beskrivning.\n' +
      '**Exempel:** "Vilka produkter finns?", "Lista trafikstatistik"',
    category: 'struktur',
    api: 'structure',
    endpoint: '/structure',
    inputSchema: {
      type: 'object',
      properties: {
        lang: {
          type: 'string',
          enum: ['sv', 'en'],
          description: 'Språk: "sv" (svenska, standard) eller "en" (engelska).',
        },
      },
    },
  },
  {
    id: 'trafa_get_product_structure',
    name: 'Trafikanalys Produktstruktur',
    description:
      'Hämta dimensioner och mått för en statistikprodukt.\n\n' +
      '**Användningsfall:** Se vilka dimensioner och mått som finns för en produkt innan datauttag.\n' +
      '**Returnerar:** Dimensioner (med möjliga värden), mått.\n' +
      '**Exempel:** "Vilka dimensioner har t10016?", "Strukturen för fordonsstatistik"',
    category: 'struktur',
    api: 'structure',
    endpoint: '/structure?query={product}',
    inputSchema: {
      type: 'object',
      properties: {
        product: {
          type: 'string',
          enum: Object.keys(PRODUCT_CODES),
          description: PRODUCT_DESCRIPTION,
        },
        lang: {
          type: 'string',
          enum: ['sv', 'en'],
          description: 'Språk: "sv" (svenska, standard) eller "en" (engelska).',
        },
      },
      required: ['product'],
    },
  },

  // ── Data (1) ──────────────────────────────────────────────────────────────
  {
    id: 'trafa_query_data',
    name: 'Trafikanalys Datauttag',
    description:
      'Hämta statistikdata med flexibel frågesyntax. HUVUDVERKTYGET för datauttag.\n\n' +
      '**Användningsfall:** Hämta specifik transportstatistik med valfria filter.\n' +
      '**Frågeformat:** PRODUKT|MÅTT|DIMENSION:värde1,värde2|DIMENSION2:värde\n' +
      '**Returnerar:** Tabelldata med kolumner och rader.\n' +
      '**Exempel:**\n' +
      '- "t10016|itrfslut|ar:2024" — Bilar i trafik 2024\n' +
      '- "t10016|itrfslut|ar:2023,2024|drivm" — Bilar per drivmedel 2023-2024\n' +
      '- "t0603||ar:2024" — Järnvägstransporter 2024',
    category: 'data',
    api: 'data',
    endpoint: '/data?query={query}',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Frågesträng i formatet PRODUKT|MÅTT|DIMENSION:värde1,värde2|DIMENSION2:värde. ' +
            'Exempel: "t10016|itrfslut|ar:2024", "t0501||ar:2024". ' +
            PRODUCT_DESCRIPTION + '. ' +
            MEASURE_DESCRIPTION + '. ' +
            DIMENSION_DESCRIPTION,
        },
        lang: {
          type: 'string',
          enum: ['sv', 'en'],
          description: 'Språk: "sv" (svenska, standard) eller "en" (engelska).',
        },
      },
      required: ['query'],
    },
  },

  // ── Fordon (2) ────────────────────────────────────────────────────────────
  {
    id: 'trafa_cars_in_traffic',
    name: 'Trafikanalys Bilar i trafik',
    description:
      'Hämta antal personbilar registrerade i trafik (produkt t10016, mått itrfslut).\n\n' +
      '**Användningsfall:** Se antal bilar i trafik, uppdelat per år, drivmedel eller ägarkategori.\n' +
      '**Returnerar:** Antal bilar per dimension.\n' +
      '**Exempel:** "Bilar i trafik 2024", "Elbilar i trafik", "Bilar per drivmedel"',
    category: 'fordon',
    api: 'data',
    endpoint: '/data?query=t10016|itrfslut|{filters}',
    defaultParams: { product: 't10016', measure: 'itrfslut' },
    inputSchema: {
      type: 'object',
      properties: {
        ar: {
          type: 'string',
          description: 'År att filtrera på (t.ex. "2024" eller "2023,2024"). Utelämna för alla år.',
        },
        drivm: {
          type: 'string',
          description: 'Drivmedel (t.ex. "bensin", "diesel", "el"). Utelämna för alla drivmedel. Ange utan värde för uppdelning per drivmedel.',
        },
        agarkat: {
          type: 'string',
          description: 'Ägarkategori. Utelämna för alla kategorier.',
        },
        lang: {
          type: 'string',
          enum: ['sv', 'en'],
          description: 'Språk: "sv" (svenska, standard) eller "en" (engelska).',
        },
      },
    },
  },
  {
    id: 'trafa_new_registrations',
    name: 'Trafikanalys Nyregistreringar',
    description:
      'Hämta antal nyregistrerade fordon (produkt t10016, mått nyregunder).\n\n' +
      '**Användningsfall:** Se hur många nya bilar som registreras per år eller per drivmedel.\n' +
      '**Returnerar:** Antal nyregistreringar per dimension.\n' +
      '**Exempel:** "Nyregistreringar 2024", "Nya elbilar 2024", "Nyregistreringar per drivmedel"',
    category: 'fordon',
    api: 'data',
    endpoint: '/data?query=t10016|nyregunder|{filters}',
    defaultParams: { product: 't10016', measure: 'nyregunder' },
    inputSchema: {
      type: 'object',
      properties: {
        ar: {
          type: 'string',
          description: 'År att filtrera på (t.ex. "2024" eller "2023,2024"). Utelämna för alla år.',
        },
        drivm: {
          type: 'string',
          description: 'Drivmedel (t.ex. "bensin", "diesel", "el"). Utelämna för alla drivmedel.',
        },
        lang: {
          type: 'string',
          enum: ['sv', 'en'],
          description: 'Språk: "sv" (svenska, standard) eller "en" (engelska).',
        },
      },
    },
  },

  // ── Transport (3) ─────────────────────────────────────────────────────────
  {
    id: 'trafa_vehicle_km',
    name: 'Trafikanalys Fordonskilometer',
    description:
      'Hämta fordonskilometer (produkt t0401, mått fordonkm).\n\n' +
      '**Användningsfall:** Se total körsträcka för svenska fordon.\n' +
      '**Returnerar:** Fordonskilometer per dimension.\n' +
      '**Exempel:** "Fordonskilometer 2024", "Körsträckor per fordonstyp"',
    category: 'transport',
    api: 'data',
    endpoint: '/data?query=t0401|fordonkm|{filters}',
    defaultParams: { product: 't0401', measure: 'fordonkm' },
    inputSchema: {
      type: 'object',
      properties: {
        ar: {
          type: 'string',
          description: 'År att filtrera på (t.ex. "2024" eller "2023,2024"). Utelämna för alla år.',
        },
        lang: {
          type: 'string',
          enum: ['sv', 'en'],
          description: 'Språk: "sv" (svenska, standard) eller "en" (engelska).',
        },
      },
    },
  },
  {
    id: 'trafa_rail_transport',
    name: 'Trafikanalys Järnvägstransporter',
    description:
      'Hämta järnvägstransportstatistik (produkt t0603).\n\n' +
      '**Användningsfall:** Se statistik om gods- och persontransporter på järnväg.\n' +
      '**Returnerar:** Järnvägsdata per dimension.\n' +
      '**Exempel:** "Järnvägstransporter 2024", "Godstransport på järnväg"',
    category: 'transport',
    api: 'data',
    endpoint: '/data?query=t0603||{filters}',
    defaultParams: { product: 't0603' },
    inputSchema: {
      type: 'object',
      properties: {
        ar: {
          type: 'string',
          description: 'År att filtrera på (t.ex. "2024" eller "2023,2024"). Utelämna för alla år.',
        },
        lang: {
          type: 'string',
          enum: ['sv', 'en'],
          description: 'Språk: "sv" (svenska, standard) eller "en" (engelska).',
        },
      },
    },
  },
  {
    id: 'trafa_air_traffic',
    name: 'Trafikanalys Flygtrafik',
    description:
      'Hämta flygtrafikstatistik (produkt t0501).\n\n' +
      '**Användningsfall:** Se statistik om passagerare, frakt och flygningar.\n' +
      '**Returnerar:** Flygdata per dimension.\n' +
      '**Exempel:** "Flygtrafik 2024", "Antal passagerare per år"',
    category: 'transport',
    api: 'data',
    endpoint: '/data?query=t0501||{filters}',
    defaultParams: { product: 't0501' },
    inputSchema: {
      type: 'object',
      properties: {
        ar: {
          type: 'string',
          description: 'År att filtrera på (t.ex. "2024" eller "2023,2024"). Utelämna för alla år.',
        },
        lang: {
          type: 'string',
          enum: ['sv', 'en'],
          description: 'Språk: "sv" (svenska, standard) eller "en" (engelska).',
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
