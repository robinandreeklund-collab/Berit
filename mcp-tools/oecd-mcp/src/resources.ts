/**
 * Static MCP resources for the OECD MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'oecd://documentation',
    name: 'OECD MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 9 verktyg, API-format och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'oecd://categories',
    name: 'OECD Datakategorier — Referens',
    description: 'Alla 17 datakategorier med beskrivningar och exempeldataset.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'oecd://filter-guide',
    name: 'SDMX Filterguide — Referens',
    description: 'Guide för att bygga SDMX-filter med dimensioner och landskoder.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# OECD MCP Server v1.0

9 verktyg för internationell statistik via OECD:s SDMX API.

## API

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| SDMX | sdmx.oecd.org/public/rest | OECD Statistical Data and Metadata Exchange |

## Autentisering

- **Ingen autentisering krävs** — öppen data
- Rate limit: väntar 1,5 sekunder mellan anrop

## Verktyg

| Kategori | Verktyg | Antal |
|----------|---------|-------|
| Sök | search_dataflows, list_dataflows, search_indicators | 3 |
| Metadata | get_data_structure, get_dataflow_url | 2 |
| Kategorier | get_categories, list_categories_detailed | 2 |
| Populära | get_popular_datasets | 1 |
| Data | query_data (HUVUDVERKTYG) | 1 |

## Cache

- Data: 1 timme
- Metadata: 24 timmar

## Arbetsflöde

1. Sök dataset → 2. Hämta struktur → 3. Bygg filter → 4. Hämta data
`;

const CATEGORIES_CONTENT = `# OECD Datakategorier

17 kategorier med internationell statistik.

| ID | Kategori | Beskrivning |
|----|----------|-------------|
| Economy | Ekonomi | BNP, nationalräkenskaper, konjunkturindikatorer |
| Health | Hälsa | Sjukvårdsutgifter, livslängd, dödsorsaker |
| Education | Utbildning | Utbildningsstatistik, PISA, finansiering |
| Employment | Sysselsättning | Arbetsmarknad, arbetslöshet, löner |
| Trade | Handel | Internationell handel, varor, tjänster |
| Finance | Finans | Finansiella marknader, investeringar, FDI |
| Government | Offentlig sektor | Offentliga finanser, skuld, skatter |
| Environment | Miljö | Miljöstatistik, utsläpp, avfall |
| Agriculture | Jordbruk | Jordbruksstatistik, livsmedel |
| SocialProtection | Social trygghet | Socialutgifter, pensioner |
| Development | Utveckling | Bistånd, utvecklingssamarbete |
| Innovation | Innovation | FoU, patent, teknik |
| Regional | Regional | Regional statistik, städer |
| Housing | Bostad | Bostadspriser, byggande |
| NaturalResources | Naturresurser | Energi, vatten, råvaror |
| Climate | Klimat | Klimatförändring, koldioxid |
| Transport | Transport | Transportstatistik, infrastruktur |
`;

const FILTER_GUIDE_CONTENT = `# SDMX Filterguide

## Grundläggande syntax

SDMX-filter använder punktseparerade dimensioner:
\`\`\`
dimension1.dimension2.dimension3.dimension4
\`\`\`

## Regler

- **Tom dimension** = wildcard (alla värden): \`SWE...\`
- **Multipla värden** med +: \`SWE+NOR+DNK.GDP..A\`
- **Ordning** beror på datasetet — kör oecd_get_data_structure först!

## Vanliga landskoder

| Kod | Land |
|-----|------|
| SWE | Sverige |
| NOR | Norge |
| DNK | Danmark |
| FIN | Finland |
| DEU | Tyskland |
| FRA | Frankrike |
| GBR | Storbritannien |
| USA | USA |
| JPN | Japan |
| OECD | OECD-genomsnitt |

## Vanliga frekvenser

| Kod | Frekvens |
|-----|----------|
| A | Årlig |
| Q | Kvartalsvis |
| M | Månadsvis |

## Exempelfilter

| Dataset | Filter | Beskrivning |
|---------|--------|-------------|
| QNA | SWE.GDP.VOBARSA.Q | Sveriges BNP kvartalsvis |
| QNA | SWE+NOR.GDP..A | Sverige + Norge BNP årlig |
| MEI | SWE.. | Alla MEI-indikatorer för Sverige |
| HPI | SWE+NOR+DNK..Q | Bostadspriser Norden kvartalsvis |

## Tidsperioder

- Årlig: \`2020\`, \`2024\`
- Kvartalsvis: \`2020-Q1\`, \`2024-Q4\`
- Månadsvis: \`2020-01\`, \`2024-12\`

Använd \`start_period\` och \`end_period\` i oecd_query_data.
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'oecd://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'oecd://categories':
      return { content: CATEGORIES_CONTENT, mimeType: 'text/markdown' };
    case 'oecd://filter-guide':
      return { content: FILTER_GUIDE_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
