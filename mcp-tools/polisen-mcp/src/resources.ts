/**
 * Static MCP resources for the Polisen MCP server.
 */

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resources: Resource[] = [
  {
    uri: 'polisen://documentation',
    name: 'Polisen MCP — Dokumentation',
    description: 'Fullständig dokumentation av verktyget och användningsexempel.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'polisen://event-types',
    name: 'Händelsetyper — Referens',
    description: 'Vanliga händelsetyper i polisens API.',
    mimeType: 'text/markdown',
  },
];

const DOCUMENTATION_CONTENT = `# Polisen MCP Server v1.0

1 verktyg för polishändelser via Polisen.se.

## API

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| Polisen Events | polisen.se/api/events | Polishändelser i realtid |

## Autentisering

Ingen autentisering krävs — öppet API.

## Verktyg

| Kategori | Verktyg |
|----------|---------|
| Händelser (1) | polishändelser med plats- och typfilter |

## Cache

- Händelser: 3 minuter
`;

const EVENT_TYPES_CONTENT = `# Polisens händelsetyper

| Typ | Beskrivning |
|-----|-------------|
| Misshandel | Fysiskt våld |
| Stöld | Tillgreppsbrott |
| Inbrott | Inbrott i bostad/lokal |
| Trafikolycka | Vägtrafikolycka |
| Brand | Eldsvåda |
| Rån | Rån och överfallsrån |
| Skottlossning | Skjutning |
| Narkotikabrott | Narkotikarelaterade brott |
| Bedrägeri | Bedrägeribrott |
| Olaga hot | Hotbrott |
| Rattfylleri | Rattfylleri/drograttfylleri |
| Mord/dråp | Mord, dråp, försök |
| Djur | Djurrelaterade händelser |
| Ordningslagen | Ordningsstörningar |

Uppdateras var 5–10 minut.
`;

export function getResourceContent(uri: string): { content: string; mimeType: string } | null {
  switch (uri) {
    case 'polisen://documentation':
      return { content: DOCUMENTATION_CONTENT, mimeType: 'text/markdown' };
    case 'polisen://event-types':
      return { content: EVENT_TYPES_CONTENT, mimeType: 'text/markdown' };
    default:
      return null;
  }
}
