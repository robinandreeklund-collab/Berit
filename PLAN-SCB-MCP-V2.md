# Plan: SCB MCP v2.0 — Förbättrad fork i `/mcp-tools/scb-mcp/`

## Bakgrund

Idag kör Berit en omodifierad klon av [isakskogstad/SCB-MCP](https://github.com/isakskogstad/SCB-MCP) via Docker sidecar. Vi vill nu:

1. **Flytta källkoden in i repot** under en ny `mcp-tools/` mapp (som kan växa med fler MCP-servrar)
2. **Bygga om SCB MCP** med förbättringar inspirerade av OneSeek v5.1:s 7-verktygs-pipeline

---

## Nuvarande tillstånd (SCB-MCP v2.5.3)

**5 verktyg:**
- `scb_search_tables` — Tabellsökning
- `scb_find_region_code` — Regionkodslookup (lokal DB + API fallback)
- `scb_get_table_variables` — Visa variabler/värden
- `scb_get_table_data` — Hämta data (med validation + auto-translation)
- `scb_preview_data` — Förhandsgranskning

**Plus 4 utility-verktyg:** `scb_get_api_status`, `scb_check_usage`, `scb_test_selection`, `scb_search_regions`

**Svagheter identifierade:**
- Ny `fetch()`-anslutning per request (ingen persistent HTTP-klient)
- Ingen metadata-cache — samma tabell hämtas om och om igen
- `scb_get_table_data` returnerar rå JSON-stat2 transformerad till platt JSON — ingen markdown-tabell
- Ingen `scb_browse` (explorativ navigering via paths)
- Ingen `scb_codelist` (inspektion av kodlistor, t.ex. SNI-koder)
- Ingen `scb_validate` (separat validering utan data-fetch)
- Auto-complete för saknade variabler är rudimentärt (kraschar ofta)
- Ingen batching för stora queries (>150 000 celler)
- Tidskonstanter hårdkodade ("2024" i fallbacks)

---

## Planerade förbättringar (OneSeek-inspirerade)

### Fas 1: Projektstruktur & migration

| Steg | Beskrivning |
|------|-------------|
| 1.1 | Skapa `mcp-tools/scb-mcp/` i reporot |
| 1.2 | Kopiera källkoden från isakskogstad/SCB-MCP till `mcp-tools/scb-mcp/` |
| 1.3 | Uppdatera `docker/scb-mcp/Dockerfile` att bygga från `mcp-tools/scb-mcp/` istället för att klona GitHub |
| 1.4 | Uppdatera `docker-compose.yaml` och `docker-compose-dev.yaml` med ny build context |
| 1.5 | Uppdatera `scripts/serve.sh` native fallback-sökväg |
| 1.6 | Verifiera att befintliga backend-tester (`test_scb_mcp_config.py`, `test_mcp_retry.py`) fortfarande passerar |

### Fas 2: Persistent HTTP-klient & cache (OPT-1, OPT-3)

| Steg | Beskrivning |
|------|-------------|
| 2.1 | Ersätt `node-fetch` med en persistent klient (keep-alive, connection pooling) via `undici` eller native `fetch` med agent |
| 2.2 | Lägg till metadata-cache med TTL (5 min) och `asyncio.Lock`-ekvivalent (mutex) för att undvika race conditions vid parallella requests |
| 2.3 | Cache-nycklar: `${tableId}:${lang}` → metadata-objekt. Invalideras vid TTL-expiry |
| 2.4 | Ta bort hårdkodade tidskonstanter ("2024") — beräkna dynamiskt via `new Date().getFullYear()` |

### Fas 3: Nya verktyg — 7-verktygs-pipeline

Vi utökar från 5 till 7 kärnverktyg (matchar OneSeek v5.0):

| Verktyg | Nytt? | Beskrivning |
|---------|-------|-------------|
| `scb_search` | Förbättring av `scb_search_tables` | Bättre relevansranking, paginering, category-filtrering |
| `scb_browse` | **NYTT** | Explorativ navigering via PxWebAPI v2 `/navigation`-alternativ (path-based). Låter agenten "bläddra" i statistikträdet |
| `scb_inspect` | Förbättring av `scb_get_table_info` + `scb_get_table_variables` | Slå ihop till ett enda verktyg som returnerar komplett metadata: variabler, kodlistor, eliminationDefaults, tidsperioder |
| `scb_codelist` | **NYTT** | Dedikerat verktyg för att utforska kodlistor (t.ex. alla SNI-koder, SSYK-koder). Returnerar hierarkiska kodstrukturer |
| `scb_preview` | Behåll `scb_preview_data` | Oförändrad |
| `scb_validate` | Förbättring av `scb_test_selection` | Utökad med auto-complete: fyller i saknade variabler med eliminationDefaults och defaultSelection-värden |
| `scb_fetch` | Förbättring av `scb_get_table_data` | JSON-stat2 → markdown-tabell-avkodning, auto-complete, batching |

### Fas 4: JSON-stat2 → Markdown-avkodning

| Steg | Beskrivning |
|------|-------------|
| 4.1 | Implementera `decodeJsonStat2ToMarkdown()` funktion som konverterar JSON-stat2 till läsbar markdown-tabell |
| 4.2 | Hantera dimensionsnamn → svenska etiketter-mappning |
| 4.3 | Formatera numeriska värden med tusentalsavgränsare (svenskt format: mellanslag) |
| 4.4 | Begränsa output till max 100 rader med "... (N rader till)"-indikation |
| 4.5 | Returnera BÅDE strukturerad JSON och markdown-sammanfattning i MCP-response |

### Fas 5: Auto-complete & smart defaults

| Steg | Beskrivning |
|------|-------------|
| 5.1 | Läs `extension.elimination` och `extension.eliminationValueCode` från metadata |
| 5.2 | Implementera `autoCompleteSelection()` — för varje saknad dimension, använd: 1) eliminationValueCode om `elimination=true`, 2) defaultSelection om tillgänglig, 3) `TOP(1)` som sista fallback |
| 5.3 | Integrera auto-complete i `scb_fetch` och `scb_validate` |
| 5.4 | Beräkna estimerad resultatstorlek INNAN API-anrop, varna om >100 000 celler |

