# SCB MCP Server — Swedish official statistics via PxWebAPI 2.0
# https://github.com/isakskogstad/SCB-MCP
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# No authentication required.

FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache git \
    && git clone --depth 1 https://github.com/isakskogstad/SCB-MCP.git . \
    && npm ci \
    && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/index.js"]
