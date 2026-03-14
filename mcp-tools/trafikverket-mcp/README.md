# Trafikverket MCP Server v1.0

MCP-server (Model Context Protocol) för realtids trafikdata från **Trafikverkets Open API v2**.

## Verktyg (22 st)

| Kategori | Verktyg | Beskrivning |
|----------|---------|-------------|
| **Trafikinfo** (4) | störningar, olyckor, köer, vägarbeten | Trafikstörningar och incidenter |
| **Tåg** (4) | förseningar, tidtabell, stationer, inställda | Tågtrafik i realtid |
| **Väg** (4) | status, underhåll, hastighet, avstängningar | Väglag och vägarbeten |
| **Väder** (4) | stationer, halka, vind, temperatur | Vägväder från mätstationer |
| **Kameror** (3) | lista, snapshot, status | Trafikkameror |
| **Prognos** (3) | trafik, väg, tåg | Prognoser och trafikflöde |

## Snabbstart

### Förutsättningar

- Node.js 18+
- Trafikverket API-nyckel (gratis via [Trafikverkets öppna data](https://api.trafikinfo.trafikverket.se/))

### Installation

```bash
cd mcp-tools/trafikverket-mcp
npm install
```

### Konfiguration

Sätt miljövariabeln `TRAFIKVERKET_API_KEY`:

```bash
export TRAFIKVERKET_API_KEY="din-api-nyckel"
```

### Kör servern

```bash
# HTTP-server (port 3000)
npm start

# Stdio-transport (för CLI-klienter)
npm run start:stdio
```

### Docker

```bash
# Från projektets rot
docker compose -f docker/docker-compose.yaml up trafikverket-mcp
```

## API

### Endpoints

| Metod | Sökväg | Beskrivning |
|-------|--------|-------------|
| GET | `/health` | Hälsokontroll |
| GET | `/mcp` | Serverinfo + kapabiliteter |
| POST | `/mcp` | JSON-RPC 2.0 (MCP-protokoll) |
| GET | `/` | Dokumentation (HTML) |

### JSON-RPC 2.0 metoder

- `initialize` — Initiera MCP-session
- `tools/list` — Lista alla 22 verktyg
- `tools/call` — Anropa ett verktyg
- `prompts/list` — Lista tillgängliga promptar
- `prompts/get` — Hämta prompt
- `resources/list` — Lista resurser
- `resources/read` — Läs resurs

## Arkitektur

```
src/
├── index.ts           # MCP-server + verktygs-dispatch (stdio)
├── http-server.ts     # Express HTTP-server (JSON-RPC 2.0)
├── api-client.ts      # Trafikverket API-klient (XML, retry, cache)
├── types.ts           # Zod-scheman för API-svar
├── tools.ts           # 22 verktygsdefinitioner
├── formatter.ts       # JSON → Markdown-tabeller
├── instructions.ts    # LLM-instruktioner
├── prompts.ts         # MCP-promptar
└── resources.ts       # Statiska resurser
```

## Teknisk information

- **API:** `https://api.trafikinfo.trafikverket.se/v2/data.json`
- **Förfrågningsformat:** XML med `<LOGIN>` + `<QUERY>`
- **Cache:** In-memory, 5 minuters TTL
- **Retry:** Exponentiell backoff vid 429/nätverksfel (max 4 försök)
- **Schema-fallback:** Automatisk vid ResourceNotFound

## Licens

MIT
