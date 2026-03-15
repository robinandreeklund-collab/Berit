#!/usr/bin/env bash
#
# start.sh - Start all DeerFlow development services
#
# Must be run from the repo root directory.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ── Argument parsing ─────────────────────────────────────────────────────────

DEV_MODE=true
for arg in "$@"; do
    case "$arg" in
        --dev)  DEV_MODE=true ;;
        --prod) DEV_MODE=false ;;
        *) echo "Unknown argument: $arg"; echo "Usage: $0 [--dev|--prod]"; exit 1 ;;
    esac
done

if $DEV_MODE; then
    FRONTEND_CMD="pnpm run dev"
else
    FRONTEND_CMD="env BETTER_AUTH_SECRET=$(python3 -c 'import secrets; print(secrets.token_hex(16))') pnpm run preview"
fi

# ── Stop existing services ────────────────────────────────────────────────────

echo "Stopping existing services if any..."
pkill -f "langgraph dev" 2>/dev/null || true
pkill -f "uvicorn src.gateway.app:app" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
pkill -f "dist/http-server.js" 2>/dev/null || true
nginx -c "$REPO_ROOT/docker/nginx/nginx.local.conf" -p "$REPO_ROOT" -s quit 2>/dev/null || true
sleep 2
# Force-kill anything that didn't respond to SIGTERM
pkill -9 -f "langgraph dev" 2>/dev/null || true
pkill -9 -f "langgraph_api" 2>/dev/null || true
pkill -9 -f "uvicorn src.gateway.app:app" 2>/dev/null || true
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 nginx 2>/dev/null || true
killall -9 nginx 2>/dev/null || true
# Kill any remaining processes on service ports (catches zombie python processes)
for port in 2024 8001 3000 2026 3100 3101 3102 3103 3104 3105 3106 3107 3108 3109 3110 3111 3112 3113 3114 3115 3116 3117 3118 3119 3120; do
    fuser -k "$port/tcp" 2>/dev/null || true
done
docker stop deer-flow-google-maps-mcp 2>/dev/null || true
docker rm deer-flow-google-maps-mcp 2>/dev/null || true
docker stop deer-flow-avanza-mcp 2>/dev/null || true
docker rm deer-flow-avanza-mcp 2>/dev/null || true
docker stop deer-flow-blocket-tradera-mcp 2>/dev/null || true
docker rm deer-flow-blocket-tradera-mcp 2>/dev/null || true
docker stop deer-flow-riksdag-mcp 2>/dev/null || true
docker rm deer-flow-riksdag-mcp 2>/dev/null || true
docker stop deer-flow-nvv-mcp 2>/dev/null || true
docker rm deer-flow-nvv-mcp 2>/dev/null || true
docker stop deer-flow-kolada-mcp 2>/dev/null || true
docker rm deer-flow-kolada-mcp 2>/dev/null || true
docker stop deer-flow-kb-mcp 2>/dev/null || true
docker rm deer-flow-kb-mcp 2>/dev/null || true
docker stop deer-flow-upphandlingsdata-mcp 2>/dev/null || true
docker rm deer-flow-upphandlingsdata-mcp 2>/dev/null || true
docker stop deer-flow-oecd-mcp 2>/dev/null || true
docker rm deer-flow-oecd-mcp 2>/dev/null || true
docker stop deer-flow-trafikanalys-mcp 2>/dev/null || true
docker rm deer-flow-trafikanalys-mcp 2>/dev/null || true
docker stop deer-flow-visitsweden-mcp 2>/dev/null || true
docker rm deer-flow-visitsweden-mcp 2>/dev/null || true
docker stop deer-flow-krisinformation-mcp 2>/dev/null || true
docker rm deer-flow-krisinformation-mcp 2>/dev/null || true
docker stop deer-flow-polisen-mcp 2>/dev/null || true
docker rm deer-flow-polisen-mcp 2>/dev/null || true
docker stop deer-flow-lightpanda 2>/dev/null || true
docker rm deer-flow-lightpanda 2>/dev/null || true
docker stop deer-flow-lightpanda-mcp 2>/dev/null || true
docker rm deer-flow-lightpanda-mcp 2>/dev/null || true
docker stop deer-flow-scb-mcp 2>/dev/null || true
docker rm deer-flow-scb-mcp 2>/dev/null || true
docker stop deer-flow-skolverket-mcp 2>/dev/null || true
docker rm deer-flow-skolverket-mcp 2>/dev/null || true
docker stop deer-flow-trafikverket-mcp 2>/dev/null || true
docker rm deer-flow-trafikverket-mcp 2>/dev/null || true
docker stop deer-flow-riksbank-mcp 2>/dev/null || true
docker rm deer-flow-riksbank-mcp 2>/dev/null || true
docker stop deer-flow-smhi-mcp 2>/dev/null || true
docker rm deer-flow-smhi-mcp 2>/dev/null || true
docker stop deer-flow-elpris-mcp 2>/dev/null || true
docker rm deer-flow-elpris-mcp 2>/dev/null || true
docker stop deer-flow-bolagsverket-mcp 2>/dev/null || true
docker rm deer-flow-bolagsverket-mcp 2>/dev/null || true
docker stop deer-flow-google-maps-mcp 2>/dev/null || true
docker rm deer-flow-google-maps-mcp 2>/dev/null || true
docker stop deer-flow-avanza-mcp 2>/dev/null || true
docker rm deer-flow-avanza-mcp 2>/dev/null || true
docker stop deer-flow-blocket-tradera-mcp 2>/dev/null || true
docker rm deer-flow-blocket-tradera-mcp 2>/dev/null || true
./scripts/cleanup-containers.sh deer-flow-sandbox 2>/dev/null || true
sleep 1

# ── Banner ────────────────────────────────────────────────────────────────────

echo ""
echo "=========================================="
echo "  Starting DeerFlow Development Server"
echo "=========================================="
echo ""
if $DEV_MODE; then
    echo "  Mode: DEV  (hot-reload enabled)"
    echo "  Tip:  run \`make start\` in production mode"
else
    echo "  Mode: PROD (hot-reload disabled)"
    echo "  Tip:  run \`make dev\` to start in development mode"
fi
echo ""
echo "Services starting up..."
echo "  → Lightpanda: Headless Browser"
if [ -z "${SCB_MCP_URL:-}" ]; then
    echo "  → SCB MCP: Swedish Statistics (local)"
else
    echo "  → SCB MCP: Swedish Statistics (remote)"
fi
if [ -z "${SKOLVERKET_MCP_URL:-}" ]; then
    echo "  → Skolverket MCP: Swedish Education (local)"
else
    echo "  → Skolverket MCP: Swedish Education (remote)"
fi
if [ -z "${TRAFIKVERKET_MCP_URL:-}" ]; then
    echo "  → Trafikverket MCP: Swedish Traffic (local)"
else
    echo "  → Trafikverket MCP: Swedish Traffic (remote)"
fi
if [ -z "${RIKSBANK_MCP_URL:-}" ]; then
    echo "  → Riksbank MCP: Swedish Economy (local)"
else
    echo "  → Riksbank MCP: Swedish Economy (remote)"
fi
if [ -z "${SMHI_MCP_URL:-}" ]; then
    echo "  → SMHI MCP: Swedish Weather (local)"
else
    echo "  → SMHI MCP: Swedish Weather (remote)"
fi
if [ -z "${LIGHTPANDA_MCP_URL:-}" ]; then
    echo "  → Lightpanda MCP: Web Browsing (local)"
else
    echo "  → Lightpanda MCP: Web Browsing (remote)"
fi
if [ -z "${ELPRIS_MCP_URL:-}" ]; then
    echo "  → Elpris MCP: Swedish Electricity Prices (local)"
else
    echo "  → Elpris MCP: Swedish Electricity Prices (remote)"
fi
if [ -z "${BOLAGSVERKET_MCP_URL:-}" ]; then
    echo "  → Bolagsverket MCP: Swedish Companies (local)"
else
    echo "  → Bolagsverket MCP: Swedish Companies (remote)"
fi
if [ -z "${GOOGLE_MAPS_MCP_URL:-}" ]; then
    echo "  → Google Maps MCP: Geocoding & Places (local)"
else
    echo "  → Google Maps MCP: Geocoding & Places (remote)"
fi
if [ -z "${AVANZA_MCP_URL:-}" ]; then
    echo "  → Avanza MCP: Swedish Stocks & Funds (local)"
else
    echo "  → Avanza MCP: Swedish Stocks & Funds (remote)"
fi
if [ -z "${BLOCKET_TRADERA_MCP_URL:-}" ]; then
    echo "  → Blocket/Tradera MCP: Swedish Marketplaces (local)"
else
    echo "  → Blocket/Tradera MCP: Swedish Marketplaces (remote)"
fi
if [ -z "${RIKSDAG_MCP_URL:-}" ]; then
    echo "  → Riksdag MCP: Swedish Parliament (local)"
else
    echo "  → Riksdag MCP: Swedish Parliament (remote)"
fi
if [ -z "${NVV_MCP_URL:-}" ]; then
    echo "  → NVV MCP: Protected Nature Areas (local)"
else
    echo "  → NVV MCP: Protected Nature Areas (remote)"
fi
if [ -z "${KOLADA_MCP_URL:-}" ]; then
    echo "  → Kolada MCP: Municipality Statistics (local)"
else
    echo "  → Kolada MCP: Municipality Statistics (remote)"
fi
if [ -z "${KB_MCP_URL:-}" ]; then
    echo "  → KB MCP: Swedish Library (local)"
else
    echo "  → KB MCP: Swedish Library (remote)"
fi
if [ -z "${UPPHANDLINGSDATA_MCP_URL:-}" ]; then
    echo "  → Upphandlingsdata MCP: Public Procurement (local)"
else
    echo "  → Upphandlingsdata MCP: Public Procurement (remote)"
fi
if [ -z "${OECD_MCP_URL:-}" ]; then
    echo "  → OECD MCP: OECD Statistics (local)"
else
    echo "  → OECD MCP: OECD Statistics (remote)"
fi
if [ -z "${TRAFIKANALYS_MCP_URL:-}" ]; then
    echo "  → Trafikanalys MCP: Transport Statistics (local)"
else
    echo "  → Trafikanalys MCP: Transport Statistics (remote)"
fi
if [ -z "${VISITSWEDEN_MCP_URL:-}" ]; then
    echo "  → Visit Sweden MCP: Swedish Tourism (local)"
else
    echo "  → Visit Sweden MCP: Swedish Tourism (remote)"
fi
if [ -z "${KRISINFORMATION_MCP_URL:-}" ]; then
    echo "  → Krisinformation MCP: Crisis Information (local)"
else
    echo "  → Krisinformation MCP: Crisis Information (remote)"
fi
if [ -z "${POLISEN_MCP_URL:-}" ]; then
    echo "  → Polisen MCP: Police Events (local)"
else
    echo "  → Polisen MCP: Police Events (remote)"
fi
echo "  → Backend: LangGraph + Gateway"
echo "  → Frontend: Next.js"
echo "  → Nginx: Reverse Proxy"
echo ""

# ── Config check ─────────────────────────────────────────────────────────────

if ! { \
        [ -n "$DEER_FLOW_CONFIG_PATH" ] && [ -f "$DEER_FLOW_CONFIG_PATH" ] || \
        [ -f backend/config.yaml ] || \
        [ -f config.yaml ]; \
    }; then
    echo "✗ No DeerFlow config file found."
    echo "  Checked these locations:"
    echo "    - $DEER_FLOW_CONFIG_PATH (when DEER_FLOW_CONFIG_PATH is set)"
    echo "    - backend/config.yaml"
    echo "    - ./config.yaml"
    echo ""
    echo "  Run 'make config' from the repo root to generate ./config.yaml, then set required model API keys in .env or your config file."
    exit 1
fi

# Load .env if it exists (so SCB_MCP_URL and other vars are available)
if [ -f "$REPO_ROOT/.env" ]; then
    set -a
    source "$REPO_ROOT/.env"
    set +a
fi

# Ensure extensions_config.json exists (MCP servers + skills)
if [ ! -f "$REPO_ROOT/extensions_config.json" ] && [ -f "$REPO_ROOT/extensions_config.example.json" ]; then
    echo "Creating extensions_config.json from example..."
    cp "$REPO_ROOT/extensions_config.example.json" "$REPO_ROOT/extensions_config.json"
fi

# ── Cleanup trap ─────────────────────────────────────────────────────────────

