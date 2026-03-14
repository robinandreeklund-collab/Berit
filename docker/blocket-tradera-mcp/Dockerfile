# Blocket & Tradera MCP Server v1.0 — Svenska marknadsplatser (köp & sälj, auktioner)
# Built from local source: mcp-tools/blocket-tradera-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# Optional: TRADERA_APP_ID and TRADERA_APP_KEY for Tradera access.

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/blocket-tradera-mcp/package.json mcp-tools/blocket-tradera-mcp/package-lock.json mcp-tools/blocket-tradera-mcp/tsconfig.json ./
COPY mcp-tools/blocket-tradera-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/build ./build
ENV PORT=3000
EXPOSE 3000
# http-server.js runs the Express HTTP server with /health and /mcp endpoints
CMD ["node", "build/http-server.js"]
