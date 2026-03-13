#!/usr/bin/env bash
#
# install-gomcp.sh - Download and install the Lightpanda gomcp MCP server
#
# Downloads the latest gomcp binary for the current platform.
# Installs to ./bin/gomcp (relative to repo root).
#
# Usage: ./scripts/install-gomcp.sh [--force]
#   --force: Re-download even if binary already exists

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="$REPO_ROOT/bin"
GOMCP_BIN="$BIN_DIR/gomcp"

# ── Parse arguments ──────────────────────────────────────────────────────────

FORCE=false
for arg in "$@"; do
    case "$arg" in
        --force) FORCE=true ;;
        *) echo "Unknown argument: $arg"; echo "Usage: $0 [--force]"; exit 1 ;;
    esac
done

# ── Check if already installed ───────────────────────────────────────────────

if [ -f "$GOMCP_BIN" ] && [ "$FORCE" = false ]; then
    echo "gomcp already installed at $GOMCP_BIN"
    echo "Use --force to re-download."
    exit 0
fi

# ── Detect platform ─────────────────────────────────────────────────────────

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
    x86_64|amd64) ARCH="amd64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *)
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

case "$OS" in
    linux)  PLATFORM="linux" ;;
    darwin) PLATFORM="darwin" ;;
    *)
        echo "Unsupported OS: $OS"
        exit 1
        ;;
esac

# ── Check for Go (build from source) ────────────────────────────────────────

mkdir -p "$BIN_DIR"

if command -v go >/dev/null 2>&1; then
    echo "Building gomcp from source using Go..."
    TMPDIR="$(mktemp -d)"
    trap 'rm -rf "$TMPDIR"' EXIT

    git clone --depth 1 https://github.com/lightpanda-io/gomcp.git "$TMPDIR/gomcp" 2>&1
    cd "$TMPDIR/gomcp"
    CGO_ENABLED=0 go build -o "$GOMCP_BIN" .
    chmod +x "$GOMCP_BIN"

    echo "✓ gomcp built and installed to $GOMCP_BIN"
else
    echo "Go is not installed. Attempting to download pre-built binary..."

    # Try downloading from GitHub releases
    RELEASE_URL="https://github.com/lightpanda-io/gomcp/releases/latest/download/gomcp-${PLATFORM}-${ARCH}"

    if command -v curl >/dev/null 2>&1; then
        HTTP_CODE=$(curl -sL -o "$GOMCP_BIN" -w "%{http_code}" "$RELEASE_URL" 2>/dev/null || echo "000")
    elif command -v wget >/dev/null 2>&1; then
        wget -q -O "$GOMCP_BIN" "$RELEASE_URL" 2>/dev/null && HTTP_CODE="200" || HTTP_CODE="000"
    else
        echo "Neither curl nor wget found."
        HTTP_CODE="000"
    fi

    if [ "$HTTP_CODE" = "200" ] && [ -s "$GOMCP_BIN" ]; then
        chmod +x "$GOMCP_BIN"
        echo "✓ gomcp downloaded and installed to $GOMCP_BIN"
    else
        rm -f "$GOMCP_BIN"
        echo "✗ Could not download gomcp binary."
        echo ""
        echo "  To install manually:"
        echo "    1. Install Go from https://go.dev"
        echo "    2. Run: ./scripts/install-gomcp.sh"
        echo ""
        echo "  Or build manually:"
        echo "    git clone https://github.com/lightpanda-io/gomcp.git /tmp/gomcp"
        echo "    cd /tmp/gomcp && go build -o $GOMCP_BIN ."
        exit 1
    fi
fi

echo ""
echo "gomcp is ready. It will be used automatically when MCP tools are loaded."
