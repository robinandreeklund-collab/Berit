# Berit MCP Tools

Berit inkluderar **21 MCP-servrar** (Model Context Protocol) som ger agenten tillgång till svenska och internationella datakällor. Alla körs som Docker-sidecars på port 3000 och exponerar HTTP MCP-endpoints.

## Översikt

| MCP-server | Verktyg | Datakälla | Beskrivning |
|------------|---------|-----------|-------------|
| **SCB** | 7 | SCB (PxWebAPI 2.0) | Sveriges officiella statistik — befolkning, ekonomi, miljö, arbetsmarknad, utbildning |
| **Skolverket** | 87 | Skolverkets API:er | Läroplaner, skolenheter, vuxenutbildning, gymnasieprogram, statistik, enkäter, SALSA |
| **Trafikverket** | 22 | Trafikverkets API | Störningar, tågförseningar, väglag, väder, kameror, prognoser (realtid) |
| **Riksbank** | 8 | Riksbankens REST API | Räntor, valutakurser, SWESTR, makroprognoser |
| **SMHI** | 10 | SMHI Open Data | Väderprognoser, analyser, observationer, vattenstånd, havsdata, brandrisk |
| **Lightpanda** | 12 | Lightpanda Browser | Webbsurfning, sökning och datautvinning med full JS-rendering |
| **Elpris** | 4 | elprisetjustnu.se | Spotpriser, historik, zonjämförelse (SE1-SE4) |
| **Bolagsverket** | 6 | Värdefulla datamängder | Organisationsuppslag, grunddata, styrelse, registrering, dokument |
| **Google Maps** | 13 | Google Maps Platform | Geocoding, platssökning, vägbeskrivningar, avstånd, elevation, tidszon |
| **Avanza** | 34 | Avanza publikt API | Aktier, fonder, ETF:er, certifikat, warranter — kurser, analyser, utdelning |
| **Blocket/Tradera** | 10 | Webb-scraping | Begagnat, prisjämförelse, bilar, båtar, MC, auktioner |
| **Riksdag** | 15 | data.riksdagen.se | Riksdagsdokument, ledamöter, voteringar, anföranden, regeringsdokument |
| **NVV** | 8 | Naturvårdsverket | Skyddade naturområden, nationalparker, naturreservat, Natura 2000, arter |
| **Kolada** | 10 | Kolada API | Kommunal och regional statistik — nyckeltal, skolresultat, ekonomi, omsorg |
| **KB** | 10 | Kungliga Biblioteket | Libris (böcker), K-samsök (kulturarv), Swepub (forskning) |
| **Upphandlingsdata** | 7 | Upphandlingsmyndigheten | Offentlig upphandling, LOV, hållbarhetskriterier, EU TED |
| **OECD** | 9 | OECD SDMX API | Internationell statistik — ekonomi, hälsa, utbildning, handel, miljö |
| **Trafikanalys** | 8 | Trafikanalys (trafa.se) | Fordon i trafik, registreringar, fordonskilometer, järnväg, flyg |
| **Visit Sweden** | 4 | Visit Sweden Data | Turism — sevärdheter, boenden, restauranger, evenemang |
| **Krisinformation** | 2 | Krisinformation.se (MSB) | Krisnyheter och VMA-varningar |
| **Polisen** | 1 | Polisen.se | Polishändelser i realtid — brott, olyckor, störningar |

**Totalt: ~277 verktyg**

## Arkitektur

Varje MCP-server:
- Körs som **Docker-sidecar** på port 3000
- Exponerar **HTTP MCP-endpoint** (`POST /mcp` med JSON-RPC 2.0)
- Har **health check** (`GET /health`)
- Har **serverinfo** (`GET /mcp`)
- Stödjer **stdio-transport** för lokal körning

## Teknikstack

- **TypeScript/Node.js 22** (de flesta servrar)
- **Python/FastMCP** (Avanza MCP)
- **Express.js** med JSON-RPC 2.0
- **In-memory cache** med TTL
- **Retry med exponential backoff**

## Katalogstruktur

```
mcp-tools/
├── scb-mcp/               # SCB — 7 verktyg
├── skolverket-mcp/         # Skolverket — 87 verktyg
├── trafikverket-mcp/       # Trafikverket — 22 verktyg
├── riksbank-mcp/           # Riksbank — 8 verktyg
├── smhi-mcp/               # SMHI — 10 verktyg
├── lightpanda-mcp/         # Lightpanda — 12 verktyg
├── elpris-mcp/             # Elpris — 4 verktyg
├── bolagsverket-mcp/       # Bolagsverket — 6 verktyg
├── google-maps-mcp/        # Google Maps — 13 verktyg
├── avanza-mcp/             # Avanza — 34 verktyg
├── blocket-tradera-mcp/    # Blocket/Tradera — 10 verktyg
├── riksdag-mcp/            # Riksdag — 15 verktyg
├── nvv-mcp/                # NVV — 8 verktyg
├── kolada-mcp/             # Kolada — 10 verktyg
├── kb-mcp/                 # KB — 10 verktyg
├── upphandlingsdata-mcp/   # Upphandlingsdata — 7 verktyg
├── oecd-mcp/               # OECD — 9 verktyg
├── trafikanalys-mcp/       # Trafikanalys — 8 verktyg
├── visitsweden-mcp/        # Visit Sweden — 4 verktyg
├── krisinformation-mcp/    # Krisinformation — 2 verktyg
├── polisen-mcp/            # Polisen — 1 verktyg
├── combined-mcp/           # Nginx reverse proxy (Render-deploy)
├── ADDING_NEW_MCP.md       # Guide för att lägga till nya MCP-servrar
└── README.md               # Denna fil
```

## Lokal utveckling

Varje MCP-server kan köras lokalt:

```bash
cd mcp-tools/<namn>-mcp
npm install
npm run build
npm start          # HTTP-server på port 3000
npm run start:stdio # Stdio-transport (för Claude Desktop)
npm test           # Kör tester
```

## Docker

Varje server har en standalone Dockerfile i `docker/<namn>-mcp/Dockerfile`:

```bash
docker build -t deer-flow-<namn>-mcp -f docker/<namn>-mcp/Dockerfile .
docker run -p 3000:3000 deer-flow-<namn>-mcp
```

## Render-deploy

Alla servrar deployeras tillsammans via `combined-mcp/` med Nginx reverse proxy. Se `render.yaml` i projektets rot.

## Lägga till en ny MCP-server

Se [ADDING_NEW_MCP.md](ADDING_NEW_MCP.md) för en komplett checklista.
