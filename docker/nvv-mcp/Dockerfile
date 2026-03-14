# NVV MCP Server v1.0 — Naturvårdsverket skyddade naturområden
# Built from local source: mcp-tools/nvv-mcp/

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/nvv-mcp/package.json mcp-tools/nvv-mcp/package-lock.json mcp-tools/nvv-mcp/tsconfig.json ./
COPY mcp-tools/nvv-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/http-server.js"]
