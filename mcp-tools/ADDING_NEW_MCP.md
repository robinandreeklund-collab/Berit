# Lägga till en ny MCP-server i Berit

Komplett checklista för att integrera en ny MCP-server (Model Context Protocol) i Berit.
Guiden använder `{name}` som platshållare — ersätt med ditt servernamn (t.ex. `smhi`, `riksbank`).

---

## Översikt — filer att skapa/ändra

| # | Fil | Typ | Beskrivning |
|---|-----|-----|-------------|
| 1 | `mcp-tools/{name}-mcp/package.json` | **Skapa** | Node.js-projekt |
| 2 | `mcp-tools/{name}-mcp/tsconfig.json` | **Skapa** | TypeScript-konfiguration |
| 3 | `mcp-tools/{name}-mcp/.gitignore` | **Skapa** | Ignorera `node_modules/` och `dist/` |
| 4 | `mcp-tools/{name}-mcp/src/` | **Skapa** | Källkod (se nedan) |
| 5 | `mcp-tools/{name}-mcp/tests/` | **Skapa** | Tester |
| 6 | `docker/{name}-mcp/Dockerfile` | **Skapa** | Standalone Docker-image |
| 7 | `skills/public/{skill-name}/SKILL.md` | **Skapa** | Skill-definition för agenten |
| 8 | `mcp-tools/combined-mcp/Dockerfile` | **Ändra** | Lägg till build-stage + prod-install |
| 9 | `mcp-tools/combined-mcp/nginx.conf` | **Ändra** | Upstream + location-block |
| 10 | `mcp-tools/combined-mcp/start.sh` | **Ändra** | Starta på intern port, PID, healthcheck |
| 11 | `extensions_config.example.json` | **Ändra** | Registrera MCP-servern |
| 12 | `docker/docker-compose.yaml` | **Ändra** | Docker Compose-service + env-vars |
| 13 | `scripts/serve.sh` | **Ändra** | Banner, startup, cleanup, ready-banner, loggar |
| 14 | `render.yaml` | **Ändra** | Render-deploy env-vars (API-nycklar) |
| 15 | `.env.example` | **Ändra** | URL-exempel |
| 16 | `CLAUDE.md` | **Ändra** | Arkitekturdokumentation |

---

## Steg 1 — Skapa MCP-serverns källkod

### 1.1 Skapa projektmapp

```
mcp-tools/{name}-mcp/
├── src/
│   ├── types.ts          # Zod-schemas, konstanter, parameter-tabeller
│   ├── api-client.ts     # API-klient med cache och retry
│   ├── formatter.ts      # Formatera API-svar till Markdown-tabeller
│   ├── tools.ts          # ToolDefinition[] med JSON Schema inputSchema
│   ├── index.ts          # MCP Server-klass + stdio-transport
│   ├── http-server.ts    # Express HTTP-server med JSON-RPC 2.0
│   ├── instructions.ts   # LLM-instruktioner (svenska)
│   ├── prompts.ts        # MCP prompts (valfritt)
│   └── resources.ts      # MCP resources (valfritt)
├── tests/
│   ├── tools.test.ts     # Tester för tool-definitioner
│   ├── formatter.test.ts # Tester för formatterare
│   └── api-client.test.ts# Tester för cache
├── package.json
├── tsconfig.json
└── .gitignore
```

### 1.2 `package.json`

```json
{
  "name": "{name}-mcp",
  "version": "1.0.0",
  "description": "MCP server for {Beskrivning} — N tools: ...",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/http-server.js",
    "start:stdio": "node dist/index.js",
    "dev": "tsc --watch",
    "prepare": "npm run build",
    "test": "vitest"
  },
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "cors": "^2.8.5",
    "express": "^4.22.1",
    "marked": "^17.0.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "vitest": "^4.0.14"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 1.3 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.4 `.gitignore`

```
node_modules/
dist/
```

### 1.5 Källkod — nyckeldelar

#### `src/tools.ts` — Tool-definitioner

Varje verktyg behöver:
- `id`: Unikt ID med prefix `{name}_` (t.ex. `smhi_vaderprognoser_metfcst`)
- `name`: Svenskt namn
- `description`: Detaljerad beskrivning med **Användningsfall**, **Returnerar**, **Exempel**
- `category`: Gruppering
- `api`: Vilken API-endpoint
- `endpoint`: URL-mönster
- `inputSchema`: Full JSON Schema med `type`, `properties`, `required`

```typescript
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  api: string;
  endpoint: string;
  inputSchema: Record<string, unknown>;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: '{name}_category_action',
    name: 'Verktygsnamn',
    description: 'Beskrivning...',
    category: 'category',
    api: 'api/endpoint',
    endpoint: '/version/1/...',
    inputSchema: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: '...' },
      },
      required: ['param1'],
    },
  },
];

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.id === id.toLowerCase());
}

