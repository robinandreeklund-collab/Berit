/**
 * 1 tool definition for the Polisen MCP server.
 */

import { EVENT_TYPES, COUNTIES } from './types.js';

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
// Shared descriptions
// ---------------------------------------------------------------------------

const LOCATION_DESCRIPTION =
  'Län att filtrera på. Använd fullständigt länsnamn.\n' +
  'Tillgängliga: ' + COUNTIES.join(', ') + '.\n' +
  'Lämna tomt för hela Sverige.';

const TYPE_DESCRIPTION =
  'Händelsetyp att filtrera på.\n' +
  'Vanliga typer: ' +
  Object.keys(EVENT_TYPES).join(', ') +
  '.\nOBS: Polisens API kan returnera fler typer än dessa.';

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
      '**Tips:** Filtrera med location (länsnamn) OCH/ELLER type (händelsetyp) för relevanta resultat.\n' +
      '**Exempel:** "Polishändelser i Stockholm", "Brott i Malmö idag", "Senaste trafikolyckorna", "Vad händer i Göteborg?"',
    category: 'handelser',
    api: 'polisen',
    endpoint: '/api/events',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          enum: COUNTIES,
          description: LOCATION_DESCRIPTION,
        },
        type: {
          type: 'string',
          enum: Object.keys(EVENT_TYPES),
          description: TYPE_DESCRIPTION,
        },
        limit: {
          type: 'number',
          description: 'Max antal händelser att visa. Standard: 20.',
          minimum: 1,
          maximum: 500,
          default: 20,
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
