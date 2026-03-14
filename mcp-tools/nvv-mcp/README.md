# NVV MCP Server v1.0

MCP-server for data om skyddade naturomraden i Sverige via Naturvardsverkets API:er. 8 verktyg via tre REST-API:er.

## API:er

| API | Bas-URL | Beskrivning |
|-----|---------|-------------|
| Nationella | `geodata.naturvardsverket.se/naturvardsregistret/rest/v3/` | Nationellt skyddade omraden (naturreservat, nationalparker) |
| Natura 2000 | `geodata.naturvardsverket.se/n2000/rest/v3/` | EU:s natverk av skyddade naturomraden |
| Ramsar | `geodata.naturvardsverket.se/internationellakonventioner/rest/v3/` | Internationellt skyddade vatmarker |

## Verktyg (8 st)

| Verktyg | Kategori | API | Beskrivning |
|---------|----------|-----|-------------|
| `nvv_uppslag` | Uppslag | Lokal | Sla upp kommun-/lanskoder fran platsnamn |
| `nvv_sok_nationella` | Sok | Nationella | Sok nationellt skyddade omraden |
| `nvv_sok_natura2000` | Sok | Natura 2000 | Sok Natura 2000-omraden |
| `nvv_detalj_nationellt` | Detalj | Nationella | Detaljer, syften, marktacke for nationellt omrade |
| `nvv_detalj_natura2000` | Detalj | Natura 2000 | Detaljer, arter, naturtyper for Natura 2000-omrade |
| `nvv_detalj_ramsar` | Detalj | Ramsar | Detaljer om Ramsar-vatmarksomrade |
| `nvv_sok_alla` | Oversikt | Alla | Sok i alla tre kallor samtidigt |
| `nvv_arter` | Oversikt | Natura 2000 | Lista skyddade arter i Natura 2000-omraden |

## Anvandning

```bash
# Installera och bygg
npm install
npm run build

# Starta HTTP-server (port 3000)
npm start

# Starta stdio-transport
npm run start:stdio

# Kor tester
npm test
```

## Miljovariabler

| Variabel | Standard | Beskrivning |
|----------|---------|-------------|
| `PORT` | 3000 | HTTP-serverns port |

## Autentisering

Ingen autentisering kravs. API:erna ar oppna.

## Kalla

All data: "Kalla: Naturvardsverket"
