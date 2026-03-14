/**
 * MCP prompts for the Riksdag MCP server.
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
    name: 'analyze-riksdag',
    description: 'Analysera riksdagens arbete: senaste dokument, debatter och voteringar.',
    arguments: [
      {
        name: 'amne',
        description: 'Ämne att fokusera på (t.ex. "klimat", "migration")',
        required: false,
      },
    ],
  },
  {
    name: 'government-overview',
    description: 'Sammanställ en översikt av regeringens senaste aktivitet: pressmeddelanden, propositioner och utredningar.',
    arguments: [],
  },
  {
    name: 'legislation-search',
    description: 'Sök efter lagstiftningsprocessen kring ett ämne: från motion/proposition till votering.',
    arguments: [
      {
        name: 'amne',
        description: 'Ämne att söka efter (t.ex. "skatt", "försvar")',
        required: true,
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
    case 'analyze-riksdag':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Analysera riksdagens arbete${args.amne ? ` kring "${args.amne}"` : ''}.\n\n` +
              'Gör följande steg:\n' +
              `1. Använd riksdag_sok_dokument för att hitta relevanta dokument${args.amne ? ` om "${args.amne}"` : ''}\n` +
              '2. Använd riksdag_sok_anforanden för att hitta relevanta debatter\n' +
              '3. Använd riksdag_sok_voteringar för att se röstningsresultat\n' +
              '4. Sammanställ en översikt med alla data',
          },
        },
      ];

    case 'government-overview':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              'Sammanställ en översikt av regeringens senaste aktivitet.\n\n' +
              'Gör följande steg:\n' +
              '1. Använd riksdag_regering_sok med type="pressmeddelanden" för senaste pressmeddelanden\n' +
              '2. Använd riksdag_hamta_propositioner för senaste propositionerna\n' +
              '3. Använd riksdag_regering_sok med type="sou" för senaste utredningarna\n' +
              '4. Sammanställ en översikt med alla data',
          },
        },
      ];

    case 'legislation-search':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Sök efter lagstiftningsprocessen kring "${args.amne || 'ämnet'}".\n\n` +
              'Gör följande steg:\n' +
              `1. Använd riksdag_sok_dokument med doktyp="prop" för att hitta propositioner om "${args.amne || 'ämnet'}"\n` +
              `2. Använd riksdag_sok_dokument med doktyp="mot" för att hitta motioner om "${args.amne || 'ämnet'}"\n` +
              `3. Använd riksdag_sok_dokument med doktyp="bet" för att hitta betänkanden\n` +
              '4. Använd riksdag_sok_voteringar för att se relevanta voteringar\n' +
              '5. Sammanställ lagstiftningsprocessen kronologiskt',
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
