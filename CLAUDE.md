# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Berit** is a customized fork of DeerFlow 2.0 — an open-source AI super agent harness built on LangGraph. It orchestrates sub-agents, persistent memory, sandboxed execution, and extensible tools/skills to handle complex tasks. This fork is preconfigured to work with **LM Studio running Nemotron 3 Nano** (local LLM), enabling the system to run without cloud-based LLM APIs.

**Architecture**:
- **Nginx** (port 2026): Unified entry point and reverse proxy
- **LangGraph Server** (port 2024): Agent runtime and workflow execution
- **Gateway API** (port 8001): REST API for models, MCP, skills, memory, artifacts, uploads
- **Frontend** (port 3000): Next.js web interface
- **LM Studio** (port 8000, external): Local LLM inference via OpenAI-compatible API
- **Lightpanda** (port 9222): High-performance headless browser for web fetching with JS rendering
- **Lightpanda MCP v1.0** (port 3000, Docker sidecar): Webbsurfning, sökning och datautvinning via Lightpanda headless browser. 12 verktyg.
- **SCB MCP v3.0** (port 3000, Docker sidecar): Swedish official statistics via PxWebAPI 2.0 — 7-tool pipeline with caching, auto-complete, and markdown output
- **Skolverket MCP v2.7.0** (port 3000, Docker sidecar): Swedish education data — läroplaner, skolenheter, vuxenutbildning, gymnasieprogram, statistik, enkäter, SALSA. 87 verktyg.
- **Trafikverket MCP v1.0** (port 3000, Docker sidecar): Swedish traffic data — störningar, tåg, väg, väder, kameror, prognoser. 22 verktyg.
- **Riksbank MCP v1.0** (port 3000, Docker sidecar): Swedish economic data — räntor, valutakurser, SWESTR, makroprognoser. 8 verktyg.
- **SMHI MCP v1.0** (port 3000, Docker sidecar): Swedish weather, hydrology, oceanography, fire risk — väderprognoser, analyser, observationer, vattenstånd, havsdata, brandrisk. 10 verktyg.
- **Elpris MCP v1.0** (port 3000, Docker sidecar): Swedish electricity prices — spotpriser, historik, zonjämförelse via elprisetjustnu.se. 4 verktyg.
- **Bolagsverket MCP v1.0** (port 3000, Docker sidecar): Swedish company data — organisationsuppslag, grunddata, styrelse, registrering, dokument via Värdefulla datamängder API. 6 verktyg.
- **Google Maps MCP v1.0** (port 3000, Docker sidecar): Geocoding, platssökning, vägbeskrivningar, avstånd, elevation, tidszon via Google Maps API. 13 verktyg.
- **Avanza MCP v1.0** (port 3000, Docker sidecar): Svenska aktier, fonder, ETF:er, certifikat, warranter, terminer — kurser, analyser, utdelning, orderbok via Avanza publikt API. 34 verktyg.
- **Blocket/Tradera MCP v1.0** (port 3000, Docker sidecar): Svenska marknadsplatser — sök begagnat, prisjämförelse, bilar, båtar, MC, auktioner. 10 verktyg.
- **Riksdag MCP v1.0** (port 3000, Docker sidecar): Sveriges riksdag och regering — dokument, ledamöter, voteringar, anföranden, regeringsdokument. 15 verktyg.
- **NVV MCP v1.0** (port 3000, Docker sidecar): Naturvårdsverket — skyddade naturområden, nationalparker, naturreservat, Natura 2000, Ramsar, arter. 8 verktyg.
- **Kolada MCP v1.0** (port 3000, Docker sidecar): Kommunal och regional statistik — nyckeltal, kommunjämförelse, skolresultat, ekonomi, omsorg. 10 verktyg.
- **KB MCP v1.0** (port 3000, Docker sidecar): Kungliga Biblioteket — Libris (böcker, tidskrifter), K-samsök (kulturarv), Swepub (forskning). 10 verktyg.
- **Upphandlingsdata MCP v1.0** (port 3000, Docker sidecar): Offentlig upphandling — LOV, hållbarhetskriterier, EU TED, frågeportal. 7 verktyg.
- **OECD MCP v1.0** (port 3000, Docker sidecar): Internationell statistik via SDMX — ekonomi, hälsa, utbildning, handel, miljö, 30+ dataset. 9 verktyg.
- **Trafikanalys MCP v1.0** (port 3000, Docker sidecar): Svensk transportstatistik — fordon, registreringar, fordonskilometer, järnväg, flyg. 8 verktyg.
- **Visit Sweden MCP v1.0** (port 3000, Docker sidecar): Svensk turism — sevärdheter, boenden, restauranger, evenemang via Visit Swedens öppna dataplattform. 4 verktyg.
- **Krisinformation MCP v1.0** (port 3000, Docker sidecar): Krisinformation — krisnyheter, VMA-varningar från Krisinformation.se (MSB). 2 verktyg.
- **Polisen MCP v1.0** (port 3000, Docker sidecar): Polishändelser — brott, olyckor, störningar i realtid från Polisen.se. 1 verktyg.

