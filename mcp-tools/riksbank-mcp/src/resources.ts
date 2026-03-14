/**
 * Static MCP resources for the Riksbank MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'riksbank://documentation',
    name: 'Riksbank MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 8 verktyg, API-format och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'riksbank://series',
    name: 'Viktiga dataserier — Referens',
    description: 'Vanliga serie-ID:n för räntor och valutakurser.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'riksbank://indicators',
    name: 'Prognosindikatorer — Referens',
    description: 'Tillgängliga indikatorer för makroekonomiska prognoser.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# Riksbank MCP Server v1.0

8 verktyg för ekonomisk data från Sveriges Riksbank.

## API:er

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| SWEA | api.riksbank.se/swea/v1/ | Räntor och växelkurser |
| SWESTR | api.riksbank.se/swestr/v1/ | Svensk dagslåneränta |
| Prognoser | api.riksbank.se/forecasts/v1/ | Makroekonomiska prognoser |

## Autentisering

- **Anonym:** 5 req/min, 1 000/dag
- **Med nyckel:** 200 req/min, 30 000/vecka
- Header: \`Ocp-Apim-Subscription-Key\`

## Verktyg

| Kategori | Verktyg |
|----------|---------|
| Räntor (2) | styrränta, marknadsräntor |
| Valuta (2) | kurser, korskurser |
| SWESTR (1) | dagslåneränta |
| Prognoser (3) | inflation, BNP, makro |

## Cache

- Räntor/kurser: 1 timme
- Metadata/prognoser: 24 timmar
`;

const SERIES_CONTENT = `# Viktiga dataserier

## Styrräntor

| Serie-ID | Beskrivning |
|----------|-------------|
| SECBREPOEFF | Styrränta (reporänta) |
| SECBDEPOEFF | Inlåningsränta |
| SECBLENDEFF | Utlåningsränta |
| SECBREFEFF | Referensränta |

## Valutor mot SEK

| Serie-ID | Valutapar |
|----------|-----------|
| SEKEURPMI | EUR/SEK |
| SEKUSDPMI | USD/SEK |
| SEKGBPPMI | GBP/SEK |
| SEKNOKPMI | NOK/SEK |
| SEKDKKPMI | DKK/SEK |
| SEKCHFPMI | CHF/SEK |
| SEKJPYPMI | JPY/SEK |

## Gruppkoder

| Grupp-ID | Beskrivning |
|----------|-------------|
| 2 | Riksbankens styrräntor |
| 3 | STIBOR |
| 130 | Valutor mot SEK |
| 131 | Korskurser |
`;

const INDICATORS_CONTENT = `# Prognosindikatorer

Riksbankens prognoser publiceras kvartalsvis i den penningpolitiska rapporten.

## Vanliga indikatorer

| ID | Beskrivning |
|----|-------------|
| CPI | Konsumentprisindex (KPI) |
| CPIF | KPI med fast ränta |
| GDP | Bruttonationalprodukt (BNP) |
| REPO | Reporänteprognos |
| UND | Arbetslöshet |

Använd \`riksbank_prognos_ovrigt\` för att lista alla tillgängliga indikatorer.
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'riksbank://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'riksbank://series':
      return { content: SERIES_CONTENT, mimeType: 'text/markdown' };
    case 'riksbank://indicators':
      return { content: INDICATORS_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
