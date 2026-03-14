/**
 * MCP prompts for the NVV MCP server.
 */

export interface Prompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

export const prompts: Prompt[] = [
  {
    name: 'search-protected-areas',
    description: 'Sok och sammanstall skyddade naturomraden i ett givet omrade.',
    arguments: [
      {
        name: 'plats',
        description: 'Platsnamn att soka i (t.ex. "Gotland", "Stockholms lan", "Malmo")',
        required: true,
      },
    ],
  },
  {
    name: 'species-inventory',
    description: 'Inventera skyddade arter i Natura 2000-omraden.',
    arguments: [
      {
        name: 'omrade',
        description: 'Natura 2000-kod eller platsnamn (t.ex. "SE0110001" eller "Uppsala")',
        required: true,
      },
      {
        name: 'artgrupp',
        description: 'Artgrupp att fokusera pa (B=Faglar, M=Daggdjur, etc.)',
        required: false,
      },
    ],
  },
];

export function getPromptById(name: string): Prompt | undefined {
  return prompts.find((p) => p.name === name);
}

export function generatePromptMessages(
  name: string,
  args: Record<string, string>,
): Array<{ role: string; content: { type: string; text: string } }> {
  switch (name) {
    case 'search-protected-areas':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Sok och sammanstall alla skyddade naturomraden i ${args.plats || 'det angivna omradet'}.\n\n` +
              'Gor foljande steg:\n' +
              '1. Anvand nvv_uppslag for att hitta kommun-/lanskod\n' +
              '2. Anvand nvv_sok_alla for att soka i alla tre kallor\n' +
              '3. For intressanta omraden, hamta detaljer med detalj-verktygen\n' +
              '4. Sammanstall en oversikt med alla skyddade omraden',
          },
        },
      ];

    case 'species-inventory':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Inventera skyddade arter i ${args.omrade || 'det angivna omradet'}${args.artgrupp ? ` (artgrupp: ${args.artgrupp})` : ''}.\n\n` +
              'Gor foljande steg:\n' +
              '1. Om en plats angetts, anvand nvv_uppslag och nvv_sok_natura2000 for att hitta omraden\n' +
              '2. Anvand nvv_arter for att lista arter i relevanta omraden\n' +
              '3. Anvand nvv_detalj_natura2000 for detaljer om omraden med manga arter\n' +
              '4. Sammanstall en artinventering med vetenskapliga och svenska namn',
          },
        },
      ];

    default:
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Okand prompt: ${name}`,
          },
        },
      ];
  }
}
