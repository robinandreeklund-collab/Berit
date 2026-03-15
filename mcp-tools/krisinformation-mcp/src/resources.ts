/**
 * Static MCP resources for the Krisinformation MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'krisinformation://documentation',
    name: 'Krisinformation MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 2 verktyg och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'krisinformation://counties',
    name: 'Länskoder — Referens',
    description: 'Alla svenska länskoder för filtrering.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# Krisinformation MCP Server v1.0

2 verktyg för krisinformation från Krisinformation.se (MSB).

## API

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| Krisinformation v3 | api.krisinformation.se/v3 | Krisnyheter och VMA-varningar |

## Autentisering

Ingen autentisering krävs — öppet API.

## Verktyg

| Kategori | Verktyg |
|----------|---------|
| Nyheter (1) | krisnyheter med länsfilter |
| VMA (1) | aktiva VMA-varningar |

## Cache

- Nyheter: 5 minuter
- VMA: 2 minuter
`;

const COUNTIES_CONTENT = `# Svenska Länskoder

| Kod | Län |
|-----|-----|
| 01 | Stockholms län |
| 03 | Uppsala län |
| 04 | Södermanlands län |
| 05 | Östergötlands län |
| 06 | Jönköpings län |
| 07 | Kronobergs län |
| 08 | Kalmar län |
| 09 | Gotlands län |
| 10 | Blekinge län |
| 12 | Skåne län |
| 13 | Hallands län |
| 14 | Västra Götalands län |
| 17 | Värmlands län |
| 18 | Örebro län |
| 19 | Västmanlands län |
| 20 | Dalarnas län |
| 21 | Gävleborgs län |
| 22 | Västernorrlands län |
| 23 | Jämtlands län |
| 24 | Västerbottens län |
| 25 | Norrbottens län |
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'krisinformation://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'krisinformation://counties':
      return { content: COUNTIES_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
