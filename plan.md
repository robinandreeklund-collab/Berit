# Plan: SMHI MCP Server Integration (v1.0)

Ny MCP-server för SMHI:s Open Data API:er — väder, hydrologi, oceanografi, brandrisk. 10 verktyg i 6 kategorier. Följer exakt samma mönster som `riksbank-mcp`. Ingen autentisering krävs — alla SMHI API:er är öppna.

## SMHI API:er

| API | Base URL | Beskrivning |
|-----|----------|-------------|
| metfcst/pmp3g | `opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2` | Väderprognoser (~10 dagar) |
| metfcst/snow1g | `opendata-download-metfcst.smhi.se/api/category/snow1g/version/1` | Snöprognoser |
| metanalys/mesan2g | `opendata-download-metanalys.smhi.se/api/category/mesan2g/version/1` | Väderanalys (MESAN) |
| metobs | `opendata-download-metobs.smhi.se/api/version/1.0` | Väderobservationer (40+ parametrar) |
| hydroobs | `opendata-download-hydroobs.smhi.se/api/version/1.0` | Hydrologiska observationer |
| pthbv | `opendata-download-pthbv.smhi.se/api/version/1` | Hydrologiska prognoser |
| ocobs | `opendata-download-ocobs.smhi.se/api/version/latest` | Oceanografiska observationer |
| fwif1g | `opendata-download-metfcst.smhi.se/api/category/fwif1g/version/1` | Brandriskprognoser (FWI) |
| fwia | `opendata-download-metanalys.smhi.se/api/category/fwia/version/1` | Brandriskanalyser |

## 10 Verktyg (6 kategorier)

| # | Tool ID | Kategori | API | Beskrivning |
|---|---------|----------|-----|-------------|
| 1 | `smhi_vaderprognoser_metfcst` | vaderprognoser | metfcst/pmp3g | Väderprognos för lat/lon (~10 dagar framåt) |
| 2 | `smhi_vaderprognoser_snow` | vaderprognoser | metfcst/snow1g | Snöprognos för lat/lon |
| 3 | `smhi_vaderanalyser_mesan` | vaderanalyser | metanalys/mesan2g | MESAN-analys senaste timmen |
| 4 | `smhi_vaderobservationer_metobs` | vaderobservationer | metobs | Väderobservationer (station + parameter + period) |
| 5 | `smhi_vaderobservationer_stationer` | vaderobservationer | metobs | Lista mätstationer för en parameter |
| 6 | `smhi_hydrologi_hydroobs` | hydrologi | hydroobs | Hydrologiska observationer (vattenstånd, flöde, temp) |
| 7 | `smhi_hydrologi_pthbv` | hydrologi | pthbv | Hydrologiska prognoser |
| 8 | `smhi_oceanografi_ocobs` | oceanografi | ocobs | Oceanografiska observationer (havstemperatur, vågor) |
| 9 | `smhi_brandrisk_fwif` | brandrisk | fwif1g | Brandriskprognos (FWI-index) |
| 10 | `smhi_brandrisk_fwia` | brandrisk | fwia | Brandriskanalys (senaste) |

## Nya filer

### `mcp-tools/smhi-mcp/`

```
mcp-tools/smhi-mcp/
├── package.json          # Samma deps som riksbank-mcp
├── tsconfig.json         # Identisk med riksbank-mcp
├── src/
│   ├── index.ts          # SmhiMCPServer klass + stdio transport
│   ├── http-server.ts    # Express + JSON-RPC 2.0 (/mcp, /health)
│   ├── tools.ts          # 10 ToolDefinition med fullständiga JSON Schemas
│   ├── types.ts          # Zod-schemas, SMHI-konstanter, parametertabeller
│   ├── api-client.ts     # SmhiApiClient — 9 API-endpoints, caching
│   ├── formatter.ts      # JSON → Markdown-tabell konvertering
│   ├── instructions.ts   # LLM workflow-instruktioner (svenska)
│   ├── prompts.ts        # 3 prompt-templates
│   └── resources.ts      # Statisk referensdokumentation
└── tests/
    ├── tools.test.ts
    ├── api-client.test.ts
    └── formatter.test.ts
```