export function getToolsByCategory(): Record<string, ToolDefinition[]> {
  const grouped: Record<string, ToolDefinition[]> = {};
  for (const tool of TOOL_DEFINITIONS) {
    if (!grouped[tool.category]) grouped[tool.category] = [];
    grouped[tool.category].push(tool);
  }
  return grouped;
}
```

#### `src/api-client.ts` — API-klient

Alla MCP-servrar följer samma mönster:
- `MemoryCache` med differentierade TTL:er
- Retry med exponential backoff (max 4 retries)
- Singleton via `getApiClient()`
- Klient-felhantering (429, 4xx, 5xx)

#### `src/http-server.ts` — HTTP-server

Express-server med dessa endpoints:
- `GET /health` → `{ status: 'ok', timestamp }`
- `GET /mcp` → Serverinfo + capabilities
- `POST /mcp` → JSON-RPC 2.0 dispatcher
- `GET /` → Serverdokumentation

JSON-RPC 2.0-metoder som måste hanteras:
- `initialize` → protocolVersion, capabilities, serverInfo
- `notifications/initialized` → 204 No Content
- `tools/list` → alla verktyg
- `tools/call` → kör verktyg
- `prompts/list`, `prompts/get` (valfritt)
- `resources/list`, `resources/read` (valfritt)

#### `src/index.ts` — MCP Server-klass

Exporterar en klass med:
- `getTools()` → lista verktyg för MCP SDK
- `callTool(name, args)` → switch-case för alla verktyg
- `CallTracker` — förhindrar LLM-loopar (max 3 anrop/verktyg/5 min)

### 1.6 Installera och bygga

```bash
cd mcp-tools/{name}-mcp
npm install
npm run build
npm test
```

**Viktigt:** Committa `package-lock.json` — den behövs av `npm ci` i Docker.

---

## Steg 2 — Docker-image (standalone)

### 2.1 Skapa `docker/{name}-mcp/Dockerfile`

```dockerfile
# {Name} MCP Server v1.0 — {Beskrivning}
# Built from local source: mcp-tools/{name}-mcp/

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/{name}-mcp/package.json mcp-tools/{name}-mcp/tsconfig.json ./
COPY mcp-tools/{name}-mcp/src ./src
RUN npm install && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/http-server.js"]
```

---

## Steg 3 — Skill-definition (SKILL.md)

> **KRITISKT: Alla MCP-verktygens instruktioner ska ligga i SKILL.md — INTE i lead agent-prompten.**

### 3.1 Varför SKILL.md istället för lead agent-prompten?

Berit använder en **progressiv laddningsarkitektur** för att hålla lead agent-prompten minimal:

```
Lead Agent Prompt (alltid laddad)
├── Generella instruktioner (workflow, clarification, subagents)
├── Skill-lista: bara namn + description + sökväg     ← MINIMALT
│   └── "swedish-weather: Använd vid frågor om väder..."
└── Tool-definitioner (LangChain injicerar automatiskt)

