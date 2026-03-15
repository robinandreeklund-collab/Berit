/**
 * MCP prompts for the Krisinformation MCP server.
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
    name: 'crisis-overview',
    description: 'Ge en översikt av aktuella kriser och varningar i Sverige.',
    arguments: [
      {
        name: 'county',
        description: 'Länskod att filtrera på (t.ex. "01" för Stockholm).',
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
    case 'crisis-overview':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Ge en översikt av aktuella kriser och varningar${args.county ? ` i län ${args.county}` : ' i Sverige'}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd krisinformation_active för att kolla VMA-varningar\n' +
              '2. Använd krisinformation_search för att hitta senaste krisnyheter\n' +
              '3. Presentera en samlad översikt',
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
