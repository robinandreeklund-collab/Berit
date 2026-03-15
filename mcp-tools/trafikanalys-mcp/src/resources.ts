/**
 * Static MCP resources for the Trafikanalys MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'trafa://documentation',
    name: 'Trafikanalys MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 8 verktyg, API-format och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'trafa://products',
    name: 'Produktkoder — Referens',
    description: 'Vanliga produktkoder för transportstatistik.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'trafa://query-syntax',
    name: 'Frågesyntax — Referens',
    description: 'Guide till frågesyntaxen för datauttag.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# Trafikanalys MCP Server v1.0

8 verktyg för svensk transportstatistik från Trafikanalys (trafa.se).

## API

| Endpoint | Bas-URL | Beskrivning |
|----------|---------|-------------|
| Structure | api.trafa.se/api/structure | Produktlista och dimensioner |
| Data | api.trafa.se/api/data | Statistikdata |

## Autentisering

Ingen autentisering krävs. API:t är öppet.

## Verktyg

| Kategori | Verktyg |
|----------|---------|
| Struktur (2) | produktlista, produktstruktur |
| Data (1) | flexibelt datauttag |
| Fordon (2) | bilar i trafik, nyregistreringar |
| Transport (3) | fordonskilometer, järnväg, flyg |

## Cache

- Data: 1 timme
- Metadata/struktur: 24 timmar
`;

const PRODUCTS_CONTENT = `# Produktkoder

## Fordon

| Produktkod | Beskrivning |
|------------|-------------|
| t10016 | Personbilar |
| t10013 | Lastbilar |
| t10011 | Bussar |
| t10014 | Motorcyklar |

## Transport

| Produktkod | Beskrivning |
|------------|-------------|
| t0401 | Fordonskilometer |
| t0501 | Flygtrafik |
| t0603 | Järnvägstransporter |
| t0604 | Järnvägspunktlighet |
| t0802 | Sjöfart |
| t0808 | Fartygsflottan |

## Övrigt

| Produktkod | Beskrivning |
|------------|-------------|
| t1201 | Färdtjänst |
| t1202 | Kommersiella linjer |
`;

const QUERY_SYNTAX_CONTENT = `# Frågesyntax

## Format

\`\`\`
PRODUKT|MÅTT|DIMENSION:värde1,värde2|DIMENSION2:värde
\`\`\`

## Delar

| Del | Beskrivning | Exempel |
|-----|-------------|---------|
| PRODUKT | Produktkod | t10016 |
| MÅTT | Måttkod (kan utelämnas) | itrfslut, nyregunder |
| DIMENSION | Dimension med värden | ar:2024, drivm:el |

## Exempel

| Fråga | Beskrivning |
|-------|-------------|
| t10016\\|itrfslut\\|ar:2024 | Bilar i trafik 2024 |
| t10016\\|itrfslut\\|ar:2023,2024\\|drivm | Bilar per drivmedel |
| t10016\\|nyregunder\\|ar:2024 | Nyregistreringar 2024 |
| t0401\\|fordonkm\\|ar:2024 | Fordonskilometer 2024 |
| t0603\\|\\|ar:2024 | Järnvägstransporter 2024 |
| t0501\\|\\|ar:2024 | Flygtrafik 2024 |

## Mått

| Kod | Beskrivning |
|-----|-------------|
| itrfslut | I trafik (slutbestånd) |
| nyregunder | Nyregistreringar under perioden |
| fordonkm | Fordonskilometer |

## Dimensioner

| Kod | Beskrivning |
|-----|-------------|
| ar | År |
| drivm | Drivmedel |
| agarkat | Ägarkategori |
| kon | Kön |

Använd \`trafa_get_product_structure\` för att se alla tillgängliga dimensioner och mått för en specifik produkt.
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'trafa://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'trafa://products':
      return { content: PRODUCTS_CONTENT, mimeType: 'text/markdown' };
    case 'trafa://query-syntax':
      return { content: QUERY_SYNTAX_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