SKILL.md (laddas on-demand via read_file)
├── Detaljerade instruktioner för MCP-verktygen       ← ALLT HÄR
├── Arbetsflöden med steg-för-steg
├── Verktygsparametrar och exempel
├── Vanliga stationer/koder
└── Felsökning
```

**Hur det fungerar:**

1. Lead agent ser bara skill-**namn och description** (en rad per skill)
2. När användarens fråga matchar en skills `description`-fält → agenten anropar `read_file` på SKILL.md
3. Först DÅ laddas alla detaljerade instruktioner, arbetsflöden och exempel

**Fördelar:**
- Lead agent-prompten förblir liten — oavsett hur många MCP-servrar som läggs till
- Varje ny MCP lägger bara till ~2 rader i prompten (namn + description)
- Detaljerade instruktioner laddas BARA när de behövs
- Ingen risk att spränga kontextfönstret

**VARNING — gör INTE detta:**
- Lägg INTE till MCP-verktygsnamn i `backend/src/agents/lead_agent/prompt.py`
- Lägg INTE till arbetsflöden eller parameterbeskrivningar i lead agent-prompten
- Lägg INTE till stationslistor, koder, eller exempelfrågor i lead agent-prompten
- Allt det ska ligga i SKILL.md

### 3.2 Description-fältet — triggers

`description` i SKILL.md frontmatter är det ENDA som syns i lead agent-prompten. Det måste:
- Innehålla alla relevanta nyckelord som användaren kan tänkas använda
- Vara på svenska (matchar användarens språk)
- Vara tillräckligt brett för att fånga relaterade frågor

Exempel (swedish-weather):
```
description: Använd denna färdighet när användaren frågar om svenskt väder,
väderprognos, temperatur, vind, nederbörd, regn, snö, SMHI, väderanalys,
MESAN, väderobservationer, mätstation, vattenstånd, hydrologi, oceanografi,
brandrisk, FWI, meteorologi, klimatdata, eller väderleksrapport i Sverige.
```

### 3.3 Skapa `skills/public/{skill-name}/SKILL.md`

```markdown
---
name: {skill-name}
description: Använd denna färdighet när användaren frågar om {triggers}...
---

# {Titel} ({Name} MCP v1.0)

## Översikt
{Kort beskrivning av vad färdigheten gör}

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `{name}_tool_1` | ... |
| `{name}_tool_2` | ... |

## Arbetsflöde
1. {Steg för steg — detaljerat}

## Vanliga parametrar/koder
{Tabeller med stations-ID, parameter-koder, etc.}

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen.**
3. **Presentera data överskådligt** — använd tabeller
4. **Ange källa**: "Källa: {API-källa}"

## Felsökning
{Vanliga felkoder och lösningar}
```

### 3.4 Checklista för SKILL.md

- [ ] `description`-fältet innehåller alla relevanta svenska nyckelord
- [ ] Alla verktygsnamn listas med exakt `id` från `tools.ts`
- [ ] Arbetsflöden visar vilka verktyg som ska anropas för vanliga frågor
- [ ] Inga instruktioner har lagts till i lead agent-prompten (`prompt.py`)

---

## Steg 4 — Combined MCP (Render-deploy)

Alla MCP-servrar körs på samma Render-instans via nginx reverse proxy.

### 4.1 Porttilldelning

| Port | Server |
|------|--------|
| 3001 | SCB (default/root) |
| 3002 | Skolverket |
| 3003 | Trafikverket |
| 3004 | Riksbank |
| 3005 | SMHI |
| **3006** | **Nästa lediga** |

### 4.2 `mcp-tools/combined-mcp/Dockerfile`

Lägg till **två** sektioner:

**Build-stage** (efter sista `FROM ... AS build-*`):

```dockerfile
# ============ Stage N: Build {Name} ============
FROM node:22-alpine AS build-{name}
WORKDIR /app
COPY {name}-mcp/package.json {name}-mcp/package-lock.json {name}-mcp/tsconfig.json ./
COPY {name}-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build
```

**Production install** (efter sista `COPY --from=build-*`):

```dockerfile
# {Name} production install
COPY {name}-mcp/package.json {name}-mcp/package-lock.json /app/{name}/
RUN cd /app/{name} && npm ci --omit=dev --ignore-scripts
COPY --from=build-{name} /app/dist /app/{name}/dist
```

> **VIKTIGT:** Inkludera alltid `package-lock.json` i COPY-kommandon. `npm ci` kräver den.

### 4.3 `mcp-tools/combined-mcp/nginx.conf`

Lägg till **upstream** (bland de andra upstream-blocken):

```nginx
# {Name} MCP — /{name}/* → port {PORT}
upstream {name} {
    server 127.0.0.1:{PORT};
}
```

Lägg till **location** (innan `location /` catch-all):

```nginx
# {Name} routes — strip /{name} prefix
location /{name}/ {
    proxy_pass http://{name}/;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding on;
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;
}
```

### 4.4 `mcp-tools/combined-mcp/start.sh`

Lägg till (i ordning):

**Echo-rad** (bland de andra echo-raderna):
```bash
echo "{Name} MCP:       internal :{PORT} → /{name}/"
```

**Start-kommando** (efter sista `*_PID=$!`):
```bash
# Start {Name} MCP on port {PORT}
echo "Starting {Name} MCP on :{PORT}..."
PORT={PORT} node /app/{name}/dist/http-server.js &
{NAME}_PID=$!
```

**Health-check** (lägg till i `for`-loopens if-villkor):
```bash
wget -qO- http://127.0.0.1:{PORT}/health >/dev/null 2>&1
```

**Status-rad** (bland de andra echo-raderna efter startup):
```bash
echo "  {Name} MCP:          http://localhost:$PORT/{name}/mcp"
echo "  {Name} health:       http://localhost:$PORT/{name}/health"
```

**PID i wait + kill** (lägg till PID-variabeln):
```bash
wait -n ... ${NAME}_PID $NGINX_PID
kill ... ${NAME}_PID ... 2>/dev/null || true
```

---

## Steg 5 — Extensions Config

### 5.1 `extensions_config.example.json`

Lägg till i `mcpServers`-objektet:

```json
"{name}": {
  "enabled": true,
  "type": "http",
  "command": null,
  "args": [],
  "env": {},
  "url": "${NAME}_MCP_URL",
  "headers": {},
  "oauth": null,
  "description": "{Beskrivning}. N verktyg."
}
```

> URL-värdet använder `$`-prefix för miljövariabel-upplösning i backend-config.

---

## Steg 6 — Docker Compose

### 6.1 `docker/docker-compose.yaml`

**Lägg till service** (efter sista MCP-service):

```yaml
  # ── {Name} MCP Server ({beskrivning}) ─
  {name}-mcp:
    build:
      context: ../
      dockerfile: docker/{name}-mcp/Dockerfile
    container_name: deer-flow-{name}-mcp
    environment:
      - PORT=3000
      # Lägg till API-nycklar här om det behövs:
      # - {NAME}_API_KEY=${{{NAME}_API_KEY}}
    networks:
      - deer-flow
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

