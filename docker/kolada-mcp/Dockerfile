# Kolada MCP Server v1.0 — Kommunal och regional statistik
# Built from local source: mcp-tools/kolada-mcp/

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/kolada-mcp/package.json mcp-tools/kolada-mcp/package-lock.json mcp-tools/kolada-mcp/tsconfig.json ./
COPY mcp-tools/kolada-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/http-server.js"]