### `docker/smhi-mcp/Dockerfile`

2-stage Alpine build, identiskt mönster som riksbank-mcp.

### `skills/public/swedish-weather/SKILL.md`

Skill-definition med triggers på: väder, SMHI, temperatur, vind, nederbörd, snö, prognos, brandrisk, vattenstånd, havstemperatur, oceanografi, hydrologi.

## Modifierade filer

| Fil | Ändring |
|-----|---------|
| `extensions_config.example.json` | Lägg till `smhi` MCP-server entry |
| `docker/docker-compose.yaml` | Lägg till `smhi-mcp` service (port 3000 internt) |
| `mcp-tools/combined-mcp/Dockerfile` | Ny build-stage + production install för SMHI |
| `mcp-tools/combined-mcp/nginx.conf` | Upstream `smhi` (port 3005) + location `/smhi/` |
| `mcp-tools/combined-mcp/start.sh` | Starta SMHI MCP på port 3005 |
| `CLAUDE.md` | Lägg till SMHI MCP i arkitektur + projektstruktur |

## Implementationsordning

### Steg 1: Grundfiler
- `package.json`, `tsconfig.json`

### Steg 2: Kärnimplementation
- `src/types.ts` — Zod-schemas + alla SMHI-konstanter (metobs-parametrar, forecast-parametrar, etc.)
- `src/api-client.ts` — SmhiApiClient med 9 endpoints + caching
- `src/formatter.ts` — Formatera prognoser, observationer, analyser till Markdown
- `src/tools.ts` — 10 verktyg med fullständiga JSON-schemas

### Steg 3: Server + transport
- `src/instructions.ts`, `src/prompts.ts`, `src/resources.ts`
- `src/index.ts` — SmhiMCPServer
- `src/http-server.ts` — Express HTTP server

### Steg 4: Docker-integration
- `docker/smhi-mcp/Dockerfile`
- Uppdatera `docker-compose.yaml`
- Uppdatera `combined-mcp/` (Dockerfile, nginx.conf, start.sh)

### Steg 5: Skill + Konfiguration
- `skills/public/swedish-weather/SKILL.md`
- Uppdatera `extensions_config.example.json`

### Steg 6: Tester
- `tests/tools.test.ts`, `tests/api-client.test.ts`, `tests/formatter.test.ts`

### Steg 7: Dokumentation
- Uppdatera `CLAUDE.md`

## Tool Schemas

Alla point-baserade verktyg (prognoser, analyser, brandrisk) tar `latitude` + `longitude` (WGS84, Sverige: 55-70°N, 10-25°E).

Observationsverktyg (metobs, hydroobs, ocobs) tar `parameter` (ID), `station` (ID), `period` (enum).

Stationsverktyget tar bara `parameter` (ID) och returnerar alla stationer.

## Caching

| Typ | TTL | Motivering |
|-----|-----|------------|
| Prognoser (metfcst, snow, fwif) | 30 min | Uppdateras var 6:e timme |
| Analyser (mesan, fwia) | 15 min | Uppdateras varje timme |
| Observationer (metobs, hydroobs, ocobs) | 5 min | Realtidsdata |
| Metadata (stationer, parametrar) | 60 min | Ändras sällan |

## Designbeslut

1. **Inga API-nycklar** — alla SMHI API:er är öppna
2. **GZIP Accept-Encoding** — krävs av metfcst-API:et
3. **Port 3005** internt i combined-mcp (nästa lediga)
4. **Port 3104** lokalt Docker (nästa efter riksbank 3103)
5. **Allt på svenska** — beskrivningar, felmeddelanden, instruktioner
6. **10 verktyg** — matchar oneseek-specifikationen