**Lägg till env-var** i `gateway` och `langgraph` services:

```yaml
      - {NAME}_MCP_URL=http://{name}-mcp:3000/mcp
```

---

## Steg 7 — Render-deploy (`render.yaml`)

Alla MCP-servrar körs på **samma Render-instans** via combined-mcp. Filen `render.yaml` i projektets rot styr Render-deployen (Infrastructure as Code).

### 7.1 Nuvarande `render.yaml`

```yaml
services:
  - type: web
    name: scb-mcp
    runtime: docker
    dockerfilePath: ./mcp-tools/combined-mcp/Dockerfile
    dockerContext: ./mcp-tools
    region: frankfurt
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: TRAFIKVERKET_API_KEY
        sync: false
      - key: RIKSBANK_API_KEY
        sync: false
```

### 7.2 Lägg till env-vars

Om din MCP-server behöver en API-nyckel, lägg till den i `envVars`-listan:

```yaml
      - key: {NAME}_API_KEY
        sync: false
```

`sync: false` innebär att värdet sätts manuellt i Render Dashboard (inte versionshanterat).

### 7.3 Viktiga detaljer

- **Inget nytt service-block behövs** — alla MCP-servrar körs i samma container via combined-mcp
- **`dockerfilePath`** pekar redan på `./mcp-tools/combined-mcp/Dockerfile` — din nya MCP byggs automatiskt om du lagt till den i combined-mcp Dockerfile (steg 4)
- **`dockerContext`** är `./mcp-tools` — alla `COPY`-kommandon i Dockerfile utgår från denna mapp
- **`healthCheckPath: /health`** — Render pingar root-serverns health. Nginx vidarebefordrar till SCB (default upstream). Övriga MCP-servrar nås via `/{name}/health`
- **Port 10000** — Render kräver att appen lyssnar på `$PORT` (10000). Nginx i combined-mcp hanterar detta

### 7.4 Efter push till Render

