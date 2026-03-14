# Google Maps MCP Server v1.0 — Geocoding, platssökning, vägbeskrivningar via Google Maps API
# Built from local source: mcp-tools/google-maps-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via MCP_SERVER_PORT env var).
# Requires GOOGLE_MAPS_API_KEY.

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/google-maps-mcp/package.json mcp-tools/google-maps-mcp/package-lock.json mcp-tools/google-maps-mcp/tsconfig.json ./
COPY mcp-tools/google-maps-mcp/tsup.config.ts ./
COPY mcp-tools/google-maps-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV MCP_SERVER_PORT=3000
ENV PORT=3000
EXPOSE 3000
# cli.js starts the HTTP server on MCP_SERVER_PORT
CMD ["node", "dist/cli.js"]
