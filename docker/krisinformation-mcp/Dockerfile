# Krisinformation MCP Server v1.0 — Swedish crisis information and VMA alerts
# Built from local source: mcp-tools/krisinformation-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# No API key required — Krisinformation API is open.

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/krisinformation-mcp/package.json mcp-tools/krisinformation-mcp/tsconfig.json ./
COPY mcp-tools/krisinformation-mcp/src ./src
RUN npm install && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/http-server.js"]
