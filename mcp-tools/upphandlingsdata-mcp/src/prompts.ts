/**
 * MCP prompts for the Upphandlingsdata MCP server.
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
    name: 'explore-procurement',
    description: 'Utforska offentlig upphandling: sök information, regler och vägledningar.',
    arguments: [
      {
        name: 'amne',
        description: 'Ämnesområde att utforska (t.ex. "direktupphandling", "ramavtal", "överprövning")',
        required: false,
      },
    ],
  },
  {
    name: 'find-lov-opportunities',
    description: 'Hitta LOV-möjligheter (Valfrihetssystem) i en viss region eller kategori.',
    arguments: [
      {
        name: 'region',
        description: 'Region/län att söka i (t.ex. "Stockholm", "Skåne")',
        required: false,
      },
      {
        name: 'kategori',
        description: 'Kategori att söka (t.ex. "hemtjänst", "äldreomsorg")',
        required: false,
      },
    ],
  },
  {
    name: 'sustainability-criteria',
    description: 'Hitta hållbarhetskriterier för ett specifikt upphandlingsområde.',
    arguments: [
      {
        name: 'omrade',
        description: 'Produktområde (t.ex. "fordon", "mat", "IT", "städning")',
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
    case 'explore-procurement':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Utforska offentlig upphandling${args.amne ? ` inom området "${args.amne}"` : ''}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd uhm_search_website för att hitta relevanta guider och vägledningar\n' +
              '2. Använd uhm_search_questions för att hitta vanliga frågor och svar\n' +
              '3. Sammanställ en översikt med de viktigaste resultaten',
          },
        },
      ];

    case 'find-lov-opportunities':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Hitta LOV-möjligheter${args.region ? ` i ${args.region}` : ''}${args.kategori ? ` inom ${args.kategori}` : ''}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd uhm_search_lov för att söka LOV-annonser med relevanta filter\n' +
              '2. Presentera resultaten i en tydlig tabell\n' +
              '3. Sammanfatta möjligheterna och ge rekommendationer',
          },
        },
      ];

    case 'sustainability-criteria':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Hitta hållbarhetskriterier${args.omrade ? ` för ${args.omrade}` : ''}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd uhm_get_criteria_categories för att se tillgängliga kategorier\n' +
              '2. Använd uhm_search_criteria för att hitta relevanta kriterier\n' +
              '3. Presentera kriterierna med typ, nivå och beskrivning',
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
