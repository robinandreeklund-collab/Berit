/**
 * Static MCP resources for the Visit Sweden MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'visitsweden://documentation',
    name: 'Visit Sweden MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 4 verktyg och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'visitsweden://entity-types',
    name: 'Entitetstyper — Referens',
    description: 'Alla entitetstyper som stöds av Visit Sweden API.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# Visit Sweden MCP Server v1.0

4 verktyg för svensk turistinformation via Visit Swedens öppna dataplattform.

## API

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| Visit Sweden Data | data.visitsweden.com | Länkad data (RDF/JSON-LD) med turisminfo |

## Autentisering

Ingen autentisering krävs — öppet API (public:true).

## Verktyg

| Kategori | Verktyg |
|----------|---------|
| Sök (1) | sök platser, boenden, restauranger, evenemang |
| Detaljer (1) | fullständig info om en post |
| Evenemang (1) | evenemang med datumfilter |
| Nära (1) | attraktioner nära en plats |

## Cache

- Sökresultat: 30 minuter
- Detaljer: 1 timme
`;

const ENTITY_TYPES_CONTENT = `# Entitetstyper i Visit Sweden

| Typ | Schema.org | Beskrivning |
|-----|-----------|-------------|
| Event | schema:Event | Evenemang, festivaler, konserter, marknader |
| LodgingBusiness | schema:LodgingBusiness | Hotell, vandrarhem, camping, stugor |
| Place | schema:Place | Platser, sevärdheter, attraktioner |
| FoodEstablishment | schema:FoodEstablishment | Restauranger, caféer, barer |

Alla entiteter följer schema.org-standarden och levereras som JSON-LD.
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'visitsweden://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'visitsweden://entity-types':
      return { content: ENTITY_TYPES_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
