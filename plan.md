# Trafikverket MCP Server — Implementation Plan

## Analysis: Existing MCP Pattern

Both SCB and Skolverket MCP servers follow an identical architecture:

| Component | Pattern |
|-----------|---------|
| **Language** | TypeScript (ES2022, ESNext modules, strict mode) |
| **Transport** | Express HTTP server with JSON-RPC 2.0 on `/mcp` |
| **MCP SDK** | `@modelcontextprotocol/sdk` ^1.0.0 |
| **Docker** | Multi-stage build (node:22-alpine), port 3000 |
| **Docker Compose** | Sidecar service in `docker/docker-compose.yaml` |
| **Config** | HTTP entry in `extensions_config.example.json` with `$TRAFIKVERKET_MCP_URL` |
| **Health** | `GET /health` returning `{ status: 'ok', timestamp }` |
| **Root** | `GET /` renders README.md as styled HTML |
| **Capabilities** | tools, prompts, resources |

## Trafikverket API Overview

- **Endpoint:** `https://api.trafikinfo.trafikverket.se/v2/data.json`
- **Auth:** API key via `X-Api-Key` header (env: `TRAFIKVERKET_API_KEY`)
- **Request format:** XML body with `<LOGIN authenticationkey="...">` + `<QUERY objecttype="..." schemaversion="...">`
- **Response:** JSON

### ObjectTypes & Schema Versions (from OnSeek reference + Trafikverket docs)

| ObjectType | SchemaVersion | Namespace | Category | Tools |
|------------|---------------|-----------|----------|-------|
| Situation | 1.5 | road.trafficinfo.new | trafikinfo | störningar, olyckor, köer, vägarbeten |
| TrainAnnouncement | 1.9 | — | tåg | förseningar, tidtabell, stationer, inställda |
| RoadCondition | 1.2 | — | väg | status, underhåll, hastighet, avstängningar |
| WeatherMeasurepoint | 2.1 | — | väder | stationer, halka, vind, temperatur |
| TrafficFlow | 1.4 | — | kameror/trafik | flöde |
| TrainStation | 1.4 | — | tåg | stationer (metadata) |
| TrainMessage | 1.7 | — | tåg | meddelanden |

## 22 Tools (matching OnSeek spec)

### Trafikinfo (4)
1. `trafikverket_trafikinfo_storningar` — Situation, filter: Deviation.LocationDescriptor
2. `trafikverket_trafikinfo_olyckor` — Situation, filter: Deviation.LocationDescriptor
3. `trafikverket_trafikinfo_koer` — Situation, filter: Deviation.LocationDescriptor
4. `trafikverket_trafikinfo_vagarbeten` — Situation, filter: Deviation.LocationDescriptor

### Tåg (4)
5. `trafikverket_tag_forseningar` — TrainAnnouncement, filter: LocationSignature
6. `trafikverket_tag_tidtabell` — TrainAnnouncement, filter: LocationSignature
7. `trafikverket_tag_stationer` — TrainStation, filter: AdvertisedLocationName
8. `trafikverket_tag_installda` — TrainAnnouncement, filter: LocationSignature

### Väg (4)
9. `trafikverket_vag_status` — RoadCondition, filter: CountyNo
10. `trafikverket_vag_underhall` — RoadCondition, filter: CountyNo
11. `trafikverket_vag_hastighet` — RoadCondition, filter: CountyNo
12. `trafikverket_vag_avstangningar` — Situation, filter: Deviation.LocationDescriptor

### Väder (4)
13. `trafikverket_vader_stationer` — WeatherMeasurepoint, filter: Name
14. `trafikverket_vader_halka` — WeatherMeasurepoint, filter: Name
15. `trafikverket_vader_vind` — WeatherMeasurepoint, filter: Name
16. `trafikverket_vader_temperatur` — WeatherMeasurepoint, filter: Name

### Kameror (3)
17. `trafikverket_kameror_lista` — TrafficSafetyCamera or Camera, filter: CountyNo
18. `trafikverket_kameror_snapshot` — Camera, filter: Id
19. `trafikverket_kameror_status` — Camera, filter: Active

### Prognos (3)
20. `trafikverket_prognos_trafik` — TrafficFlow, filter: CountyNo
21. `trafikverket_prognos_vag` — RoadCondition, filter: CountyNo
22. `trafikverket_prognos_tag` — TrainAnnouncement, filter: LocationSignature

## File Structure

