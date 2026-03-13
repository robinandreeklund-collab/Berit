#!/usr/bin/env bash
#
# run-gomcp.sh - Wrapper to launch gomcp with the correct CDP URL
#
# Respects LIGHTPANDA_CDP_URL environment variable for the WebSocket endpoint.
# Defaults to ws://localhost:9222 for local development.
#
# Usage: ./scripts/run-gomcp.sh [extra-gomcp-args...]

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GOMCP_BIN="$REPO_ROOT/bin/gomcp"

CDP_URL="${LIGHTPANDA_CDP_URL:-ws://localhost:9222}"

if [ ! -f "$GOMCP_BIN" ]; then
    echo "gomcp not found at $GOMCP_BIN. Run: ./scripts/install-gomcp.sh" >&2
    exit 1
fi

exec "$GOMCP_BIN" -cdp "$CDP_URL" stdio "$@"
