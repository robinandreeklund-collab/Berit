/**
 * MCP prompts for the Trafikanalys MCP server.
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
    name: 'vehicle-statistics',
    description: 'Sammanställ fordonsstatistik: bilar i trafik, nyregistreringar och drivmedelsfördelning.',
    arguments: [
      {
        name: 'ar',
        description: 'År att analysera (t.ex. "2024" eller "2023,2024")',
        required: false,
      },
    ],
  },
  {
    name: 'transport-comparison',
    description: 'Jämför transportslag: väg, järnväg och flyg.',
    arguments: [
      {
        name: 'ar',
        description: 'År att jämföra (t.ex. "2024")',
        required: false,
      },
    ],
  },
  {
    name: 'traffic-trends',
    description: 'Analysera trender inom svensk transportstatistik: fordonsflotta, körsträckor och trafikutveckling.',
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
    case 'vehicle-statistics':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Sammanställ fordonsstatistik${args.ar ? ` för ${args.ar}` : ''}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd trafa_cars_in_traffic för att hämta antal bilar i trafik\n' +
              '2. Använd trafa_new_registrations för att hämta nyregistreringar\n' +
              '3. Hämta data uppdelat per drivmedel för att se elbilarnas andel\n' +
              '4. Sammanställ en tydlig rapport med tabeller och kommentarer',
          },
        },
      ];

    case 'transport-comparison':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Jämför transportslag${args.ar ? ` för ${args.ar}` : ''}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd trafa_vehicle_km för att hämta fordonskilometer (vägtrafik)\n' +
              '2. Använd trafa_rail_transport för att hämta järnvägsdata\n' +
              '3. Använd trafa_air_traffic för att hämta flygdata\n' +
              '4. Jämför transportslagen och presentera i en tydlig rapport',
          },
        },
      ];

    case 'traffic-trends':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              'Analysera trender inom svensk transportstatistik.\n\n' +
              'Gör följande steg:\n' +
              '1. Använd trafa_list_products för att se tillgängliga produkter\n' +
              '2. Hämta fordonsdata för de senaste åren med trafa_cars_in_traffic\n' +
              '3. Hämta nyregistreringar per drivmedel med trafa_new_registrations\n' +
              '4. Hämta fordonskilometer med trafa_vehicle_km\n' +
              '5. Sammanställ en trendanalys med kommentarer om utvecklingen',
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
