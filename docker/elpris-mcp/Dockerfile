# Elpris MCP Server v1.0 — Swedish electricity prices via elprisetjustnu.se
# Built from local source: mcp-tools/elpris-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# No API key required — open API.

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/elpris-mcp/package.json mcp-tools/elpris-mcp/tsconfig.json ./
COPY mcp-tools/elpris-mcp/src ./src
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
