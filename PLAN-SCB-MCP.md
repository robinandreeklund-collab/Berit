# Plan: Integration av SCB MCP i Berit

## Sammanfattning

**SCB MCP** (github.com/isakskogstad/SCB-MCP) är en TypeScript/Node.js MCP-server som ger LLM:er tillgång till SCB:s PxWebAPI 2.0 — 1 200+ statistiktabeller med svensk befolknings-, ekonomi-, miljö-, arbetsmarknads- och utbildningsdata.

Servern exponerar 5 MCP-verktyg:
- `search_tables()` — sök statistiktabeller (fuzzy matching, "Goteborg" → "Göteborg")
- `find_region_code()` — slå upp regionkoder (312+ regioner)
- `get_table_variables()` — hämta dimensioner/variabler för en tabell
- `get_table_data()` — hämta statistikdata med filtreringar
- `preview_data()` — testa frågor innan full hämtning

---

## Analys: Separat (Render) vs Direkt integration

### Alternativ A: Peka på Render-instansen (HTTP)

```json
{
  "scb": {
    "enabled": true,
    "type": "http",
    "url": "https://scb-mcp.onrender.com/mcp",
    "description": "SCB — svensk officiell statistik (1200+ tabeller)"
  }
}
```

| Fördelar | Nackdelar |
|----------|-----------|
| **Noll infrastruktur** — ingen build, ingen container | **Cold start** — Render free tier sover efter inaktivitet (30-60s uppstart) |
| **Alltid senaste version** — uppdateras av maintainer | **Extern beroende** — driftstopp hos Render/maintainer = Berit tappar SCB |
| **Minimal konfiguration** — 5 rader JSON | **Latens** — varje MCP-anrop gör roundtrip till Render → SCB API |
| | **Rate limit** — 30 req/10s delad med alla andra användare av samma instans |
| | **Ingen kontroll** — kan inte justera timeout, caching, språk |

### Alternativ B: Lokal stdio-integration (npm/npx)

```json
{
  "scb": {
    "enabled": true,
    "type": "stdio",
    "command": "node",
    "args": ["./node_modules/.bin/scb-mcp/dist/index.js"],
    "env": {},
    "description": "SCB — svensk officiell statistik (1200+ tabeller)"
  }
}
```

| Fördelar | Nackdelar |
|----------|-----------|
| **Ingen latens** — direkt stdio-kommunikation | **Node.js-beroende** — kräver npm install i build-processen |
| **Ingen cold start** — startar med agenten | **Versionshantering** — manuell uppgradering |
| **Ingen delad rate limit** — egen instans | **Mer setup** — kräver ändringar i install-scripts |
| **Full kontroll** — kan forka/patcha vid behov | |

### Alternativ C: Docker sidecar (REKOMMENDERAT)

```json
{
  "scb": {
    "enabled": true,
    "type": "http",
    "url": "http://scb-mcp:3000/mcp",
    "description": "SCB — svensk officiell statistik (1200+ tabeller)"
  }
}
```

Med tillägg i `docker-compose.yaml`:
```yaml
scb-mcp:
  image: ghcr.io/isakskogstad/scb-mcp:latest  # eller lokal build
  container_name: deer-flow-scb-mcp
  networks:
    - deer-flow
  restart: unless-stopped
```

| Fördelar | Nackdelar |
|----------|-----------|
| **Ingen cold start** — alltid igång i Docker-nätverket | **Ytterligare container** — liten resursförbrukning (~50MB RAM) |
| **Isolation** — egen process, kraschar inte agenten | **Docker-krav** — kräver Docker för full funktionalitet |
| **Enkel uppgradering** — byt image tag | **Nätverkslatens** — minimal (intern Docker-bridge) |
| **Konsistent med Lightpanda-mönstret** — redan etablerat mönster i Berit | |
| **Fungerar i både dev och prod** — samma config | |

---

## Rekommendation: Hybrid (C + A som fallback)

**Primärt: Docker sidecar (Alternativ C)** för alla som kör via `make dev` eller Docker Compose.

**Fallback: Render (Alternativ A)** som opt-in för snabb test utan Docker.

### Motivering

1. **Berit använder redan Docker** — Lightpanda, Nginx, Gateway, LangGraph körs alla som containers. SCB MCP passar naturligt in.
2. **HTTP-transport stöds fullt ut** — `McpServerConfig` har `type: "http"` + `url` + `headers` + `oauth`. SCB MCP kräver ingen auth.
3. **Ingen Node.js i backend-imagen** — Berits backend-image är Python-baserad. Att lägga till npm i builden (Alt B) är onödigt komplext.
4. **Render som fallback** — för snabb demo/test kan man bara byta URL:en till Render-instansen.