1. Pusha dina ändringar till den branch som Render bevakar
2. Om ny API-nyckel behövs: gå till **Render Dashboard → Environment → Add Environment Variable**
3. Render bygger automatiskt och deployer
4. Verifiera: `curl https://scb-mcp-tjuk.onrender.com/{name}/health`

---

## Steg 8 — Utvecklingsserver (`scripts/serve.sh`)

Serve.sh har **6 platser** som måste uppdateras:

### 8.1 Portlista (rad ~48)

Lägg till `{LOCAL_PORT}` i for-loopen:
```bash
for port in 2024 8001 3000 2026 3100 3101 3102 3103 3104 {LOCAL_PORT}; do
```

Porttilldelning (lokal utveckling):
| Port | Server |
|------|--------|
| 3100 | SCB |
| 3101 | Skolverket |
| 3102 | Trafikverket |
| 3103 | Riksbank |
| 3104 | SMHI |
| **3105** | **Nästa lediga** |

### 8.2 Docker container cleanup (rad ~51-61)

```bash
docker stop deer-flow-{name}-mcp 2>/dev/null || true
docker rm deer-flow-{name}-mcp 2>/dev/null || true
```

### 8.3 Banner (rad ~81-104)

```bash
if [ -z "${{NAME}_MCP_URL:-}" ]; then
    echo "  → {Name} MCP: {Beskrivning} (local)"
else
    echo "  → {Name} MCP: {Beskrivning} (remote)"
fi
```

### 8.4 Cleanup trap (rad ~136-198)

```bash
# Kill {Name} MCP Node.js process if running
if [ -n "${{NAME}_MCP_PID:-}" ] && kill -0 "${NAME}_MCP_PID" 2>/dev/null; then
    kill "${NAME}_MCP_PID" 2>/dev/null || true
fi
```

Lägg till i cleanup containers:
```bash
docker stop deer-flow-{name}-mcp 2>/dev/null || true
docker rm deer-flow-{name}-mcp 2>/dev/null || true
```

### 8.5 Startup-logik (rad ~407-466)

Kopiera hela blocket från en befintlig MCP-server (t.ex. Riksbank) och ersätt:
- `RIKSBANK` → `{NAME}` (versaler)
- `riksbank` → `{name}` (gemener)
- `Riksbank` → `{Name}` (rubrikform)
- `3103` → `{LOCAL_PORT}` (ny port)
- `Economy` → `{Beskrivning}`

Blocket följer detta mönster:
```bash
# {Name} MCP Server — {beskrivning}
{NAME}_MCP_PORT="${{{NAME}_MCP_PORT:-{LOCAL_PORT}}}"
{NAME}_MCP_DIR="$REPO_ROOT/mcp-tools/{name}-mcp"
if [ -n "${{NAME}_MCP_URL:-}" ]; then
    echo "✓ {Name} MCP using remote instance: ${{NAME}_MCP_URL}"
elif [ -z "${{NAME}_MCP_URL:-}" ]; then
    echo "Starting {Name} MCP server..."
    {NAME}_MCP_STARTED=false

    # Strategy 1: Docker container
    # (docker build, docker run, wait-for-port)

    # Strategy 2: Native Node.js fallback
    # (npm ci, npm run build, node dist/http-server.js)
fi
export {NAME}_MCP_URL="${{{NAME}_MCP_URL:-}}"
```

### 8.6 Ready-banner (rad ~522-586)

Lägg till URL:
```bash
if [ -n "${{NAME}_MCP_URL:-}" ]; then
    echo "  {EMOJI} {Name}:       ${{NAME}_MCP_URL}"
else
    echo "  {EMOJI} {Name}:       (ej konfigurerad)"
fi
```

Lägg till loggar:
```bash
if [ -n "${{NAME}_MCP_PID:-}" ]; then
    echo "     - {Name}:       logs/{name}-mcp.log"
elif [ -z "${{NAME}_MCP_URL:-}" ] || echo "${{NAME}_MCP_URL}" | grep -q "localhost"; then
    echo "     - {Name}:       docker logs deer-flow-{name}-mcp"
fi
```

---

## Steg 9 — Miljövariabler

### 9.1 `.env.example`

```bash
# {Name} MCP Server URL ({beskrivning})
# Docker: http://{name}-mcp:3000/mcp (automatic)
# Combined Render instance (same host as SCB, /{name}/ prefix):
# {NAME}_MCP_URL=https://scb-mcp.onrender.com/{name}/mcp
```

