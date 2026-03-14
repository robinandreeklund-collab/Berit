/**
 * MCP prompts for the Trafikverket MCP server.
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
    name: 'analyze-traffic-situation',
    description: 'Analysera trafiksituationen för en plats eller sträcka. Sammanställer störningar, olyckor, köer och vägarbeten.',
    arguments: [
      {
        name: 'plats',
        description: 'Plats eller sträcka att analysera (t.ex. "E4 Stockholm–Uppsala")',
        required: true,
      },
    ],
  },
  {
    name: 'check-train-status',
    description: 'Kontrollera tågstatus vid en station: förseningar, inställda tåg och aktuell tidtabell.',
    arguments: [
      {
        name: 'station',
        description: 'Station att kontrollera (t.ex. "Stockholm C", "Göteborg C")',
        required: true,
      },
    ],
  },
  {
    name: 'road-weather-report',
    description: 'Skapa en väg- och väderrapport för ett län: väglag, temperatur, halka, vind.',
    arguments: [
      {
        name: 'lan',
        description: 'Län att rapportera om (t.ex. "Dalarnas län", "14" för Västra Götaland)',
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
    case 'analyze-traffic-situation':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Analysera trafiksituationen för "${args.plats || 'okänd plats'}".\n\n` +
              `Gör följande steg:\n` +
              `1. Använd trafikverket_trafikinfo_storningar för att hämta störningar\n` +
              `2. Använd trafikverket_trafikinfo_olyckor för att hämta olyckor\n` +
              `3. Använd trafikverket_trafikinfo_koer för att hämta köer\n` +
              `4. Använd trafikverket_trafikinfo_vagarbeten för att hämta vägarbeten\n` +
              `5. Sammanställ en komplett trafikrapport med alla fynd`,
          },
        },
      ];

    case 'check-train-status':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Kontrollera tågstatus vid "${args.station || 'okänd station'}".\n\n` +
              `Gör följande steg:\n` +
              `1. Använd trafikverket_tag_tidtabell för att hämta avgångar/ankomster\n` +
              `2. Använd trafikverket_tag_forseningar för att identifiera förseningar\n` +
              `3. Använd trafikverket_tag_installda för att hitta inställda tåg\n` +
              `4. Sammanställ en statusrapport med tidtabell, förseningar och inställda tåg`,
          },
        },
      ];

    case 'road-weather-report':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Skapa en väg- och väderrapport för "${args.lan || 'okänt län'}".\n\n` +
              `Gör följande steg:\n` +
              `1. Använd trafikverket_vag_status för att hämta väglag\n` +
              `2. Använd trafikverket_vader_temperatur för att hämta temperatur\n` +
              `3. Använd trafikverket_vader_halka för att kontrollera halkförhållanden\n` +
              `4. Använd trafikverket_vader_vind för att kontrollera vindförhållanden\n` +
              `5. Sammanställ en komplett väg- och väderrapport`,
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
