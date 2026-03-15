"""Tests for MCP tool loading retry logic and parallel initialization."""

import asyncio
import time
from unittest.mock import AsyncMock, MagicMock, patch

from src.mcp.tools import _is_http_transport, _load_tools_from_server, get_mcp_tools


def test_is_http_transport_http():
    assert _is_http_transport({"scb": {"transport": "http", "url": "http://localhost:3000/mcp"}}) is True


def test_is_http_transport_sse():
    assert _is_http_transport({"scb": {"transport": "sse", "url": "http://localhost:3000/sse"}}) is True


def test_is_http_transport_stdio():
    assert _is_http_transport({"lightpanda": {"transport": "stdio", "command": "gomcp"}}) is False


def test_is_http_transport_empty():
    assert _is_http_transport({}) is False


def test_retry_succeeds_on_second_attempt():
    """HTTP server fails once then succeeds — should return tools."""
    mock_tool = MagicMock()
    mock_tool.name = "search_tables"

    mock_client = MagicMock()
    mock_client.get_tools = AsyncMock(side_effect=[Exception("503 Service Unavailable"), [mock_tool]])

    with patch("langchain_mcp_adapters.client.MultiServerMCPClient", return_value=mock_client), \
         patch("src.mcp.tools.asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        tools = asyncio.run(_load_tools_from_server(
            "scb",
            {"scb": {"transport": "http", "url": "http://scb-mcp:3000/mcp"}},
            [],
        ))

    assert len(tools) == 1
    assert tools[0].name == "search_tables"
    mock_sleep.assert_called_once_with(5)  # first retry delay: 5 * 2^0 = 5


def test_retry_exhausted_returns_empty():
    """HTTP server fails all attempts — should return empty list."""
    mock_client = MagicMock()
    mock_client.get_tools = AsyncMock(side_effect=Exception("503 Service Unavailable"))

    with patch("langchain_mcp_adapters.client.MultiServerMCPClient", return_value=mock_client), \
         patch("src.mcp.tools.asyncio.sleep", new_callable=AsyncMock):
        tools = asyncio.run(_load_tools_from_server(
            "scb",
            {"scb": {"transport": "http", "url": "http://scb-mcp:3000/mcp"}},
            [],
        ))

    assert tools == []
    assert mock_client.get_tools.call_count == 3  # _HTTP_RETRY_ATTEMPTS = 3


def test_stdio_no_retry():
    """Stdio server fails once — should NOT retry."""
    mock_client = MagicMock()
    mock_client.get_tools = AsyncMock(side_effect=Exception("Connection refused"))

    with patch("langchain_mcp_adapters.client.MultiServerMCPClient", return_value=mock_client), \
         patch("src.mcp.tools.asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        tools = asyncio.run(_load_tools_from_server(
            "lightpanda",
            {"lightpanda": {"transport": "stdio", "command": "gomcp"}},
            [],
        ))

    assert tools == []
    assert mock_client.get_tools.call_count == 1
    mock_sleep.assert_not_called()


def test_retry_exponential_backoff():
    """Verify exponential backoff delays: 5s, 10s."""
    mock_tool = MagicMock()
    mock_tool.name = "test_tool"

    mock_client = MagicMock()
    mock_client.get_tools = AsyncMock(side_effect=[
        Exception("503"),
        Exception("503"),
        [mock_tool],  # succeeds on 3rd attempt
    ])

    with patch("langchain_mcp_adapters.client.MultiServerMCPClient", return_value=mock_client), \
         patch("src.mcp.tools.asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        tools = asyncio.run(_load_tools_from_server(
            "scb",
            {"scb": {"transport": "http", "url": "http://scb-mcp:3000/mcp"}},
            [],
        ))

    assert len(tools) == 1
    assert mock_sleep.call_count == 2
    mock_sleep.assert_any_call(5)   # 5 * 2^0
    mock_sleep.assert_any_call(10)  # 5 * 2^1


def test_first_attempt_success_no_retry():
    """HTTP server succeeds on first attempt — no retries needed."""
    mock_tool = MagicMock()
    mock_tool.name = "get_table_data"

    mock_client = MagicMock()
    mock_client.get_tools = AsyncMock(return_value=[mock_tool])

    with patch("langchain_mcp_adapters.client.MultiServerMCPClient", return_value=mock_client), \
         patch("src.mcp.tools.asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        tools = asyncio.run(_load_tools_from_server(
            "scb",
            {"scb": {"transport": "http", "url": "http://scb-mcp:3000/mcp"}},
            [],
        ))

    assert len(tools) == 1
    mock_sleep.assert_not_called()


def test_parallel_loading():
    """Multiple MCP servers should be loaded concurrently, not sequentially.

    Each mock server takes 0.5s to respond. With 3 servers loaded in parallel,
    total time should be ~0.5s, not ~1.5s.
    """
    async def _slow_get_tools():
        await asyncio.sleep(0.5)
        tool = MagicMock()
        tool.name = f"tool_{id(tool)}"
        return [tool]

    def make_slow_client(*args, **kwargs):
        client = MagicMock()
        client.get_tools = _slow_get_tools
        return client

    servers_config = {
        "server_a": {"transport": "http", "url": "http://a:3000/mcp"},
        "server_b": {"transport": "http", "url": "http://b:3000/mcp"},
        "server_c": {"transport": "http", "url": "http://c:3000/mcp"},
    }

    mock_extensions = MagicMock()
    mock_extensions.mcp_servers = {
        name: MagicMock(enabled=True, type="http", url=cfg["url"])
        for name, cfg in servers_config.items()
    }

    with patch("langchain_mcp_adapters.client.MultiServerMCPClient", side_effect=make_slow_client), \
         patch("src.mcp.tools.ExtensionsConfig.from_file", return_value=mock_extensions), \
         patch("src.mcp.tools.build_servers_config", return_value=servers_config), \
         patch("src.mcp.tools.get_initial_oauth_headers", new_callable=AsyncMock, return_value={}), \
         patch("src.mcp.tools.build_oauth_tool_interceptor", return_value=None):
        start = time.monotonic()
        tools = asyncio.run(get_mcp_tools())
        elapsed = time.monotonic() - start

    assert len(tools) == 3
    # Parallel: ~0.5s. Sequential would be ~1.5s. Allow generous margin.
    assert elapsed < 1.0, f"Parallel loading took {elapsed:.2f}s — expected < 1.0s (are servers loading sequentially?)"
