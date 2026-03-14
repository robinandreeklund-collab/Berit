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
for port in 2024 8001 3000 2026 3100 3101 3102 3103 3104 3105; do
    fuser -k "$port/tcp" 2>/dev/null || true
done
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
    # Kill any remaining processes on service ports (catches zombie python processes)
    for port in 2024 8001 3000 2026 3100 3101 3102 3103 3104 3105; do
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
echo ""
echo "Press Ctrl+C to stop all services"

wait
