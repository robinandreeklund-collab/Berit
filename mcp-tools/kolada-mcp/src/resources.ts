/**
 * Static MCP resources for the Kolada MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'kolada://documentation',
    name: 'Kolada MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 10 verktyg, API-format och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'kolada://popular-kpis',
    name: 'Populära nyckeltal — Referens',
    description: 'Vanliga nyckeltal-ID:n med beskrivningar.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'kolada://municipalities',
    name: 'Kommuner — Referens',
    description: 'Vanliga kommun-ID:n med namn.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# Kolada MCP Server v1.0

10 verktyg för svensk kommunstatistik från Kolada (RKA).

## API

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| Kolada v2 | api.kolada.se/v2/ | Nyckeltal, kommuner, enheter, kommungrupper |

## Autentisering

Kolada API:t är öppet och kräver ingen API-nyckel.

## Verktyg

| Kategori | Antal | Verktyg |
|----------|-------|---------|
| Sök (3) | 3 | nyckeltal, kommun, enhet |
| Hämta data (4) | 4 | kommun, alla kommuner, enhet, nyckeltal detalj |
| Jämförelse (2) | 2 | jämför kommuner, trend |
| Referens (1) | 1 | kommungrupper |

## Cache

- Data (KPI-värden): 30 minuter
- Metadata (KPI-definitioner, kommuner): 24 timmar
`;

const POPULAR_KPIS_CONTENT = `# Populära nyckeltal

## Befolkning

| KPI-ID | Beskrivning |
|--------|-------------|
| N01951 | Invånare totalt, antal (folkmängd) |
| N01963 | Befolkningsförändring sedan föregående år (%) |
| N01920 | Invånare 0-18 år, antal |
| N00980 | Äldre äldre av invånare 65+, andel (%) |

## Arbetsmarknad

| KPI-ID | Beskrivning |
|--------|-------------|
| N02267 | Sysselsättningsgrad 20-64 år, andel (%) |
| N02280 | Arbetslöshet 20-64 år, andel (%) |

## Utbildning

| KPI-ID | Beskrivning |
|--------|-------------|
| N15006 | Kostnad grundskola åk 1-9, kr/elev |
| N15504 | Meritvärde åk 9, genomsnitt (17 ämnen) |

## Ekonomi

| KPI-ID | Beskrivning |
|--------|-------------|
| N00901 | Skattesats till kommun (%) |
| N20891 | Invånare 65+ i särskilt boende/hemtjänst, andel (%) |

Använd \`kolada_sok_nyckeltal\` för att söka efter fler nyckeltal.
`;

const MUNICIPALITIES_CONTENT = `# Vanliga kommuner

## Storstäder

| Kommun-ID | Namn |
|-----------|------|
| 0180 | Stockholm |
| 1280 | Malmö |
| 1480 | Göteborg |

## Större städer

| Kommun-ID | Namn |
|-----------|------|
| 0380 | Uppsala |
| 1281 | Lund |
| 0580 | Linköping |
| 1880 | Örebro |
| 2580 | Luleå |
| 1980 | Västerås |
| 0680 | Jönköping |

## Län

Län har ID:n som börjar med två siffror (t.ex. "01" för Stockholms län).
Kommuner har 4-siffriga ID:n (t.ex. "0180" för Stockholm kommun).

Använd \`kolada_sok_kommun\` för att söka efter fler kommuner.
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'kolada://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'kolada://popular-kpis':
      return { content: POPULAR_KPIS_CONTENT, mimeType: 'text/markdown' };
    case 'kolada://municipalities':
      return { content: MUNICIPALITIES_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
