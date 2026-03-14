# Trafikverket MCP Server v1.0 — Swedish traffic data via Trafikverket Open API
# Built from local source: mcp-tools/trafikverket-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# Requires TRAFIKVERKET_API_KEY environment variable.

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/trafikverket-mcp/package.json mcp-tools/trafikverket-mcp/tsconfig.json ./
COPY mcp-tools/trafikverket-mcp/src ./src
RUN npm install && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
# http-server.js runs the Express HTTP server (Streamable HTTP MCP).
CMD ["node", "dist/http-server.js"]
