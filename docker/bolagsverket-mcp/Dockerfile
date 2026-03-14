# Bolagsverket MCP Server v1.0 — Swedish company data via Värdefulla datamängder API
# Built from local source: mcp-tools/bolagsverket-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# Requires OAuth 2.0 credentials (BOLAGSVERKET_CLIENT_ID + BOLAGSVERKET_CLIENT_SECRET).

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/bolagsverket-mcp/package.json mcp-tools/bolagsverket-mcp/tsconfig.json ./
COPY mcp-tools/bolagsverket-mcp/src ./src
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
