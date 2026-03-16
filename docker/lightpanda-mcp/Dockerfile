# Lightpanda MCP Server v1.0 — Web browsing, search and data extraction
# Built from local source: mcp-tools/lightpanda-mcp/
# NOTE: Requires a running Lightpanda browser instance (LIGHTPANDA_CDP_URL)
# Start one with: docker run -d -p 9222:9222 lightpanda/browser:nightly

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/lightpanda-mcp/package.json mcp-tools/lightpanda-mcp/package-lock.json mcp-tools/lightpanda-mcp/tsconfig.json ./
COPY mcp-tools/lightpanda-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/http-server.js"]
