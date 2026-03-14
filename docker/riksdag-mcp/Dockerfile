# Riksdag MCP Server v1.0 — Sveriges riksdag och regering
# Built from local source: mcp-tools/riksdag-mcp/

FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/riksdag-mcp/package.json mcp-tools/riksdag-mcp/package-lock.json mcp-tools/riksdag-mcp/tsconfig.json ./
COPY mcp-tools/riksdag-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/http-server.js"]
