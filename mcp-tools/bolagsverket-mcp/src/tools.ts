/**
 * 6 tool definitions for the Bolagsverket MCP server.
 *
 * Aligned with actual API capabilities (Värdefulla datamängder v1).
 * Search is by organisation number only — no name-based search.
 */

// ---------------------------------------------------------------------------
// ToolDefinition interface
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  api: 'vardefulla';
  endpoint: string;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 6 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Uppslag (1) ─────────────────────────────────────────────────────────
  {
    id: 'bolagsverket_uppslag',
    name: 'Bolagsverket Organisationsuppslag',
    description:
      'Slå upp en organisation via organisationsnummer. Returnerar all tillgänglig grunddata.\n\n' +
      '**Användningsfall:** Hitta information om ett företag via org.nummer.\n' +
      '**Returnerar:** Namn, juridisk form, adress, verksamhet, SNI-koder, status.\n' +
      '**OBS:** Sökning sker ENBART via organisationsnummer — ej via namn.\n' +
      '**Exempel:** "Sök på 5566778899", "Info om org.nr 556677-8899"',
    category: 'uppslag',
    api: 'vardefulla',
    endpoint: '/organisationer',
    inputSchema: {
      type: 'object',
      properties: {
        organisationsnummer: {
          type: 'string',
          description: 'Organisationsnummer (10 siffror, med eller utan bindestreck). Exempel: "5566778899" eller "556677-8899".',
        },
      },
      required: ['organisationsnummer'],
    },
  },

  // ── Grunddata (1) ───────────────────────────────────────────────────────
  {
    id: 'bolagsverket_grunddata',
    name: 'Bolagsverket Grunddata',
    description:
      'Hämta detaljerad grunddata om en organisation: adresser, aktiekapital, firmateckning.\n\n' +
      '**Användningsfall:** Se fullständig information om företagets registrering.\n' +
      '**Returnerar:** Adress, besöksadress, aktiekapital, firmateckning, verksamhetsbeskrivning.\n' +
      '**Exempel:** "Visa grunddata för 5566778899", "Aktiekapital för företaget"',
    category: 'grunddata',
    api: 'vardefulla',
    endpoint: '/organisationer',
    inputSchema: {
      type: 'object',
      properties: {
        organisationsnummer: {
          type: 'string',
          description: 'Organisationsnummer (10 siffror).',
        },
      },
      required: ['organisationsnummer'],
    },
  },

  // ── Styrelse (1) ─────────────────────────────────────────────────────────
  {
    id: 'bolagsverket_styrelse',
    name: 'Bolagsverket Styrelse & Funktionärer',
    description:
      'Hämta styrelseledamöter, VD och andra funktionärer för en organisation.\n\n' +
      '**Användningsfall:** Se vem som sitter i styrelsen eller är VD.\n' +
      '**Returnerar:** Namn, befattning, roll, tillträdesdatum.\n' +
      '**Exempel:** "Vilka sitter i styrelsen?", "Vem är VD?"',
    category: 'funktionarer',
    api: 'vardefulla',
    endpoint: '/organisationer',
    inputSchema: {
      type: 'object',
      properties: {
        organisationsnummer: {
          type: 'string',
          description: 'Organisationsnummer (10 siffror).',
        },
      },
      required: ['organisationsnummer'],
    },
  },

  // ── Registrering (1) ────────────────────────────────────────────────────
  {
    id: 'bolagsverket_registrering',
    name: 'Bolagsverket Registreringsstatus',
    description:
      'Hämta registreringsstatus: F-skatt, momsregistrering, arbetsgivarstatus.\n\n' +
      '**Användningsfall:** Kontrollera om ett företag har F-skattsedel eller är momsregistrerat.\n' +
      '**Returnerar:** F-skatt (ja/nej), moms (ja/nej), arbetsgivare (ja/nej).\n' +
      '**Exempel:** "Har företaget F-skatt?", "Är de momsregistrerade?"',
    category: 'registrering',
    api: 'vardefulla',
    endpoint: '/organisationer',
    inputSchema: {
      type: 'object',
      properties: {
        organisationsnummer: {
          type: 'string',
          description: 'Organisationsnummer (10 siffror).',
        },
      },
      required: ['organisationsnummer'],
    },
  },

  // ── Dokument (2) ────────────────────────────────────────────────────────
  {
    id: 'bolagsverket_dokumentlista',
    name: 'Bolagsverket Dokumentlista',
    description:
      'Hämta lista över inlämnade dokument (årsredovisningar m.m.) för en organisation.\n\n' +
      '**Användningsfall:** Se vilka årsredovisningar som finns inlämnade.\n' +
      '**Returnerar:** Dokumenttyp, datum, beskrivning, räkenskapsår.\n' +
      '**OBS:** Digitalt inlämnade årsredovisningar från 2020 och framåt.\n' +
      '**Exempel:** "Vilka dokument finns?", "Årsredovisningar för företaget"',
    category: 'dokument',
    api: 'vardefulla',
    endpoint: '/dokumentlista',
    inputSchema: {
      type: 'object',
      properties: {
        organisationsnummer: {
          type: 'string',
          description: 'Organisationsnummer (10 siffror).',
        },
      },
      required: ['organisationsnummer'],
    },
  },
  {
    id: 'bolagsverket_dokument',
    name: 'Bolagsverket Hämta Dokument',
    description:
      'Hämta ett specifikt dokument via dokument-ID.\n\n' +
      '**Användningsfall:** Ladda ner en specifik årsredovisning.\n' +
      '**Returnerar:** Dokumentinnehåll eller länk.\n' +
      '**OBS:** Kräver dokument-ID från bolagsverket_dokumentlista.\n' +
      '**Exempel:** "Hämta dokument ABC123"',
    category: 'dokument',
    api: 'vardefulla',
    endpoint: '/dokument/{id}',
    inputSchema: {
      type: 'object',
      properties: {
        dokumentId: {
          type: 'string',
          description: 'Dokument-ID (från bolagsverket_dokumentlista).',
        },
      },
      required: ['dokumentId'],
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
