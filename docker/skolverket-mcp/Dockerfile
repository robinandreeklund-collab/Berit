# Skolverket MCP Server v2.7.0 — Swedish education data (Skolverket APIs)
# Built from local source: mcp-tools/skolverket-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# No authentication required.

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/skolverket-mcp/package.json mcp-tools/skolverket-mcp/package-lock.json mcp-tools/skolverket-mcp/tsconfig.json ./
COPY mcp-tools/skolverket-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
COPY mcp-tools/skolverket-mcp/public ./public
RUN mkdir -p logs
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/streamable-http-server.js"]