## Project Structure

```
Berit/
├── Makefile                    # Root commands (check, install, dev, stop, docker-*, up, down)
├── config.yaml                 # Main application config (preconfigured for LM Studio)
├── extensions_config.json      # MCP servers and skills configuration
├── .env                        # API keys & environment variables
├── backend/                    # Python/LangGraph backend (see backend/CLAUDE.md)
│   ├── src/
│   │   ├── agents/             # LangGraph agent system (lead_agent, middlewares, memory)
│   │   ├── gateway/            # FastAPI Gateway API (routers for models, MCP, skills, etc.)
│   │   ├── sandbox/            # Sandbox execution (local, Docker providers)
│   │   ├── subagents/          # Subagent delegation system
│   │   ├── tools/              # Built-in tools (present_files, ask_clarification, view_image)
│   │   ├── mcp/                # Model Context Protocol integration
│   │   ├── models/             # LLM model factory
│   │   ├── skills/             # Skills discovery and loading
│   │   ├── config/             # Configuration system
│   │   ├── community/          # Community tools (Lightpanda, Tavily, Jina, Firecrawl, etc.)
│   │   ├── channels/           # IM integrations (Slack, Telegram, Feishu)
│   │   └── client.py           # Embedded Python client (DeerFlowClient)
│   └── tests/                  # Backend test suite
├── frontend/                   # Next.js/React/TypeScript frontend (see frontend/CLAUDE.md)
│   └── src/
│       ├── app/                # Next.js App Router
│       ├── components/         # React components (UI, workspace, landing)
│       └── core/               # Business logic (threads, API, artifacts, i18n, settings)
├── skills/                     # Agent skills library
│   ├── public/                 # Public skills (20 built-in)
│   └── custom/                 # Custom skills (gitignored)
├── mcp-tools/                  # MCP tool servers (local source)
│   ├── scb-mcp/               # SCB MCP v3.0 (forked & enhanced from isakskogstad/SCB-MCP)
│   ├── skolverket-mcp/        # Skolverket MCP v2.7.0 (forked from isakskogstad/Skolverket-MCP)
│   ├── trafikverket-mcp/      # Trafikverket MCP v1.0 — 22 verktyg för realtids trafikdata
│   ├── riksbank-mcp/         # Riksbank MCP v1.0 — 8 verktyg för ekonomisk data
│   ├── smhi-mcp/             # SMHI MCP v1.0 — 10 verktyg för väder, hydrologi, oceanografi, brandrisk
│   ├── lightpanda-mcp/       # Lightpanda MCP v1.0 — 12 verktyg för webbsurfning, sökning, datautvinning
│   ├── elpris-mcp/           # Elpris MCP v1.0 — 4 verktyg för svenska elpriser (spotpriser)
│   ├── bolagsverket-mcp/     # Bolagsverket MCP v1.0 — 6 verktyg för svensk företagsinformation
│   ├── google-maps-mcp/      # Google Maps MCP v1.0 — 13 verktyg för geocoding, platser, navigation
│   ├── avanza-mcp/           # Avanza MCP v1.0 — 34 verktyg för aktier, fonder, ETF:er (Python/FastMCP)
│   ├── blocket-tradera-mcp/  # Blocket/Tradera MCP v1.0 — 10 verktyg för begagnatmarknaden
│   ├── riksdag-mcp/          # Riksdag MCP v1.0 — 15 verktyg för riksdag och regering
│   ├── nvv-mcp/              # NVV MCP v1.0 — 8 verktyg för skyddade naturområden
│   ├── kolada-mcp/           # Kolada MCP v1.0 — 10 verktyg för kommunal statistik
│   ├── kb-mcp/              # KB MCP v1.0 — 10 verktyg för Libris, K-samsök, Swepub
│   ├── upphandlingsdata-mcp/ # Upphandlingsdata MCP v1.0 — 7 verktyg för offentlig upphandling
│   ├── oecd-mcp/            # OECD MCP v1.0 — 9 verktyg för internationell statistik
│   ├── trafikanalys-mcp/    # Trafikanalys MCP v1.0 — 8 verktyg för transportstatistik
│   ├── visitsweden-mcp/     # Visit Sweden MCP v1.0 — 4 verktyg för turism
│   ├── krisinformation-mcp/ # Krisinformation MCP v1.0 — 2 verktyg för krisnyheter, VMA
│   └── polisen-mcp/         # Polisen MCP v1.0 — 1 verktyg för polishändelser
├── docker/                     # Docker Compose & Nginx configs
│   ├── scb-mcp/               # SCB MCP server Dockerfile (builds from mcp-tools/scb-mcp/)
│   ├── trafikverket-mcp/      # Trafikverket MCP server Dockerfile
│   ├── riksbank-mcp/         # Riksbank MCP server Dockerfile
│   ├── smhi-mcp/             # SMHI MCP server Dockerfile
│   ├── lightpanda-mcp/       # Lightpanda MCP server Dockerfile
│   ├── elpris-mcp/           # Elpris MCP server Dockerfile
│   ├── bolagsverket-mcp/     # Bolagsverket MCP server Dockerfile
│   ├── google-maps-mcp/      # Google Maps MCP server Dockerfile
│   ├── avanza-mcp/           # Avanza MCP server Dockerfile
│   ├── blocket-tradera-mcp/  # Blocket/Tradera MCP server Dockerfile
│   ├── riksdag-mcp/         # Riksdag MCP server Dockerfile
│   ├── nvv-mcp/             # NVV MCP server Dockerfile
│   ├── kolada-mcp/          # Kolada MCP server Dockerfile
│   ├── kb-mcp/              # KB MCP server Dockerfile
│   ├── upphandlingsdata-mcp/ # Upphandlingsdata MCP server Dockerfile
│   ├── oecd-mcp/            # OECD MCP server Dockerfile
│   ├── trafikanalys-mcp/    # Trafikanalys MCP server Dockerfile
│   ├── visitsweden-mcp/     # Visit Sweden MCP server Dockerfile
│   ├── krisinformation-mcp/ # Krisinformation MCP server Dockerfile
│   └── polisen-mcp/         # Polisen MCP server Dockerfile
└── scripts/                    # Automation scripts (check, serve, deploy, etc.)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12+, LangGraph, LangChain, FastAPI |
| Frontend | Next.js 16, React 19, TypeScript 5.8, Tailwind CSS 4 |
| Package Managers | uv (Python), pnpm 10.26.2 (Node.js) |
| Linting/Formatting | Ruff (Python), ESLint + Prettier (TypeScript) |
| Browser Engine | Lightpanda (headless, CDP, 12 MCP tools via lightpanda-mcp) |
| Infrastructure | Nginx, Docker & Docker Compose |
| Database | SQLite (checkpointing) |

## Commands

### Full Application (from project root)

```bash
make check      # Check system requirements (Node, Python, uv, pnpm, Nginx)
make install    # Install all dependencies (frontend + backend)
make dev        # Start all services (Lightpanda + LangGraph + Gateway + Frontend + Nginx)
make stop       # Stop all services (including Lightpanda container)
make config     # Generate local configuration files from examples
```

### Backend Only (from `backend/`)

```bash
make install    # Install backend dependencies
make dev        # Run LangGraph server (port 2024)
make gateway    # Run Gateway API (port 8001)
make test       # Run all backend tests
make lint       # Lint with ruff
make format     # Format code with ruff
```

### Frontend Only (from `frontend/`)

```bash
pnpm dev        # Dev server with Turbopack (port 3000)
pnpm build      # Production build
pnpm check      # Lint + type check (run before committing)
pnpm lint       # ESLint only
pnpm typecheck  # TypeScript type check
```

### Docker

```bash
make docker-init    # Initialize Docker environment (first time)
make docker-start   # Start services with Docker Compose
make up             # Build and start production Docker services
make down           # Stop and remove containers
```

## Development Guidelines

### Documentation Update Policy

**CRITICAL: Always update README.md and CLAUDE.md after every code change.**

- Update `README.md` for user-facing changes (features, setup, usage)
- Update `CLAUDE.md` for development changes (architecture, commands, workflows)
- Subdirectory CLAUDE.md files exist in `backend/` and `frontend/` — update those for component-specific changes

### Test-Driven Development — MANDATORY

Every new feature or bug fix MUST include unit tests.

```bash
# Run backend tests
cd backend && make test