### Fas 6: Batching för stora queries

| Steg | Beskrivning |
|------|-------------|
| 6.1 | Beräkna `totalCells = product(selectedValueCounts)` |
| 6.2 | Om `totalCells > maxDataCells` (hämtas från `/config`), dela upp i batchar per tidsdimension |
| 6.3 | Exekvera batchar sekventiellt (respektera rate limit) och slå samman resultat |
| 6.4 | Returnera samlat resultat med metadata om antal batchar |

### Fas 7: `scb_browse` — explorativ navigering

| Steg | Beskrivning |
|------|-------------|
| 7.1 | Implementera path-baserad browsing via SCB:s `/tables?query=*` med subjectCode-filtrering |
| 7.2 | Returnera hierarkisk vy: Subject Area → Subject → Tables |
| 7.3 | Stödja nedåt-navigering: `scb_browse({subjectCode: "BE"})` → alla befolkningstabeller |

### Fas 8: `scb_codelist` — kodlisteutforskning

| Steg | Beskrivning |
|------|-------------|
| 8.1 | Dedikerat verktyg: givet `tableId` + `variableCode`, returnera ALLA koder med etiketter |
| 8.2 | Stödja filtrering: `scb_codelist({tableId: "TAB638", variable: "Region", filter: "Stockholm"})` |
| 8.3 | Returnera hierarkiska koder om tillämpligt (t.ex. län → kommuner) |

### Fas 9: Tester

| Steg | Beskrivning |
|------|-------------|
| 9.1 | Enhetstester för `decodeJsonStat2ToMarkdown()` med riktiga SCB-responses |
| 9.2 | Enhetstester för `autoCompleteSelection()` med edge cases |
| 9.3 | Enhetstester för batching-logik |
| 9.4 | Enhetstester för cache-invalidering och TTL |
| 9.5 | Integrationstester mot `scb_browse` och `scb_codelist` |
| 9.6 | Uppdatera backend-tester (`test_scb_mcp_config.py`) om Docker-konfiguration ändrats |

