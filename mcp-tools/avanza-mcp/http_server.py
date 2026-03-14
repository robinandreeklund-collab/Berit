"""HTTP server wrapper for Avanza MCP.

Runs the FastMCP server in streamable-http mode with a /health endpoint.
"""

import json
import os
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = int(os.environ.get("PORT", 3000))
MCP_PORT = PORT + 1000  # Internal MCP port (not exposed)


class HealthHandler(BaseHTTPRequestHandler):
    """Minimal health check + proxy handler."""

    def do_GET(self):
        if self.path == "/health":
            body = json.dumps({"status": "ok", "server": "avanza-mcp", "version": "1.3.0", "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body.encode())
        elif self.path == "/":
            body = json.dumps({"name": "Avanza MCP Server", "version": "1.3.0", "protocol": "mcp", "description": "Swedish stocks, funds, ETFs, certificates via Avanza public API. 34 tools."})
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body.encode())
        elif self.path == "/mcp":
            # Forward SSE GET to FastMCP
            self._proxy("GET")
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/mcp":
            self._proxy("POST")
        else:
            self.send_response(404)
            self.end_headers()

    def do_DELETE(self):
        if self.path == "/mcp":
            self._proxy("DELETE")
        else:
            self.send_response(404)
            self.end_headers()

    def _proxy(self, method):
        """Proxy request to internal FastMCP server."""
        import urllib.request
        import urllib.error

        url = f"http://127.0.0.1:{MCP_PORT}{self.path}"

        # Read request body for POST
        body = None
        if method == "POST":
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 0:
                body = self.rfile.read(content_length)

        req = urllib.request.Request(url, data=body, method=method)

        # Forward relevant headers
        for header in ["Content-Type", "Accept", "mcp-session-id"]:
            val = self.headers.get(header)
            if val:
                req.add_header(header, val)

        try:
            with urllib.request.urlopen(req, timeout=600) as resp:
                status = resp.status
                self.send_response(status)
                # Forward response headers
                for key, val in resp.getheaders():
                    if key.lower() not in ("transfer-encoding", "connection"):
                        self.send_header(key, val)
                self.end_headers()
                # Stream response body
                while True:
                    chunk = resp.read(8192)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def log_message(self, format, *args):
        """Suppress default logging noise."""
        pass


def start_fastmcp():
    """Start FastMCP server on internal port."""
    os.environ["PORT"] = str(MCP_PORT)
    from avanza_mcp import mcp
    mcp.run(transport="streamable-http", host="127.0.0.1", port=MCP_PORT)


def main():
    # Start FastMCP in background thread
    mcp_thread = threading.Thread(target=start_fastmcp, daemon=True)
    mcp_thread.start()

    # Wait for FastMCP to be ready
    import urllib.request
    import urllib.error
    for _ in range(30):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{MCP_PORT}/mcp", timeout=2)
            break
        except Exception:
            time.sleep(1)

    # Start health/proxy server on external port
    server = HTTPServer(("0.0.0.0", PORT), HealthHandler)
    print(f"Avanza MCP HTTP server running on port {PORT}")
    print(f"  Health: http://localhost:{PORT}/health")
    print(f"  MCP:    http://localhost:{PORT}/mcp")
    server.serve_forever()


if __name__ == "__main__":
    main()