```
mcp-tools/trafikverket-mcp/
├── src/
│   ├── index.ts              # MCP server class + tool definitions (stdio)
│   ├── http-server.ts         # Express HTTP server (Streamable HTTP MCP)
│   ├── api-client.ts          # Trafikverket API client (XML request builder, retry, caching)
│   ├── types.ts               # Zod schemas for API responses
│   ├── tools.ts               # Tool definitions array (22 tools with metadata)
│   ├── formatter.ts           # JSON response → Markdown table formatting
│   ├── instructions.ts        # LLM instructions & workflow guidance
│   ├── prompts.ts             # MCP prompts (analyze traffic, find delays, etc.)
│   └── resources.ts           # Static resources (documentation)
├── tests/
│   ├── api-client.test.ts     # API client unit tests
│   ├── formatter.test.ts      # Formatter unit tests
│   └── tools.test.ts          # Tool definition tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md

docker/trafikverket-mcp/
└── Dockerfile                 # Multi-stage build, same pattern as SCB/Skolverket
```

## Implementation Steps

### Step 1: Project scaffolding
- Create `mcp-tools/trafikverket-mcp/` directory
- Create `package.json` (same deps as SCB: MCP SDK, express, cors, marked, zod)
- Create `tsconfig.json` (ES2022, ESNext, strict)
- Create `vitest.config.ts`

### Step 2: Core API client (`src/api-client.ts`)
- XML request builder with `<LOGIN>` + `<QUERY>` structure
- Retry with exponential backoff on 429
- In-memory cache with 5-minute TTL (no Redis dependency — keep it simple like SCB)
- Schema version fallback support
- Rate limit tracking

### Step 3: Type definitions (`src/types.ts`)
- Zod schemas for Trafikverket API responses
- TrainAnnouncement, Situation, RoadCondition, WeatherMeasurepoint response types

### Step 4: Tool definitions (`src/tools.ts`)
- 22 tool definitions with:
  - Tool ID, name, description (Swedish)
  - ObjectType, schemaVersion, namespace, filterField
  - Keywords and example queries
  - Input schemas (Zod → JSON Schema for MCP)

### Step 5: Response formatter (`src/formatter.ts`)
- Convert Trafikverket JSON responses to structured output
- Markdown table generation for results
- Swedish number/date formatting

### Step 6: MCP server (`src/index.ts`)
- MCP Server class with `getTools()` and `callTool()` methods
- Tool dispatch: map tool name → objecttype + filters → API call → format response
- Call tracking (max 3 calls per tool per 5-min window, like SCB)
- Error handling with Swedish suggestions

### Step 7: HTTP server (`src/http-server.ts`)
- Express HTTP server (copy SCB pattern exactly)
- JSON-RPC 2.0 on POST /mcp
- GET /mcp (server info), GET /health, GET / (README)
- CORS support

### Step 8: Prompts & instructions
- `src/prompts.ts`: 3 prompts (analyze traffic, find delays, check road conditions)
- `src/instructions.ts`: LLM workflow guidance
- `src/resources.ts`: Static documentation resources

### Step 9: Tests
- API client tests (XML building, caching, retry logic)
- Formatter tests (markdown table generation)
- Tool definition tests (all 22 tools valid)

### Step 10: Docker setup
- `docker/trafikverket-mcp/Dockerfile` (multi-stage, node:22-alpine)
- Add `trafikverket-mcp` service to `docker/docker-compose.yaml`
- Add env vars: `TRAFIKVERKET_MCP_URL=http://trafikverket-mcp:3000/mcp`

### Step 11: Configuration integration
- Add `trafikverket` entry to `extensions_config.example.json`
- Add `TRAFIKVERKET_API_KEY` and `TRAFIKVERKET_MCP_URL` to `.env.example`
- Update `docker-compose.yaml` gateway/langgraph env vars

### Step 12: Documentation
- `mcp-tools/trafikverket-mcp/README.md`
- Update root `CLAUDE.md` and `README.md` with Trafikverket MCP references

## Key Design Decisions

1. **TypeScript MCP server** (not Python) — matches SCB/Skolverket pattern exactly
2. **In-memory cache** — no Redis dependency, keeps it self-contained like SCB
3. **22 tools** — matching the OnSeek spec exactly
4. **API key via env var** — `TRAFIKVERKET_API_KEY` passed to Docker container
5. **Same Docker Compose pattern** — sidecar on port 3000, health check, deer-flow network
6. **Swedish-first** — all descriptions, errors, and instructions in Swedish