cleanup() {
    trap - INT TERM
    echo ""
    echo "Shutting down services..."
    # Send SIGTERM first, then SIGKILL after a grace period to ensure cleanup
    pkill -f "langgraph dev" 2>/dev/null || true
    pkill -f "uvicorn src.gateway.app:app" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next start" 2>/dev/null || true
    # Kill nginx using the captured PID first (most reliable),
    # then fall back to pkill/killall for any stray nginx workers.
    if [ -n "${NGINX_PID:-}" ] && kill -0 "$NGINX_PID" 2>/dev/null; then
        kill -TERM "$NGINX_PID" 2>/dev/null || true
    fi
    sleep 2
    # Force-kill anything that didn't respond to SIGTERM
    pkill -9 -f "langgraph dev" 2>/dev/null || true
    pkill -9 -f "langgraph_api" 2>/dev/null || true
    pkill -9 -f "uvicorn src.gateway.app:app" 2>/dev/null || true
    pkill -9 -f "next dev" 2>/dev/null || true
    pkill -9 -f "next start" 2>/dev/null || true
    if [ -n "${NGINX_PID:-}" ] && kill -0 "$NGINX_PID" 2>/dev/null; then
        kill -9 "$NGINX_PID" 2>/dev/null || true
    fi
    pkill -9 nginx 2>/dev/null || true
    killall -9 nginx 2>/dev/null || true
    # Kill SCB MCP Node.js process if running
    if [ -n "${SCB_MCP_PID:-}" ] && kill -0 "$SCB_MCP_PID" 2>/dev/null; then
        kill "$SCB_MCP_PID" 2>/dev/null || true
    fi
    # Kill Skolverket MCP Node.js process if running
    if [ -n "${SKOLVERKET_MCP_PID:-}" ] && kill -0 "$SKOLVERKET_MCP_PID" 2>/dev/null; then
        kill "$SKOLVERKET_MCP_PID" 2>/dev/null || true
    fi
    # Kill Trafikverket MCP Node.js process if running
    if [ -n "${TRAFIKVERKET_MCP_PID:-}" ] && kill -0 "$TRAFIKVERKET_MCP_PID" 2>/dev/null; then
        kill "$TRAFIKVERKET_MCP_PID" 2>/dev/null || true
    fi
    # Kill Riksbank MCP Node.js process if running
    if [ -n "${RIKSBANK_MCP_PID:-}" ] && kill -0 "$RIKSBANK_MCP_PID" 2>/dev/null; then
        kill "$RIKSBANK_MCP_PID" 2>/dev/null || true
    fi
    # Kill SMHI MCP Node.js process if running
    if [ -n "${SMHI_MCP_PID:-}" ] && kill -0 "$SMHI_MCP_PID" 2>/dev/null; then
        kill "$SMHI_MCP_PID" 2>/dev/null || true
    fi
    # Kill Lightpanda MCP Node.js process if running
    if [ -n "${LIGHTPANDA_MCP_PID:-}" ] && kill -0 "$LIGHTPANDA_MCP_PID" 2>/dev/null; then
        kill "$LIGHTPANDA_MCP_PID" 2>/dev/null || true
    fi
    # Kill Elpris MCP Node.js process if running
    if [ -n "${ELPRIS_MCP_PID:-}" ] && kill -0 "$ELPRIS_MCP_PID" 2>/dev/null; then
        kill "$ELPRIS_MCP_PID" 2>/dev/null || true
    fi
    # Kill Bolagsverket MCP Node.js process if running
    if [ -n "${BOLAGSVERKET_MCP_PID:-}" ] && kill -0 "$BOLAGSVERKET_MCP_PID" 2>/dev/null; then
        kill "$BOLAGSVERKET_MCP_PID" 2>/dev/null || true
    fi
    # Kill Google Maps MCP process if running
    if [ -n "${GOOGLE_MAPS_MCP_PID:-}" ] && kill -0 "$GOOGLE_MAPS_MCP_PID" 2>/dev/null; then
        kill "$GOOGLE_MAPS_MCP_PID" 2>/dev/null || true
    fi
    # Kill Avanza MCP process if running
    if [ -n "${AVANZA_MCP_PID:-}" ] && kill -0 "$AVANZA_MCP_PID" 2>/dev/null; then
        kill "$AVANZA_MCP_PID" 2>/dev/null || true
    fi
    # Kill Blocket/Tradera MCP process if running
    if [ -n "${BLOCKET_TRADERA_MCP_PID:-}" ] && kill -0 "$BLOCKET_TRADERA_MCP_PID" 2>/dev/null; then
        kill "$BLOCKET_TRADERA_MCP_PID" 2>/dev/null || true
    fi
    # Kill Riksdag MCP Node.js process if running
    if [ -n "${RIKSDAG_MCP_PID:-}" ] && kill -0 "$RIKSDAG_MCP_PID" 2>/dev/null; then
        kill "$RIKSDAG_MCP_PID" 2>/dev/null || true
    fi
    # Kill NVV MCP Node.js process if running
    if [ -n "${NVV_MCP_PID:-}" ] && kill -0 "$NVV_MCP_PID" 2>/dev/null; then
        kill "$NVV_MCP_PID" 2>/dev/null || true
    fi
    # Kill Kolada MCP Node.js process if running
    if [ -n "${KOLADA_MCP_PID:-}" ] && kill -0 "$KOLADA_MCP_PID" 2>/dev/null; then
        kill "$KOLADA_MCP_PID" 2>/dev/null || true
    fi
    # Kill KB MCP Node.js process if running
    if [ -n "${KB_MCP_PID:-}" ] && kill -0 "$KB_MCP_PID" 2>/dev/null; then
        kill "$KB_MCP_PID" 2>/dev/null || true
    fi
    # Kill Upphandlingsdata MCP Node.js process if running
    if [ -n "${UPPHANDLINGSDATA_MCP_PID:-}" ] && kill -0 "$UPPHANDLINGSDATA_MCP_PID" 2>/dev/null; then
        kill "$UPPHANDLINGSDATA_MCP_PID" 2>/dev/null || true
    fi
    # Kill OECD MCP Node.js process if running
    if [ -n "${OECD_MCP_PID:-}" ] && kill -0 "$OECD_MCP_PID" 2>/dev/null; then
        kill "$OECD_MCP_PID" 2>/dev/null || true
    fi
    # Kill Trafikanalys MCP Node.js process if running
    if [ -n "${TRAFIKANALYS_MCP_PID:-}" ] && kill -0 "$TRAFIKANALYS_MCP_PID" 2>/dev/null; then
        kill "$TRAFIKANALYS_MCP_PID" 2>/dev/null || true
    fi
    # Kill Visit Sweden MCP Node.js process if running
    if [ -n "${VISITSWEDEN_MCP_PID:-}" ] && kill -0 "$VISITSWEDEN_MCP_PID" 2>/dev/null; then
        kill "$VISITSWEDEN_MCP_PID" 2>/dev/null || true
    fi
    # Kill Krisinformation MCP Node.js process if running
    if [ -n "${KRISINFORMATION_MCP_PID:-}" ] && kill -0 "$KRISINFORMATION_MCP_PID" 2>/dev/null; then
        kill "$KRISINFORMATION_MCP_PID" 2>/dev/null || true
    fi
    # Kill Polisen MCP Node.js process if running
    if [ -n "${POLISEN_MCP_PID:-}" ] && kill -0 "$POLISEN_MCP_PID" 2>/dev/null; then
        kill "$POLISEN_MCP_PID" 2>/dev/null || true
    fi
    # Kill any remaining processes on service ports (catches zombie python processes)
    for port in 2024 8001 3000 2026 3100 3101 3102 3103 3104 3105 3106 3107 3108 3109 3110 3111 3112 3113 3114 3115 3116 3117 3118 3119 3120; do
        fuser -k "$port/tcp" 2>/dev/null || true
    done
    echo "Cleaning up containers..."
    docker stop deer-flow-lightpanda 2>/dev/null || true
    docker rm deer-flow-lightpanda 2>/dev/null || true
    docker stop deer-flow-lightpanda-mcp 2>/dev/null || true
    docker rm deer-flow-lightpanda-mcp 2>/dev/null || true
    docker stop deer-flow-scb-mcp 2>/dev/null || true
    docker rm deer-flow-scb-mcp 2>/dev/null || true
    docker stop deer-flow-skolverket-mcp 2>/dev/null || true
    docker rm deer-flow-skolverket-mcp 2>/dev/null || true
    docker stop deer-flow-trafikverket-mcp 2>/dev/null || true
    docker rm deer-flow-trafikverket-mcp 2>/dev/null || true
    docker stop deer-flow-riksbank-mcp 2>/dev/null || true
    docker rm deer-flow-riksbank-mcp 2>/dev/null || true
    docker stop deer-flow-smhi-mcp 2>/dev/null || true
    docker rm deer-flow-smhi-mcp 2>/dev/null || true
    docker stop deer-flow-elpris-mcp 2>/dev/null || true
    docker rm deer-flow-elpris-mcp 2>/dev/null || true
    docker stop deer-flow-bolagsverket-mcp 2>/dev/null || true
    docker rm deer-flow-bolagsverket-mcp 2>/dev/null || true
    docker stop deer-flow-google-maps-mcp 2>/dev/null || true
    docker rm deer-flow-google-maps-mcp 2>/dev/null || true
    docker stop deer-flow-avanza-mcp 2>/dev/null || true
    docker rm deer-flow-avanza-mcp 2>/dev/null || true
    docker stop deer-flow-blocket-tradera-mcp 2>/dev/null || true
    docker rm deer-flow-blocket-tradera-mcp 2>/dev/null || true
    docker stop deer-flow-riksdag-mcp 2>/dev/null || true
    docker rm deer-flow-riksdag-mcp 2>/dev/null || true
    docker stop deer-flow-nvv-mcp 2>/dev/null || true
    docker rm deer-flow-nvv-mcp 2>/dev/null || true
    docker stop deer-flow-kolada-mcp 2>/dev/null || true
    docker rm deer-flow-kolada-mcp 2>/dev/null || true
    docker stop deer-flow-kb-mcp 2>/dev/null || true
    docker rm deer-flow-kb-mcp 2>/dev/null || true
    docker stop deer-flow-upphandlingsdata-mcp 2>/dev/null || true
    docker rm deer-flow-upphandlingsdata-mcp 2>/dev/null || true
    docker stop deer-flow-oecd-mcp 2>/dev/null || true
    docker rm deer-flow-oecd-mcp 2>/dev/null || true
    docker stop deer-flow-trafikanalys-mcp 2>/dev/null || true
    docker rm deer-flow-trafikanalys-mcp 2>/dev/null || true
    docker stop deer-flow-visitsweden-mcp 2>/dev/null || true
    docker rm deer-flow-visitsweden-mcp 2>/dev/null || true
    docker stop deer-flow-krisinformation-mcp 2>/dev/null || true
    docker rm deer-flow-krisinformation-mcp 2>/dev/null || true
    docker stop deer-flow-polisen-mcp 2>/dev/null || true
    docker rm deer-flow-polisen-mcp 2>/dev/null || true
    ./scripts/cleanup-containers.sh deer-flow-sandbox 2>/dev/null || true
    echo "✓ All services stopped"
    exit 0
}
trap cleanup INT TERM

# ── Start services ────────────────────────────────────────────────────────────

mkdir -p logs

if $DEV_MODE; then
    LANGGRAPH_EXTRA_FLAGS=""
    GATEWAY_EXTRA_FLAGS="--reload --reload-include='*.yaml' --reload-include='.env'"
else
    LANGGRAPH_EXTRA_FLAGS="--no-reload"
    GATEWAY_EXTRA_FLAGS=""
fi

echo "Starting Lightpanda headless browser..."
LIGHTPANDA_PORT="${LIGHTPANDA_PORT:-9222}"
if command -v docker >/dev/null 2>&1; then
    docker run -d --name deer-flow-lightpanda -p "${LIGHTPANDA_PORT}:9222" \
        --restart unless-stopped lightpanda/browser:nightly > /dev/null 2>&1
    ./scripts/wait-for-port.sh "$LIGHTPANDA_PORT" 15 "Lightpanda" || {
        echo "  ⚠ Lightpanda failed to start. Web fetch/search will not work."
        echo "  Continuing without Lightpanda..."
    }
    echo "✓ Lightpanda started on localhost:${LIGHTPANDA_PORT}"
else
    echo "  ⚠ Docker not found — skipping Lightpanda."
    echo "  Web fetch/search requires Lightpanda. Install Docker or run Lightpanda manually."
fi
export LIGHTPANDA_URL="http://localhost:${LIGHTPANDA_PORT}"
export LIGHTPANDA_CDP_URL="ws://localhost:${LIGHTPANDA_PORT}"

# SCB MCP Server — Swedish official statistics
SCB_MCP_PORT="${SCB_MCP_PORT:-3100}"
SCB_MCP_DIR="$REPO_ROOT/mcp-tools/scb-mcp"
if [ -n "${SCB_MCP_URL:-}" ]; then
    echo "✓ SCB MCP using remote instance: ${SCB_MCP_URL}"
