/**
 * MCP prompts for the Kolada MCP server.
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
    name: 'compare-municipalities',
    description: 'Jämför nyckeltal mellan kommuner — t.ex. befolkning, skolresultat, kostnader.',
    arguments: [
      {
        name: 'kommuner',
        description: 'Kommunnamn att jämföra (kommaseparerat, t.ex. "Stockholm,Malmö,Göteborg")',
        required: false,
      },
      {
        name: 'nyckeltal',
        description: 'Nyckeltal att jämföra (t.ex. "befolkning", "skolresultat")',
        required: false,
      },
    ],
  },
  {
    name: 'education-quality',
    description: 'Analysera utbildningskvalitet i en kommun — betyg, behörighet, skolresultat.',
    arguments: [
      {
        name: 'kommun',
        description: 'Kommunnamn (t.ex. "Stockholm")',
        required: false,
      },
    ],
  },
  {
    name: 'economic-overview',
    description: 'Skapa en ekonomisk översikt för en kommun — kostnader, intäkter, nettokostnadsavvikelse.',
    arguments: [
      {
        name: 'kommun',
        description: 'Kommunnamn (t.ex. "Stockholm")',
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
    case 'compare-municipalities':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Jämför kommuner${args.kommuner ? ` (${args.kommuner})` : ''} på ${args.nyckeltal || 'viktiga nyckeltal'}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd kolada_sok_kommun för att hitta kommun-ID:n\n' +
              '2. Använd kolada_sok_nyckeltal för att hitta relevanta nyckeltal\n' +
              '3. Använd kolada_jamfor_kommuner för att jämföra data\n' +
              '4. Sammanställ en jämförelsetabell med kommentarer',
          },
        },
      ];

    case 'education-quality':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Analysera utbildningskvaliteten i ${args.kommun || 'en vald kommun'}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd kolada_sok_kommun för att hitta kommun-ID\n' +
              '2. Använd kolada_sok_nyckeltal med "skola" och "betyg" för att hitta relevanta KPI:er\n' +
              '3. Använd kolada_data_kommun för att hämta data för varje KPI\n' +
              '4. Använd kolada_trend för att se utveckling över tid\n' +
              '5. Sammanställ en utbildningsrapport',
          },
        },
      ];

    case 'economic-overview':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Skapa en ekonomisk översikt för ${args.kommun || 'en vald kommun'}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd kolada_sok_kommun för att hitta kommun-ID\n' +
              '2. Hämta nyckeltal: N00901 (skattesats), N02267 (sysselsättningsgrad)\n' +
              '3. Använd kolada_trend för att se ekonomisk utveckling\n' +
              '4. Sammanställ en ekonomisk översikt med alla nyckeltal',
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
