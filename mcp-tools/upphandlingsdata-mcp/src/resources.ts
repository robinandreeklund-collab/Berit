/**
 * Static MCP resources for the Upphandlingsdata MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'uhm://documentation',
    name: 'Upphandlingsdata MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 7 verktyg, API-format och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'uhm://criteria-types',
    name: 'Kriterietyper — Referens',
    description: 'Tillgängliga typer av hållbarhetskriterier för upphandling.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'uhm://lov-info',
    name: 'LOV / Valfrihetssystem — Referens',
    description: 'Information om Lagen om valfrihetssystem (LOV) och tillgängliga regioner.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# Upphandlingsdata MCP Server v1.0

7 verktyg för svensk upphandlingsdata från Upphandlingsmyndigheten och EU TED.

## API:er

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| UHM | upphandlingsmyndigheten.se/api/sv/ | Svensk upphandlingsdata |
| TED | api.ted.europa.eu/v3/ | EU:s upphandlingsannonser |

## Autentisering

Alla API:er är publika och kräver ingen autentisering.

## Verktyg

| Kategori | Verktyg |
|----------|---------|
| Översikt (1) | API-översikt |
| Sökning (2) | webbplats, frågeportalen |
| LOV (1) | valfrihetssystem |
| Kriterier (2) | sök kriterier, kategorier |
| TED (1) | EU-upphandlingar |

## Cache

- Sökresultat: 1 timme
- Metadata/kategorier: 24 timmar
`;

const CRITERIA_TYPES_CONTENT = `# Kriterietyper

Upphandlingsmyndighetens hållbarhetskriterier finns i följande typer:

| Typ | Beskrivning |
|-----|-------------|
| Krav | Obligatoriska krav som ställs i upphandlingen |
| Kriterier | Tilldelningskriterier som ger mervärde |
| Villkor | Särskilda kontraktsvillkor |
| Uppföljning | Krav och metoder för uppföljning |

## Nivåer

Kriterierna finns i tre ambitionsnivåer:

| Nivå | Beskrivning |
|------|-------------|
| Bas | Grundläggande krav, enklast att använda |
| Avancerad | Högre ambitionsnivå, kräver mer av leverantören |
| Spjutspets | Högsta ambitionsnivå, driver marknaden framåt |

Använd \`uhm_get_criteria_categories\` för att se alla tillgängliga produktområden.
`;

const LOV_INFO_CONTENT = `# LOV — Lagen om valfrihetssystem

## Vad är LOV?

LOV (Lagen om valfrihetssystem, SFS 2008:962) ger kommuner och regioner möjlighet
att införa valfrihetssystem inom hälso- och sjukvård samt socialtjänst.

## Hur fungerar det?

1. Kommunen beslutar att införa valfrihetssystem inom ett område
2. En annons publiceras på upphandlingsmyndigheten.se
3. Leverantörer kan löpande ansöka om att bli godkända
4. Brukare väljer fritt bland godkända leverantörer

## Vanliga områden

- Hemtjänst
- Äldreomsorg
- Daglig verksamhet (LSS)
- Ledsagning
- Primärvård (vårdval)

## Tillgängliga regioner

Alla 21 svenska län kan filtreras i sökningen:
Blekinge, Dalarna, Gotland, Gävleborg, Halland, Jämtland, Jönköping,
Kalmar, Kronoberg, Norrbotten, Skåne, Stockholm, Södermanland, Uppsala,
Värmland, Västerbotten, Västernorrland, Västmanland, Västra Götaland,
Örebro, Östergötland.

Använd \`uhm_search_lov\` med region-parametern för att filtrera.
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'uhm://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'uhm://criteria-types':
      return { content: CRITERIA_TYPES_CONTENT, mimeType: 'text/markdown' };
    case 'uhm://lov-info':
      return { content: LOV_INFO_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
