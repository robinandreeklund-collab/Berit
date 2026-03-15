/**
 * MCP prompts for the OECD MCP server.
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
    name: 'analyze-economic-trend',
    description: 'Analysera ekonomisk trend för ett eller flera länder med BNP, inflation och arbetslöshet.',
    arguments: [
      {
        name: 'countries',
        description: 'Landskoder (kommaseparerat, t.ex. "SWE,NOR,DNK")',
        required: false,
      },
      {
        name: 'period',
        description: 'Tidsperiod (t.ex. "2020-2024")',
        required: false,
      },
    ],
  },
  {
    name: 'compare-countries',
    description: 'Jämför länder inom ett specifikt ämnesområde med OECD-data.',
    arguments: [
      {
        name: 'countries',
        description: 'Landskoder att jämföra (kommaseparerat, t.ex. "SWE,NOR,FIN,DNK")',
        required: true,
      },
      {
        name: 'topic',
        description: 'Ämne att jämföra (t.ex. "health", "education", "economy")',
        required: true,
      },
    ],
  },
  {
    name: 'get-latest-statistics',
    description: 'Hämta den senaste tillgängliga statistiken för ett specifikt dataset och land.',
    arguments: [
      {
        name: 'dataset',
        description: 'Dataset-ID (t.ex. "QNA", "MEI", "HEALTH_STAT")',
        required: true,
      },
      {
        name: 'country',
        description: 'Landskod (t.ex. "SWE")',
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
    case 'analyze-economic-trend': {
      const countries = args.countries || 'SWE';
      const period = args.period || '2020-2024';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Analysera den ekonomiska trenden för ${countries} under perioden ${period}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd oecd_get_data_structure för att förstå QNA-datasetets filter\n' +
              `2. Använd oecd_query_data med QNA-datasetet för BNP-data (${countries})\n` +
              `3. Använd oecd_query_data med MEI-datasetet för inflation och arbetsmarknad (${countries})\n` +
              '4. Sammanställ en ekonomisk trendanalys med alla data',
          },
        },
      ];
    }

    case 'compare-countries': {
      const countries = args.countries;
      const topic = args.topic;
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Jämför ${countries} inom ämnet "${topic}" med OECD-data.\n\n` +
              'Gör följande steg:\n' +
              `1. Använd oecd_search_dataflows för att hitta relevanta dataset för "${topic}"\n` +
              '2. Använd oecd_get_data_structure för att förstå filterformatet\n' +
              `3. Använd oecd_query_data för att hämta data för ${countries}\n` +
              '4. Presentera en jämförande analys i tabellformat',
          },
        },
      ];
    }

    case 'get-latest-statistics': {
      const dataset = args.dataset;
      const country = args.country || 'SWE';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Hämta den senaste statistiken från ${dataset}-datasetet för ${country}.\n\n` +
              'Gör följande steg:\n' +
              `1. Använd oecd_get_data_structure för ${dataset} för att se dimensioner\n` +
              `2. Använd oecd_query_data med filter för ${country} och last_n_observations=10\n` +
              '3. Presentera resultaten med förklaring av varje indikator',
          },
        },
      ];
    }

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
