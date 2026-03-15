/**
 * MCP prompts for the KB MCP server.
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
    name: 'search-books',
    description: 'Sök och hitta böcker i Libris efter författare, titel eller ämne.',
    arguments: [
      {
        name: 'query',
        description: 'Sökord: författarnamn, boktitel eller ämne',
        required: true,
      },
    ],
  },
  {
    name: 'cultural-heritage',
    description: 'Utforska kulturarvsobjekt i K-samsök — foton, fornlämningar, konstverk från 83 institutioner.',
    arguments: [
      {
        name: 'query',
        description: 'Sökord eller plats att utforska',
        required: true,
      },
    ],
  },
  {
    name: 'research-publications',
    description: 'Sök svenska forskningspublikationer i Swepub — artiklar, avhandlingar, rapporter.',
    arguments: [
      {
        name: 'query',
        description: 'Forskningsämne eller författare att söka efter',
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
    case 'search-books':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Sök efter böcker relaterade till "${args.query || 'Sverige'}".\n\n` +
              'Gör följande steg:\n' +
              '1. Använd kb_libris_search för att söka i Libris\n' +
              '2. Om sökordet verkar vara ett författarnamn, använd kb_libris_search_author\n' +
              '3. Om sökordet verkar vara en boktitel, använd kb_libris_search_title\n' +
              '4. Presentera resultaten i en tydlig tabell med titel, författare, år och förlag',
          },
        },
      ];

    case 'cultural-heritage':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Utforska kulturarvsobjekt relaterade till "${args.query || 'vikingatid'}".\n\n` +
              'Gör följande steg:\n' +
              '1. Använd kb_ksamsok_search för att söka i K-samsök\n' +
              '2. Om sökordet är en plats, använd kb_ksamsok_search_location\n' +
              '3. Välj intressanta objekt och hämta detaljer med kb_ksamsok_get_object\n' +
              '4. Presentera resultaten med objektnamn, typ, institution och eventuella bilder',
          },
        },
      ];

    case 'research-publications':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Sök svenska forskningspublikationer om "${args.query || 'hållbar utveckling'}".\n\n` +
              'Gör följande steg:\n' +
              '1. Använd kb_swepub_search för att söka i Swepub\n' +
              '2. Presentera resultaten med titel, författare, år och källa\n' +
              '3. Sammanfatta de viktigaste trenderna i forskningsresultaten',
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
