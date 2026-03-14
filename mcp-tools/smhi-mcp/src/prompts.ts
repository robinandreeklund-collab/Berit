/**
 * MCP prompts for the SMHI MCP server.
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
    name: 'weather-report',
    description: 'Skapa en väderrapport för en plats med prognos och aktuellt väder.',
    arguments: [
      {
        name: 'plats',
        description: 'Platsnamn (t.ex. "Stockholm", "Göteborg", "Malmö")',
        required: false,
      },
    ],
  },
  {
    name: 'hydrology-analysis',
    description: 'Sammanställ en hydrologisk rapport med observationer och prognoser.',
    arguments: [],
  },
  {
    name: 'fire-risk-assessment',
    description: 'Bedöm brandrisk för en plats med prognos och aktuell analys.',
    arguments: [
      {
        name: 'plats',
        description: 'Platsnamn (t.ex. "Gotland", "Småland")',
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
    case 'weather-report':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Skapa en väderrapport${args.plats ? ` för ${args.plats}` : ' för Stockholm'}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd smhi_vaderanalyser_mesan för att se aktuellt väder\n' +
              '2. Använd smhi_vaderprognoser_metfcst för att se prognosen kommande dagar\n' +
              '3. Sammanställ en överskådlig väderrapport med aktuellt läge och prognos',
          },
        },
      ];

    case 'hydrology-analysis':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              'Sammanställ en hydrologisk rapport.\n\n' +
              'Gör följande steg:\n' +
              '1. Använd smhi_hydrologi_pthbv för att hämta hydrologiska prognoser\n' +
              '2. Presentera resultat i tydliga tabeller\n' +
              '3. Kommentera eventuella risker för höga vattenstånd',
          },
        },
      ];

    case 'fire-risk-assessment':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Bedöm brandrisk${args.plats ? ` för ${args.plats}` : ''}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd smhi_brandrisk_fwia för aktuell brandriskanalys\n' +
              '2. Använd smhi_brandrisk_fwif för brandriskprognos kommande dagar\n' +
              '3. Sammanställ en brandriskbedömning med rekommendationer',
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