### Fas 10: Integration med Berit

| Steg | Beskrivning |
|------|-------------|
| 10.1 | Uppdatera `lead_agent/prompt.py` — nytt `<scb_tools>` block med 7-verktygs-pipeline-instruktioner |
| 10.2 | Uppdatera `extensions_config.example.json` om tool-namn ändrats |
| 10.3 | Uppdatera `CLAUDE.md`, `backend/CLAUDE.md`, och `README.md` med ny arkitektur |

---

## Mappstruktur efter implementering

```
Berit/
├── mcp-tools/                          # NY: Samlingsfolder för MCP-verktyg
│   └── scb-mcp/                        # Forkad + förbättrad SCB MCP
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       ├── src/
│       │   ├── index.ts                # MCP server (uppdaterad med 7 verktyg)
│       │   ├── api-client.ts           # Persistent HTTP-klient med cache
│       │   ├── http-server.ts          # Express HTTP transport
│       │   ├── types.ts                # Zod schemas
│       │   ├── regions.ts              # Regiondatabas (312 regioner)
│       │   ├── instructions.ts         # LLM-instruktioner
│       │   ├── prompts.ts              # MCP prompts
│       │   ├── resources.ts            # MCP resources
│       │   ├── jsonstat2.ts            # NY: JSON-stat2 → markdown decoder
│       │   ├── autocomplete.ts         # NY: Auto-complete selection logic
│       │   └── batch.ts               # NY: Batching för stora queries
│       └── tests/
│           ├── jsonstat2.test.ts
│           ├── autocomplete.test.ts
│           ├── batch.test.ts
│           └── codelist.test.ts
├── docker/
│   └── scb-mcp/
│       └── Dockerfile                  # Uppdaterad: bygger från mcp-tools/scb-mcp/
└── ...
```

---

## Verktygs-pipeline efter implementering

```
Användare: "Hur ser befolkningen ut i Göteborg?"

Agent:
  1. scb_search("befolkning Göteborg")
  2. scb_inspect("TAB638")           ← metadata + variabler i ett anrop
  3. scb_validate({                  ← auto-complete fyller i saknade variabler
       tableId: "TAB638",
       selection: { Region: ["1480"], Tid: ["TOP(5)"] }
     })
  4. scb_fetch({                     ← JSON-stat2 → markdown-tabell
       tableId: "TAB638",
       selection: { Region: ["1480"], Tid: ["TOP(5)"], ... }
     })
  5. Svarar med formaterad markdown-tabell direkt i chatten
```

---

## Prioritering

| Prioritet | Fas | Motivation |
|-----------|-----|------------|
| P0 | Fas 1 (projektstruktur) | Grundförutsättning |
| P0 | Fas 2 (persistent HTTP + cache) | Största prestandaförbättringen |
| P1 | Fas 4 (JSON-stat2 → markdown) | Kritisk för användbarhet |
| P1 | Fas 5 (auto-complete) | Löser vanligaste felkällan |
| P1 | Fas 3 (7-verktygs-pipeline) | Kopplar ihop allt |
| P2 | Fas 6 (batching) | Behövs för stora queries |
| P2 | Fas 7-8 (browse + codelist) | Nya capabilities |
| P2 | Fas 9-10 (tester + integration) | Kvalitetssäkring |

---

## Risker & mitigation

| Risk | Mitigation |
|------|-----------|
| SCB API v2 saknar `/navigation` endpoint | `scb_browse` bygger på `?query=*` + subjectCode-filtrering istället |
| Breaking change i verktygsnamn | Bakåtkompatibla alias under övergångsperiod (konfigureras i prompt) |
| Metadata-cache returnerar stale data | TTL på 5 min + force-refresh-parameter |
| Batching skapar för många API-anrop | Respektera rate limit (30/10s), sekventiell exekvering |
