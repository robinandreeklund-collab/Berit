# Plan: Riksbank MCP Server Integration

Ny MCP-server för Riksbankens öppna API:er (SWEA, SWESTR, Prognoser). Följer exakt samma mönster som `trafikverket-mcp`.

## Scope

- 8 verktyg, 3 API:er (SWEA räntor/valuta, SWESTR dagslåneränta, Prognoser makroekonomi)
- Dual transport: stdio + HTTP (Express)
- Docker sidecar + Node.js fallback
- Skill-fil för agentsystemet
- Tester

## Steg

### 1. Skapa `mcp-tools/riksbank-mcp/` — projektstruktur

Skapa alla filer med samma struktur som trafikverket-mcp:

- **`package.json`** — `riksbank-mcp`, samma deps (`@modelcontextprotocol/sdk`, `express`, `cors`, `zod`, `marked`), scripts: build/start/start:stdio/dev/test
- **`tsconfig.json`** — Identisk med trafikverket-mcp
- **`vitest.config.ts`** — Identisk med trafikverket-mcp

### 2. `src/tools.ts` — 8 verktygsdefinitioner

| Tool ID | Namn | API | Endpoint |
|---------|------|-----|----------|
| `riksbank_ranta_styrranta` | Riksbanken Styrränta | SWEA | `/Observations/Latest/{seriesId}` + historik |
| `riksbank_ranta_marknadsrantor` | Riksbanken Marknadsräntor | SWEA | `/Observations/Latest/ByGroup/{groupId}` |
| `riksbank_valuta_kurser` | Riksbanken Valutakurser | SWEA | `/Observations/Latest/ByGroup/130` |
| `riksbank_valuta_korskurser` | Riksbanken Korskurser | SWEA | `/CrossRates/{id1}/{id2}/{date}` |
| `riksbank_swestr` | Riksbanken SWESTR | SWESTR | `/latest/SWESTR` + historik |
| `riksbank_prognos_inflation` | Riksbanken Inflation | Prognoser | `/forecasts?indicator=...` (KPI, KPIF) |
| `riksbank_prognos_bnp` | Riksbanken BNP | Prognoser | `/forecasts?indicator=...` (BNP) |
| `riksbank_prognos_ovrigt` | Riksbanken Makro | Prognoser | `/indicators` + `/forecasts` |

ToolDefinition-interface anpassat för REST (ej XML som Trafikverket):
```typescript
interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;           // ranta | valuta | swestr | prognos
  api: 'swea' | 'swestr' | 'forecasts';
  endpoint: string;           // URL-mall
  defaultParams?: Record<string, string>;
}
```

### 3. `src/types.ts` — Zod-scheman + konstanter

- `ObservationSchema` — `{ date, value }`
- `SeriesSchema` — `{ seriesId, seriesName, groupId }`
- `GroupSchema` — `{ groupId, groupName, parentGroupId }`
- `SwestrSchema` — `{ rate, date, pctl12_5, pctl87_5, volume, numberOfTransactions, numberOfAgents, publicationTime }`
- `ForecastSchema` — `{ indicator, values: { date, forecast, outcome } }`
- `IndicatorSchema` — `{ id, name }`
- Inputscheman: `RateFilterSchema`, `CurrencyFilterSchema`, `CrossRateFilterSchema`, `SwestrFilterSchema`, `ForecastFilterSchema`
- Konstanter: `SERIES_IDS` (SECBREPOEFF, SEKEURPMI, etc.), `GROUP_IDS`, `INDICATOR_IDS`

### 4. `src/api-client.ts` — HTTP-klient

- `RiksbankApiClient` klass med MemoryCache (samma mönster)
- Tre bas-URL:er konfigurerbara via env vars
- Standard JSON fetch (inte XML som Trafikverket)
- API-nyckel via `Ocp-Apim-Subscription-Key` header (valfri, funkar anonymt)
- Cache: 3600s räntor, 86400s metadata
- Retry med exponential backoff (429-hantering)

### 5. `src/formatter.ts` — Markdown-formatering

- `formatObservations()` — Räntor/kurser → tabell med datum + värde
- `formatSwestr()` — SWESTR → tabell med rate, percentiler, volym
- `formatForecasts()` — Prognoser → tabell med prognos vs utfall
- `formatSeries()` — Seriemetadata
- `formatIndicators()` — Indikatorlista
- `formatCrossRate()` — Korskurs mellan valutor

