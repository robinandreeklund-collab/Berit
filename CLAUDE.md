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
- **SCB MCP v3.0** (port 3000, Docker sidecar): Swedish official statistics via PxWebAPI 2.0 — 7-tool pipeline with caching, auto-complete, and markdown output
- **Skolverket MCP v2.7.0** (port 3000, Docker sidecar): Swedish education data — läroplaner, skolenheter, vuxenutbildning, gymnasieprogram, statistik, enkäter, SALSA. 87 verktyg.
- **Trafikverket MCP v1.0** (port 3000, Docker sidecar): Swedish traffic data — störningar, tåg, väg, väder, kameror, prognoser. 22 verktyg.
- **Riksbank MCP v1.0** (port 3000, Docker sidecar): Swedish economic data — räntor, valutakurser, SWESTR, makroprognoser. 8 verktyg.
- **SMHI MCP v1.0** (port 3000, Docker sidecar): Swedish weather, hydrology, oceanography, fire risk — väderprognoser, analyser, observationer, vattenstånd, havsdata, brandrisk. 10 verktyg.

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
│   ├── public/                 # Public skills (19 built-in)
│   └── custom/                 # Custom skills (gitignored)
├── mcp-tools/                  # MCP tool servers (local source)
│   ├── scb-mcp/               # SCB MCP v3.0 (forked & enhanced from isakskogstad/SCB-MCP)
│   ├── skolverket-mcp/        # Skolverket MCP v2.7.0 (forked from isakskogstad/Skolverket-MCP)
│   ├── trafikverket-mcp/      # Trafikverket MCP v1.0 — 22 verktyg för realtids trafikdata
│   ├── riksbank-mcp/         # Riksbank MCP v1.0 — 8 verktyg för ekonomisk data
│   └── smhi-mcp/             # SMHI MCP v1.0 — 10 verktyg för väder, hydrologi, oceanografi, brandrisk
├── docker/                     # Docker Compose & Nginx configs
│   ├── scb-mcp/               # SCB MCP server Dockerfile (builds from mcp-tools/scb-mcp/)
│   ├── trafikverket-mcp/      # Trafikverket MCP server Dockerfile
│   ├── riksbank-mcp/         # Riksbank MCP server Dockerfile
│   └── smhi-mcp/             # SMHI MCP server Dockerfile
└── scripts/                    # Automation scripts (check, serve, deploy, etc.)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12+, LangGraph, LangChain, FastAPI |
| Frontend | Next.js 16, React 19, TypeScript 5.8, Tailwind CSS 4 |
| Package Managers | uv (Python), pnpm 10.26.2 (Node.js) |
| Linting/Formatting | Ruff (Python), ESLint + Prettier (TypeScript) |
| Browser Engine | Lightpanda (headless, CDP, 14 MCP tools via gomcp) |
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
