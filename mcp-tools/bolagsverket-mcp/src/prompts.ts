/**
 * MCP prompts for the Bolagsverket MCP server.
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
    name: 'company-overview',
    description: 'Sammanställ en fullständig företagsöversikt med grunddata, styrelse och registreringsstatus.',
    arguments: [
      {
        name: 'organisationsnummer',
        description: 'Organisationsnummer (10 siffror)',
        required: true,
      },
    ],
  },
  {
    name: 'company-documents',
    description: 'Lista alla tillgängliga dokument (årsredovisningar) för ett företag.',
    arguments: [
      {
        name: 'organisationsnummer',
        description: 'Organisationsnummer (10 siffror)',
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
    case 'company-overview':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Sammanställ en fullständig företagsöversikt för organisationsnummer ${args.organisationsnummer || '?'}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd bolagsverket_uppslag för att hämta grundläggande info\n' +
              '2. Använd bolagsverket_styrelse för att hämta styrelseledamöter\n' +
              '3. Använd bolagsverket_registrering för att kontrollera F-skatt och moms\n' +
              '4. Sammanställ allt i en tydlig översikt',
          },
        },
      ];

    case 'company-documents':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Lista alla tillgängliga dokument för organisationsnummer ${args.organisationsnummer || '?'}.\n\n` +
              'Gör följande steg:\n' +
              '1. Använd bolagsverket_dokumentlista för att hämta dokumentlistan\n' +
              '2. Presentera dokumenten i en tabell sorterad efter datum',
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