### 6. `src/index.ts` — MCP-server (stdio)

- `RiksbankMCPServer` klass
- `getTools()` → 8 verktyg med Zod-inputscheman
- `callTool(name, args)` → API-anrop + formatering
- CallTracker (max 3 anrop/5 min per verktyg)
- Handlers: tools/list, tools/call, prompts/list, prompts/get, resources/list, resources/read
- Stdio transport

### 7. `src/http-server.ts` — Express HTTP-server

Identisk struktur som trafikverket-mcp:
- `GET /health`, `GET /mcp`, `POST /mcp`, `GET /`
- JSON-RPC 2.0 dispatcher
- CORS, PORT env var

### 8. `src/instructions.ts` + `src/prompts.ts` + `src/resources.ts`

**Instructions:** Verktygslista, arbetsflöde, viktiga serie-ID:n

**Prompts (3 st):**
- `analyze-interest-rates` — Styrränta + marknadsräntor + SWESTR
- `currency-report` — Valutakurser + korskurser
- `economic-outlook` — Alla prognoser

**Resources (3 st):**
- `riksbank://documentation` — API-referens
- `riksbank://series` — Viktiga serie-ID:n
- `riksbank://indicators` — Prognosindikatorer

### 9. Tester — `tests/`

- `tools.test.ts` — Validera 8 verktyg
- `api-client.test.ts` — Mock fetch, cache, retry
- `formatter.test.ts` — Markdown-output

### 10. `docker/riksbank-mcp/Dockerfile`

Multi-stage build (node:22-alpine), kopierar från `mcp-tools/riksbank-mcp/`, `CMD ["node", "dist/http-server.js"]`

### 11. `skills/public/swedish-economy/SKILL.md`

Skill-fil med:
- `name: swedish-economy`
- Description som triggar på: ränta, styrränta, reporänta, valutakurs, SEK, kronkurs, EUR/SEK, USD/SEK, SWESTR, dagslåneränta, inflation, KPI, KPIF, BNP, Riksbanken, makroekonomi, arbetsmarknad, prognos
- Alla 8 verktyg listade i tabeller
- Arbetsflöde per frågetyp
- Kritiska regler (max 4 anrop, svenska, etc.)
- Exempelfrågor

### 12. `extensions_config.example.json` — MCP-server entry

```json
"riksbank": {
  "enabled": true,
  "type": "http",
  "url": "$RIKSBANK_MCP_URL",
  "description": "Riksbanken — Räntor, valutakurser, SWESTR, makroprognoser. 8 verktyg."
}
```

### 13. `scripts/serve.sh` — Startscript

Lägg till Riksbank MCP-blocket efter Trafikverket (samma mönster):
- Banner-rad
- Remote URL check (`RIKSBANK_MCP_URL`)
- Docker start (port 3103)
- Node.js fallback
- Cleanup i trap
- Status i ready-block med emoji 💰

### 14. Dokumentation

Uppdatera `CLAUDE.md` och `README.md`:
- Riksbank MCP i arkitekturtabell
- Port 3103
- Miljövariabler (`RIKSBANK_API_KEY`, `RIKSBANK_MCP_URL`)

## Nya filer

```
mcp-tools/riksbank-mcp/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts
│   ├── http-server.ts
│   ├── api-client.ts
│   ├── types.ts
│   ├── tools.ts
│   ├── formatter.ts
│   ├── instructions.ts
│   ├── prompts.ts
│   └── resources.ts
└── tests/
    ├── tools.test.ts
    ├── api-client.test.ts
    └── formatter.test.ts

docker/riksbank-mcp/
└── Dockerfile

skills/public/swedish-economy/
└── SKILL.md
```

## Modifierade filer

- `extensions_config.example.json` — ny MCP-server entry
- `scripts/serve.sh` — startblock, cleanup, banner, status
- `CLAUDE.md` — arkitektur, port, beskrivning
- `README.md` — användarändringar

## Designbeslut

1. **REST API** (inte XML som Trafikverket) — standard JSON fetch
2. **Valfri API-nyckel** — funkar anonymt (5 req/min), bättre med nyckel (200 req/min)
3. **Differentierad cache** — 1h för räntor, 24h för metadata
4. **8 verktyg** — enligt Riksbank API-specen
5. **Port 3103** — nästa lediga efter Trafikverket (3102)
6. **Allt på svenska** — beskrivningar, felmeddelanden, instruktioner
