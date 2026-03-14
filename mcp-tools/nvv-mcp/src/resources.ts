/**
 * Static MCP resources for the NVV MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'nvv://documentation',
    name: 'NVV MCP -- Dokumentation',
    description: 'Fullstandig dokumentation av alla 8 verktyg, API-format och anvandningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'nvv://county-codes',
    name: 'Lanskoder -- Referens',
    description: 'Svenska lanskoder for anvandning i sokverktyg.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# NVV MCP Server v1.0

8 verktyg for data om skyddade naturomraden i Sverige via Naturvardsverkets API:er.

## API:er

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| Nationella | geodata.naturvardsverket.se/naturvardsregistret/rest/v3/ | Nationellt skyddade omraden |
| Natura 2000 | geodata.naturvardsverket.se/n2000/rest/v3/ | EU:s natverk av skyddade omraden |
| Ramsar | geodata.naturvardsverket.se/internationellakonventioner/rest/v3/ | Internationellt skyddade vatmarker |

## Autentisering

Ingen autentisering kravs. API:erna ar oppna.

## Verktyg

| Kategori | Verktyg |
|----------|---------|
| Uppslag (1) | kommun-/lanskoder |
| Sok (2) | nationella, Natura 2000 |
| Detalj (3) | nationellt, Natura 2000, Ramsar |
| Oversikt (2) | alla kallor, arter |

## Cache

- Omradesdata: 1 timme
- Referensdata: 24 timmar
`;

const COUNTY_CODES_CONTENT = `# Svenska lanskoder

| Kod | Lan |
|-----|-----|
| AB | Stockholms lan |
| C | Uppsala lan |
| D | Sodermanlands lan |
| E | Ostergotlands lan |
| F | Jonkopings lan |
| G | Kronobergs lan |
| H | Kalmar lan |
| I | Gotlands lan |
| K | Blekinge lan |
| M | Skane lan |
| N | Hallands lan |
| O | Vastra Gotalands lan |
| S | Varmlands lan |
| T | Orebro lan |
| U | Vastmanlands lan |
| W | Dalarnas lan |
| X | Gavleborgs lan |
| Y | Vasternorrlands lan |
| Z | Jamtlands lan |
| AC | Vasterbottens lan |
| BD | Norrbottens lan |

Anvand \`nvv_uppslag\` for att soka efter lanskoder med platsnamn.
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'nvv://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'nvv://county-codes':
      return { content: COUNTY_CODES_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
