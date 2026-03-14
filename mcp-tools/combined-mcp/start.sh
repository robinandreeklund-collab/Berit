#!/bin/sh
set -e

PORT="${PORT:-10000}"
export PORT

echo "=== Combined MCP Server ==="
echo "Port: $PORT"
echo "SCB MCP:          internal :3001 → /"
echo "Skolverket MCP:   internal :3002 → /skolverket/"
echo "Trafikverket MCP: internal :3003 → /trafikverket/"
echo "Riksbank MCP:     internal :3004 → /riksbank/"
echo "SMHI MCP:         internal :3005 → /smhi/"
echo "Lightpanda MCP:   internal :3006 → /lightpanda/"
echo "Elpris MCP:       internal :3007 → /elpris/"
echo "Bolagsverket MCP: internal :3008 → /bolagsverket/"
echo "Google Maps MCP:  internal :3009 → /google-maps/"
echo "Blocket/Tradera:  internal :3010 → /blocket-tradera/"

# Generate nginx config with actual PORT
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start SCB MCP on port 3001
echo "Starting SCB MCP on :3001..."
PORT=3001 node /app/scb/dist/http-server.js &
SCB_PID=$!

# Start Skolverket MCP on port 3002
echo "Starting Skolverket MCP on :3002..."
PORT=3002 node /app/skolverket/dist/streamable-http-server.js &
SKOLVERKET_PID=$!

# Start Trafikverket MCP on port 3003
echo "Starting Trafikverket MCP on :3003..."
PORT=3003 node /app/trafikverket/dist/http-server.js &
TRAFIKVERKET_PID=$!

# Start Riksbank MCP on port 3004
echo "Starting Riksbank MCP on :3004..."
PORT=3004 node /app/riksbank/dist/http-server.js &
RIKSBANK_PID=$!

# Start SMHI MCP on port 3005
echo "Starting SMHI MCP on :3005..."
PORT=3005 node /app/smhi/dist/http-server.js &
SMHI_PID=$!

# Start Lightpanda MCP on port 3006
# NOTE: Lightpanda MCP requires LIGHTPANDA_CDP_URL pointing to a Lightpanda browser.
# In combined-mcp, the browser is NOT included — set LIGHTPANDA_CDP_URL externally.
echo "Starting Lightpanda MCP on :3006..."
PORT=3006 node /app/lightpanda/dist/http-server.js &
LIGHTPANDA_PID=$!

# Start Elpris MCP on port 3007
echo "Starting Elpris MCP on :3007..."
PORT=3007 node /app/elpris/dist/http-server.js &
ELPRIS_PID=$!

# Start Bolagsverket MCP on port 3008
echo "Starting Bolagsverket MCP on :3008..."
PORT=3008 node /app/bolagsverket/dist/http-server.js &
BOLAGSVERKET_PID=$!

# Start Google Maps MCP on port 3009
echo "Starting Google Maps MCP on :3009..."
MCP_SERVER_PORT=3009 PORT=3009 node /app/google-maps/dist/cli.js &
GOOGLE_MAPS_PID=$!

# Start Blocket/Tradera MCP on port 3010
echo "Starting Blocket/Tradera MCP on :3010..."
PORT=3010 node /app/blocket-tradera/build/http-server.js &
BLOCKET_TRADERA_PID=$!

# Wait for all to be ready
echo "Waiting for services..."
for i in 1 2 3 4 5 6 7 8 9 10; do
    if wget -qO- http://127.0.0.1:3001/health >/dev/null 2>&1 && \
       wget -qO- http://127.0.0.1:3002/health >/dev/null 2>&1 && \
       wget -qO- http://127.0.0.1:3003/health >/dev/null 2>&1 && \
       wget -qO- http://127.0.0.1:3004/health >/dev/null 2>&1 && \
       wget -qO- http://127.0.0.1:3005/health >/dev/null 2>&1 && \
       wget -qO- http://127.0.0.1:3006/health >/dev/null 2>&1 && \
       wget -qO- http://127.0.0.1:3007/health >/dev/null 2>&1 && \
       wget -qO- http://127.0.0.1:3008/health >/dev/null 2>&1 && \
       nc -z 127.0.0.1 3009 2>/dev/null && \
       wget -qO- http://127.0.0.1:3010/health >/dev/null 2>&1; then
        echo "All services healthy!"
        break
    fi
    sleep 1
done

# Start nginx
echo "Starting nginx on :$PORT..."
nginx -g 'daemon off;' &
NGINX_PID=$!

echo "=== All services running ==="
echo "  SCB MCP:          http://localhost:$PORT/mcp"
echo "  SCB health:       http://localhost:$PORT/health"
echo "  Skolverket MCP:   http://localhost:$PORT/skolverket/mcp"
echo "  Skolverket health: http://localhost:$PORT/skolverket/health"
echo "  Trafikverket MCP:  http://localhost:$PORT/trafikverket/mcp"
echo "  Trafikverket health: http://localhost:$PORT/trafikverket/health"
echo "  Riksbank MCP:      http://localhost:$PORT/riksbank/mcp"
echo "  Riksbank health:   http://localhost:$PORT/riksbank/health"
echo "  SMHI MCP:          http://localhost:$PORT/smhi/mcp"
echo "  SMHI health:       http://localhost:$PORT/smhi/health"
echo "  Lightpanda MCP:    http://localhost:$PORT/lightpanda/mcp"
echo "  Lightpanda health: http://localhost:$PORT/lightpanda/health"
echo "  Elpris MCP:        http://localhost:$PORT/elpris/mcp"
echo "  Elpris health:     http://localhost:$PORT/elpris/health"
echo "  Bolagsverket MCP:  http://localhost:$PORT/bolagsverket/mcp"
echo "  Bolagsverket health: http://localhost:$PORT/bolagsverket/health"
echo "  Google Maps MCP:   http://localhost:$PORT/google-maps/mcp"
echo "  Blocket/Tradera MCP: http://localhost:$PORT/blocket-tradera/mcp"
echo "  Blocket/Tradera health: http://localhost:$PORT/blocket-tradera/health"

# Wait for any process to exit
wait -n $SCB_PID $SKOLVERKET_PID $TRAFIKVERKET_PID $RIKSBANK_PID $SMHI_PID $LIGHTPANDA_PID $ELPRIS_PID $BOLAGSVERKET_PID $GOOGLE_MAPS_PID $BLOCKET_TRADERA_PID $NGINX_PID

# If any exits, kill the rest
echo "A process exited, shutting down..."
kill $SCB_PID $SKOLVERKET_PID $TRAFIKVERKET_PID $RIKSBANK_PID $SMHI_PID $LIGHTPANDA_PID $ELPRIS_PID $BOLAGSVERKET_PID $GOOGLE_MAPS_PID $BLOCKET_TRADERA_PID $NGINX_PID 2>/dev/null || true
exit 1
