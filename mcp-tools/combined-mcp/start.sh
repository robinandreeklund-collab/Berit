#!/bin/sh
set -e

PORT="${PORT:-10000}"
export PORT

echo "=== Combined MCP Server ==="
echo "Port: $PORT"
echo "SCB MCP:       internal :3001 → /"
echo "Skolverket MCP: internal :3002 → /skolverket/"

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

# Wait for both to be ready
echo "Waiting for services..."
for i in 1 2 3 4 5 6 7 8 9 10; do
    if wget -qO- http://127.0.0.1:3001/health >/dev/null 2>&1 && \
       wget -qO- http://127.0.0.1:3002/health >/dev/null 2>&1; then
        echo "Both services healthy!"
        break
    fi
    sleep 1
done

# Start nginx
echo "Starting nginx on :$PORT..."
nginx -g 'daemon off;' &
NGINX_PID=$!

echo "=== All services running ==="
echo "  SCB MCP:       http://localhost:$PORT/mcp"
echo "  SCB health:    http://localhost:$PORT/health"
echo "  Skolverket MCP: http://localhost:$PORT/skolverket/mcp"
echo "  Skolverket health: http://localhost:$PORT/skolverket/health"

# Wait for any process to exit
wait -n $SCB_PID $SKOLVERKET_PID $NGINX_PID

# If any exits, kill the rest
echo "A process exited, shutting down..."
kill $SCB_PID $SKOLVERKET_PID $NGINX_PID 2>/dev/null || true
exit 1
