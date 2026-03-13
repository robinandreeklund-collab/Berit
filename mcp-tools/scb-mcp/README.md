# SCB MCP Server v3.0

MCP-server (Model Context Protocol) för svensk officiell statistik via SCB:s PxWebAPI v2.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/robinandreeklund-collab/Berit)

## Verktyg (10 st)

### Discovery
| Verktyg | Beskrivning |
|---------|-------------|
| `scb_search` | Sök statistiktabeller med nyckelord |
| `scb_browse` | Bläddra i SCB:s ämnesträd |

### Inspection
| Verktyg | Beskrivning |
|---------|-------------|
| `scb_inspect` | Hämta metadata — variabler, kodlistor, tidsperioder |
| `scb_codelist` | Utforska en specifik variabels alla värden |

### Data
| Verktyg | Beskrivning |
|---------|-------------|
| `scb_preview` | Förhandsgranska data (max ~50 rader) |
| `scb_validate` | Validera och auto-komplettera en selektion |
| `scb_fetch` | Hämta fullständig data med markdown-tabell |

### Utility
| Verktyg | Beskrivning |
|---------|-------------|
| `scb_find_region_code` | Hitta regionkod med fuzzy-matching ("Goteborg" → 1480) |
| `scb_search_regions` | Sök bland 312 regioner (rike, län, kommuner) |
| `scb_check_usage` | Visa API-användning och rate limit |

## Funktioner

- **Metadata-cache** med 5 min TTL — minskar API-anrop
- **Auto-complete** — fyller i saknade variabler via eliminationsdefault
- **Batch-splitting** — delar upp stora frågor automatiskt
- **JSON-stat2 → Markdown** — tabeller direkt i LLM-svar
- **Fuzzy region-sökning** — 312 kommuner/län utan exakt stavning
- **Bakåtkompatibla alias** — gamla verktygsnamn fungerar fortfarande

## Snabbstart

### Deploy till Render (enklast)

Klicka knappen ovan, eller gå till:

```
https://render.com/deploy?repo=https://github.com/robinandreeklund-collab/Berit
```

Render konfigurerar allt automatiskt (Docker, health check, Frankfurt-region).

### Lokalt med Docker

```bash
cd mcp-tools/scb-mcp
docker build -t scb-mcp .
docker run -p 3100:10000 -e PORT=10000 scb-mcp
```

### Lokalt med Node.js

```bash
cd mcp-tools/scb-mcp
npm ci
npm run build
PORT=3100 npm start
```

## API

- **Health check:** `GET /health`
- **Server info:** `GET /mcp`
- **MCP endpoint:** `POST /mcp` (JSON-RPC 2.0)

### Exempel

```bash
# Lista verktyg
curl -X POST https://your-app.onrender.com/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Sök tabeller
curl -X POST https://your-app.onrender.com/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"scb_search","arguments":{"query":"befolkning kommun"}}}'

# Hitta regionkod
curl -X POST https://your-app.onrender.com/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"scb_find_region_code","arguments":{"query":"Göteborg"}}}'
```

## Använda med MCP-klienter

### Claude Desktop / Claude Code

Lägg till i din MCP-konfiguration:

```json
{
  "mcpServers": {
    "scb": {
      "url": "https://your-app.onrender.com/mcp"
    }
  }
}
```

### Rekommenderat arbetsflöde

```
scb_search → scb_find_region_code → scb_inspect → scb_validate → scb_fetch
```

1. **Sök** efter rätt tabell
2. **Hitta regionkoder** om du behöver kommundata
3. **Inspektera** tabellens variabler
4. **Validera** din selektion (auto-complete fyller i resten)
5. **Hämta** data med markdown-tabell

## Licens

MIT