---

## Implementationsplan

### Steg 1: Uppdatera `extensions_config.example.json`

Lägg till SCB MCP-konfiguration:

```json
{
  "mcpServers": {
    "lightpanda": { "..." },
    "filesystem": { "..." },
    "scb": {
      "enabled": true,
      "type": "http",
      "url": "http://scb-mcp:3000/mcp",
      "env": {},
      "description": "SCB — Sveriges officiella statistik via PxWebAPI 2.0. 1200+ tabeller: befolkning, ekonomi, miljö, arbetsmarknad, utbildning. 75+ års historisk data."
    }
  }
}
```

### Steg 2: Uppdatera Docker Compose

**`docker/docker-compose.yaml`** (produktion):
```yaml
scb-mcp:
  build:
    context: ../
    dockerfile: docker/scb-mcp/Dockerfile
  container_name: deer-flow-scb-mcp
  environment:
    - PORT=3000
  networks:
    - deer-flow
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
    interval: 30s
    timeout: 5s
    retries: 3
```

**`docker/docker-compose-dev.yaml`** (utveckling):
Samma service-definition.

### Steg 3: Skapa Dockerfile för SCB MCP

**`docker/scb-mcp/Dockerfile`**:
```dockerfile
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache git \
    && git clone --depth 1 https://github.com/isakskogstad/SCB-MCP.git . \
    && npm ci --production=false \
    && npm run build \
    && npm prune --production \
    && apk del git
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Alternativt: Om maintainer publicerar en Docker-image, byt till `image: ghcr.io/isakskogstad/scb-mcp:latest`.

### Steg 4: Uppdatera `make dev` (icke-Docker-flödet)

I `Makefile` / `scripts/serve.sh`: Starta SCB MCP som bakgrundsprocess om Node.js är tillgängligt:

```bash
# Valfritt: starta SCB MCP lokalt om klonen finns
if [ -d "vendor/scb-mcp" ]; then
  cd vendor/scb-mcp && PORT=3100 node dist/index.js &
fi
```

Alternativt: Hoppa över detta och kräv Docker för SCB MCP.

### Steg 5: Skriv tester

**`backend/tests/test_scb_mcp_config.py`**:
- Verifiera att SCB MCP-konfigurationen laddas korrekt från `extensions_config.json`
- Verifiera att `type: "http"` + `url` parsas till `McpServerConfig`
- Verifiera att servern är nåbar (integration test, markerad med `@pytest.mark.integration`)

### Steg 6: Uppdatera dokumentation

- **`README.md`**: Lägg till SCB MCP i listan över integrationer
- **`CLAUDE.md`**: Uppdatera projektstruktur och MCP-serverlistan
- **`backend/CLAUDE.md`**: Uppdatera MCP-sektionen med SCB MCP-detaljer
- **`SETUP.md`**: Lägg till eventuella setup-steg

### Steg 7: Testa end-to-end

1. `make dev` → verifiera att SCB MCP-containern startar
2. Gå till Berit UI → fråga agenten: "Hur många invånare har Göteborg?"
3. Verifiera att agenten använder SCB MCP-verktyg (`search_tables`, `find_region_code`, `get_table_data`)
4. Testa felhantering: Stoppa SCB MCP-containern → agenten ska hantera otillgänglighet graciöst

---

## Risker och mitigering

| Risk | Sannolikhet | Påverkan | Mitigering |
|------|-------------|----------|------------|
| SCB API nere/långsam | Låg | Medium | Rate limiting redan inbyggd (30 req/10s). Agent kan meddela användaren. |
| SCB MCP repo överges | Låg | Hög | Forka till Berit-organisationen. Minimal kodbas (~500 LoC). |
| Nemotron 3 Nano förstår inte verktygen | Medium | Hög | Testa noggrant. SCB MCP har tydliga tool-beskrivningar. Eventuellt anpassa system prompt. |
| Docker-image blir stor | Låg | Låg | Node.js Alpine + pruning → ~80MB. Acceptabelt. |

---

## Tidsuppskattning

| Steg | Uppskattning |
|------|-------------|
| 1. Config | 10 min |
| 2-3. Docker | 30 min |
| 4. Make dev (valfritt) | 20 min |
| 5. Tester | 30 min |
| 6. Dokumentation | 20 min |
| 7. E2E-test | 30 min |
| **Totalt** | **~2-3 timmar** |
