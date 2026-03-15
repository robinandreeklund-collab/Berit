# KB MCP Server v1.0 — Kungliga Biblioteket (Swedish National Library)
# Built from local source: mcp-tools/kb-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# All APIs are public — no authentication required.

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/kb-mcp/package.json mcp-tools/kb-mcp/tsconfig.json ./
COPY mcp-tools/kb-mcp/src ./src
RUN npm install && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/http-server.js"]
