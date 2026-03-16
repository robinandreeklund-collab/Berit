#!/bin/sh
set -e

echo "[entrypoint] Starting Lightpanda browser on port 9222..."
lightpanda --host 127.0.0.1 --port 9222 &
BROWSER_PID=$!

# Wait for browser to be ready (up to 10 seconds)
for i in $(seq 1 20); do
  if wget -q -O /dev/null http://127.0.0.1:9222/json/version 2>/dev/null; then
    echo "[entrypoint] Lightpanda browser is ready (PID=$BROWSER_PID)"
    break
  fi
  if [ "$i" -eq 20 ]; then
    echo "[entrypoint] WARNING: Lightpanda browser did not become ready in 10s, starting MCP server anyway"
  fi
  sleep 0.5
done

echo "[entrypoint] Starting MCP server on port ${PORT:-3000}..."
exec node dist/http-server.js
