/**
 * MCP prompts for the Riksbank MCP server.
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
    name: 'analyze-interest-rates',
    description: 'Analysera ränteläget: styrränta, marknadsräntor och SWESTR.',
    arguments: [],
  },
  {
    name: 'currency-report',
    description: 'Sammanställ en valutarapport med aktuella kurser mot SEK.',
    arguments: [
      {
        name: 'valutor',
        description: 'Valutor att inkludera (kommaseparerat, t.ex. "EUR,USD,NOK")',
        required: false,
      },
    ],
  },
  {
    name: 'economic-outlook',
    description: 'Skapa en ekonomisk översikt med Riksbankens prognoser för inflation, BNP och övriga indikatorer.',
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
    case 'analyze-interest-rates':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              'Analysera det aktuella ränteläget i Sverige.\n\n' +
              'Gör följande steg:\n' +
              '1. Använd riksbank_ranta_styrranta för att hämta aktuell reporänta\n' +
              '2. Använd riksbank_ranta_marknadsrantor för att hämta STIBOR och obligationsräntor\n' +
              '3. Använd riksbank_swestr för att hämta dagslåneräntan\n' +
              '4. Sammanställ en ränteöversikt med alla data',
          },
        },
      ];

    case 'currency-report':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Sammanställ en valutarapport${args.valutor ? ` för ${args.valutor}` : ''}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd riksbank_valuta_kurser för att hämta aktuella kurser mot SEK\n' +
              '2. Presentera resultaten i en tydlig tabell\n' +
              '3. Kommentera eventuella anmärkningsvärda rörelser',
          },
        },
      ];

    case 'economic-outlook':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              'Skapa en ekonomisk översikt baserad på Riksbankens prognoser.\n\n' +
              'Gör följande steg:\n' +
              '1. Använd riksbank_prognos_inflation för att hämta inflationsprognoser\n' +
              '2. Använd riksbank_prognos_bnp för att hämta BNP-prognoser\n' +
              '3. Använd riksbank_prognos_ovrigt för att se övriga indikatorer\n' +
              '4. Sammanställ en ekonomisk översikt med alla prognoser',
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
