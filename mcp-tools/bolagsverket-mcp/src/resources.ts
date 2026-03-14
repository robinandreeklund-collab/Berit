/**
 * Static MCP resources for the Bolagsverket MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'bolagsverket://documentation',
    name: 'Bolagsverket MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 6 verktyg, API-format och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'bolagsverket://limitations',
    name: 'API-begränsningar — Referens',
    description: 'Kända begränsningar i Bolagsverkets Värdefulla datamängder API.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# Bolagsverket MCP Server v1.0

6 verktyg för företagsinformation via Bolagsverkets Värdefulla datamängder API.

## API

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| Värdefulla datamängder v1 | gw.api.bolagsverket.se/vardefulla-datamangder/v1 | Organisationer, dokument |

## Autentisering

OAuth 2.0 (client_credentials). Gratis registrering.

## Verktyg

| Kategori | Verktyg |
|----------|---------|
| Uppslag (1) | organisationsuppslag |
| Grunddata (1) | detaljerad grunddata |
| Funktionärer (1) | styrelse & funktionärer |
| Registrering (1) | F-skatt, moms, arbetsgivare |
| Dokument (2) | dokumentlista, hämta dokument |

## Begränsningar

- Sökning enbart via organisationsnummer
- Rate limit: 60 req/min
- Årsredovisningar: digitalt inlämnade från 2020

## Cache

- Organisation: 1 timme
- Dokument: 24 timmar
`;

const LIMITATIONS_CONTENT = `# API-begränsningar

## Sökning
- **Enbart organisationsnummer** — namnbaserad sökning stöds inte
- Ingen filtring på bransch, region eller storlek

## Data
- Inga personuppgifter (personnummer etc.)
- Ingen ärendehistorik
- Ingen kapitalhistorik
- Ingen ägandestruktur

## Dokument
- Enbart digitalt inlämnade årsredovisningar (2020+)
- Handlingar inlämnade på papper ingår inte

## Betaltjänster
En betald API-nivå skulle möjliggöra:
- Namnsökning
- Ärendehistorik (från 2003)
- Ägandestrukturer
- Strukturerad finansiell data
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'bolagsverket://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'bolagsverket://limitations':
      return { content: LIMITATIONS_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
