# Combined MCP Server — SCB + Skolverket + Trafikverket + Riksbank + SMHI + Lightpanda on one instance
# SCB:          / (backwards compatible)
# Skolverket:   /skolverket/
# Trafikverket: /trafikverket/
# Riksbank:     /riksbank/

# ============ Stage 1: Build SCB ============
FROM node:22-alpine AS build-scb
WORKDIR /app
COPY scb-mcp/package.json scb-mcp/package-lock.json scb-mcp/tsconfig.json ./
COPY scb-mcp/src ./src
RUN npm ci

# ============ Stage 2: Build Skolverket ============
FROM node:22-alpine AS build-skolverket
WORKDIR /app
COPY skolverket-mcp/package.json skolverket-mcp/package-lock.json skolverket-mcp/tsconfig.json ./
COPY skolverket-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 3: Build Trafikverket ============
FROM node:22-alpine AS build-trafikverket
WORKDIR /app
COPY trafikverket-mcp/package.json trafikverket-mcp/package-lock.json trafikverket-mcp/tsconfig.json ./
COPY trafikverket-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 4: Build Riksbank ============
FROM node:22-alpine AS build-riksbank
WORKDIR /app
COPY riksbank-mcp/package.json riksbank-mcp/package-lock.json riksbank-mcp/tsconfig.json ./
COPY riksbank-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 5: Build SMHI ============
FROM node:22-alpine AS build-smhi
WORKDIR /app
COPY smhi-mcp/package.json smhi-mcp/package-lock.json smhi-mcp/tsconfig.json ./
COPY smhi-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 6: Build Lightpanda ============
FROM node:22-alpine AS build-lightpanda
WORKDIR /app
COPY lightpanda-mcp/package.json lightpanda-mcp/package-lock.json lightpanda-mcp/tsconfig.json ./
COPY lightpanda-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 7: Production ============
FROM node:22-alpine

# Install nginx and envsubst (from gettext)
RUN apk add --no-cache nginx gettext

WORKDIR /app

# SCB production install
COPY scb-mcp/package.json scb-mcp/package-lock.json /app/scb/
RUN cd /app/scb && npm ci --omit=dev --ignore-scripts
COPY --from=build-scb /app/dist /app/scb/dist

# Skolverket production install
COPY skolverket-mcp/package.json skolverket-mcp/package-lock.json /app/skolverket/
RUN cd /app/skolverket && npm ci --only=production --ignore-scripts
COPY --from=build-skolverket /app/dist /app/skolverket/dist
COPY skolverket-mcp/public /app/skolverket/public
RUN mkdir -p /app/skolverket/logs

# Trafikverket production install
COPY trafikverket-mcp/package.json trafikverket-mcp/package-lock.json /app/trafikverket/
RUN cd /app/trafikverket && npm ci --omit=dev --ignore-scripts
COPY --from=build-trafikverket /app/dist /app/trafikverket/dist
COPY trafikverket-mcp/README.md /app/trafikverket/README.md

# Riksbank production install
COPY riksbank-mcp/package.json riksbank-mcp/package-lock.json /app/riksbank/
RUN cd /app/riksbank && npm ci --omit=dev --ignore-scripts
COPY --from=build-riksbank /app/dist /app/riksbank/dist
COPY riksbank-mcp/README.md /app/riksbank/README.md

# SMHI production install
COPY smhi-mcp/package.json smhi-mcp/package-lock.json /app/smhi/
RUN cd /app/smhi && npm ci --omit=dev --ignore-scripts
COPY --from=build-smhi /app/dist /app/smhi/dist

# Lightpanda production install
COPY lightpanda-mcp/package.json lightpanda-mcp/package-lock.json /app/lightpanda/
RUN cd /app/lightpanda && npm ci --omit=dev --ignore-scripts
COPY --from=build-lightpanda /app/dist /app/lightpanda/dist

# Nginx config template + start script
COPY combined-mcp/nginx.conf /etc/nginx/nginx.conf.template
COPY combined-mcp/start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1

CMD ["/app/start.sh"]