elif [ -z "${SCB_MCP_URL:-}" ]; then
    echo "Starting SCB MCP server..."
    SCB_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $SCB_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-scb-mcp >/dev/null 2>&1; then
            echo "  Building SCB MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-scb-mcp -f docker/scb-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-scb-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-scb-mcp -p "${SCB_MCP_PORT}:3000" \
                -e PORT=3000 --restart unless-stopped deer-flow-scb-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$SCB_MCP_PORT" 30 "SCB MCP" || true
            if docker ps --filter name=deer-flow-scb-mcp --format '{{.Status}}' | grep -q "Up"; then
                export SCB_MCP_URL="http://localhost:${SCB_MCP_PORT}/mcp"
                echo "✓ SCB MCP started via Docker on localhost:${SCB_MCP_PORT}"
                SCB_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $SCB_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting SCB MCP with Node.js..."
        if [ ! -f "$SCB_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building SCB MCP from local source (first time)..."
            (cd "$SCB_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ SCB MCP build failed. SCB statistics will not be available."
            }
        fi
        if [ -f "$SCB_MCP_DIR/dist/http-server.js" ]; then
            PORT="$SCB_MCP_PORT" node "$SCB_MCP_DIR/dist/http-server.js" > logs/scb-mcp.log 2>&1 &
            SCB_MCP_PID=$!
            ./scripts/wait-for-port.sh "$SCB_MCP_PORT" 15 "SCB MCP" || {
                echo "  ⚠ SCB MCP failed to start."
                kill "$SCB_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$SCB_MCP_PID" 2>/dev/null; then
                export SCB_MCP_URL="http://localhost:${SCB_MCP_PORT}/mcp"
                echo "✓ SCB MCP started via Node.js on localhost:${SCB_MCP_PORT}"
                SCB_MCP_STARTED=true
            fi
        fi
    fi

    if ! $SCB_MCP_STARTED; then
        echo "  ⚠ SCB MCP could not be started. Swedish statistics tools will not be available."
        echo "  Install Docker or Node.js to enable SCB MCP."
    fi
fi
export SCB_MCP_URL="${SCB_MCP_URL:-}"

# Skolverket MCP Server — Swedish education data
SKOLVERKET_MCP_PORT="${SKOLVERKET_MCP_PORT:-3101}"
SKOLVERKET_MCP_DIR="$REPO_ROOT/mcp-tools/skolverket-mcp"
if [ -n "${SKOLVERKET_MCP_URL:-}" ]; then
    echo "✓ Skolverket MCP using remote instance: ${SKOLVERKET_MCP_URL}"
elif [ -z "${SKOLVERKET_MCP_URL:-}" ]; then
    echo "Starting Skolverket MCP server..."
    SKOLVERKET_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $SKOLVERKET_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-skolverket-mcp >/dev/null 2>&1; then
            echo "  Building Skolverket MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-skolverket-mcp -f docker/skolverket-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-skolverket-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-skolverket-mcp -p "${SKOLVERKET_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production --restart unless-stopped deer-flow-skolverket-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$SKOLVERKET_MCP_PORT" 30 "Skolverket MCP" || true
            if docker ps --filter name=deer-flow-skolverket-mcp --format '{{.Status}}' | grep -q "Up"; then
                export SKOLVERKET_MCP_URL="http://localhost:${SKOLVERKET_MCP_PORT}/mcp"
                echo "✓ Skolverket MCP started via Docker on localhost:${SKOLVERKET_MCP_PORT}"
                SKOLVERKET_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $SKOLVERKET_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Skolverket MCP with Node.js..."
        if [ ! -f "$SKOLVERKET_MCP_DIR/dist/streamable-http-server.js" ]; then
            echo "  Building Skolverket MCP from local source (first time)..."
            (cd "$SKOLVERKET_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Skolverket MCP build failed. Education tools will not be available."
            }
        fi
        if [ -f "$SKOLVERKET_MCP_DIR/dist/streamable-http-server.js" ]; then
            PORT="$SKOLVERKET_MCP_PORT" node "$SKOLVERKET_MCP_DIR/dist/streamable-http-server.js" > logs/skolverket-mcp.log 2>&1 &
            SKOLVERKET_MCP_PID=$!
            ./scripts/wait-for-port.sh "$SKOLVERKET_MCP_PORT" 15 "Skolverket MCP" || {
                echo "  ⚠ Skolverket MCP failed to start."
                kill "$SKOLVERKET_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$SKOLVERKET_MCP_PID" 2>/dev/null; then
                export SKOLVERKET_MCP_URL="http://localhost:${SKOLVERKET_MCP_PORT}/mcp"
                echo "✓ Skolverket MCP started via Node.js on localhost:${SKOLVERKET_MCP_PORT}"
                SKOLVERKET_MCP_STARTED=true
            fi
        fi
    fi

    if ! $SKOLVERKET_MCP_STARTED; then
        echo "  ⚠ Skolverket MCP could not be started. Swedish education tools will not be available."
        echo "  Install Docker or Node.js to enable Skolverket MCP."
    fi
fi
export SKOLVERKET_MCP_URL="${SKOLVERKET_MCP_URL:-}"

# Trafikverket MCP Server — Swedish traffic data
TRAFIKVERKET_MCP_PORT="${TRAFIKVERKET_MCP_PORT:-3102}"
TRAFIKVERKET_MCP_DIR="$REPO_ROOT/mcp-tools/trafikverket-mcp"
if [ -n "${TRAFIKVERKET_MCP_URL:-}" ]; then
    echo "✓ Trafikverket MCP using remote instance: ${TRAFIKVERKET_MCP_URL}"
elif [ -z "${TRAFIKVERKET_MCP_URL:-}" ]; then
    echo "Starting Trafikverket MCP server..."
    TRAFIKVERKET_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $TRAFIKVERKET_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-trafikverket-mcp >/dev/null 2>&1; then
            echo "  Building Trafikverket MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-trafikverket-mcp -f docker/trafikverket-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-trafikverket-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-trafikverket-mcp -p "${TRAFIKVERKET_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                -e TRAFIKVERKET_API_KEY="${TRAFIKVERKET_API_KEY:-}" \
                --restart unless-stopped deer-flow-trafikverket-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$TRAFIKVERKET_MCP_PORT" 30 "Trafikverket MCP" || true
            if docker ps --filter name=deer-flow-trafikverket-mcp --format '{{.Status}}' | grep -q "Up"; then
                export TRAFIKVERKET_MCP_URL="http://localhost:${TRAFIKVERKET_MCP_PORT}/mcp"
                echo "✓ Trafikverket MCP started via Docker on localhost:${TRAFIKVERKET_MCP_PORT}"
                TRAFIKVERKET_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $TRAFIKVERKET_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Trafikverket MCP with Node.js..."
        if [ ! -f "$TRAFIKVERKET_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building Trafikverket MCP from local source (first time)..."
            (cd "$TRAFIKVERKET_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Trafikverket MCP build failed. Traffic tools will not be available."
            }
        fi
        if [ -f "$TRAFIKVERKET_MCP_DIR/dist/http-server.js" ]; then
            PORT="$TRAFIKVERKET_MCP_PORT" TRAFIKVERKET_API_KEY="${TRAFIKVERKET_API_KEY:-}" \
                node "$TRAFIKVERKET_MCP_DIR/dist/http-server.js" > logs/trafikverket-mcp.log 2>&1 &
            TRAFIKVERKET_MCP_PID=$!
            ./scripts/wait-for-port.sh "$TRAFIKVERKET_MCP_PORT" 15 "Trafikverket MCP" || {
                echo "  ⚠ Trafikverket MCP failed to start."
                kill "$TRAFIKVERKET_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$TRAFIKVERKET_MCP_PID" 2>/dev/null; then
                export TRAFIKVERKET_MCP_URL="http://localhost:${TRAFIKVERKET_MCP_PORT}/mcp"
                echo "✓ Trafikverket MCP started via Node.js on localhost:${TRAFIKVERKET_MCP_PORT}"
                TRAFIKVERKET_MCP_STARTED=true
            fi
        fi
    fi

    if ! $TRAFIKVERKET_MCP_STARTED; then
        echo "  ⚠ Trafikverket MCP could not be started. Swedish traffic tools will not be available."
        echo "  Install Docker or Node.js to enable Trafikverket MCP."
    fi
fi
export TRAFIKVERKET_MCP_URL="${TRAFIKVERKET_MCP_URL:-}"

# Riksbank MCP Server — Swedish economic data
RIKSBANK_MCP_PORT="${RIKSBANK_MCP_PORT:-3103}"
RIKSBANK_MCP_DIR="$REPO_ROOT/mcp-tools/riksbank-mcp"
if [ -n "${RIKSBANK_MCP_URL:-}" ]; then
    echo "✓ Riksbank MCP using remote instance: ${RIKSBANK_MCP_URL}"
elif [ -z "${RIKSBANK_MCP_URL:-}" ]; then
    echo "Starting Riksbank MCP server..."
    RIKSBANK_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $RIKSBANK_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-riksbank-mcp >/dev/null 2>&1; then
            echo "  Building Riksbank MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-riksbank-mcp -f docker/riksbank-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-riksbank-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-riksbank-mcp -p "${RIKSBANK_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                -e RIKSBANK_API_KEY="${RIKSBANK_API_KEY:-}" \
                --restart unless-stopped deer-flow-riksbank-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$RIKSBANK_MCP_PORT" 30 "Riksbank MCP" || true
            if docker ps --filter name=deer-flow-riksbank-mcp --format '{{.Status}}' | grep -q "Up"; then
                export RIKSBANK_MCP_URL="http://localhost:${RIKSBANK_MCP_PORT}/mcp"
                echo "✓ Riksbank MCP started via Docker on localhost:${RIKSBANK_MCP_PORT}"
                RIKSBANK_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $RIKSBANK_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Riksbank MCP with Node.js..."
        if [ ! -f "$RIKSBANK_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building Riksbank MCP from local source (first time)..."
            (cd "$RIKSBANK_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Riksbank MCP build failed. Economy tools will not be available."
            }
        fi
        if [ -f "$RIKSBANK_MCP_DIR/dist/http-server.js" ]; then
            PORT="$RIKSBANK_MCP_PORT" RIKSBANK_API_KEY="${RIKSBANK_API_KEY:-}" \
                node "$RIKSBANK_MCP_DIR/dist/http-server.js" > logs/riksbank-mcp.log 2>&1 &
            RIKSBANK_MCP_PID=$!
            ./scripts/wait-for-port.sh "$RIKSBANK_MCP_PORT" 15 "Riksbank MCP" || {
                echo "  ⚠ Riksbank MCP failed to start."
                kill "$RIKSBANK_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$RIKSBANK_MCP_PID" 2>/dev/null; then
                export RIKSBANK_MCP_URL="http://localhost:${RIKSBANK_MCP_PORT}/mcp"
                echo "✓ Riksbank MCP started via Node.js on localhost:${RIKSBANK_MCP_PORT}"
                RIKSBANK_MCP_STARTED=true
            fi
        fi
    fi

    if ! $RIKSBANK_MCP_STARTED; then
        echo "  ⚠ Riksbank MCP could not be started. Swedish economy tools will not be available."
        echo "  Install Docker or Node.js to enable Riksbank MCP."
    fi
fi
export RIKSBANK_MCP_URL="${RIKSBANK_MCP_URL:-}"

# SMHI MCP Server — Swedish weather, hydrology, oceanography, fire risk
SMHI_MCP_PORT="${SMHI_MCP_PORT:-3104}"
SMHI_MCP_DIR="$REPO_ROOT/mcp-tools/smhi-mcp"
if [ -n "${SMHI_MCP_URL:-}" ]; then
    echo "✓ SMHI MCP using remote instance: ${SMHI_MCP_URL}"
elif [ -z "${SMHI_MCP_URL:-}" ]; then
    echo "Starting SMHI MCP server..."
    SMHI_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $SMHI_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-smhi-mcp >/dev/null 2>&1; then
            echo "  Building SMHI MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-smhi-mcp -f docker/smhi-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-smhi-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-smhi-mcp -p "${SMHI_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                --restart unless-stopped deer-flow-smhi-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$SMHI_MCP_PORT" 30 "SMHI MCP" || true
            if docker ps --filter name=deer-flow-smhi-mcp --format '{{.Status}}' | grep -q "Up"; then
                export SMHI_MCP_URL="http://localhost:${SMHI_MCP_PORT}/mcp"
                echo "✓ SMHI MCP started via Docker on localhost:${SMHI_MCP_PORT}"
                SMHI_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $SMHI_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting SMHI MCP with Node.js..."
        if [ ! -f "$SMHI_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building SMHI MCP from local source (first time)..."
            (cd "$SMHI_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ SMHI MCP build failed. Weather tools will not be available."
            }
        fi
        if [ -f "$SMHI_MCP_DIR/dist/http-server.js" ]; then
            PORT="$SMHI_MCP_PORT" \
                node "$SMHI_MCP_DIR/dist/http-server.js" > logs/smhi-mcp.log 2>&1 &
            SMHI_MCP_PID=$!
            ./scripts/wait-for-port.sh "$SMHI_MCP_PORT" 15 "SMHI MCP" || {
                echo "  ⚠ SMHI MCP failed to start."
                kill "$SMHI_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$SMHI_MCP_PID" 2>/dev/null; then
                export SMHI_MCP_URL="http://localhost:${SMHI_MCP_PORT}/mcp"
                echo "✓ SMHI MCP started via Node.js on localhost:${SMHI_MCP_PORT}"
                SMHI_MCP_STARTED=true
            fi
        fi
    fi

    if ! $SMHI_MCP_STARTED; then
        echo "  ⚠ SMHI MCP could not be started. Swedish weather tools will not be available."
        echo "  Install Docker or Node.js to enable SMHI MCP."
    fi
fi
export SMHI_MCP_URL="${SMHI_MCP_URL:-}"

# Lightpanda MCP Server — web browsing, search and data extraction
LIGHTPANDA_MCP_PORT="${LIGHTPANDA_MCP_PORT:-3105}"
LIGHTPANDA_MCP_DIR="$REPO_ROOT/mcp-tools/lightpanda-mcp"
if [ -n "${LIGHTPANDA_MCP_URL:-}" ]; then
    echo "✓ Lightpanda MCP using remote instance: ${LIGHTPANDA_MCP_URL}"
elif [ -z "${LIGHTPANDA_MCP_URL:-}" ]; then
    echo "Starting Lightpanda MCP server..."
    LIGHTPANDA_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $LIGHTPANDA_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-lightpanda-mcp >/dev/null 2>&1; then
            echo "  Building Lightpanda MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-lightpanda-mcp -f docker/lightpanda-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-lightpanda-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-lightpanda-mcp -p "${LIGHTPANDA_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                -e LIGHTPANDA_URL="${LIGHTPANDA_URL:-http://host.docker.internal:${LIGHTPANDA_PORT:-9222}}" \
                -e LIGHTPANDA_CDP_URL="${LIGHTPANDA_CDP_URL:-ws://host.docker.internal:${LIGHTPANDA_PORT:-9222}}" \
                --add-host=host.docker.internal:host-gateway \
                --restart unless-stopped deer-flow-lightpanda-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$LIGHTPANDA_MCP_PORT" 30 "Lightpanda MCP" || true
            if docker ps --filter name=deer-flow-lightpanda-mcp --format '{{.Status}}' | grep -q "Up"; then
                export LIGHTPANDA_MCP_URL="http://localhost:${LIGHTPANDA_MCP_PORT}/mcp"
                echo "✓ Lightpanda MCP started via Docker on localhost:${LIGHTPANDA_MCP_PORT}"
                LIGHTPANDA_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $LIGHTPANDA_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Lightpanda MCP with Node.js..."
        if [ ! -f "$LIGHTPANDA_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building Lightpanda MCP from local source (first time)..."
            (cd "$LIGHTPANDA_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Lightpanda MCP build failed. Web browsing MCP tools will not be available."
            }
        fi
        if [ -f "$LIGHTPANDA_MCP_DIR/dist/http-server.js" ]; then
            PORT="$LIGHTPANDA_MCP_PORT" \
                node "$LIGHTPANDA_MCP_DIR/dist/http-server.js" > logs/lightpanda-mcp.log 2>&1 &
            LIGHTPANDA_MCP_PID=$!
            ./scripts/wait-for-port.sh "$LIGHTPANDA_MCP_PORT" 15 "Lightpanda MCP" || {
                echo "  ⚠ Lightpanda MCP failed to start."
                kill "$LIGHTPANDA_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$LIGHTPANDA_MCP_PID" 2>/dev/null; then
                export LIGHTPANDA_MCP_URL="http://localhost:${LIGHTPANDA_MCP_PORT}/mcp"
                echo "✓ Lightpanda MCP started via Node.js on localhost:${LIGHTPANDA_MCP_PORT}"
                LIGHTPANDA_MCP_STARTED=true
            fi
        fi
    fi

    if ! $LIGHTPANDA_MCP_STARTED; then
        echo "  ⚠ Lightpanda MCP could not be started. Web browsing MCP tools will not be available."
        echo "  Install Docker or Node.js to enable Lightpanda MCP."
    fi
fi
export LIGHTPANDA_MCP_URL="${LIGHTPANDA_MCP_URL:-}"

# Elpris MCP Server — Swedish electricity prices
ELPRIS_MCP_PORT="${ELPRIS_MCP_PORT:-3106}"
ELPRIS_MCP_DIR="$REPO_ROOT/mcp-tools/elpris-mcp"
if [ -n "${ELPRIS_MCP_URL:-}" ]; then
    echo "✓ Elpris MCP using remote instance: ${ELPRIS_MCP_URL}"
elif [ -z "${ELPRIS_MCP_URL:-}" ]; then
    echo "Starting Elpris MCP server..."
    ELPRIS_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $ELPRIS_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-elpris-mcp >/dev/null 2>&1; then
            echo "  Building Elpris MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-elpris-mcp -f docker/elpris-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-elpris-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-elpris-mcp -p "${ELPRIS_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                --restart unless-stopped deer-flow-elpris-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$ELPRIS_MCP_PORT" 30 "Elpris MCP" || true
            if docker ps --filter name=deer-flow-elpris-mcp --format '{{.Status}}' | grep -q "Up"; then
                export ELPRIS_MCP_URL="http://localhost:${ELPRIS_MCP_PORT}/mcp"
                echo "✓ Elpris MCP started via Docker on localhost:${ELPRIS_MCP_PORT}"
                ELPRIS_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $ELPRIS_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Elpris MCP with Node.js..."
        if [ ! -f "$ELPRIS_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building Elpris MCP from local source (first time)..."
            (cd "$ELPRIS_MCP_DIR" && npm install > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Elpris MCP build failed. Electricity price tools will not be available."
            }
        fi
        if [ -f "$ELPRIS_MCP_DIR/dist/http-server.js" ]; then
            PORT="$ELPRIS_MCP_PORT" \
                node "$ELPRIS_MCP_DIR/dist/http-server.js" > logs/elpris-mcp.log 2>&1 &
            ELPRIS_MCP_PID=$!
            ./scripts/wait-for-port.sh "$ELPRIS_MCP_PORT" 15 "Elpris MCP" || {
                echo "  ⚠ Elpris MCP failed to start."
                kill "$ELPRIS_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$ELPRIS_MCP_PID" 2>/dev/null; then
                export ELPRIS_MCP_URL="http://localhost:${ELPRIS_MCP_PORT}/mcp"
                echo "✓ Elpris MCP started via Node.js on localhost:${ELPRIS_MCP_PORT}"
                ELPRIS_MCP_STARTED=true
            fi
        fi
    fi

    if ! $ELPRIS_MCP_STARTED; then
        echo "  ⚠ Elpris MCP could not be started. Electricity price tools will not be available."
        echo "  Install Docker or Node.js to enable Elpris MCP."
    fi
fi
export ELPRIS_MCP_URL="${ELPRIS_MCP_URL:-}"

# Bolagsverket MCP Server — Swedish company data
BOLAGSVERKET_MCP_PORT="${BOLAGSVERKET_MCP_PORT:-3107}"
BOLAGSVERKET_MCP_DIR="$REPO_ROOT/mcp-tools/bolagsverket-mcp"
if [ -n "${BOLAGSVERKET_MCP_URL:-}" ]; then
    echo "✓ Bolagsverket MCP using remote instance: ${BOLAGSVERKET_MCP_URL}"
elif [ -z "${BOLAGSVERKET_MCP_URL:-}" ]; then
    echo "Starting Bolagsverket MCP server..."
    BOLAGSVERKET_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $BOLAGSVERKET_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-bolagsverket-mcp >/dev/null 2>&1; then
            echo "  Building Bolagsverket MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-bolagsverket-mcp -f docker/bolagsverket-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-bolagsverket-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-bolagsverket-mcp -p "${BOLAGSVERKET_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                -e BOLAGSVERKET_CLIENT_ID="${BOLAGSVERKET_CLIENT_ID:-}" \
                -e BOLAGSVERKET_CLIENT_SECRET="${BOLAGSVERKET_CLIENT_SECRET:-}" \
                --restart unless-stopped deer-flow-bolagsverket-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$BOLAGSVERKET_MCP_PORT" 30 "Bolagsverket MCP" || true
            if docker ps --filter name=deer-flow-bolagsverket-mcp --format '{{.Status}}' | grep -q "Up"; then
                export BOLAGSVERKET_MCP_URL="http://localhost:${BOLAGSVERKET_MCP_PORT}/mcp"
                echo "✓ Bolagsverket MCP started via Docker on localhost:${BOLAGSVERKET_MCP_PORT}"
                BOLAGSVERKET_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $BOLAGSVERKET_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Bolagsverket MCP with Node.js..."
        if [ ! -f "$BOLAGSVERKET_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building Bolagsverket MCP from local source (first time)..."
            (cd "$BOLAGSVERKET_MCP_DIR" && npm install > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Bolagsverket MCP build failed. Company data tools will not be available."
            }
        fi
        if [ -f "$BOLAGSVERKET_MCP_DIR/dist/http-server.js" ]; then
            PORT="$BOLAGSVERKET_MCP_PORT" \
                BOLAGSVERKET_CLIENT_ID="${BOLAGSVERKET_CLIENT_ID:-}" \
                BOLAGSVERKET_CLIENT_SECRET="${BOLAGSVERKET_CLIENT_SECRET:-}" \
                node "$BOLAGSVERKET_MCP_DIR/dist/http-server.js" > logs/bolagsverket-mcp.log 2>&1 &
            BOLAGSVERKET_MCP_PID=$!
            ./scripts/wait-for-port.sh "$BOLAGSVERKET_MCP_PORT" 15 "Bolagsverket MCP" || {
                echo "  ⚠ Bolagsverket MCP failed to start."
                kill "$BOLAGSVERKET_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$BOLAGSVERKET_MCP_PID" 2>/dev/null; then
                export BOLAGSVERKET_MCP_URL="http://localhost:${BOLAGSVERKET_MCP_PORT}/mcp"
                echo "✓ Bolagsverket MCP started via Node.js on localhost:${BOLAGSVERKET_MCP_PORT}"
                BOLAGSVERKET_MCP_STARTED=true
            fi
        fi
    fi

    if ! $BOLAGSVERKET_MCP_STARTED; then
        echo "  ⚠ Bolagsverket MCP could not be started. Company data tools will not be available."
        echo "  Install Docker or Node.js to enable Bolagsverket MCP."
    fi
fi
export BOLAGSVERKET_MCP_URL="${BOLAGSVERKET_MCP_URL:-}"

# Google Maps MCP Server — geocoding, places, directions
GOOGLE_MAPS_MCP_PORT="${GOOGLE_MAPS_MCP_PORT:-3108}"
GOOGLE_MAPS_MCP_DIR="$REPO_ROOT/mcp-tools/google-maps-mcp"
if [ -n "${GOOGLE_MAPS_MCP_URL:-}" ]; then
    echo "✓ Google Maps MCP using remote instance: ${GOOGLE_MAPS_MCP_URL}"
elif [ -z "${GOOGLE_MAPS_MCP_URL:-}" ]; then
    echo "Starting Google Maps MCP server..."
    GOOGLE_MAPS_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $GOOGLE_MAPS_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-google-maps-mcp >/dev/null 2>&1; then
            echo "  Building Google Maps MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-google-maps-mcp -f docker/google-maps-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-google-maps-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-google-maps-mcp -p "${GOOGLE_MAPS_MCP_PORT}:3000" \
                -e MCP_SERVER_PORT=3000 -e PORT=3000 \
                -e GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_API_KEY:-}" \
                --restart unless-stopped deer-flow-google-maps-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$GOOGLE_MAPS_MCP_PORT" 30 "Google Maps MCP" || true
            if docker ps --filter name=deer-flow-google-maps-mcp --format '{{.Status}}' | grep -q "Up"; then
                export GOOGLE_MAPS_MCP_URL="http://localhost:${GOOGLE_MAPS_MCP_PORT}/mcp"
                echo "✓ Google Maps MCP started via Docker on localhost:${GOOGLE_MAPS_MCP_PORT}"
                GOOGLE_MAPS_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $GOOGLE_MAPS_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Google Maps MCP with Node.js..."
        if [ ! -f "$GOOGLE_MAPS_MCP_DIR/dist/cli.js" ]; then
            echo "  Building Google Maps MCP from local source (first time)..."
            (cd "$GOOGLE_MAPS_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Google Maps MCP build failed. Maps tools will not be available."
            }
        fi
        if [ -f "$GOOGLE_MAPS_MCP_DIR/dist/cli.js" ]; then
            MCP_SERVER_PORT="$GOOGLE_MAPS_MCP_PORT" GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_API_KEY:-}" \
                node "$GOOGLE_MAPS_MCP_DIR/dist/cli.js" > logs/google-maps-mcp.log 2>&1 &
            GOOGLE_MAPS_MCP_PID=$!
            ./scripts/wait-for-port.sh "$GOOGLE_MAPS_MCP_PORT" 15 "Google Maps MCP" || {
                echo "  ⚠ Google Maps MCP failed to start."
                kill "$GOOGLE_MAPS_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$GOOGLE_MAPS_MCP_PID" 2>/dev/null; then
                export GOOGLE_MAPS_MCP_URL="http://localhost:${GOOGLE_MAPS_MCP_PORT}/mcp"
                echo "✓ Google Maps MCP started via Node.js on localhost:${GOOGLE_MAPS_MCP_PORT}"
                GOOGLE_MAPS_MCP_STARTED=true
            fi
        fi
    fi

    if ! $GOOGLE_MAPS_MCP_STARTED; then
        echo "  ⚠ Google Maps MCP could not be started. Maps tools will not be available."
        echo "  Install Docker or Node.js to enable Google Maps MCP."
    fi
fi
export GOOGLE_MAPS_MCP_URL="${GOOGLE_MAPS_MCP_URL:-}"

# Avanza MCP Server — Swedish stocks, funds, ETFs
AVANZA_MCP_PORT="${AVANZA_MCP_PORT:-3109}"
AVANZA_MCP_DIR="$REPO_ROOT/mcp-tools/avanza-mcp"
if [ -n "${AVANZA_MCP_URL:-}" ]; then
    echo "✓ Avanza MCP using remote instance: ${AVANZA_MCP_URL}"
elif [ -z "${AVANZA_MCP_URL:-}" ]; then
    echo "Starting Avanza MCP server..."
    AVANZA_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $AVANZA_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-avanza-mcp >/dev/null 2>&1; then
            echo "  Building Avanza MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-avanza-mcp -f docker/avanza-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-avanza-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-avanza-mcp -p "${AVANZA_MCP_PORT}:3000" \
                -e PORT=3000 \
                --restart unless-stopped deer-flow-avanza-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$AVANZA_MCP_PORT" 30 "Avanza MCP" || true
            if docker ps --filter name=deer-flow-avanza-mcp --format '{{.Status}}' | grep -q "Up"; then
                export AVANZA_MCP_URL="http://localhost:${AVANZA_MCP_PORT}/mcp"
                echo "✓ Avanza MCP started via Docker on localhost:${AVANZA_MCP_PORT}"
                AVANZA_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Python (fallback when Docker unavailable)
    if ! $AVANZA_MCP_STARTED && command -v python3 >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Avanza MCP with Python..."
        if [ -f "$AVANZA_MCP_DIR/http_server.py" ]; then
            (cd "$AVANZA_MCP_DIR" && pip install -e . > /dev/null 2>&1) || true
            PORT="$AVANZA_MCP_PORT" python3 "$AVANZA_MCP_DIR/http_server.py" > logs/avanza-mcp.log 2>&1 &
            AVANZA_MCP_PID=$!
            ./scripts/wait-for-port.sh "$AVANZA_MCP_PORT" 30 "Avanza MCP" || {
                echo "  ⚠ Avanza MCP failed to start."
                kill "$AVANZA_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$AVANZA_MCP_PID" 2>/dev/null; then
                export AVANZA_MCP_URL="http://localhost:${AVANZA_MCP_PORT}/mcp"
                echo "✓ Avanza MCP started via Python on localhost:${AVANZA_MCP_PORT}"
                AVANZA_MCP_STARTED=true
            fi
        fi
    fi

    if ! $AVANZA_MCP_STARTED; then
        echo "  ⚠ Avanza MCP could not be started. Stock/fund tools will not be available."
        echo "  Install Docker or Python to enable Avanza MCP."
    fi
fi
export AVANZA_MCP_URL="${AVANZA_MCP_URL:-}"

# Blocket/Tradera MCP Server — Swedish marketplaces
BLOCKET_TRADERA_MCP_PORT="${BLOCKET_TRADERA_MCP_PORT:-3110}"
BLOCKET_TRADERA_MCP_DIR="$REPO_ROOT/mcp-tools/blocket-tradera-mcp"
if [ -n "${BLOCKET_TRADERA_MCP_URL:-}" ]; then
    echo "✓ Blocket/Tradera MCP using remote instance: ${BLOCKET_TRADERA_MCP_URL}"
elif [ -z "${BLOCKET_TRADERA_MCP_URL:-}" ]; then
    echo "Starting Blocket/Tradera MCP server..."
    BLOCKET_TRADERA_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $BLOCKET_TRADERA_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-blocket-tradera-mcp >/dev/null 2>&1; then
            echo "  Building Blocket/Tradera MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-blocket-tradera-mcp -f docker/blocket-tradera-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-blocket-tradera-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-blocket-tradera-mcp -p "${BLOCKET_TRADERA_MCP_PORT}:3000" \
                -e PORT=3000 \
                -e TRADERA_APP_ID="${TRADERA_APP_ID:-}" \
                -e TRADERA_APP_KEY="${TRADERA_APP_KEY:-}" \
                --restart unless-stopped deer-flow-blocket-tradera-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$BLOCKET_TRADERA_MCP_PORT" 30 "Blocket/Tradera MCP" || true
            if docker ps --filter name=deer-flow-blocket-tradera-mcp --format '{{.Status}}' | grep -q "Up"; then
                export BLOCKET_TRADERA_MCP_URL="http://localhost:${BLOCKET_TRADERA_MCP_PORT}/mcp"
                echo "✓ Blocket/Tradera MCP started via Docker on localhost:${BLOCKET_TRADERA_MCP_PORT}"
                BLOCKET_TRADERA_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $BLOCKET_TRADERA_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Blocket/Tradera MCP with Node.js..."
        if [ ! -f "$BLOCKET_TRADERA_MCP_DIR/build/http-server.js" ]; then
            echo "  Building Blocket/Tradera MCP from local source (first time)..."
            (cd "$BLOCKET_TRADERA_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Blocket/Tradera MCP build failed. Marketplace tools will not be available."
            }
        fi
        if [ -f "$BLOCKET_TRADERA_MCP_DIR/build/http-server.js" ]; then
            PORT="$BLOCKET_TRADERA_MCP_PORT" \
                TRADERA_APP_ID="${TRADERA_APP_ID:-}" \
                TRADERA_APP_KEY="${TRADERA_APP_KEY:-}" \
                node "$BLOCKET_TRADERA_MCP_DIR/build/http-server.js" > logs/blocket-tradera-mcp.log 2>&1 &
            BLOCKET_TRADERA_MCP_PID=$!
            ./scripts/wait-for-port.sh "$BLOCKET_TRADERA_MCP_PORT" 15 "Blocket/Tradera MCP" || {
                echo "  ⚠ Blocket/Tradera MCP failed to start."
                kill "$BLOCKET_TRADERA_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$BLOCKET_TRADERA_MCP_PID" 2>/dev/null; then
                export BLOCKET_TRADERA_MCP_URL="http://localhost:${BLOCKET_TRADERA_MCP_PORT}/mcp"
                echo "✓ Blocket/Tradera MCP started via Node.js on localhost:${BLOCKET_TRADERA_MCP_PORT}"
                BLOCKET_TRADERA_MCP_STARTED=true
            fi
        fi
    fi

    if ! $BLOCKET_TRADERA_MCP_STARTED; then
        echo "  ⚠ Blocket/Tradera MCP could not be started. Marketplace tools will not be available."
        echo "  Install Docker or Node.js to enable Blocket/Tradera MCP."
    fi
fi
export BLOCKET_TRADERA_MCP_URL="${BLOCKET_TRADERA_MCP_URL:-}"

# Riksdag MCP Server — Swedish parliament & government data
RIKSDAG_MCP_PORT="${RIKSDAG_MCP_PORT:-3111}"
RIKSDAG_MCP_DIR="$REPO_ROOT/mcp-tools/riksdag-mcp"
if [ -n "${RIKSDAG_MCP_URL:-}" ]; then
    echo "✓ Riksdag MCP using remote instance: ${RIKSDAG_MCP_URL}"
elif [ -z "${RIKSDAG_MCP_URL:-}" ]; then
    echo "Starting Riksdag MCP server..."
    RIKSDAG_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $RIKSDAG_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-riksdag-mcp >/dev/null 2>&1; then
            echo "  Building Riksdag MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-riksdag-mcp -f docker/riksdag-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-riksdag-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-riksdag-mcp -p "${RIKSDAG_MCP_PORT}:3000" \
                -e PORT=3000 \
                --restart unless-stopped deer-flow-riksdag-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$RIKSDAG_MCP_PORT" 30 "Riksdag MCP" || true
            if docker ps --filter name=deer-flow-riksdag-mcp --format '{{.Status}}' | grep -q "Up"; then
                export RIKSDAG_MCP_URL="http://localhost:${RIKSDAG_MCP_PORT}/mcp"
                echo "✓ Riksdag MCP started via Docker on localhost:${RIKSDAG_MCP_PORT}"
                RIKSDAG_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $RIKSDAG_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Riksdag MCP with Node.js..."
        if [ ! -f "$RIKSDAG_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building Riksdag MCP from local source (first time)..."
            (cd "$RIKSDAG_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Riksdag MCP build failed. Parliament tools will not be available."
            }
        fi
        if [ -f "$RIKSDAG_MCP_DIR/dist/http-server.js" ]; then
            PORT="$RIKSDAG_MCP_PORT" \
                node "$RIKSDAG_MCP_DIR/dist/http-server.js" > logs/riksdag-mcp.log 2>&1 &
            RIKSDAG_MCP_PID=$!
            ./scripts/wait-for-port.sh "$RIKSDAG_MCP_PORT" 15 "Riksdag MCP" || {
                echo "  ⚠ Riksdag MCP failed to start."
                kill "$RIKSDAG_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$RIKSDAG_MCP_PID" 2>/dev/null; then
                export RIKSDAG_MCP_URL="http://localhost:${RIKSDAG_MCP_PORT}/mcp"
                echo "✓ Riksdag MCP started via Node.js on localhost:${RIKSDAG_MCP_PORT}"
                RIKSDAG_MCP_STARTED=true
            fi
        fi
    fi

    if ! $RIKSDAG_MCP_STARTED; then
        echo "  ⚠ Riksdag MCP could not be started. Parliament tools will not be available."
        echo "  Install Docker or Node.js to enable Riksdag MCP."
    fi
fi
export RIKSDAG_MCP_URL="${RIKSDAG_MCP_URL:-}"

# NVV MCP Server — Swedish protected nature areas
NVV_MCP_PORT="${NVV_MCP_PORT:-3112}"
NVV_MCP_DIR="$REPO_ROOT/mcp-tools/nvv-mcp"
if [ -n "${NVV_MCP_URL:-}" ]; then
    echo "✓ NVV MCP using remote instance: ${NVV_MCP_URL}"
elif [ -z "${NVV_MCP_URL:-}" ]; then
    echo "Starting NVV MCP server..."
    NVV_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $NVV_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-nvv-mcp >/dev/null 2>&1; then
            echo "  Building NVV MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-nvv-mcp -f docker/nvv-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-nvv-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-nvv-mcp -p "${NVV_MCP_PORT}:3000" \
                -e PORT=3000 \
                --restart unless-stopped deer-flow-nvv-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$NVV_MCP_PORT" 30 "NVV MCP" || true
            if docker ps --filter name=deer-flow-nvv-mcp --format '{{.Status}}' | grep -q "Up"; then
                export NVV_MCP_URL="http://localhost:${NVV_MCP_PORT}/mcp"
                echo "✓ NVV MCP started via Docker on localhost:${NVV_MCP_PORT}"
                NVV_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $NVV_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting NVV MCP with Node.js..."
        if [ ! -f "$NVV_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building NVV MCP from local source (first time)..."
            (cd "$NVV_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ NVV MCP build failed. Nature protection tools will not be available."
            }
        fi
        if [ -f "$NVV_MCP_DIR/dist/http-server.js" ]; then
            PORT="$NVV_MCP_PORT" \
                node "$NVV_MCP_DIR/dist/http-server.js" > logs/nvv-mcp.log 2>&1 &
            NVV_MCP_PID=$!
            ./scripts/wait-for-port.sh "$NVV_MCP_PORT" 15 "NVV MCP" || {
                echo "  ⚠ NVV MCP failed to start."
                kill "$NVV_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$NVV_MCP_PID" 2>/dev/null; then
                export NVV_MCP_URL="http://localhost:${NVV_MCP_PORT}/mcp"
                echo "✓ NVV MCP started via Node.js on localhost:${NVV_MCP_PORT}"
                NVV_MCP_STARTED=true
            fi
        fi
    fi

    if ! $NVV_MCP_STARTED; then
        echo "  ⚠ NVV MCP could not be started. Nature protection tools will not be available."
        echo "  Install Docker or Node.js to enable NVV MCP."
    fi
fi
export NVV_MCP_URL="${NVV_MCP_URL:-}"

# Kolada MCP Server — Swedish municipality statistics
KOLADA_MCP_PORT="${KOLADA_MCP_PORT:-3113}"
KOLADA_MCP_DIR="$REPO_ROOT/mcp-tools/kolada-mcp"
if [ -n "${KOLADA_MCP_URL:-}" ]; then
    echo "✓ Kolada MCP using remote instance: ${KOLADA_MCP_URL}"
elif [ -z "${KOLADA_MCP_URL:-}" ]; then
    echo "Starting Kolada MCP server..."
    KOLADA_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $KOLADA_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-kolada-mcp >/dev/null 2>&1; then
            echo "  Building Kolada MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-kolada-mcp -f docker/kolada-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-kolada-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-kolada-mcp -p "${KOLADA_MCP_PORT}:3000" \
                -e PORT=3000 \
                --restart unless-stopped deer-flow-kolada-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$KOLADA_MCP_PORT" 30 "Kolada MCP" || true
            if docker ps --filter name=deer-flow-kolada-mcp --format '{{.Status}}' | grep -q "Up"; then
                export KOLADA_MCP_URL="http://localhost:${KOLADA_MCP_PORT}/mcp"
                echo "✓ Kolada MCP started via Docker on localhost:${KOLADA_MCP_PORT}"
                KOLADA_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $KOLADA_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Kolada MCP with Node.js..."
        if [ ! -f "$KOLADA_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building Kolada MCP from local source (first time)..."
            (cd "$KOLADA_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Kolada MCP build failed. Municipality statistics tools will not be available."
            }
        fi
        if [ -f "$KOLADA_MCP_DIR/dist/http-server.js" ]; then
            PORT="$KOLADA_MCP_PORT" \
                node "$KOLADA_MCP_DIR/dist/http-server.js" > logs/kolada-mcp.log 2>&1 &
            KOLADA_MCP_PID=$!
            ./scripts/wait-for-port.sh "$KOLADA_MCP_PORT" 15 "Kolada MCP" || {
                echo "  ⚠ Kolada MCP failed to start."
                kill "$KOLADA_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$KOLADA_MCP_PID" 2>/dev/null; then
                export KOLADA_MCP_URL="http://localhost:${KOLADA_MCP_PORT}/mcp"
                echo "✓ Kolada MCP started via Node.js on localhost:${KOLADA_MCP_PORT}"
                KOLADA_MCP_STARTED=true
            fi
        fi
    fi

    if ! $KOLADA_MCP_STARTED; then
        echo "  ⚠ Kolada MCP could not be started. Municipality statistics tools will not be available."
        echo "  Install Docker or Node.js to enable Kolada MCP."
    fi
fi
export KOLADA_MCP_URL="${KOLADA_MCP_URL:-}"

# KB MCP Server — Kungliga Biblioteket (Libris, K-samsök, Swepub)
KB_MCP_PORT="${KB_MCP_PORT:-3114}"
KB_MCP_DIR="$REPO_ROOT/mcp-tools/kb-mcp"
if [ -n "${KB_MCP_URL:-}" ]; then
    echo "✓ KB MCP using remote instance: ${KB_MCP_URL}"
elif [ -z "${KB_MCP_URL:-}" ]; then
    echo "Starting KB MCP server..."
    KB_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $KB_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-kb-mcp >/dev/null 2>&1; then
            echo "  Building KB MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-kb-mcp -f docker/kb-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-kb-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-kb-mcp -p "${KB_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                --restart unless-stopped deer-flow-kb-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$KB_MCP_PORT" 30 "KB MCP" || true
            if docker ps --filter name=deer-flow-kb-mcp --format '{{.Status}}' | grep -q "Up"; then
                export KB_MCP_URL="http://localhost:${KB_MCP_PORT}/mcp"
                echo "✓ KB MCP started via Docker on localhost:${KB_MCP_PORT}"
                KB_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $KB_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting KB MCP with Node.js..."
        if [ ! -f "$KB_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building KB MCP from local source (first time)..."
            (cd "$KB_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ KB MCP build failed. Library tools will not be available."
            }
        fi
        if [ -f "$KB_MCP_DIR/dist/http-server.js" ]; then
            PORT="$KB_MCP_PORT" \
                node "$KB_MCP_DIR/dist/http-server.js" > logs/kb-mcp.log 2>&1 &
            KB_MCP_PID=$!
            ./scripts/wait-for-port.sh "$KB_MCP_PORT" 15 "KB MCP" || {
                echo "  ⚠ KB MCP failed to start."
                kill "$KB_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$KB_MCP_PID" 2>/dev/null; then
                export KB_MCP_URL="http://localhost:${KB_MCP_PORT}/mcp"
                echo "✓ KB MCP started via Node.js on localhost:${KB_MCP_PORT}"
                KB_MCP_STARTED=true
            fi
        fi
    fi

    if ! $KB_MCP_STARTED; then
        echo "  ⚠ KB MCP could not be started. Library tools will not be available."
        echo "  Install Docker or Node.js to enable KB MCP."
    fi
fi
export KB_MCP_URL="${KB_MCP_URL:-}"

# Upphandlingsdata MCP Server — Swedish public procurement
UPPHANDLINGSDATA_MCP_PORT="${UPPHANDLINGSDATA_MCP_PORT:-3115}"
UPPHANDLINGSDATA_MCP_DIR="$REPO_ROOT/mcp-tools/upphandlingsdata-mcp"
if [ -n "${UPPHANDLINGSDATA_MCP_URL:-}" ]; then
    echo "✓ Upphandlingsdata MCP using remote instance: ${UPPHANDLINGSDATA_MCP_URL}"
elif [ -z "${UPPHANDLINGSDATA_MCP_URL:-}" ]; then
    echo "Starting Upphandlingsdata MCP server..."
    UPPHANDLINGSDATA_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $UPPHANDLINGSDATA_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-upphandlingsdata-mcp >/dev/null 2>&1; then
            echo "  Building Upphandlingsdata MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-upphandlingsdata-mcp -f docker/upphandlingsdata-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-upphandlingsdata-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-upphandlingsdata-mcp -p "${UPPHANDLINGSDATA_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                --restart unless-stopped deer-flow-upphandlingsdata-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$UPPHANDLINGSDATA_MCP_PORT" 30 "Upphandlingsdata MCP" || true
            if docker ps --filter name=deer-flow-upphandlingsdata-mcp --format '{{.Status}}' | grep -q "Up"; then
                export UPPHANDLINGSDATA_MCP_URL="http://localhost:${UPPHANDLINGSDATA_MCP_PORT}/mcp"
                echo "✓ Upphandlingsdata MCP started via Docker on localhost:${UPPHANDLINGSDATA_MCP_PORT}"
                UPPHANDLINGSDATA_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $UPPHANDLINGSDATA_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Upphandlingsdata MCP with Node.js..."
        if [ ! -f "$UPPHANDLINGSDATA_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building Upphandlingsdata MCP from local source (first time)..."
            (cd "$UPPHANDLINGSDATA_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Upphandlingsdata MCP build failed. Procurement tools will not be available."
            }
        fi
        if [ -f "$UPPHANDLINGSDATA_MCP_DIR/dist/http-server.js" ]; then
            PORT="$UPPHANDLINGSDATA_MCP_PORT" \
                node "$UPPHANDLINGSDATA_MCP_DIR/dist/http-server.js" > logs/upphandlingsdata-mcp.log 2>&1 &
            UPPHANDLINGSDATA_MCP_PID=$!
            ./scripts/wait-for-port.sh "$UPPHANDLINGSDATA_MCP_PORT" 15 "Upphandlingsdata MCP" || {
                echo "  ⚠ Upphandlingsdata MCP failed to start."
                kill "$UPPHANDLINGSDATA_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$UPPHANDLINGSDATA_MCP_PID" 2>/dev/null; then
                export UPPHANDLINGSDATA_MCP_URL="http://localhost:${UPPHANDLINGSDATA_MCP_PORT}/mcp"
                echo "✓ Upphandlingsdata MCP started via Node.js on localhost:${UPPHANDLINGSDATA_MCP_PORT}"
                UPPHANDLINGSDATA_MCP_STARTED=true
            fi
        fi
    fi

    if ! $UPPHANDLINGSDATA_MCP_STARTED; then
        echo "  ⚠ Upphandlingsdata MCP could not be started. Procurement tools will not be available."
        echo "  Install Docker or Node.js to enable Upphandlingsdata MCP."
    fi
fi
export UPPHANDLINGSDATA_MCP_URL="${UPPHANDLINGSDATA_MCP_URL:-}"

# OECD MCP Server — OECD statistical data via SDMX
OECD_MCP_PORT="${OECD_MCP_PORT:-3116}"
OECD_MCP_DIR="$REPO_ROOT/mcp-tools/oecd-mcp"
if [ -n "${OECD_MCP_URL:-}" ]; then
    echo "✓ OECD MCP using remote instance: ${OECD_MCP_URL}"
elif [ -z "${OECD_MCP_URL:-}" ]; then
    echo "Starting OECD MCP server..."
    OECD_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $OECD_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-oecd-mcp >/dev/null 2>&1; then
            echo "  Building OECD MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-oecd-mcp -f docker/oecd-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-oecd-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-oecd-mcp -p "${OECD_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                --restart unless-stopped deer-flow-oecd-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$OECD_MCP_PORT" 30 "OECD MCP" || true
            if docker ps --filter name=deer-flow-oecd-mcp --format '{{.Status}}' | grep -q "Up"; then
                export OECD_MCP_URL="http://localhost:${OECD_MCP_PORT}/mcp"
                echo "✓ OECD MCP started via Docker on localhost:${OECD_MCP_PORT}"
                OECD_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $OECD_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting OECD MCP with Node.js..."
        if [ ! -f "$OECD_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building OECD MCP from local source (first time)..."
            (cd "$OECD_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ OECD MCP build failed. OECD statistics tools will not be available."
            }
        fi
        if [ -f "$OECD_MCP_DIR/dist/http-server.js" ]; then
            PORT="$OECD_MCP_PORT" \
                node "$OECD_MCP_DIR/dist/http-server.js" > logs/oecd-mcp.log 2>&1 &
            OECD_MCP_PID=$!
            ./scripts/wait-for-port.sh "$OECD_MCP_PORT" 15 "OECD MCP" || {
                echo "  ⚠ OECD MCP failed to start."
                kill "$OECD_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$OECD_MCP_PID" 2>/dev/null; then
                export OECD_MCP_URL="http://localhost:${OECD_MCP_PORT}/mcp"
                echo "✓ OECD MCP started via Node.js on localhost:${OECD_MCP_PORT}"
                OECD_MCP_STARTED=true
            fi
        fi
    fi

    if ! $OECD_MCP_STARTED; then
        echo "  ⚠ OECD MCP could not be started. OECD statistics tools will not be available."
        echo "  Install Docker or Node.js to enable OECD MCP."
    fi
fi
export OECD_MCP_URL="${OECD_MCP_URL:-}"

# Trafikanalys MCP Server — Swedish transport statistics
TRAFIKANALYS_MCP_PORT="${TRAFIKANALYS_MCP_PORT:-3117}"
TRAFIKANALYS_MCP_DIR="$REPO_ROOT/mcp-tools/trafikanalys-mcp"
if [ -n "${TRAFIKANALYS_MCP_URL:-}" ]; then
    echo "✓ Trafikanalys MCP using remote instance: ${TRAFIKANALYS_MCP_URL}"
elif [ -z "${TRAFIKANALYS_MCP_URL:-}" ]; then
    echo "Starting Trafikanalys MCP server..."
    TRAFIKANALYS_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $TRAFIKANALYS_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-trafikanalys-mcp >/dev/null 2>&1; then
            echo "  Building Trafikanalys MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-trafikanalys-mcp -f docker/trafikanalys-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-trafikanalys-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-trafikanalys-mcp -p "${TRAFIKANALYS_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                --restart unless-stopped deer-flow-trafikanalys-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$TRAFIKANALYS_MCP_PORT" 30 "Trafikanalys MCP" || true
            if docker ps --filter name=deer-flow-trafikanalys-mcp --format '{{.Status}}' | grep -q "Up"; then
                export TRAFIKANALYS_MCP_URL="http://localhost:${TRAFIKANALYS_MCP_PORT}/mcp"
                echo "✓ Trafikanalys MCP started via Docker on localhost:${TRAFIKANALYS_MCP_PORT}"
                TRAFIKANALYS_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $TRAFIKANALYS_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Trafikanalys MCP with Node.js..."
        if [ ! -f "$TRAFIKANALYS_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building Trafikanalys MCP from local source (first time)..."
            (cd "$TRAFIKANALYS_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Trafikanalys MCP build failed. Transport statistics tools will not be available."
            }
        fi
        if [ -f "$TRAFIKANALYS_MCP_DIR/dist/http-server.js" ]; then
            PORT="$TRAFIKANALYS_MCP_PORT" \
                node "$TRAFIKANALYS_MCP_DIR/dist/http-server.js" > logs/trafikanalys-mcp.log 2>&1 &
            TRAFIKANALYS_MCP_PID=$!
            ./scripts/wait-for-port.sh "$TRAFIKANALYS_MCP_PORT" 15 "Trafikanalys MCP" || {
                echo "  ⚠ Trafikanalys MCP failed to start."
                kill "$TRAFIKANALYS_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$TRAFIKANALYS_MCP_PID" 2>/dev/null; then
                export TRAFIKANALYS_MCP_URL="http://localhost:${TRAFIKANALYS_MCP_PORT}/mcp"
                echo "✓ Trafikanalys MCP started via Node.js on localhost:${TRAFIKANALYS_MCP_PORT}"
                TRAFIKANALYS_MCP_STARTED=true
            fi
        fi
    fi

    if ! $TRAFIKANALYS_MCP_STARTED; then
        echo "  ⚠ Trafikanalys MCP could not be started. Transport statistics tools will not be available."
        echo "  Install Docker or Node.js to enable Trafikanalys MCP."
    fi
fi
export TRAFIKANALYS_MCP_URL="${TRAFIKANALYS_MCP_URL:-}"

# Visit Sweden MCP Server — Swedish tourism data
VISITSWEDEN_MCP_PORT="${VISITSWEDEN_MCP_PORT:-3118}"
VISITSWEDEN_MCP_DIR="$REPO_ROOT/mcp-tools/visitsweden-mcp"
if [ -n "${VISITSWEDEN_MCP_URL:-}" ]; then
    echo "✓ Visit Sweden MCP using remote instance: ${VISITSWEDEN_MCP_URL}"
elif [ -z "${VISITSWEDEN_MCP_URL:-}" ]; then
    echo "Starting Visit Sweden MCP server..."
    VISITSWEDEN_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $VISITSWEDEN_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-visitsweden-mcp >/dev/null 2>&1; then
            echo "  Building Visit Sweden MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-visitsweden-mcp -f docker/visitsweden-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-visitsweden-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-visitsweden-mcp -p "${VISITSWEDEN_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                --restart unless-stopped deer-flow-visitsweden-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$VISITSWEDEN_MCP_PORT" 30 "Visit Sweden MCP" || true
            if docker ps --filter name=deer-flow-visitsweden-mcp --format '{{.Status}}' | grep -q "Up"; then
                export VISITSWEDEN_MCP_URL="http://localhost:${VISITSWEDEN_MCP_PORT}/mcp"
                echo "✓ Visit Sweden MCP started via Docker on localhost:${VISITSWEDEN_MCP_PORT}"
                VISITSWEDEN_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $VISITSWEDEN_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Visit Sweden MCP with Node.js..."
        if [ ! -f "$VISITSWEDEN_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building Visit Sweden MCP from local source (first time)..."
            (cd "$VISITSWEDEN_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Visit Sweden MCP build failed. Tourism tools will not be available."
            }
        fi
        if [ -f "$VISITSWEDEN_MCP_DIR/dist/http-server.js" ]; then
            PORT="$VISITSWEDEN_MCP_PORT" \
                node "$VISITSWEDEN_MCP_DIR/dist/http-server.js" > logs/visitsweden-mcp.log 2>&1 &
            VISITSWEDEN_MCP_PID=$!
            ./scripts/wait-for-port.sh "$VISITSWEDEN_MCP_PORT" 15 "Visit Sweden MCP" || {
                echo "  ⚠ Visit Sweden MCP failed to start."
                kill "$VISITSWEDEN_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$VISITSWEDEN_MCP_PID" 2>/dev/null; then
                export VISITSWEDEN_MCP_URL="http://localhost:${VISITSWEDEN_MCP_PORT}/mcp"
                echo "✓ Visit Sweden MCP started via Node.js on localhost:${VISITSWEDEN_MCP_PORT}"
                VISITSWEDEN_MCP_STARTED=true
            fi
        fi
    fi

    if ! $VISITSWEDEN_MCP_STARTED; then
        echo "  ⚠ Visit Sweden MCP could not be started. Tourism tools will not be available."
        echo "  Install Docker or Node.js to enable Visit Sweden MCP."
    fi
fi
export VISITSWEDEN_MCP_URL="${VISITSWEDEN_MCP_URL:-}"

# Krisinformation MCP Server — Swedish crisis information
KRISINFORMATION_MCP_PORT="${KRISINFORMATION_MCP_PORT:-3119}"
KRISINFORMATION_MCP_DIR="$REPO_ROOT/mcp-tools/krisinformation-mcp"
if [ -n "${KRISINFORMATION_MCP_URL:-}" ]; then
    echo "✓ Krisinformation MCP using remote instance: ${KRISINFORMATION_MCP_URL}"
elif [ -z "${KRISINFORMATION_MCP_URL:-}" ]; then
    echo "Starting Krisinformation MCP server..."
    KRISINFORMATION_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $KRISINFORMATION_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-krisinformation-mcp >/dev/null 2>&1; then
            echo "  Building Krisinformation MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-krisinformation-mcp -f docker/krisinformation-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-krisinformation-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-krisinformation-mcp -p "${KRISINFORMATION_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                --restart unless-stopped deer-flow-krisinformation-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$KRISINFORMATION_MCP_PORT" 30 "Krisinformation MCP" || true
            if docker ps --filter name=deer-flow-krisinformation-mcp --format '{{.Status}}' | grep -q "Up"; then
                export KRISINFORMATION_MCP_URL="http://localhost:${KRISINFORMATION_MCP_PORT}/mcp"
                echo "✓ Krisinformation MCP started via Docker on localhost:${KRISINFORMATION_MCP_PORT}"
                KRISINFORMATION_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $KRISINFORMATION_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Krisinformation MCP with Node.js..."
        if [ ! -f "$KRISINFORMATION_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building Krisinformation MCP from local source (first time)..."
            (cd "$KRISINFORMATION_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Krisinformation MCP build failed. Crisis information tools will not be available."
            }
        fi
        if [ -f "$KRISINFORMATION_MCP_DIR/dist/http-server.js" ]; then
            PORT="$KRISINFORMATION_MCP_PORT" \
                node "$KRISINFORMATION_MCP_DIR/dist/http-server.js" > logs/krisinformation-mcp.log 2>&1 &
            KRISINFORMATION_MCP_PID=$!
            ./scripts/wait-for-port.sh "$KRISINFORMATION_MCP_PORT" 15 "Krisinformation MCP" || {
                echo "  ⚠ Krisinformation MCP failed to start."
                kill "$KRISINFORMATION_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$KRISINFORMATION_MCP_PID" 2>/dev/null; then
                export KRISINFORMATION_MCP_URL="http://localhost:${KRISINFORMATION_MCP_PORT}/mcp"
                echo "✓ Krisinformation MCP started via Node.js on localhost:${KRISINFORMATION_MCP_PORT}"
                KRISINFORMATION_MCP_STARTED=true
            fi
        fi
    fi

    if ! $KRISINFORMATION_MCP_STARTED; then
        echo "  ⚠ Krisinformation MCP could not be started. Crisis information tools will not be available."
        echo "  Install Docker or Node.js to enable Krisinformation MCP."
    fi
fi
export KRISINFORMATION_MCP_URL="${KRISINFORMATION_MCP_URL:-}"

# Polisen MCP Server — Swedish police events
POLISEN_MCP_PORT="${POLISEN_MCP_PORT:-3120}"
POLISEN_MCP_DIR="$REPO_ROOT/mcp-tools/polisen-mcp"
if [ -n "${POLISEN_MCP_URL:-}" ]; then
    echo "✓ Polisen MCP using remote instance: ${POLISEN_MCP_URL}"
elif [ -z "${POLISEN_MCP_URL:-}" ]; then
    echo "Starting Polisen MCP server..."
    POLISEN_MCP_STARTED=false

    # Strategy 1: Docker container
    if ! $POLISEN_MCP_STARTED && command -v docker >/dev/null 2>&1; then
        if ! docker image inspect deer-flow-polisen-mcp >/dev/null 2>&1; then
            echo "  Building Polisen MCP Docker image (first time, may take a minute)..."
            docker build -t deer-flow-polisen-mcp -f docker/polisen-mcp/Dockerfile . > /dev/null 2>&1 || true
        fi
        if docker image inspect deer-flow-polisen-mcp >/dev/null 2>&1; then
            docker run -d --name deer-flow-polisen-mcp -p "${POLISEN_MCP_PORT}:3000" \
                -e PORT=3000 -e NODE_ENV=production \
                --restart unless-stopped deer-flow-polisen-mcp > /dev/null 2>&1
            ./scripts/wait-for-port.sh "$POLISEN_MCP_PORT" 30 "Polisen MCP" || true
            if docker ps --filter name=deer-flow-polisen-mcp --format '{{.Status}}' | grep -q "Up"; then
                export POLISEN_MCP_URL="http://localhost:${POLISEN_MCP_PORT}/mcp"
                echo "✓ Polisen MCP started via Docker on localhost:${POLISEN_MCP_PORT}"
                POLISEN_MCP_STARTED=true
            fi
        fi
    fi

    # Strategy 2: Native Node.js (fallback when Docker unavailable)
    if ! $POLISEN_MCP_STARTED && command -v node >/dev/null 2>&1; then
        echo "  Docker unavailable, starting Polisen MCP with Node.js..."
        if [ ! -f "$POLISEN_MCP_DIR/dist/http-server.js" ]; then
            echo "  Building Polisen MCP from local source (first time)..."
            (cd "$POLISEN_MCP_DIR" && npm ci > /dev/null 2>&1 && npm run build > /dev/null 2>&1) || {
                echo "  ⚠ Polisen MCP build failed. Police event tools will not be available."
            }
        fi
        if [ -f "$POLISEN_MCP_DIR/dist/http-server.js" ]; then
            PORT="$POLISEN_MCP_PORT" \
                node "$POLISEN_MCP_DIR/dist/http-server.js" > logs/polisen-mcp.log 2>&1 &
            POLISEN_MCP_PID=$!
            ./scripts/wait-for-port.sh "$POLISEN_MCP_PORT" 15 "Polisen MCP" || {
                echo "  ⚠ Polisen MCP failed to start."
                kill "$POLISEN_MCP_PID" 2>/dev/null || true
            }
            if kill -0 "$POLISEN_MCP_PID" 2>/dev/null; then
                export POLISEN_MCP_URL="http://localhost:${POLISEN_MCP_PORT}/mcp"
                echo "✓ Polisen MCP started via Node.js on localhost:${POLISEN_MCP_PORT}"
                POLISEN_MCP_STARTED=true
            fi
        fi
    fi

    if ! $POLISEN_MCP_STARTED; then
        echo "  ⚠ Polisen MCP could not be started. Police event tools will not be available."
        echo "  Install Docker or Node.js to enable Polisen MCP."
    fi
fi
export POLISEN_MCP_URL="${POLISEN_MCP_URL:-}"

# Export filesystem allowed path for MCP filesystem server (per-thread workspaces live here)
DEER_FLOW_BASE="${DEER_FLOW_HOME:-$REPO_ROOT/backend/.deer-flow}"
mkdir -p "$DEER_FLOW_BASE"
export FILESYSTEM_ALLOWED_PATH="$DEER_FLOW_BASE"

# Install gomcp MCP server if not present
if [ ! -f "$REPO_ROOT/bin/gomcp" ]; then
    echo "Installing gomcp MCP server for Lightpanda..."
    "$REPO_ROOT/scripts/install-gomcp.sh" || {
        echo "  ⚠ gomcp installation failed. MCP browser tools will not be available."
        echo "  Community tool fallbacks (web_search, web_fetch) will still work."
    }
fi

echo "Starting LangGraph server..."
(cd backend && NO_COLOR=1 uv run langgraph dev --no-browser --allow-blocking $LANGGRAPH_EXTRA_FLAGS > ../logs/langgraph.log 2>&1) &
./scripts/wait-for-port.sh 2024 60 "LangGraph" || {
    echo "  See logs/langgraph.log for details"
    tail -20 logs/langgraph.log
    cleanup
}
echo "✓ LangGraph server started on localhost:2024"

echo "Starting Gateway API..."
(cd backend && uv run uvicorn src.gateway.app:app --host 0.0.0.0 --port 8001 $GATEWAY_EXTRA_FLAGS > ../logs/gateway.log 2>&1) &
./scripts/wait-for-port.sh 8001 30 "Gateway API" || {
    echo "✗ Gateway API failed to start. Last log output:"
    tail -60 logs/gateway.log
    echo ""
    echo "Likely configuration errors:"
    grep -E "Failed to load configuration|Environment variable .* not found|config\.yaml.*not found" logs/gateway.log | tail -5 || true
    cleanup
}
echo "✓ Gateway API started on localhost:8001"

echo "Starting Frontend..."
(cd frontend && $FRONTEND_CMD > ../logs/frontend.log 2>&1) &
./scripts/wait-for-port.sh 3000 120 "Frontend" || {
    echo "  See logs/frontend.log for details"
    tail -20 logs/frontend.log
    cleanup
}
echo "✓ Frontend started on localhost:3000"

echo "Starting Nginx reverse proxy..."
nginx -g 'daemon off;' -c "$REPO_ROOT/docker/nginx/nginx.local.conf" -p "$REPO_ROOT" > logs/nginx.log 2>&1 &
NGINX_PID=$!
./scripts/wait-for-port.sh 2026 10 "Nginx" || {
    echo "  See logs/nginx.log for details"
    tail -10 logs/nginx.log
    cleanup
}
echo "✓ Nginx started on localhost:2026"

# ── Ready ─────────────────────────────────────────────────────────────────────

echo ""
echo "=========================================="
if $DEV_MODE; then
    echo "  ✓ DeerFlow development server is running!"
else
    echo "  ✓ DeerFlow production server is running!"
fi
echo "=========================================="
echo ""
echo "  🌐 Application:  http://localhost:2026"
echo "  📡 API Gateway:  http://localhost:2026/api/*"
echo "  🤖 LangGraph:    http://localhost:2026/api/langgraph/*"
echo "  🌍 Lightpanda:   http://localhost:${LIGHTPANDA_PORT:-9222}"
if [ -n "${SCB_MCP_URL:-}" ]; then
    echo "  📊 SCB MCP:      ${SCB_MCP_URL}"
else
    echo "  📊 SCB MCP:      (ej konfigurerad)"
fi
if [ -n "${SKOLVERKET_MCP_URL:-}" ]; then
    echo "  🎓 Skolverket:   ${SKOLVERKET_MCP_URL}"
else
    echo "  🎓 Skolverket:   (ej konfigurerad)"
fi
if [ -n "${TRAFIKVERKET_MCP_URL:-}" ]; then
    echo "  🚦 Trafikverket: ${TRAFIKVERKET_MCP_URL}"
else
    echo "  🚦 Trafikverket: (ej konfigurerad)"
fi
if [ -n "${RIKSBANK_MCP_URL:-}" ]; then
    echo "  💰 Riksbank:     ${RIKSBANK_MCP_URL}"
else
    echo "  💰 Riksbank:     (ej konfigurerad)"
fi
if [ -n "${SMHI_MCP_URL:-}" ]; then
    echo "  🌤️ SMHI:         ${SMHI_MCP_URL}"
else
    echo "  🌤️ SMHI:         (ej konfigurerad)"
fi
if [ -n "${LIGHTPANDA_MCP_URL:-}" ]; then
    echo "  🌐 Lightpanda:   ${LIGHTPANDA_MCP_URL}"
else
    echo "  🌐 Lightpanda:   (ej konfigurerad)"
fi
if [ -n "${ELPRIS_MCP_URL:-}" ]; then
    echo "  ⚡ Elpris:       ${ELPRIS_MCP_URL}"
else
    echo "  ⚡ Elpris:       (ej konfigurerad)"
fi
if [ -n "${BOLAGSVERKET_MCP_URL:-}" ]; then
    echo "  🏢 Bolagsverket: ${BOLAGSVERKET_MCP_URL}"
else
    echo "  🏢 Bolagsverket: (ej konfigurerad)"
fi
if [ -n "${GOOGLE_MAPS_MCP_URL:-}" ]; then
    echo "  🗺️ Google Maps: ${GOOGLE_MAPS_MCP_URL}"
else
    echo "  🗺️ Google Maps: (ej konfigurerad)"
fi
if [ -n "${AVANZA_MCP_URL:-}" ]; then
    echo "  📈 Avanza:       ${AVANZA_MCP_URL}"
else
    echo "  📈 Avanza:       (ej konfigurerad)"
fi
if [ -n "${BLOCKET_TRADERA_MCP_URL:-}" ]; then
    echo "  🛒 Blocket:      ${BLOCKET_TRADERA_MCP_URL}"
else
    echo "  🛒 Blocket:      (ej konfigurerad)"
fi
if [ -n "${RIKSDAG_MCP_URL:-}" ]; then
    echo "  🏛️ Riksdag:      ${RIKSDAG_MCP_URL}"
else
    echo "  🏛️ Riksdag:      (ej konfigurerad)"
fi
if [ -n "${NVV_MCP_URL:-}" ]; then
    echo "  🌿 NVV:          ${NVV_MCP_URL}"
else
    echo "  🌿 NVV:          (ej konfigurerad)"
fi
if [ -n "${KOLADA_MCP_URL:-}" ]; then
    echo "  📊 Kolada:       ${KOLADA_MCP_URL}"
else
    echo "  📊 Kolada:       (ej konfigurerad)"
fi
if [ -n "${KB_MCP_URL:-}" ]; then
    echo "  📚 KB:           ${KB_MCP_URL}"
else
    echo "  📚 KB:           (ej konfigurerad)"
fi
if [ -n "${UPPHANDLINGSDATA_MCP_URL:-}" ]; then
    echo "  📋 Upphandling:  ${UPPHANDLINGSDATA_MCP_URL}"
else
    echo "  📋 Upphandling:  (ej konfigurerad)"
fi
if [ -n "${OECD_MCP_URL:-}" ]; then
    echo "  🌍 OECD:         ${OECD_MCP_URL}"
else
    echo "  🌍 OECD:         (ej konfigurerad)"
fi
if [ -n "${TRAFIKANALYS_MCP_URL:-}" ]; then
    echo "  🚗 Trafikanalys: ${TRAFIKANALYS_MCP_URL}"
else
    echo "  🚗 Trafikanalys: (ej konfigurerad)"
fi
if [ -n "${VISITSWEDEN_MCP_URL:-}" ]; then
    echo "  🏔️ Visit Sweden: ${VISITSWEDEN_MCP_URL}"
else
    echo "  🏔️ Visit Sweden: (ej konfigurerad)"
fi
if [ -n "${KRISINFORMATION_MCP_URL:-}" ]; then
    echo "  🚨 Krisinformation: ${KRISINFORMATION_MCP_URL}"
else
    echo "  🚨 Krisinformation: (ej konfigurerad)"
fi
if [ -n "${POLISEN_MCP_URL:-}" ]; then
    echo "  👮 Polisen:      ${POLISEN_MCP_URL}"
else
    echo "  👮 Polisen:      (ej konfigurerad)"
fi
echo ""
echo "  📋 Logs:"
echo "     - LangGraph:   logs/langgraph.log"
echo "     - Gateway:     logs/gateway.log"
echo "     - Frontend:    logs/frontend.log"
echo "     - Nginx:       logs/nginx.log"
echo "     - Lightpanda:  docker logs deer-flow-lightpanda"
if [ -n "${SCB_MCP_PID:-}" ]; then
    echo "     - SCB MCP:     logs/scb-mcp.log"
elif [ -z "${SCB_MCP_URL:-}" ] || echo "${SCB_MCP_URL}" | grep -q "localhost"; then
    echo "     - SCB MCP:     docker logs deer-flow-scb-mcp"
fi
if [ -n "${SKOLVERKET_MCP_PID:-}" ]; then
    echo "     - Skolverket:  logs/skolverket-mcp.log"
elif [ -z "${SKOLVERKET_MCP_URL:-}" ] || echo "${SKOLVERKET_MCP_URL}" | grep -q "localhost"; then
    echo "     - Skolverket:  docker logs deer-flow-skolverket-mcp"
fi
if [ -n "${TRAFIKVERKET_MCP_PID:-}" ]; then
    echo "     - Trafikverket: logs/trafikverket-mcp.log"
elif [ -z "${TRAFIKVERKET_MCP_URL:-}" ] || echo "${TRAFIKVERKET_MCP_URL}" | grep -q "localhost"; then
    echo "     - Trafikverket: docker logs deer-flow-trafikverket-mcp"
fi
if [ -n "${RIKSBANK_MCP_PID:-}" ]; then
    echo "     - Riksbank:    logs/riksbank-mcp.log"
elif [ -z "${RIKSBANK_MCP_URL:-}" ] || echo "${RIKSBANK_MCP_URL}" | grep -q "localhost"; then
    echo "     - Riksbank:    docker logs deer-flow-riksbank-mcp"
fi
if [ -n "${SMHI_MCP_PID:-}" ]; then
    echo "     - SMHI:        logs/smhi-mcp.log"
elif [ -z "${SMHI_MCP_URL:-}" ] || echo "${SMHI_MCP_URL}" | grep -q "localhost"; then
    echo "     - SMHI:        docker logs deer-flow-smhi-mcp"
fi
if [ -n "${LIGHTPANDA_MCP_PID:-}" ]; then
    echo "     - Lightpanda:  logs/lightpanda-mcp.log"
elif [ -z "${LIGHTPANDA_MCP_URL:-}" ] || echo "${LIGHTPANDA_MCP_URL}" | grep -q "localhost"; then
    echo "     - Lightpanda:  docker logs deer-flow-lightpanda-mcp"
fi
if [ -n "${ELPRIS_MCP_PID:-}" ]; then
    echo "     - Elpris:      logs/elpris-mcp.log"
elif [ -z "${ELPRIS_MCP_URL:-}" ] || echo "${ELPRIS_MCP_URL}" | grep -q "localhost"; then
    echo "     - Elpris:      docker logs deer-flow-elpris-mcp"
fi
if [ -n "${BOLAGSVERKET_MCP_PID:-}" ]; then
    echo "     - Bolagsverket: logs/bolagsverket-mcp.log"
elif [ -z "${BOLAGSVERKET_MCP_URL:-}" ] || echo "${BOLAGSVERKET_MCP_URL}" | grep -q "localhost"; then
    echo "     - Bolagsverket: docker logs deer-flow-bolagsverket-mcp"
fi
if [ -n "${GOOGLE_MAPS_MCP_PID:-}" ]; then
    echo "     - Google Maps: logs/google-maps-mcp.log"
elif [ -z "${GOOGLE_MAPS_MCP_URL:-}" ] || echo "${GOOGLE_MAPS_MCP_URL}" | grep -q "localhost"; then
    echo "     - Google Maps: docker logs deer-flow-google-maps-mcp"
fi
if [ -n "${AVANZA_MCP_PID:-}" ]; then
    echo "     - Avanza:      logs/avanza-mcp.log"
elif [ -z "${AVANZA_MCP_URL:-}" ] || echo "${AVANZA_MCP_URL}" | grep -q "localhost"; then
    echo "     - Avanza:      docker logs deer-flow-avanza-mcp"
fi
if [ -n "${BLOCKET_TRADERA_MCP_PID:-}" ]; then
    echo "     - Blocket:     logs/blocket-tradera-mcp.log"
elif [ -z "${BLOCKET_TRADERA_MCP_URL:-}" ] || echo "${BLOCKET_TRADERA_MCP_URL}" | grep -q "localhost"; then
    echo "     - Blocket:     docker logs deer-flow-blocket-tradera-mcp"
fi
if [ -n "${RIKSDAG_MCP_PID:-}" ]; then
    echo "     - Riksdag:     logs/riksdag-mcp.log"
elif [ -z "${RIKSDAG_MCP_URL:-}" ] || echo "${RIKSDAG_MCP_URL}" | grep -q "localhost"; then
    echo "     - Riksdag:     docker logs deer-flow-riksdag-mcp"
fi
if [ -n "${NVV_MCP_PID:-}" ]; then
    echo "     - NVV:         logs/nvv-mcp.log"
elif [ -z "${NVV_MCP_URL:-}" ] || echo "${NVV_MCP_URL}" | grep -q "localhost"; then
    echo "     - NVV:         docker logs deer-flow-nvv-mcp"
fi
if [ -n "${KOLADA_MCP_PID:-}" ]; then
    echo "     - Kolada:      logs/kolada-mcp.log"
elif [ -z "${KOLADA_MCP_URL:-}" ] || echo "${KOLADA_MCP_URL}" | grep -q "localhost"; then
    echo "     - Kolada:      docker logs deer-flow-kolada-mcp"
fi
if [ -n "${KB_MCP_PID:-}" ]; then
    echo "     - KB:          logs/kb-mcp.log"
elif [ -z "${KB_MCP_URL:-}" ] || echo "${KB_MCP_URL}" | grep -q "localhost"; then
    echo "     - KB:          docker logs deer-flow-kb-mcp"
fi
if [ -n "${UPPHANDLINGSDATA_MCP_PID:-}" ]; then
    echo "     - Upphandling: logs/upphandlingsdata-mcp.log"
elif [ -z "${UPPHANDLINGSDATA_MCP_URL:-}" ] || echo "${UPPHANDLINGSDATA_MCP_URL}" | grep -q "localhost"; then
    echo "     - Upphandling: docker logs deer-flow-upphandlingsdata-mcp"
fi
if [ -n "${OECD_MCP_PID:-}" ]; then
    echo "     - OECD:        logs/oecd-mcp.log"
elif [ -z "${OECD_MCP_URL:-}" ] || echo "${OECD_MCP_URL}" | grep -q "localhost"; then
    echo "     - OECD:        docker logs deer-flow-oecd-mcp"
fi
if [ -n "${TRAFIKANALYS_MCP_PID:-}" ]; then
    echo "     - Trafikanalys: logs/trafikanalys-mcp.log"
elif [ -z "${TRAFIKANALYS_MCP_URL:-}" ] || echo "${TRAFIKANALYS_MCP_URL}" | grep -q "localhost"; then
    echo "     - Trafikanalys: docker logs deer-flow-trafikanalys-mcp"
fi
if [ -n "${VISITSWEDEN_MCP_PID:-}" ]; then
    echo "     - Visit Sweden: logs/visitsweden-mcp.log"
elif [ -z "${VISITSWEDEN_MCP_URL:-}" ] || echo "${VISITSWEDEN_MCP_URL}" | grep -q "localhost"; then
    echo "     - Visit Sweden: docker logs deer-flow-visitsweden-mcp"
fi
if [ -n "${KRISINFORMATION_MCP_PID:-}" ]; then
    echo "     - Krisinformation: logs/krisinformation-mcp.log"
elif [ -z "${KRISINFORMATION_MCP_URL:-}" ] || echo "${KRISINFORMATION_MCP_URL}" | grep -q "localhost"; then
    echo "     - Krisinformation: docker logs deer-flow-krisinformation-mcp"
fi
if [ -n "${POLISEN_MCP_PID:-}" ]; then
    echo "     - Polisen:     logs/polisen-mcp.log"
elif [ -z "${POLISEN_MCP_URL:-}" ] || echo "${POLISEN_MCP_URL}" | grep -q "localhost"; then
    echo "     - Polisen:     docker logs deer-flow-polisen-mcp"
fi
echo ""
echo "Press Ctrl+C to stop all services"

wait
