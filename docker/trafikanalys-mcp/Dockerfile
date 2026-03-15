# Trafikanalys MCP Server v1.0 — Swedish Transport Statistics
# Built from local source: mcp-tools/trafikanalys-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# All APIs are public — no authentication required.

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/trafikanalys-mcp/package.json mcp-tools/trafikanalys-mcp/tsconfig.json ./
COPY mcp-tools/trafikanalys-mcp/src ./src
RUN npm install && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/http-server.js"]
