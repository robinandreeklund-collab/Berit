# Skolverket MCP Server — Swedish education data via Skolverket APIs
# https://github.com/isakskogstad/Skolverket-MCP
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# APIs: Syllabus (läroplaner), School Units Registry, Planned Educations.
# No authentication required.

FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache git \
    && git clone --depth 1 https://github.com/isakskogstad/Skolverket-MCP.git . \
    && npm ci --ignore-scripts \
    && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --only=production --ignore-scripts
COPY --from=build /app/dist ./dist
COPY --from=build /app/README.md ./
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info
EXPOSE 3000
# CRITICAL: streamable-http-server.js runs the Express HTTP server (Streamable HTTP MCP).
# index.js is the stdio transport version and does NOT listen on any port.
CMD ["node", "dist/streamable-http-server.js"]
