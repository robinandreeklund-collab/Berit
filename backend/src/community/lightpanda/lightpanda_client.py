import json
import logging
import os

import requests

logger = logging.getLogger(__name__)

DEFAULT_LIGHTPANDA_URL = "http://localhost:9222"


class LightpandaClient:
    """Client for Lightpanda headless browser via Chrome DevTools Protocol (CDP).

    Lightpanda is a high-performance headless browser that uses 9x less memory
    and is 11x faster than Chrome. It supports JavaScript execution via V8 and
    exposes a CDP-compatible WebSocket interface.

    The client communicates with Lightpanda's CDP endpoint to navigate pages,
    extract rendered DOM content, and capture network responses.
    """

    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or os.getenv("LIGHTPANDA_URL", DEFAULT_LIGHTPANDA_URL)
        self._session_id: str | None = None

    def fetch(self, url: str, timeout: int = 30) -> str:
        """Fetch a URL using Lightpanda CDP WebSocket protocol.

        Connects to Lightpanda's CDP WebSocket endpoint, navigates to the URL,
        waits for the page to load (including JavaScript execution), and returns
        the rendered HTML.

        Args:
            url: The URL to fetch and render.
            timeout: Request timeout in seconds.

        Returns:
            The rendered HTML content of the page.
        """
        try:
            import websocket
        except ImportError:
            logger.error("websocket-client not installed. Install with: uv add websocket-client")
            return "Error: websocket-client package not installed. Run: uv add websocket-client"

        ws_url = self._get_ws_url()

        try:
            ws = websocket.create_connection(ws_url, timeout=timeout)
            msg_id = 1

            # Enable Page domain
            ws.send(json.dumps({"id": msg_id, "method": "Page.enable"}))
            msg_id += 1
            _read_cdp_response(ws, msg_id - 1, timeout)

            # Navigate to URL
            ws.send(json.dumps({"id": msg_id, "method": "Page.navigate", "params": {"url": url}}))
            msg_id += 1
            _read_cdp_response(ws, msg_id - 1, timeout)

            # Wait for Page.loadEventFired
            _wait_for_event(ws, "Page.loadEventFired", timeout)

            # Get the rendered HTML
            ws.send(json.dumps({"id": msg_id, "method": "Runtime.evaluate", "params": {"expression": "document.documentElement.outerHTML", "returnByValue": True}}))
            result = _read_cdp_response(ws, msg_id, timeout)

            ws.close()

            if result and "result" in result:
                inner = result["result"]
                if "result" in inner and "value" in inner["result"]:
                    return inner["result"]["value"]

            return "Error: Could not extract page content from CDP response"

        except ConnectionRefusedError:
            error_message = f"Could not connect to Lightpanda at {ws_url}. Ensure Lightpanda is running (docker run -d -p 9222:9222 lightpanda/browser:nightly)"
            logger.error(error_message)
            return f"Error: {error_message}"
        except Exception as e:
            error_message = f"Lightpanda CDP fetch failed: {str(e)}"
            logger.error(error_message)
            return f"Error: {error_message}"

    def _get_ws_url(self) -> str:
        """Get the CDP WebSocket URL from Lightpanda's /json/version endpoint."""
        try:
            version_response = requests.get(f"{self.base_url}/json/version", timeout=5)
            if version_response.status_code == 200:
                version_data = version_response.json()
                ws_url = version_data.get("webSocketDebuggerUrl")
                if ws_url:
                    return ws_url
        except Exception:
            pass

        # Fallback: construct WebSocket URL from base URL
        return f"ws://{self.base_url.replace('http://', '').replace('https://', '')}"


def _read_cdp_response(ws, expected_id: int, timeout: float) -> dict | None:
    """Read CDP WebSocket messages until we get the response for expected_id."""
    import time

    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            ws.settimeout(max(0.1, deadline - time.time()))
            raw = ws.recv()
            msg = json.loads(raw)
            if msg.get("id") == expected_id:
                return msg
        except Exception:
            break
    return None


def _wait_for_event(ws, event_name: str, timeout: float) -> dict | None:
    """Wait for a specific CDP event."""
    import time

    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            ws.settimeout(max(0.1, deadline - time.time()))
            raw = ws.recv()
            msg = json.loads(raw)
            if msg.get("method") == event_name:
                return msg
        except Exception:
            break
    return None
