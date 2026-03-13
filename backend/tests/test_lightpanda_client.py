"""Tests for Lightpanda headless browser client and tools."""

import json
from unittest.mock import MagicMock, patch

from src.community.lightpanda.lightpanda_client import LightpandaClient


class TestLightpandaClient:
    def test_client_initialization_defaults(self):
        """Test LightpandaClient initialization with default parameters."""
        client = LightpandaClient()
        assert client.base_url == "http://localhost:9222"

    def test_client_initialization_custom_url(self):
        """Test LightpandaClient initialization with custom URL."""
        client = LightpandaClient(base_url="http://lightpanda:9222")
        assert client.base_url == "http://lightpanda:9222"

    @patch.dict("os.environ", {"LIGHTPANDA_URL": "http://env-lightpanda:9222"})
    def test_client_initialization_from_env(self):
        """Test LightpandaClient picks up LIGHTPANDA_URL env var."""
        client = LightpandaClient()
        assert client.base_url == "http://env-lightpanda:9222"

    @patch("websocket.create_connection")
    @patch.object(LightpandaClient, "_get_ws_url", return_value="ws://localhost:9222")
    def test_fetch_success(self, mock_ws_url, mock_create_conn):
        """Test successful fetch via CDP WebSocket."""
        mock_ws = MagicMock()
        mock_create_conn.return_value = mock_ws

        # Simulate CDP responses: Page.enable, Page.navigate, Page.loadEventFired, Runtime.evaluate
        html_content = "<html><body><h1>Hello World</h1></body></html>"
        mock_ws.recv.side_effect = [
            json.dumps({"id": 1}),  # Page.enable response
            json.dumps({"id": 2}),  # Page.navigate response
            json.dumps({"method": "Page.loadEventFired"}),  # load event
            json.dumps({"id": 3, "result": {"result": {"value": html_content}}}),  # Runtime.evaluate
        ]

        client = LightpandaClient()
        result = client.fetch("https://example.com")

        assert result == html_content
        mock_create_conn.assert_called_once_with("ws://localhost:9222", timeout=30)

    @patch("websocket.create_connection")
    @patch.object(LightpandaClient, "_get_ws_url", return_value="ws://localhost:9222")
    def test_fetch_custom_timeout(self, mock_ws_url, mock_create_conn):
        """Test fetch with custom timeout."""
        mock_ws = MagicMock()
        mock_create_conn.return_value = mock_ws

        mock_ws.recv.side_effect = [
            json.dumps({"id": 1}),
            json.dumps({"id": 2}),
            json.dumps({"method": "Page.loadEventFired"}),
            json.dumps({"id": 3, "result": {"result": {"value": "<html></html>"}}}),
        ]

        client = LightpandaClient()
        client.fetch("https://example.com", timeout=60)

        mock_create_conn.assert_called_once_with("ws://localhost:9222", timeout=60)

    @patch("websocket.create_connection")
    @patch.object(LightpandaClient, "_get_ws_url", return_value="ws://localhost:9222")
    def test_fetch_no_content_in_response(self, mock_ws_url, mock_create_conn):
        """Test fetch when CDP returns no content."""
        mock_ws = MagicMock()
        mock_create_conn.return_value = mock_ws

        mock_ws.recv.side_effect = [
            json.dumps({"id": 1}),
            json.dumps({"id": 2}),
            json.dumps({"method": "Page.loadEventFired"}),
            json.dumps({"id": 3, "result": {}}),  # No result.value
        ]

        client = LightpandaClient()
        result = client.fetch("https://example.com")

        assert result.startswith("Error:")

    @patch("websocket.create_connection")
    @patch.object(LightpandaClient, "_get_ws_url", return_value="ws://localhost:9222")
    def test_fetch_connection_error(self, mock_ws_url, mock_create_conn):
        """Test fetch when Lightpanda is not running."""
        mock_create_conn.side_effect = ConnectionRefusedError("Connection refused")

        client = LightpandaClient()
        result = client.fetch("https://example.com")

        assert result.startswith("Error:")
        assert "connect" in result.lower()

    @patch("websocket.create_connection")
    @patch.object(LightpandaClient, "_get_ws_url", return_value="ws://localhost:9222")
    def test_fetch_generic_exception(self, mock_ws_url, mock_create_conn):
        """Test fetch with unexpected exception."""
        mock_create_conn.side_effect = Exception("Unexpected error")

        client = LightpandaClient()
        result = client.fetch("https://example.com")

        assert result.startswith("Error:")
        assert "Unexpected error" in result

    @patch("src.community.lightpanda.lightpanda_client.requests.get")
    def test_get_ws_url_from_version_endpoint(self, mock_get):
        """Test _get_ws_url fetches URL from /json/version."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/abc"}
        mock_get.return_value = mock_response

        client = LightpandaClient()
        ws_url = client._get_ws_url()

        assert ws_url == "ws://localhost:9222/devtools/browser/abc"

    @patch("src.community.lightpanda.lightpanda_client.requests.get")
    def test_get_ws_url_fallback(self, mock_get):
        """Test _get_ws_url falls back to constructed URL when /json/version fails."""
        mock_get.side_effect = Exception("Connection refused")

        client = LightpandaClient()
        ws_url = client._get_ws_url()

        assert ws_url == "ws://localhost:9222"


class TestLightpandaTools:
    @patch("src.community.lightpanda.tools.LightpandaClient")
    @patch("src.community.lightpanda.tools.get_app_config")
    def test_web_fetch_tool_success(self, mock_get_config, mock_client_class):
        """Test web_fetch_tool returns markdown content."""
        from src.community.lightpanda import tools

        mock_config = MagicMock()
        mock_config.get_tool_config.return_value = MagicMock(model_extra={"timeout": 30})
        mock_get_config.return_value = mock_config

        mock_client = MagicMock()
        mock_client.fetch.return_value = "<html><head><title>Test Page</title></head><body><p>Test content</p></body></html>"
        mock_client_class.return_value = mock_client

        result = tools.web_fetch_tool.run("https://example.com")

        assert "Test" in result
        mock_client.fetch.assert_called_once_with("https://example.com", timeout=30)

    @patch("src.community.lightpanda.tools.LightpandaClient")
    @patch("src.community.lightpanda.tools.get_app_config")
    def test_web_fetch_tool_error_passthrough(self, mock_get_config, mock_client_class):
        """Test web_fetch_tool passes through error messages."""
        from src.community.lightpanda import tools

        mock_config = MagicMock()
        mock_config.get_tool_config.return_value = None
        mock_get_config.return_value = mock_config

        mock_client = MagicMock()
        mock_client.fetch.return_value = "Error: Could not connect to Lightpanda"
        mock_client_class.return_value = mock_client

        result = tools.web_fetch_tool.run("https://example.com")

        assert result == "Error: Could not connect to Lightpanda"

    @patch("src.community.lightpanda.tools.LightpandaClient")
    @patch("src.community.lightpanda.tools.get_app_config")
    def test_web_fetch_tool_truncates_content(self, mock_get_config, mock_client_class):
        """Test web_fetch_tool truncates content to 4096 chars."""
        from src.community.lightpanda import tools

        mock_config = MagicMock()
        mock_config.get_tool_config.return_value = None
        mock_get_config.return_value = mock_config

        long_content = "<html><body>" + "x" * 10000 + "</body></html>"
        mock_client = MagicMock()
        mock_client.fetch.return_value = long_content
        mock_client_class.return_value = mock_client

        result = tools.web_fetch_tool.run("https://example.com")

        assert len(result) <= 4096

    @patch("src.community.lightpanda.tools.LightpandaClient")
    @patch("src.community.lightpanda.tools.get_app_config")
    def test_web_search_tool_success(self, mock_get_config, mock_client_class):
        """Test web_search_tool returns structured results."""
        from src.community.lightpanda import tools

        mock_config = MagicMock()
        mock_config.get_tool_config.return_value = MagicMock(model_extra={"max_results": 5, "timeout": 30})
        mock_get_config.return_value = mock_config

        # Simulate DuckDuckGo HTML response with result links
        ddg_html = """
        <html><body>
        <div class="result">
            <a class="result__a" href="https://example.com/page1">Example Page 1</a>
            <a class="result__snippet">This is the first result snippet</a>
        </div>
        <div class="result">
            <a class="result__a" href="https://example.com/page2">Example Page 2</a>
            <a class="result__snippet">This is the second result snippet</a>
        </div>
        </body></html>
        """
        mock_client = MagicMock()
        mock_client.fetch.return_value = ddg_html
        mock_client_class.return_value = mock_client

        result = tools.web_search_tool.run("test query")

        parsed = json.loads(result)
        assert isinstance(parsed, list)
        assert len(parsed) == 2
        assert parsed[0]["title"] == "Example Page 1"
        assert parsed[0]["url"] == "https://example.com/page1"

    @patch("src.community.lightpanda.tools.LightpandaClient")
    @patch("src.community.lightpanda.tools.get_app_config")
    def test_web_search_tool_error_passthrough(self, mock_get_config, mock_client_class):
        """Test web_search_tool passes through errors."""
        from src.community.lightpanda import tools

        mock_config = MagicMock()
        mock_config.get_tool_config.return_value = None
        mock_get_config.return_value = mock_config

        mock_client = MagicMock()
        mock_client.fetch.return_value = "Error: Connection refused"
        mock_client_class.return_value = mock_client

        result = tools.web_search_tool.run("test query")

        assert result == "Error: Connection refused"

    @patch("src.community.lightpanda.tools.LightpandaClient")
    @patch("src.community.lightpanda.tools.get_app_config")
    def test_web_search_tool_no_results(self, mock_get_config, mock_client_class):
        """Test web_search_tool with no matching results."""
        from src.community.lightpanda import tools

        mock_config = MagicMock()
        mock_config.get_tool_config.return_value = None
        mock_get_config.return_value = mock_config

        mock_client = MagicMock()
        mock_client.fetch.return_value = "<html><body>No results</body></html>"
        mock_client_class.return_value = mock_client

        result = tools.web_search_tool.run("obscure query")

        parsed = json.loads(result)
        assert isinstance(parsed, list)
        assert len(parsed) == 0

    @patch("src.community.lightpanda.tools.LightpandaClient")
    @patch("src.community.lightpanda.tools.get_app_config")
    def test_web_search_tool_max_results(self, mock_get_config, mock_client_class):
        """Test web_search_tool respects max_results config."""
        from src.community.lightpanda import tools

        mock_config = MagicMock()
        mock_config.get_tool_config.return_value = MagicMock(model_extra={"max_results": 1, "timeout": 30})
        mock_get_config.return_value = mock_config

        ddg_html = """
        <html><body>
        <a class="result__a" href="https://example.com/1">Result 1</a>
        <a class="result__snippet">Snippet 1</a>
        <a class="result__a" href="https://example.com/2">Result 2</a>
        <a class="result__snippet">Snippet 2</a>
        <a class="result__a" href="https://example.com/3">Result 3</a>
        <a class="result__snippet">Snippet 3</a>
        </body></html>
        """
        mock_client = MagicMock()
        mock_client.fetch.return_value = ddg_html
        mock_client_class.return_value = mock_client

        result = tools.web_search_tool.run("test")

        parsed = json.loads(result)
        assert len(parsed) <= 1

    @patch("src.community.lightpanda.tools.LightpandaClient")
    @patch("src.community.lightpanda.tools.get_app_config")
    def test_web_search_tool_uddg_redirect(self, mock_get_config, mock_client_class):
        """Test web_search_tool extracts actual URL from DuckDuckGo redirect."""
        from src.community.lightpanda import tools

        mock_config = MagicMock()
        mock_config.get_tool_config.return_value = None
        mock_get_config.return_value = mock_config

        ddg_html = """
        <html><body>
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Freal.example.com%2Fpage&rut=abc">Real Result</a>
        <a class="result__snippet">Real snippet</a>
        </body></html>
        """
        mock_client = MagicMock()
        mock_client.fetch.return_value = ddg_html
        mock_client_class.return_value = mock_client

        result = tools.web_search_tool.run("test")

        parsed = json.loads(result)
        assert len(parsed) == 1
        assert parsed[0]["url"] == "https://real.example.com/page"
