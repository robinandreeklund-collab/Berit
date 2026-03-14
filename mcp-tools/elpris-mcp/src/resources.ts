/**
 * Static MCP resources for the Elpris MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'elpris://documentation',
    name: 'Elpris MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 4 verktyg, priszoner och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'elpris://zones',
    name: 'Priszoner — Referens',
    description: 'De fyra svenska priszonerna med beskrivningar.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# Elpris MCP Server v1.0

4 verktyg för svenska elpriser (spotpriser) via elprisetjustnu.se.

## API

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| Elpriset Just Nu | elprisetjustnu.se/api/v1/ | Spotpriser per zon och timme |

## Autentisering

Ingen autentisering krävs — öppet API.

## Verktyg

| Kategori | Verktyg |
|----------|---------|
| Pris (2) | dagens priser, morgondagens priser |
| Historik (1) | historiska priser |
| Jämförelse (1) | zonjämförelse |

## Priser

- Exkluderar moms och avgifter (elnätsavgift, energiskatt)
- 15-minutersintervall
- Data från 2022-11-01

## Cache

- Aktuella priser: 15 minuter
- Historisk data: 24 timmar
`;

const ZONES_CONTENT = `# Svenska Priszoner

| Zon | Område | Beskrivning |
|-----|--------|-------------|
| SE1 | Luleå | Norra Sverige |
| SE2 | Sundsvall | Mellersta Sverige |
| SE3 | Stockholm | Södra Mellansverige |
| SE4 | Malmö | Södra Sverige |

Priserna skiljer sig mellan zonerna pga överföringskapacitet i elnätet.
Generellt är priserna lägre i norra Sverige (SE1, SE2) pga vattenkraft.
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'elpris://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'elpris://zones':
      return { content: ZONES_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
