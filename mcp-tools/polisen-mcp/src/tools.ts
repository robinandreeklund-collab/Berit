/**
 * 1 tool definition for the Polisen MCP server.
 */

// ---------------------------------------------------------------------------
// ToolDefinition interface
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  api: 'polisen';
  endpoint: string;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 1 tool definition
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: 'polisen_events',
    name: 'Polishändelser',
    description:
      'Hämta aktuella polishändelser i Sverige. Uppdateras var 5–10 minut.\n\n' +
      '**Användningsfall:** Se pågående polishändelser, brott och olyckor i ett specifikt län eller i hela Sverige.\n' +
      '**Returnerar:** Lista med händelser: typ, plats, datum, sammanfattning och GPS-koordinater.\n' +
      '**Exempel:** "Polishändelser i Stockholm", "Brott i Malmö idag", "Senaste trafikolyckorna", "Vad händer i Göteborg?"',
    category: 'handelser',
    api: 'polisen',
    endpoint: '/api/events',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Län att filtrera på (t.ex. "Stockholms län", "Skåne län", "Västra Götalands län"). Lämna tomt för alla län.',
        },
        type: {
          type: 'string',
          description: 'Händelsetyp att filtrera på (t.ex. "Misshandel", "Trafikolycka", "Brand", "Stöld", "Inbrott").',
        },
        limit: {
          type: 'number',
          description: 'Max antal händelser att visa (1-500). Standard: 20.',
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