Om API-nyckel behövs:
```bash
# {NAME}_API_KEY=your-{name}-api-key
```

---

## Steg 10 — Dokumentation

### 10.1 `CLAUDE.md`

Uppdatera projektöversikten (Architecture-sektionen) med:
```
- **{Name} MCP v1.0** (port 3000, Docker sidecar): {Beskrivning}. N verktyg.
```

Uppdatera projektstrukturens `mcp-tools/`-sektion:
```
│   ├── {name}-mcp/           # {Name} MCP v1.0 — N verktyg för {data}
```

---

## Steg 11 — Testa

### 11.1 Lokal test

```bash
cd mcp-tools/{name}-mcp
npm test                         # Enhetstester
npm start                        # Starta HTTP-server
curl localhost:3000/health       # Hälsokontroll
curl -X POST localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### 11.2 Test av varje verktyg

```bash
curl -s localhost:3000/mcp -X POST \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0","id":2,"method":"tools/call",
    "params":{"name":"{tool_id}","arguments":{...}}
  }'
```

### 11.3 Test på Render (combined)

```bash
# Health
curl https://scb-mcp.onrender.com/{name}/health

# Tools list
curl -X POST https://scb-mcp.onrender.com/{name}/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Tool call
curl -X POST https://scb-mcp.onrender.com/{name}/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{...}}'
```

### 11.4 Full integration

```bash
make dev   # Verifiera att {Name} syns i bannern
```

---

## Checklista

- [ ] `mcp-tools/{name}-mcp/` — Källkod, tester, package.json, tsconfig.json, .gitignore
- [ ] `mcp-tools/{name}-mcp/package-lock.json` — Committad (krävs av Docker `npm ci`)
- [ ] `docker/{name}-mcp/Dockerfile` — Standalone Docker-image
- [ ] `skills/public/{skill-name}/SKILL.md` — Skill-definition med alla verktygs-instruktioner
- [ ] **INGEN ändring** i `backend/src/agents/lead_agent/prompt.py` — all promptning sker i SKILL.md
- [ ] `mcp-tools/combined-mcp/Dockerfile` — Build-stage + production install
- [ ] `mcp-tools/combined-mcp/nginx.conf` — Upstream + location
- [ ] `mcp-tools/combined-mcp/start.sh` — Start, healthcheck, PID
- [ ] `extensions_config.example.json` — MCP-serverregistrering
- [ ] `docker/docker-compose.yaml` — Service + env-vars i gateway/langgraph
- [ ] `scripts/serve.sh` — Banner, startup, cleanup, ready-banner, loggar (6 platser)
- [ ] `render.yaml` — Env-vars för Render-deploy (API-nycklar)
- [ ] `.env.example` — URL + ev. API-nyckel
- [ ] `CLAUDE.md` — Arkitekturbeskrivning
- [ ] Alla tester passerar (`npm test`)
- [ ] Health-endpoint svarar (`/health`)
- [ ] Tools list returnerar korrekt antal (`tools/list`)
- [ ] Varje verktyg fungerar mot live API (`tools/call`)
- [ ] Render-deploy bygger utan fel

---

## Vanliga fallgropar

1. **`npm ci` misslyckas i Docker** — Du glömde committa `package-lock.json` eller inkludera den i COPY
2. **Verktyg syns inte i agenten** — Du glömde `extensions_config.example.json` eller `serve.sh` startup
3. **404 på Render** — Du glömde nginx upstream/location i `combined-mcp/nginx.conf`
4. **"params is not iterable"** — API-responsen har annat format än förväntat. Testa mot live API
5. **Branner visar "(ej konfigurerad)"** — `{NAME}_MCP_URL` exporteras inte. Kolla `serve.sh` startup
6. **Skill triggas inte** — `description`-fältet i SKILL.md saknar rätt nyckelord
7. **Kontextfönstret sprängs** — Du la MCP-instruktioner i `prompt.py` istället för SKILL.md. Lead agent-prompten ska BARA ha skill-namn och description — alla detaljer, arbetsflöden, parameterbeskrivningar och exempel ska ligga i SKILL.md som laddas on-demand
