#!/usr/bin/env bash
#
# start-daemon.sh - Start all DeerFlow development services in daemon mode
#
# This script starts DeerFlow services in the background without keeping
# the terminal connection. Logs are written to separate files.
#
# Must be run from the repo root directory.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ── Stop existing services ────────────────────────────────────────────────────

echo "Stopping existing services if any..."
pkill -f "langgraph dev" 2>/dev/null || true
pkill -f "uvicorn src.gateway.app:app" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
nginx -c "$REPO_ROOT/docker/nginx/nginx.local.conf" -p "$REPO_ROOT" -s quit 2>/dev/null || true
sleep 2
# Force-kill anything that didn't respond to SIGTERM
pkill -9 -f "langgraph dev" 2>/dev/null || true
pkill -9 -f "langgraph_api" 2>/dev/null || true
pkill -9 -f "uvicorn src.gateway.app:app" 2>/dev/null || true
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 nginx 2>/dev/null || true
# Kill any remaining processes on service ports (catches zombie python processes)
for port in 2024 8001 3000 2026; do
    fuser -k "$port/tcp" 2>/dev/null || true
done
docker stop deer-flow-lightpanda 2>/dev/null || true
docker rm deer-flow-lightpanda 2>/dev/null || true
./scripts/cleanup-containers.sh deer-flow-sandbox 2>/dev/null || true
sleep 1

# ── Banner ────────────────────────────────────────────────────────────────────

echo ""
echo "=========================================="
echo " Starting DeerFlow in Daemon Mode"
echo "=========================================="
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

# Ensure extensions_config.json exists (MCP servers + skills)
if [ ! -f "$REPO_ROOT/extensions_config.json" ] && [ -f "$REPO_ROOT/extensions_config.example.json" ]; then
    echo "Creating extensions_config.json from example..."
    cp "$REPO_ROOT/extensions_config.example.json" "$REPO_ROOT/extensions_config.json"
fi

# ── Cleanup on failure ───────────────────────────────────────────────────────

cleanup_on_failure() {
    echo "Failed to start services, cleaning up..."
    pkill -f "langgraph dev" 2>/dev/null || true
    pkill -f "uvicorn src.gateway.app:app" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    nginx -c "$REPO_ROOT/docker/nginx/nginx.local.conf" -p "$REPO_ROOT" -s quit 2>/dev/null || true
    sleep 2
    # Force-kill anything that didn't respond to SIGTERM
    pkill -9 -f "langgraph dev" 2>/dev/null || true
    pkill -9 -f "langgraph_api" 2>/dev/null || true
    pkill -9 -f "uvicorn src.gateway.app:app" 2>/dev/null || true
    pkill -9 -f "next dev" 2>/dev/null || true
    pkill -9 nginx 2>/dev/null || true
    # Kill any remaining processes on service ports
    for port in 2024 8001 3000 2026; do
        fuser -k "$port/tcp" 2>/dev/null || true
    done
    echo "✓ Cleanup complete"
}

trap cleanup_on_failure INT TERM

# ── Start services ────────────────────────────────────────────────────────────

mkdir -p logs

LIGHTPANDA_PORT="${LIGHTPANDA_PORT:-9222}"
echo "Starting Lightpanda headless browser..."
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
fi
export LIGHTPANDA_URL="http://localhost:${LIGHTPANDA_PORT}"

# Install gomcp MCP server if not present
if [ ! -f "$REPO_ROOT/bin/gomcp" ]; then
    echo "Installing gomcp MCP server for Lightpanda..."
    "$REPO_ROOT/scripts/install-gomcp.sh" || {
        echo "  ⚠ gomcp installation failed. MCP browser tools will not be available."
    }
fi

echo "Starting LangGraph server..."
nohup sh -c 'cd backend && NO_COLOR=1 uv run langgraph dev --no-browser --allow-blocking --no-reload > ../logs/langgraph.log 2>&1' &
./scripts/wait-for-port.sh 2024 60 "LangGraph" || {
    echo "✗ LangGraph failed to start. Last log output:"
    tail -60 logs/langgraph.log
    cleanup_on_failure
    exit 1
}
echo "✓ LangGraph server started on localhost:2024"

echo "Starting Gateway API..."
nohup sh -c 'cd backend && uv run uvicorn src.gateway.app:app --host 0.0.0.0 --port 8001 > ../logs/gateway.log 2>&1' &
./scripts/wait-for-port.sh 8001 30 "Gateway API" || {
    echo "✗ Gateway API failed to start. Last log output:"
    tail -60 logs/gateway.log
    cleanup_on_failure
    exit 1
}
echo "✓ Gateway API started on localhost:8001"

echo "Starting Frontend..."
nohup sh -c 'cd frontend && pnpm run dev > ../logs/frontend.log 2>&1' &
./scripts/wait-for-port.sh 3000 120 "Frontend" || {
    echo "✗ Frontend failed to start. Last log output:"
    tail -60 logs/frontend.log
    cleanup_on_failure
    exit 1
}
echo "✓ Frontend started on localhost:3000"

echo "Starting Nginx reverse proxy..."
nohup sh -c 'nginx -g "daemon off;" -c "$1/docker/nginx/nginx.local.conf" -p "$1" > logs/nginx.log 2>&1' _ "$REPO_ROOT" &
./scripts/wait-for-port.sh 2026 10 "Nginx" || {
    echo "✗ Nginx failed to start. Last log output:"
    tail -60 logs/nginx.log
    cleanup_on_failure
    exit 1
}
echo "✓ Nginx started on localhost:2026"

# ── Ready ─────────────────────────────────────────────────────────────────────

echo ""
echo "=========================================="
echo " DeerFlow is running in daemon mode!"
echo "=========================================="
echo ""
echo " 🌐 Application:  http://localhost:2026"
echo " 📡 API Gateway:  http://localhost:2026/api/*"
echo " 🤖 LangGraph:    http://localhost:2026/api/langgraph/*"
echo " 🌍 Lightpanda:   http://localhost:${LIGHTPANDA_PORT:-9222}"
echo ""
echo " 📋 Logs:"
echo " - LangGraph:   logs/langgraph.log"
echo " - Gateway:     logs/gateway.log"
echo " - Frontend:    logs/frontend.log"
echo " - Nginx:       logs/nginx.log"
echo " - Lightpanda:  docker logs deer-flow-lightpanda"
echo ""
echo " 🛑 Stop daemon: make stop"
echo ""
