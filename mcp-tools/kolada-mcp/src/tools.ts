/**
 * 10 tool definitions for the Kolada MCP server.
 *
 * Each tool includes a full JSON Schema `inputSchema` so the LLM knows
 * exactly which parameters to provide for successful API requests.
 */

import { POPULAR_KPIS, COMMON_MUNICIPALITIES } from './types.js';

// ---------------------------------------------------------------------------
// Shared descriptions
// ---------------------------------------------------------------------------

const KPI_DESCRIPTION =
  'Vanliga nyckeltal: ' +
  Object.entries(POPULAR_KPIS)
    .slice(0, 5)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

const MUNICIPALITY_DESCRIPTION =
  'Vanliga kommuner: ' +
  Object.entries(COMMON_MUNICIPALITIES)
    .slice(0, 5)
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
  api: 'kolada';
  endpoint: string;
  defaultParams?: Record<string, string>;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 10 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Sök (3) ──────────────────────────────────────────────────────────────
  {
    id: 'kolada_sok_nyckeltal',
    name: 'Kolada Sök nyckeltal',
    description:
      'Sök nyckeltal (KPI:er) i Kolada efter titel/nyckelord.\n\n' +
      '**Användningsfall:** Hitta rätt nyckeltal-ID för kommunstatistik.\n' +
      '**Returnerar:** ID, namn, verksamhetsområde.\n' +
      '**Exempel:** "befolkning", "skola", "äldreomsorg", "kostnad per elev"',
    category: 'sok',
    api: 'kolada',
    endpoint: '/kpi?title={query}',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm för nyckeltalsnamn (t.ex. "befolkning", "skola", "äldreomsorg"). ' + KPI_DESCRIPTION,
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 20).',
        },
      },
      required: ['query'],
    },
  },
  {
    id: 'kolada_sok_kommun',
    name: 'Kolada Sök kommun',
    description:
      'Sök kommuner och län i Kolada efter namn.\n\n' +
      '**Användningsfall:** Hitta kommun-ID för att hämta data.\n' +
      '**Returnerar:** ID, namn, typ (K=kommun, L=län).\n' +
      '**Exempel:** "Stockholm", "Malmö", "Göteborg"',
    category: 'sok',
    api: 'kolada',
    endpoint: '/municipality?title={query}',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Kommunnamn att söka efter. ' + MUNICIPALITY_DESCRIPTION,
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 20).',
        },
      },
      required: ['query'],
    },
  },
  {
    id: 'kolada_sok_enhet',
    name: 'Kolada Sök enhet',
    description:
      'Sök organisatoriska enheter (skolor, vårdcentraler, etc.) i Kolada.\n\n' +
      '**Användningsfall:** Hitta enhets-ID för detaljerad statistik.\n' +
      '**Returnerar:** ID, namn, kommun.\n' +
      '**Exempel:** "Björkskolan", "vårdcentral"',
    category: 'sok',
    api: 'kolada',
    endpoint: '/ou?title={query}',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Enhetsnamn att söka efter (t.ex. "Björkskolan", "vårdcentral").',
        },
        kommun: {
          type: 'string',
          description: 'Kommun-ID för att filtrera enheter (t.ex. "0180" för Stockholm). Valfritt.',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 20).',
        },
      },
      required: ['query'],
    },
  },

  // ── Hämta data (4) ────────────────────────────────────────────────────────
  {
    id: 'kolada_data_kommun',
    name: 'Kolada Data kommun',
    description:
      'Hämta nyckeltalsvärden för en specifik kommun.\n\n' +
      '**Användningsfall:** Se ett nyckeltals värde för en kommun, med möjlighet att ange tidsperiod.\n' +
      '**Returnerar:** Kommun, period, värde, kön.\n' +
      '**Exempel:** "Invånarantal i Stockholm", "Skolresultat i Malmö 2020-2024"',
    category: 'data',
    api: 'kolada',
    endpoint: '/data/municipality/{kommun_id}/kpi/{kpi_id}',
    inputSchema: {
      type: 'object',
      properties: {
        kpi_id: {
          type: 'string',
          description: 'Nyckeltal-ID. ' + KPI_DESCRIPTION,
        },
        kommun_id: {
          type: 'string',
          description: 'Kommun-ID (4 siffror). ' + MUNICIPALITY_DESCRIPTION,
        },
        from_year: {
          type: 'string',
          description: 'Startår (t.ex. "2020"). Valfritt.',
        },
        to_year: {
          type: 'string',
          description: 'Slutår (t.ex. "2024"). Valfritt.',
        },
      },
      required: ['kpi_id', 'kommun_id'],
    },
  },
  {
    id: 'kolada_data_alla_kommuner',
    name: 'Kolada Data alla kommuner',
    description:
      'Hämta nyckeltalsvärden för ALLA kommuner för ett visst år.\n\n' +
      '**Användningsfall:** Jämföra alla kommuner, hitta bästa/sämsta, rankningar.\n' +
      '**Returnerar:** Kommun, period, värde för samtliga kommuner.\n' +
      '**Exempel:** "Vilken kommun har flest invånare 2023?"',
    category: 'data',
    api: 'kolada',
    endpoint: '/data/permunicipality/{kpi_id}/{year}',
    inputSchema: {
      type: 'object',
      properties: {
        kpi_id: {
          type: 'string',
          description: 'Nyckeltal-ID. ' + KPI_DESCRIPTION,
        },
        year: {
          type: 'string',
          description: 'År att hämta data för (t.ex. "2023").',
        },
      },
      required: ['kpi_id', 'year'],
    },
  },
  {
    id: 'kolada_data_enhet',
    name: 'Kolada Data enhet',
    description:
      'Hämta nyckeltalsvärden per organisatorisk enhet (skola, vårdcentral, etc.).\n\n' +
      '**Användningsfall:** Jämföra enskilda skolor, vårdcentraler eller andra enheter.\n' +
      '**Returnerar:** Enhet, period, värde.\n' +
      '**Exempel:** "Skolresultat per skola 2023"',
    category: 'data',
    api: 'kolada',
    endpoint: '/data/perou/{kpi_id}/{year}',
    inputSchema: {
      type: 'object',
      properties: {
        kpi_id: {
          type: 'string',
          description: 'Nyckeltal-ID. ' + KPI_DESCRIPTION,
        },
        year: {
          type: 'string',
          description: 'År att hämta data för (t.ex. "2023").',
        },
      },
      required: ['kpi_id', 'year'],
    },
  },
  {
    id: 'kolada_nyckeltal_detalj',
    name: 'Kolada Nyckeltal detalj',
    description:
      'Hämta detaljerad metadata om ett nyckeltal (KPI).\n\n' +
      '**Användningsfall:** Förstå vad ett nyckeltal mäter, vem som är ansvarig, publiceringsdata.\n' +
      '**Returnerar:** ID, namn, beskrivning, verksamhetsområde, ansvarig, perspektiv.\n' +
      '**Exempel:** "Vad mäter N01951?", "Beskriv nyckeltal N02267"',
    category: 'data',
    api: 'kolada',
    endpoint: '/kpi/{kpi_id}',
    inputSchema: {
      type: 'object',
      properties: {
        kpi_id: {
          type: 'string',
          description: 'Nyckeltal-ID (t.ex. "N01951"). ' + KPI_DESCRIPTION,
        },
      },
      required: ['kpi_id'],
    },
  },

  // ── Jämförelse (2) ────────────────────────────────────────────────────────
  {
    id: 'kolada_jamfor_kommuner',
    name: 'Kolada Jämför kommuner',
    description:
      'Jämför nyckeltalsvärden mellan flera kommuner.\n\n' +
      '**Användningsfall:** Jämföra t.ex. skolresultat eller kostnader mellan kommuner.\n' +
      '**Returnerar:** Kommun, period, värde för varje vald kommun.\n' +
      '**Exempel:** "Jämför invånarantal Stockholm, Malmö, Göteborg"',
    category: 'jamforelse',
    api: 'kolada',
    endpoint: '/data/municipality/{kommun_ids}/kpi/{kpi_id}',
    inputSchema: {
      type: 'object',
      properties: {
        kpi_id: {
          type: 'string',
          description: 'Nyckeltal-ID att jämföra. ' + KPI_DESCRIPTION,
        },
        kommun_ids: {
          type: 'string',
          description: 'Kommun-ID:n, kommaseparerade (t.ex. "0180,1280,1480"). ' + MUNICIPALITY_DESCRIPTION,
        },
        year: {
          type: 'string',
          description: 'År att jämföra (t.ex. "2023"). Standard: senaste tillgängliga.',
        },
      },
      required: ['kpi_id', 'kommun_ids'],
    },
  },
  {
    id: 'kolada_trend',
    name: 'Kolada Trend',
    description:
      'Hämta trenddata för ett nyckeltal i en kommun över flera år.\n\n' +
      '**Användningsfall:** Se utveckling över tid, identifiera trender.\n' +
      '**Returnerar:** År, värde, förändring.\n' +
      '**Exempel:** "Befolkningsutveckling Stockholm senaste 5 åren"',
    category: 'jamforelse',
    api: 'kolada',
    endpoint: '/data/municipality/{kommun_id}/kpi/{kpi_id}',
    inputSchema: {
      type: 'object',
      properties: {
        kpi_id: {
          type: 'string',
          description: 'Nyckeltal-ID. ' + KPI_DESCRIPTION,
        },
        kommun_id: {
          type: 'string',
          description: 'Kommun-ID (4 siffror). ' + MUNICIPALITY_DESCRIPTION,
        },
        years: {
          type: 'number',
          description: 'Antal år bakåt (standard: 5).',
        },
      },
      required: ['kpi_id', 'kommun_id'],
    },
  },

  // ── Referens (1) ──────────────────────────────────────────────────────────
  {
    id: 'kolada_kommungrupper',
    name: 'Kolada Kommungrupper',
    description:
      'Lista kommungrupper (klassificeringar som SKR:s kommuntyper).\n\n' +
      '**Användningsfall:** Se vilka kommungrupper som finns, för att jämföra liknande kommuner.\n' +
      '**Returnerar:** Grupp-ID, namn, antal medlemmar.\n' +
      '**Exempel:** "Vilka kommungrupper finns?", "Storstadskommuner"',
    category: 'referens',
    api: 'kolada',
    endpoint: '/municipality_groups',
    inputSchema: {
      type: 'object',
      properties: {},
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
