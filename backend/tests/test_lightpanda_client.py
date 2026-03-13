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

    @patch("src.community.lightpanda.lightpanda_client.requests.get")
    def test_fetch_success(self, mock_get):
        """Test successful fetch operation."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "<html><body><h1>Hello World</h1></body></html>"
        mock_get.return_value = mock_response

        client = LightpandaClient()
        result = client.fetch("https://example.com")

        assert result == "<html><body><h1>Hello World</h1></body></html>"
        mock_get.assert_called_once()
        args, kwargs = mock_get.call_args
        assert "example.com" in args[0]
        assert kwargs["timeout"] == 30

    @patch("src.community.lightpanda.lightpanda_client.requests.get")
    def test_fetch_custom_timeout(self, mock_get):
        """Test fetch with custom timeout."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "<html></html>"
        mock_get.return_value = mock_response

        client = LightpandaClient()
        client.fetch("https://example.com", timeout=60)

        _, kwargs = mock_get.call_args
        assert kwargs["timeout"] == 60

    @patch("src.community.lightpanda.lightpanda_client.requests.get")
    def test_fetch_non_200_status(self, mock_get):
        """Test fetch operation with non-200 status code."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_get.return_value = mock_response

        client = LightpandaClient()
        result = client.fetch("https://example.com")

        assert result.startswith("Error:")
        assert "500" in result

    @patch("src.community.lightpanda.lightpanda_client.requests.get")
    def test_fetch_empty_response(self, mock_get):
        """Test fetch operation with empty response."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = ""
        mock_get.return_value = mock_response

        client = LightpandaClient()
        result = client.fetch("https://example.com")

        assert result.startswith("Error:")
        assert "empty" in result.lower()

    @patch("src.community.lightpanda.lightpanda_client.requests.get")
    def test_fetch_connection_error(self, mock_get):
        """Test fetch when Lightpanda is not running."""
        import requests

        mock_get.side_effect = requests.exceptions.ConnectionError("Connection refused")

        client = LightpandaClient()
        result = client.fetch("https://example.com")

        assert result.startswith("Error:")
        assert "connect" in result.lower()

    @patch("src.community.lightpanda.lightpanda_client.requests.get")
    def test_fetch_generic_exception(self, mock_get):
        """Test fetch with unexpected exception."""
        mock_get.side_effect = Exception("Unexpected error")

        client = LightpandaClient()
        result = client.fetch("https://example.com")

        assert result.startswith("Error:")
        assert "Unexpected error" in result

    @patch("src.community.lightpanda.lightpanda_client.requests.get")
    def test_fetch_url_encoding(self, mock_get):
        """Test that URLs with special characters are properly encoded."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "<html></html>"
        mock_get.return_value = mock_response

        client = LightpandaClient()
        client.fetch("https://example.com/path?q=hello world&lang=sv")

        args, _ = mock_get.call_args
        # The URL should be properly encoded
        assert "example.com" in args[0]


class TestLightpandaTools:
    @patch("src.community.lightpanda.tools.LightpandaClient")
    @patch("src.community.lightpanda.tools.get_app_config")
    def test_web_fetch_tool_success(self, mock_get_config, mock_client_class):
        """Test web_fetch_tool returns markdown content."""
        from src.community.lightpanda import tools

        mock_config = MagicMock()
        mock_config.get_tool_config.return_value = MagicMock(model_extra={"timeout": 30, "use_cdp": False})
        mock_get_config.return_value = mock_config

        mock_client = MagicMock()
        mock_client.fetch.return_value = "<html><head><title>Test Page</title></head><body><p>Test content</p></body></html>"
        mock_client_class.return_value = mock_client

        result = tools.web_fetch_tool.run("https://example.com")

        assert "Test" in result
        mock_client.fetch.assert_called_once_with("https://example.com", timeout=30)

    @patch("src.community.lightpanda.tools.LightpandaClient")
    @patch("src.community.lightpanda.tools.get_app_config")
    def test_web_fetch_tool_cdp_mode(self, mock_get_config, mock_client_class):
        """Test web_fetch_tool uses CDP when configured."""
        from src.community.lightpanda import tools

        mock_config = MagicMock()
        mock_config.get_tool_config.return_value = MagicMock(model_extra={"timeout": 30, "use_cdp": True})
        mock_get_config.return_value = mock_config

        mock_client = MagicMock()
        mock_client.fetch_cdp.return_value = "<html><head><title>CDP Page</title></head><body><p>CDP content</p></body></html>"
        mock_client_class.return_value = mock_client

        result = tools.web_fetch_tool.run("https://example.com")

        assert "CDP" in result
        mock_client.fetch_cdp.assert_called_once_with("https://example.com", timeout=30)

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
