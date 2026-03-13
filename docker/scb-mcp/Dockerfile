# SCB MCP Server v3.0 — Swedish official statistics via PxWebAPI 2.0
# Built from local source: mcp-tools/scb-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# No authentication required.

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/scb-mcp/package.json mcp-tools/scb-mcp/tsconfig.json ./
COPY mcp-tools/scb-mcp/src ./src
RUN npm install

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
# http-server.js runs the Express HTTP server (Streamable HTTP MCP).
# index.js is the stdio transport version and does NOT listen on any port.
CMD ["node", "dist/http-server.js"]
