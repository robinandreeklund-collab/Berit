/**
 * Static MCP resources for the Trafikverket MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'trafikverket://documentation',
    name: 'Trafikverket MCP — Dokumentation',
    description: 'Fullständig dokumentation av alla 22 verktyg, API-format och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'trafikverket://counties',
    name: 'Svenska län — Referens',
    description: 'Länskoder och namn för filtrering.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'trafikverket://stations',
    name: 'Vanliga tågstationer — Referens',
    description: 'Vanliga tågstationer med signaturer.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# Trafikverket MCP Server v1.0

22 verktyg för realtidsdata från Trafikverkets Open API.

## API

- **Endpoint:** \`https://api.trafikinfo.trafikverket.se/v2/data.json\`
- **Autentisering:** API-nyckel via \`TRAFIKVERKET_API_KEY\`
- **Cache:** 5 minuter (in-memory)
- **Format:** XML-förfrågan → JSON-svar

## Verktyg

| Kategori | Verktyg | ObjectType |
|----------|---------|------------|
| Trafikinfo (4) | störningar, olyckor, köer, vägarbeten | Situation |
| Tåg (4) | förseningar, tidtabell, stationer, inställda | TrainAnnouncement / TrainStation |
| Väg (4) | status, underhåll, hastighet, avstängningar | RoadCondition / Situation |
| Väder (4) | stationer, halka, vind, temperatur | WeatherMeasurepoint |
| Kameror (3) | lista, snapshot, status | Camera |
| Prognos (3) | trafik, väg, tåg | TrafficFlow / RoadCondition / TrainAnnouncement |

## Filtertyper

- **plats** — Platsnamn eller vägnamn (t.ex. "Stockholm", "E4")
- **station** — Tågstation (t.ex. "Stockholm C", "Cst")
- **lan** — Länskod (t.ex. "01" för Stockholm)
- **id** — Kamera-ID
`;

const COUNTIES_CONTENT = `# Svenska län — Koder

| Kod | Län |
|-----|-----|
| 01 | Stockholms län |
| 03 | Uppsala län |
| 04 | Södermanlands län |
| 05 | Östergötlands län |
| 06 | Jönköpings län |
| 07 | Kronobergs län |
| 08 | Kalmar län |
| 09 | Gotlands län |
| 10 | Blekinge län |
| 12 | Skåne län |
| 13 | Hallands län |
| 14 | Västra Götalands län |
| 17 | Värmlands län |
| 18 | Örebro län |
| 19 | Västmanlands län |
| 20 | Dalarnas län |
| 21 | Gävleborgs län |
| 22 | Västernorrlands län |
| 23 | Jämtlands län |
| 24 | Västerbottens län |
| 25 | Norrbottens län |
`;

const STATIONS_CONTENT = `# Vanliga tågstationer

| Station | Signatur |
|---------|----------|
| Stockholm C | Cst |
| Göteborg C | G |
| Malmö C | M |
| Uppsala C | U |
| Linköping C | Lp |
| Norrköping C | Nr |
| Örebro C | Ör |
| Västerås C | Vå |
| Lund C | Lu |
| Helsingborg C | Hb |
| Jönköping C | Jö |
| Umeå C | Uå |
| Gävle C | Gä |
| Sundsvall C | Sdl |
| Karlstad C | Ksd |
| Borås C | Bs |
| Eskilstuna C | Et |
| Halmstad C | Hd |
| Växjö | Vx |
| Kalmar C | Ka |
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'trafikverket://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'trafikverket://counties':
      return { content: COUNTIES_CONTENT, mimeType: 'text/markdown' };
    case 'trafikverket://stations':
      return { content: STATIONS_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
