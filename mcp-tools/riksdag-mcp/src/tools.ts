/**
 * 15 tool definitions for the Riksdag MCP server.
 *
 * Each tool includes a full JSON Schema `inputSchema` so the LLM knows
 * exactly which parameters to provide for successful API requests.
 */

import { DOKTYP, PARTIER, REGERING_DOKTYP } from './types.js';

// ---------------------------------------------------------------------------
// Shared descriptions
// ---------------------------------------------------------------------------

const DOKTYP_DESCRIPTION =
  'Dokumenttyp. Tillgängliga: ' +
  Object.entries(DOKTYP)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

const PARTI_DESCRIPTION =
  'Parti. Tillgängliga: ' +
  Object.entries(PARTIER)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

const REGERING_DOKTYP_DESCRIPTION =
  'Dokumenttyp. Tillgängliga: ' +
  Object.entries(REGERING_DOKTYP)
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
  api: 'riksdagen' | 'g0v' | 'combined' | 'static';
  endpoint: string;
  defaultParams?: Record<string, string>;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 15 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Sök (4) ──────────────────────────────────────────────────────────────
  {
    id: 'riksdag_sok_dokument',
    name: 'Riksdagen Sök dokument',
    description:
      'Sök bland riksdagens dokument: motioner, propositioner, betänkanden, interpellationer, frågor.\n\n' +
      '**Användningsfall:** Hitta dokument om ett visst ämne, från viss period eller av viss typ.\n' +
      '**Returnerar:** Dok-ID, typ, riksmöte, titel, datum.\n' +
      '**Exempel:** "Motioner om klimat", "Propositioner 2024/25"',
    category: 'sok',
    api: 'riksdagen',
    endpoint: '/dokumentlista/',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm (fritext). Exempel: "klimat", "migration", "skatt".',
        },
        doktyp: {
          type: 'string',
          enum: Object.keys(DOKTYP),
          description: DOKTYP_DESCRIPTION,
        },
        rm: {
          type: 'string',
          description: 'Riksmöte (t.ex. "2024/25"). Lämna tomt för alla.',
        },
        from_date: {
          type: 'string',
          description: 'Startdatum (YYYY-MM-DD). Exempel: "2024-01-01".',
        },
        to_date: {
          type: 'string',
          description: 'Slutdatum (YYYY-MM-DD). Exempel: "2025-12-31".',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 20, max: 100).',
        },
      },
    },
  },
  {
    id: 'riksdag_sok_ledamoter',
    name: 'Riksdagen Sök ledamöter',
    description:
      'Sök bland riksdagens ledamöter efter namn, parti eller valkrets.\n\n' +
      '**Användningsfall:** Hitta en specifik ledamot, lista ledamöter i ett parti eller från en valkrets.\n' +
      '**Returnerar:** ID, namn, parti, valkrets, status.\n' +
      '**Exempel:** "Ledamöter från Västra Götaland", "Moderata ledamöter"',
    category: 'sok',
    api: 'riksdagen',
    endpoint: '/personlista/',
    inputSchema: {
      type: 'object',
      properties: {
        namn: {
          type: 'string',
          description: 'Sök på namn (för- eller efternamn).',
        },
        parti: {
          type: 'string',
          enum: Object.keys(PARTIER),
          description: PARTI_DESCRIPTION,
        },
        valkrets: {
          type: 'string',
          description: 'Valkrets (t.ex. "Stockholms kommun", "Västra Götalands läns norra").',
        },
        status: {
          type: 'string',
          enum: ['active', 'all'],
          description: 'Filtrera på status. "active" = nuvarande ledamöter, "all" = alla (standard: active).',
        },
      },
    },
  },
  {
    id: 'riksdag_sok_anforanden',
    name: 'Riksdagen Sök anföranden',
    description:
      'Sök bland riksdagsdebatternas anföranden (tal i kammaren).\n\n' +
      '**Användningsfall:** Hitta vad som sagts i en debatt, vad en ledamot har sagt.\n' +
      '**Returnerar:** Datum, talare, parti, ämne, dok-ID.\n' +
      '**Exempel:** "Anföranden om försvar", "Vad sa Annie Lööf?"',
    category: 'sok',
    api: 'riksdagen',
    endpoint: '/anforandelista/',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm (fritext i anförandetext).',
        },
        talare: {
          type: 'string',
          description: 'Talarens namn.',
        },
        parti: {
          type: 'string',
          enum: Object.keys(PARTIER),
          description: PARTI_DESCRIPTION,
        },
        rm: {
          type: 'string',
          description: 'Riksmöte (t.ex. "2024/25").',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 20, max: 100).',
        },
      },
    },
  },
  {
    id: 'riksdag_sok_voteringar',
    name: 'Riksdagen Sök voteringar',
    description:
      'Sök bland riksdagens voteringar (omröstningar).\n\n' +
      '**Användningsfall:** Se hur riksdagen röstat i en viss fråga, hur ett parti röstat.\n' +
      '**Returnerar:** Datum, riksmöte, beteckning, punkt, namn, parti, röst.\n' +
      '**Exempel:** "Voteringar 2024/25", "Hur röstade SD?"',
    category: 'sok',
    api: 'riksdagen',
    endpoint: '/voteringlista/',
    inputSchema: {
      type: 'object',
      properties: {
        rm: {
          type: 'string',
          description: 'Riksmöte (t.ex. "2024/25").',
        },
        beteckning: {
          type: 'string',
          description: 'Beteckning (t.ex. "FiU10" för Finansutskottets betänkande 10).',
        },
        parti: {
          type: 'string',
          enum: Object.keys(PARTIER),
          description: PARTI_DESCRIPTION,
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 20, max: 100).',
        },
      },
    },
  },

  // ── Hämta (5) ────────────────────────────────────────────────────────────
  {
    id: 'riksdag_hamta_dokument',
    name: 'Riksdagen Hämta dokument',
    description:
      'Hämta ett specifikt riksdagsdokument med dess ID.\n\n' +
      '**Användningsfall:** Visa detaljer om ett specifikt dokument (motion, proposition, etc.).\n' +
      '**Returnerar:** Fullständig dokumentinformation med titel, typ, sammanfattning, länk.\n' +
      '**Exempel:** "Visa dokument GZ10123", "Detaljer om prop. 2024/25:1"',
    category: 'hamta',
    api: 'riksdagen',
    endpoint: '/dokument/{dok_id}.json',
    inputSchema: {
      type: 'object',
      properties: {
        dok_id: {
          type: 'string',
          description: 'Dokumentets unika ID (t.ex. "GZ10123", "H901FiU10").',
        },
      },
      required: ['dok_id'],
    },
  },
  {
    id: 'riksdag_hamta_ledamot',
    name: 'Riksdagen Hämta ledamot',
    description:
      'Hämta detaljerad information om en specifik riksdagsledamot.\n\n' +
      '**Användningsfall:** Visa fullständig profil för en ledamot.\n' +
      '**Returnerar:** Namn, parti, valkrets, status, uppdrag.\n' +
      '**Exempel:** "Detaljer om ledamot 0123456789"',
    category: 'hamta',
    api: 'riksdagen',
    endpoint: '/personlista/',
    inputSchema: {
      type: 'object',
      properties: {
        intressent_id: {
          type: 'string',
          description: 'Ledamotens unika ID (intressent_id).',
        },
      },
      required: ['intressent_id'],
    },
  },
  {
    id: 'riksdag_hamta_motioner',
    name: 'Riksdagen Hämta motioner',
    description:
      'Hämta de senaste motionerna från riksdagen.\n\n' +
      '**Användningsfall:** Se vilka motioner som lämnats in, t.ex. under innevarande riksmöte.\n' +
      '**Returnerar:** Dok-ID, titel, datum, parti.\n' +
      '**Exempel:** "Senaste motionerna", "Motioner 2024/25"',
    category: 'hamta',
    api: 'riksdagen',
    endpoint: '/dokumentlista/',
    defaultParams: { doktyp: 'mot' },
    inputSchema: {
      type: 'object',
      properties: {
        rm: {
          type: 'string',
          description: 'Riksmöte (t.ex. "2024/25"). Lämna tomt för senaste.',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 20).',
        },
      },
    },
  },
  {
    id: 'riksdag_hamta_propositioner',
    name: 'Riksdagen Hämta propositioner',
    description:
      'Hämta de senaste propositionerna från regeringen.\n\n' +
      '**Användningsfall:** Se vilka propositioner som lagts fram, t.ex. under innevarande riksmöte.\n' +
      '**Returnerar:** Dok-ID, titel, datum.\n' +
      '**Exempel:** "Senaste propositionerna", "Propositioner 2024/25"',
    category: 'hamta',
    api: 'riksdagen',
    endpoint: '/dokumentlista/',
    defaultParams: { doktyp: 'prop' },
    inputSchema: {
      type: 'object',
      properties: {
        rm: {
          type: 'string',
          description: 'Riksmöte (t.ex. "2024/25"). Lämna tomt för senaste.',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 20).',
        },
      },
    },
  },
  {
    id: 'riksdag_hamta_utskott',
    name: 'Riksdagen Utskott',
    description:
      'Lista riksdagens utskott med förkortningar och fullständiga namn.\n\n' +
      '**Användningsfall:** Se vilka utskott som finns, hitta rätt förkortning.\n' +
      '**Returnerar:** Förkortning, fullständigt namn.\n' +
      '**Exempel:** "Vilka utskott finns?", "Vad heter FiU?"',
    category: 'hamta',
    api: 'static',
    endpoint: '',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ── Regering (3) ─────────────────────────────────────────────────────────
  {
    id: 'riksdag_regering_sok',
    name: 'Regeringen Sök dokument',
    description:
      'Sök bland regeringens dokument via g0v.se: pressmeddelanden, propositioner, SOU, DS, direktiv, remisser.\n\n' +
      '**Användningsfall:** Hitta regeringsdokument av en viss typ eller om ett visst ämne.\n' +
      '**Returnerar:** Datum, typ, titel, departement, länk.\n' +
      '**Exempel:** "Senaste pressmeddelanden", "SOU om digitalisering"',
    category: 'regering',
    api: 'g0v',
    endpoint: '/{type}.json',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm (fritext).',
        },
        type: {
          type: 'string',
          enum: Object.keys(REGERING_DOKTYP),
          description: REGERING_DOKTYP_DESCRIPTION,
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 20).',
        },
      },
    },
  },
  {
    id: 'riksdag_regering_dokument',
    name: 'Regeringen Hämta dokument',
    description:
      'Hämta ett specifikt regeringsdokument.\n\n' +
      '**Användningsfall:** Visa detaljer om ett specifikt regeringsdokument.\n' +
      '**Returnerar:** Fullständig dokumentinformation med titel, datum, departement, länk.\n' +
      '**Exempel:** "Visa regeringsdokument X"',
    category: 'regering',
    api: 'g0v',
    endpoint: '/{type}.json',
    inputSchema: {
      type: 'object',
      properties: {
        document_id: {
          type: 'string',
          description: 'Dokumentets unika ID.',
        },
        type: {
          type: 'string',
          enum: Object.keys(REGERING_DOKTYP),
          description: 'Dokumenttyp att söka i.',
        },
      },
      required: ['document_id'],
    },
  },
  {
    id: 'riksdag_regering_departement',
    name: 'Regeringen Departement',
    description:
      'Analysera regeringsdokument per departement.\n\n' +
      '**Användningsfall:** Se vilka dokument ett visst departement publicerat.\n' +
      '**Returnerar:** Datum, typ, titel, departement, länk.\n' +
      '**Exempel:** "Dokument från Finansdepartementet", "Justitiedepartementets pressmeddelanden"',
    category: 'regering',
    api: 'g0v',
    endpoint: '/{type}.json',
    inputSchema: {
      type: 'object',
      properties: {
        departement: {
          type: 'string',
          description: 'Departementets namn (t.ex. "Finansdepartementet", "Justitiedepartementet").',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat (standard: 20).',
        },
      },
    },
  },

  // ── Kalender & Analys (3) ────────────────────────────────────────────────
  {
    id: 'riksdag_kalender',
    name: 'Riksdagen Kalender',
    description:
      'Hämta riksdagens kalenderhändelser (debatter, utskottsmöten, voteringar).\n\n' +
      '**Användningsfall:** Se kommande eller tidigare händelser i riksdagen.\n' +
      '**Returnerar:** Datum, tid, typ, beskrivning, plats.\n' +
      '**Exempel:** "Riksdagens kalender nästa vecka", "Kommande debatter"',
    category: 'kalender',
    api: 'riksdagen',
    endpoint: '/kalenderlista/',
    inputSchema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Startdatum (YYYY-MM-DD). Standard: idag.',
        },
        to: {
          type: 'string',
          description: 'Slutdatum (YYYY-MM-DD). Standard: 7 dagar framåt.',
        },
      },
    },
  },
  {
    id: 'riksdag_kombinerad_sok',
    name: 'Kombinerad sökning',
    description:
      'Sök parallellt i riksdagens och regeringens data.\n\n' +
      '**Användningsfall:** Bred sökning som spänner över både riksdagen och regeringen.\n' +
      '**Returnerar:** Resultat från båda källorna i en samlad vy.\n' +
      '**Exempel:** "Allt om klimat", "Sök migration i riksdag och regering"',
    category: 'kalender',
    api: 'combined',
    endpoint: '',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm (fritext). Söker i både riksdagen och regeringen.',
        },
        limit: {
          type: 'number',
          description: 'Max antal resultat per källa (standard: 10).',
        },
      },
      required: ['query'],
    },
  },
  {
    id: 'riksdag_statistik',
    name: 'Riksdagen Statistik',
    description:
      'Lista tillgängliga datakällor och rapporttyper.\n\n' +
      '**Användningsfall:** Översikt av vad som finns att hämta via Riksdags-MCP.\n' +
      '**Returnerar:** Tillgängliga datakällor, dokumenttyper och verktyg.\n' +
      '**Exempel:** "Vad kan jag söka på?", "Vilka rapporter finns?"',
    category: 'kalender',
    api: 'static',
    endpoint: '',
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
