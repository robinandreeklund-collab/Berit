# Avanza MCP Server v1.0 — Svenska aktier, fonder, ETF:er, certifikat via Avanza API
# Built from local source: mcp-tools/avanza-mcp/
#
# Exposes an HTTP MCP endpoint on port 3000 (configurable via PORT env var).
# No API key required — all Avanza endpoints are publicly accessible.

FROM python:3.12-alpine AS build
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY mcp-tools/avanza-mcp/pyproject.toml mcp-tools/avanza-mcp/uv.lock ./
COPY mcp-tools/avanza-mcp/src ./src
COPY mcp-tools/avanza-mcp/http_server.py ./
RUN uv sync --frozen --no-dev

FROM python:3.12-alpine
WORKDIR /app
COPY --from=build /app/.venv /app/.venv
COPY --from=build /app/src ./src
COPY --from=build /app/pyproject.toml ./
COPY mcp-tools/avanza-mcp/http_server.py ./
ENV PATH="/app/.venv/bin:$PATH"
ENV PORT=3000
EXPOSE 3000
CMD ["python", "http_server.py"]
