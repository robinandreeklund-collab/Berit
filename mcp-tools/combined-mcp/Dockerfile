# Combined MCP Server — 20 MCP servers on one Render instance
# (Lightpanda runs locally only — requires headless browser sidecar)
# SCB:              / (backwards compatible)
# Skolverket:       /skolverket/
# Trafikverket:     /trafikverket/
# Riksbank:         /riksbank/
# SMHI:             /smhi/
# Elpris:           /elpris/
# Bolagsverket:     /bolagsverket/
# Google Maps:      /google-maps/
# Blocket/Tradera:  /blocket-tradera/
# Riksdag:          /riksdag/
# NVV:              /nvv/
# Kolada:           /kolada/
# KB:               /kb/
# Upphandlingsdata: /upphandlingsdata/
# OECD:             /oecd/
# Trafikanalys:     /trafikanalys/
# Visit Sweden:     /visitsweden/
# Krisinformation:  /krisinformation/
# Polisen:          /polisen/

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

# ============ Stage 6: Build Elpris ============
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

# ============ Stage 14: Build KB ============
FROM node:22-alpine AS build-kb
WORKDIR /app
COPY kb-mcp/package.json kb-mcp/package-lock.json kb-mcp/tsconfig.json ./
COPY kb-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 15: Build Upphandlingsdata ============
FROM node:22-alpine AS build-upphandlingsdata
WORKDIR /app
COPY upphandlingsdata-mcp/package.json upphandlingsdata-mcp/package-lock.json upphandlingsdata-mcp/tsconfig.json ./
COPY upphandlingsdata-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 16: Build OECD ============
FROM node:22-alpine AS build-oecd
WORKDIR /app
COPY oecd-mcp/package.json oecd-mcp/package-lock.json oecd-mcp/tsconfig.json ./
COPY oecd-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 17: Build Trafikanalys ============
FROM node:22-alpine AS build-trafikanalys
WORKDIR /app
COPY trafikanalys-mcp/package.json trafikanalys-mcp/package-lock.json trafikanalys-mcp/tsconfig.json ./
COPY trafikanalys-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 18: Build Visit Sweden ============
FROM node:22-alpine AS build-visitsweden
WORKDIR /app
COPY visitsweden-mcp/package.json visitsweden-mcp/package-lock.json visitsweden-mcp/tsconfig.json ./
COPY visitsweden-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 19: Build Krisinformation ============
FROM node:22-alpine AS build-krisinformation
WORKDIR /app
COPY krisinformation-mcp/package.json krisinformation-mcp/package-lock.json krisinformation-mcp/tsconfig.json ./
COPY krisinformation-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 20: Build Polisen ============
FROM node:22-alpine AS build-polisen
WORKDIR /app
COPY polisen-mcp/package.json polisen-mcp/package-lock.json polisen-mcp/tsconfig.json ./
COPY polisen-mcp/src ./src
RUN npm ci --ignore-scripts && npm run build

# ============ Stage 20: Production ============
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

# KB production install
COPY kb-mcp/package.json kb-mcp/package-lock.json /app/kb/
RUN cd /app/kb && npm ci --omit=dev --ignore-scripts
COPY --from=build-kb /app/dist /app/kb/dist

# Upphandlingsdata production install
COPY upphandlingsdata-mcp/package.json upphandlingsdata-mcp/package-lock.json /app/upphandlingsdata/
RUN cd /app/upphandlingsdata && npm ci --omit=dev --ignore-scripts
COPY --from=build-upphandlingsdata /app/dist /app/upphandlingsdata/dist

# OECD production install
COPY oecd-mcp/package.json oecd-mcp/package-lock.json /app/oecd/
RUN cd /app/oecd && npm ci --omit=dev --ignore-scripts
COPY --from=build-oecd /app/dist /app/oecd/dist

# Trafikanalys production install
COPY trafikanalys-mcp/package.json trafikanalys-mcp/package-lock.json /app/trafikanalys/
RUN cd /app/trafikanalys && npm ci --omit=dev --ignore-scripts
COPY --from=build-trafikanalys /app/dist /app/trafikanalys/dist

# Visit Sweden production install
COPY visitsweden-mcp/package.json visitsweden-mcp/package-lock.json /app/visitsweden/
RUN cd /app/visitsweden && npm ci --omit=dev --ignore-scripts
COPY --from=build-visitsweden /app/dist /app/visitsweden/dist

# Krisinformation production install
COPY krisinformation-mcp/package.json krisinformation-mcp/package-lock.json /app/krisinformation/
RUN cd /app/krisinformation && npm ci --omit=dev --ignore-scripts
COPY --from=build-krisinformation /app/dist /app/krisinformation/dist

# Polisen production install
COPY polisen-mcp/package.json polisen-mcp/package-lock.json /app/polisen/
RUN cd /app/polisen && npm ci --omit=dev --ignore-scripts
COPY --from=build-polisen /app/dist /app/polisen/dist

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
