/**
 * Static MCP resources for the Riksdag MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'riksdag://documentation',
    name: 'Riksdag MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 15 verktyg, API-format och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'riksdag://document-types',
    name: 'Dokumenttyper — Referens',
    description: 'Tillgängliga dokumenttyper för riksdags- och regeringsdokument.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'riksdag://committees',
    name: 'Utskott — Referens',
    description: 'Riksdagens utskott med förkortningar och fullständiga namn.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# Riksdag MCP Server v1.0

15 verktyg för data från Sveriges Riksdag och Regeringskansliet.

## API:er

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| Riksdagen | data.riksdagen.se | Dokument, ledamöter, anföranden, voteringar |
| Regeringskansliet | g0v.se | Pressmeddelanden, propositioner, SOU, DS |

## Autentisering

Inga API-nycklar krävs — alla API:er är publika.

## Verktyg

| Kategori | Verktyg |
|----------|---------|
| Sök (4) | dokument, ledamöter, anföranden, voteringar |
| Hämta (5) | dokument, ledamot, motioner, propositioner, utskott |
| Regering (3) | sökning, dokument, departement |
| Kalender & Analys (3) | kalender, kombinerad sökning, statistik |

## Cache

- Dokument: 30 minuter
- Ledamöter/metadata: 24 timmar
`;

const DOCUMENT_TYPES_CONTENT = `# Dokumenttyper

## Riksdagen

| Kod | Beskrivning |
|-----|-------------|
| mot | Motion |
| prop | Proposition |
| bet | Betänkande |
| ip | Interpellation |
| fr | Skriftlig fråga |
| sou | Statens offentliga utredningar |
| ds | Departementsserien |
| dir | Kommittédirektiv |
| rskr | Riksdagsskrivelse |
| prot | Protokoll |

## Regeringskansliet (g0v.se)

| Typ | Beskrivning |
|-----|-------------|
| pressmeddelanden | Pressmeddelanden |
| propositioner | Propositioner |
| sou | Statens offentliga utredningar |
| ds | Departementsserien |
| dir | Kommittédirektiv |
| remisser | Remisser |
`;

const COMMITTEES_CONTENT = `# Riksdagens utskott

| Förkortning | Namn |
|-------------|------|
| AU | Arbetsmarknadsutskottet |
| CU | Civilutskottet |
| FiU | Finansutskottet |
| FöU | Försvarsutskottet |
| JuU | Justitieutskottet |
| KU | Konstitutionsutskottet |
| KrU | Kulturutskottet |
| MJU | Miljö- och jordbruksutskottet |
| NU | Näringsutskottet |
| SkU | Skatteutskottet |
| SfU | Socialförsäkringsutskottet |
| SoU | Socialutskottet |
| TU | Trafikutskottet |
| UbU | Utbildningsutskottet |
| UU | Utrikesutskottet |

Utskotten bereder ärenden innan riksdagen fattar beslut.
Betänkanden namnges med utskottsförkortning + nummer, t.ex. "FiU10".
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'riksdag://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'riksdag://document-types':
      return { content: DOCUMENT_TYPES_CONTENT, mimeType: 'text/markdown' };
    case 'riksdag://committees':
      return { content: COMMITTEES_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
