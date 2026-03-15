/**
 * Static MCP resources for the KB MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'kb://documentation',
    name: 'KB MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 10 verktyg, API-format och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'kb://apis',
    name: 'KB API:er — Referens',
    description: 'Översikt av Libris, K-samsök och Swepub API:er.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'kb://search-tips',
    name: 'Söktips — Referens',
    description: 'Tips för effektiv sökning i Libris, K-samsök och Swepub.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# KB MCP Server v1.0

10 verktyg för att söka i Kungliga Bibliotekets och Sveriges kulturarvsdata.

## API:er

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| Libris Xsearch | libris.kb.se/xsearch | Böcker, tidskrifter, e-resurser |
| Libris XL | libris.kb.se/find | Avancerad sökning (JSON-LD) |
| K-samsök | kulturarvsdata.se/ksamsok/api | Kulturarvsobjekt (83 institutioner) |
| Swepub | libris.kb.se/xsearch?type=swepub | Forskningspublikationer |

## Autentisering

Alla API:er är öppna och kräver ingen autentisering.

## Verktyg

| Kategori | Verktyg | Antal |
|----------|---------|-------|
| Libris sökning | fritext, författare, titel, ISBN | 4 |
| Libris avancerat | find (operatorer), holdings (bestånd) | 2 |
| K-samsök | sökning, platssökning, objektdetalj | 3 |
| Swepub | sökning | 1 |

## Cache

- Sökresultat: 1 timme
- Metadata: 24 timmar
`;

const APIS_CONTENT = `# KB API:er

## Libris Xsearch

- **URL:** https://libris.kb.se/xsearch
- **Format:** JSON
- **Parametrar:** query, n (limit), format=json, format_extended=true
- **Fältsökning:** AUTHOR:namn, TITLE:titel, ISBN:nummer

## Libris XL / Find

- **URL:** https://libris.kb.se/find
- **Format:** JSON-LD
- **Parametrar:** q (sökfråga), _limit (max resultat)
- **Operatorer:** AND, OR, NOT, field:value

## K-samsök

- **URL:** https://kulturarvsdata.se/ksamsok/api
- **Format:** XML (parsas automatiskt till JSON)
- **Metoder:** search, getObject
- **Sökning:** CQL-syntax (text=, itemType=, countyName=, municipalityName=)

## Swepub

- **URL:** https://libris.kb.se/xsearch?type=swepub
- **Format:** JSON
- **Parametrar:** Samma som Libris Xsearch med type=swepub
`;

const SEARCH_TIPS_CONTENT = `# Söktips

## Libris

- **Fritext:** Sök i alla fält samtidigt
- **Författare:** Använd kb_libris_search_author för exakta författarsökningar
- **ISBN:** Fungerar med och utan bindestreck
- **Avancerat:** Kombinera fält med AND/OR: "title:klimat AND author:Lindgren"

## K-samsök

- **Objekttyper:** foto, konstverk, fornlämning, byggnad, karta, föremål
- **Plats:** Sök på län eller kommun med kb_ksamsok_search_location
- **CQL-syntax:** "text=viking AND itemType=foto"

## Swepub

- **Innehåller:** Artiklar, avhandlingar, rapporter, bokkapitel
- **Täckning:** Alla svenska universitet och högskolor
- **Språk:** Både svenska och engelska publikationer

## Kombinera verktyg

1. Sök i Libris efter en bok
2. Använd post-ID:t i kb_libris_holdings för att se var boken finns
3. Komplettera med Swepub för relaterad forskning
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'kb://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'kb://apis':
      return { content: APIS_CONTENT, mimeType: 'text/markdown' };
    case 'kb://search-tips':
      return { content: SEARCH_TIPS_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
