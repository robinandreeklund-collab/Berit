# SCB MCP Server v3.0 — Standalone Dockerfile for Render/Railway/Fly.io
#
# Build context: mcp-tools/scb-mcp/ (this directory)
# Exposes HTTP MCP endpoint on PORT (default 3000).

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm ci

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/http-server.js"]
