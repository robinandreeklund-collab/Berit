/**
 * MCP prompts for the Elpris MCP server.
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
    name: 'electricity-prices-today',
    description: 'Visa dagens elpriser med snitt, min och max.',
    arguments: [
      {
        name: 'zon',
        description: 'Priszon (SE1-SE4). Standard: SE3.',
        required: false,
      },
    ],
  },
  {
    name: 'zone-comparison',
    description: 'Jämför elpriser mellan alla 4 svenska priszoner.',
    arguments: [],
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
    case 'electricity-prices-today':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Visa dagens elpriser${args.zon ? ` för zon ${args.zon}` : ''}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd elpris_idag för att hämta dagens priser\n' +
              '2. Presentera timmpriser i en tabell\n' +
              '3. Lyft fram billigaste och dyraste timmarna',
          },
        },
      ];

    case 'zone-comparison':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              'Jämför elpriser mellan alla 4 priszoner idag.\n\n' +
              'Gör följande steg:\n' +
              '1. Använd elpris_jamforelse för att jämföra alla zoner\n' +
              '2. Presentera snittpriser per zon\n' +
              '3. Kommentera prisskillnader mellan norr och söder',
          },
        },
      ];

    default:
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Okänd prompt: ${name}`,
          },
        },
      ];
  }
}
