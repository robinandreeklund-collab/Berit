# Polisen MCP Server v1.0 — Swedish police events and incidents
# Built from local source: mcp-tools/polisen-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# No API key required — Polisen API is open.

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/polisen-mcp/package.json mcp-tools/polisen-mcp/tsconfig.json ./
COPY mcp-tools/polisen-mcp/src ./src
RUN npm install && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/http-server.js"]
