/**
 * 2 tool definitions for the Krisinformation MCP server.
 */

import { COUNTIES } from './types.js';

// ---------------------------------------------------------------------------
// ToolDefinition interface
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  api: 'krisinformation';
  endpoint: string;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Shared descriptions
// ---------------------------------------------------------------------------

const COUNTY_DESCRIPTION =
  'Län att filtrera på (länskod). Tillgängliga:\n' +
  Object.entries(COUNTIES)
    .map(([code, name]) => `${code}=${name}`)
    .join(', ') +
  '.\nLämna tomt för hela Sverige.';

// ---------------------------------------------------------------------------
// 2 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: 'krisinformation_search',
    name: 'Sök krisinformation',
    description:
      'Sök efter krisnyheter och händelser från Krisinformation.se (MSB).\n\n' +
      '**Användningsfall:** Hitta aktuella kriser, olyckor, vädervarningar, samhällsstörningar i Sverige.\n' +
      '**Returnerar:** Lista med nyhetsartiklar med rubrik, sammanfattning, källa och datum.\n' +
      '**Tips:** Utan filter returneras senaste 7 dagarnas nyheter för hela Sverige.\n' +
      '**Exempel:** "Kriser i Stockholm", "Översvämningar Sverige", "Aktuella varningar"',
    category: 'nyheter',
    api: 'krisinformation',
    endpoint: '/v3/news',
    inputSchema: {
      type: 'object',
      properties: {
        county: {
          type: 'string',
          enum: Object.keys(COUNTIES),
          description: COUNTY_DESCRIPTION,
        },
        days: {
          type: 'number',
          description: 'Antal dagar tillbaka att söka. Standard: 7.',
          minimum: 1,
          maximum: 30,
          default: 7,
        },
      },
    },
  },
  {
    id: 'krisinformation_active',
    name: 'Aktiva VMA-varningar',
    description:
      'Hämta aktiva VMA-varningar (Viktigt Meddelande till Allmänheten) från Krisinformation.se.\n\n' +
      '**Användningsfall:** Se om det finns aktiva krislarm, VMA eller allvarliga varningar i Sverige just nu.\n' +
      '**Returnerar:** Lista med aktiva VMA med allvarlighetsgrad (Severe/Moderate/Minor), meddelande och berörd region.\n' +
      '**Tips:** Anropa UTAN parametrar för att se alla aktiva VMA i hela Sverige. Ofta tomt resultat — det betyder att inga VMA är aktiva.\n' +
      '**Exempel:** "Finns det aktiva VMA?", "Krislarm i Sverige", "Aktiva varningar"',
    category: 'vma',
    api: 'krisinformation',
    endpoint: '/v3/vmas',
    inputSchema: {
      type: 'object',
      properties: {
        county: {
          type: 'string',
          enum: Object.keys(COUNTIES),
          description: COUNTY_DESCRIPTION,
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
