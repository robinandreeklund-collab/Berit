# Upphandlingsdata MCP Server v1.0 — Swedish Public Procurement Data
# Built from local source: mcp-tools/upphandlingsdata-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# All APIs are public — no authentication required.

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/upphandlingsdata-mcp/package.json mcp-tools/upphandlingsdata-mcp/tsconfig.json ./
COPY mcp-tools/upphandlingsdata-mcp/src ./src
RUN npm install && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/http-server.js"]
