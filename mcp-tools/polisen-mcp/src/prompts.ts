/**
 * MCP prompts for the Polisen MCP server.
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
    name: 'local-police-events',
    description: 'Visa senaste polishändelserna i ett specifikt län.',
    arguments: [
      {
        name: 'location',
        description: 'Län att visa händelser för (t.ex. "Stockholms län").',
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
    case 'local-police-events':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Visa senaste polishändelserna${args.location ? ` i ${args.location}` : ' i Sverige'}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd polisen_events för att hämta senaste händelserna\n' +
              '2. Presentera dem i en tabell med datum, typ och sammanfattning\n' +
              '3. Sammanfatta de mest anmärkningsvärda händelserna',
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
