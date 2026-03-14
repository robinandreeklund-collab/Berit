# Combined MCP Server — SCB + Skolverket + Trafikverket + Riksbank + SMHI + Lightpanda + Elpris + Bolagsverket + Riksdag + NVV + Kolada on one instance
# SCB:            / (backwards compatible)
# Skolverket:     /skolverket/
# Trafikverket:   /trafikverket/
# Riksbank:       /riksbank/
# Elpris:         /elpris/
# Bolagsverket:   /bolagsverket/

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

# ============ Stage 7: Build Elpris ============
FROM node:22-alpine AS build-elpris
WORKDIR /app
COPY elpris-mcp/package.json elpris-mcp/tsconfig.json ./
COPY elpris-mcp/src ./src
RUN npm install && npm run build

# ============ Stage 8: Build Bolagsverket ============
FROM node:22-alpine AS build-bolagsverket
WORKDIR /app
COPY bolagsverket-mcp/package.json bolagsverket-mcp/tsconfig.json ./
COPY bolagsverket-mcp/src ./src
RUN npm install && npm run build

# ============ Stage 9: Build Google Maps ============
FROM node:22-alpine AS build-google-maps
WORKDIR /app
COPY google-maps-mcp/package.json google-maps-mcp/package-lock.json google-maps-mcp/tsconfig.json google-maps-mcp/tsup.config.ts ./
COPY google-maps-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 10: Build Blocket/Tradera ============
FROM node:22-alpine AS build-blocket-tradera
WORKDIR /app
COPY blocket-tradera-mcp/package.json blocket-tradera-mcp/package-lock.json blocket-tradera-mcp/tsconfig.json ./
COPY blocket-tradera-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 11: Build Riksdag ============
FROM node:22-alpine AS build-riksdag
WORKDIR /app
COPY riksdag-mcp/package.json riksdag-mcp/package-lock.json riksdag-mcp/tsconfig.json ./
COPY riksdag-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 12: Build NVV ============
FROM node:22-alpine AS build-nvv
WORKDIR /app
COPY nvv-mcp/package.json nvv-mcp/package-lock.json nvv-mcp/tsconfig.json ./
COPY nvv-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 13: Build Kolada ============
FROM node:22-alpine AS build-kolada
WORKDIR /app
COPY kolada-mcp/package.json kolada-mcp/package-lock.json kolada-mcp/tsconfig.json ./
COPY kolada-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 14: Production ============
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

# Elpris production install
COPY elpris-mcp/package.json /app/elpris/
RUN cd /app/elpris && npm install --omit=dev --ignore-scripts
COPY --from=build-elpris /app/dist /app/elpris/dist

# Bolagsverket production install
COPY bolagsverket-mcp/package.json /app/bolagsverket/
RUN cd /app/bolagsverket && npm install --omit=dev --ignore-scripts
COPY --from=build-bolagsverket /app/dist /app/bolagsverket/dist

# Google Maps production install
COPY google-maps-mcp/package.json google-maps-mcp/package-lock.json /app/google-maps/
RUN cd /app/google-maps && npm ci --omit=dev --ignore-scripts
COPY --from=build-google-maps /app/dist /app/google-maps/dist

# Blocket/Tradera production install
COPY blocket-tradera-mcp/package.json blocket-tradera-mcp/package-lock.json /app/blocket-tradera/
RUN cd /app/blocket-tradera && npm ci --omit=dev --ignore-scripts
COPY --from=build-blocket-tradera /app/build /app/blocket-tradera/build

# Riksdag production install
COPY riksdag-mcp/package.json riksdag-mcp/package-lock.json /app/riksdag/
RUN cd /app/riksdag && npm ci --omit=dev --ignore-scripts
COPY --from=build-riksdag /app/dist /app/riksdag/dist

# NVV production install
COPY nvv-mcp/package.json nvv-mcp/package-lock.json /app/nvv/
RUN cd /app/nvv && npm ci --omit=dev --ignore-scripts
COPY --from=build-nvv /app/dist /app/nvv/dist

# Kolada production install
COPY kolada-mcp/package.json kolada-mcp/package-lock.json /app/kolada/
RUN cd /app/kolada && npm ci --omit=dev --ignore-scripts
COPY --from=build-kolada /app/dist /app/kolada/dist

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