# Run a specific test
cd backend && PYTHONPATH=. uv run pytest tests/test_<feature>.py -v

# Frontend type safety
cd frontend && pnpm check
```

### Code Style

**Backend (Python)**:
- Ruff linter/formatter, line length 240, double quotes, 4-space indent
- Python 3.12+ with type hints
- Config: `backend/ruff.toml`

**Frontend (TypeScript)**:
- ESLint + Prettier with Tailwind CSS plugin
- Import order enforced: builtin → external → internal → parent → sibling
- Inline type imports: `import { type Foo }`
- Path alias: `@/*` → `src/*`
- Config: `frontend/eslint.config.js`, `frontend/prettier.config.js`

## Configuration

### Main Config (`config.yaml`)

Located in project root. Controls models, tools, sandbox, memory, skills, channels, and more. Values starting with `$` are resolved as environment variables.

### Extensions Config (`extensions_config.json`)

MCP servers and skills configuration in project root. Can be updated at runtime via Gateway API.

### Environment Variables (`.env`)

API keys and secrets. Preconfigured with LM Studio dummy keys for local development.

## Nginx Routing

All traffic enters through port 2026:
- `/api/langgraph/*` → LangGraph Server (2024)
- `/api/*` (other) → Gateway API (8001)
- `/` (non-API) → Frontend (3000)

## Key Subsystem Documentation

- Backend architecture and internals: [`backend/CLAUDE.md`](backend/CLAUDE.md)
- Frontend architecture and patterns: [`frontend/CLAUDE.md`](frontend/CLAUDE.md)
- Configuration reference: [`backend/docs/CONFIGURATION.md`](backend/docs/CONFIGURATION.md)
- Architecture deep-dive: [`backend/docs/ARCHITECTURE.md`](backend/docs/ARCHITECTURE.md)
- API reference: [`backend/docs/API.md`](backend/docs/API.md)
- Setup guide: [`SETUP.md`](SETUP.md)
