# Lightpanda MCP Server v1.0 — Web browsing, search and data extraction
# Built from local source: mcp-tools/lightpanda-mcp/
# Includes Lightpanda browser binary so the container is self-contained
# (no external browser dependency needed — works on Render, Railway, etc.)

# --- Stage 1: Build MCP server ---
FROM node:22-alpine AS build
WORKDIR /app
COPY mcp-tools/lightpanda-mcp/package.json mcp-tools/lightpanda-mcp/package-lock.json mcp-tools/lightpanda-mcp/tsconfig.json ./
COPY mcp-tools/lightpanda-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# --- Stage 2: Download Lightpanda browser binary ---
FROM debian:bookworm-slim AS browser
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
# Download the latest nightly Lightpanda binary for Linux x86_64
RUN curl -fSL -o /lightpanda \
    https://github.com/lightpanda-io/browser/releases/download/nightly/lightpanda-x86_64-linux && \
    chmod +x /lightpanda

# --- Stage 3: Final image (Debian-based for glibc compatibility with Lightpanda) ---
FROM node:22-bookworm-slim
WORKDIR /app

# Install tini for proper process supervision (PID 1 signal handling)
# and wget for health checks in entrypoint
RUN apt-get update && apt-get install -y --no-install-recommends tini wget && rm -rf /var/lib/apt/lists/*

# Copy MCP server
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist

# Copy Lightpanda browser binary
COPY --from=browser /lightpanda /usr/local/bin/lightpanda

# Copy entrypoint script
COPY docker/lightpanda-mcp/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Configure environment
ENV PORT=3000
ENV LIGHTPANDA_CDP_URL=ws://127.0.0.1:9222
ENV LIGHTPANDA_URL=http://127.0.0.1:9222

EXPOSE 3000

ENTRYPOINT ["tini", "--"]
CMD ["/entrypoint.sh"]
