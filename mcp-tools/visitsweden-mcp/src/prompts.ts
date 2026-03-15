/**
 * MCP prompts for the Visit Sweden MCP server.
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
    name: 'explore-destination',
    description: 'Utforska en svensk destination — sevärdheter, boenden och restauranger.',
    arguments: [
      {
        name: 'destination',
        description: 'Stad eller region att utforska (t.ex. "Göteborg", "Dalarna").',
        required: true,
      },
    ],
  },
  {
    name: 'weekend-events',
    description: 'Hitta evenemang som pågår den kommande helgen.',
    arguments: [
      {
        name: 'region',
        description: 'Region att söka i (t.ex. "stockholm", "skane").',
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
    case 'explore-destination':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Utforska ${args.destination || 'en svensk destination'} som turistmål.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd visitsweden_search för att hitta sevärdheter\n' +
              '2. Använd visitsweden_search med type=LodgingBusiness för boenden\n' +
              '3. Använd visitsweden_search med type=FoodEstablishment för restauranger\n' +
              '4. Presentera en översikt med rekommendationer',
          },
        },
      ];

    case 'weekend-events':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Hitta evenemang${args.region ? ` i ${args.region}` : ' i hela Sverige'} den kommande helgen.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd visitsweden_search_events med datumfilter för helgen\n' +
              '2. Presentera evenemangen i en tabell\n' +
              '3. Ge korta rekommendationer',
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
