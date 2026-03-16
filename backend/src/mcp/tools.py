"""Load MCP tools using langchain-mcp-adapters."""

import asyncio
import logging

from langchain_core.tools import BaseTool

from src.config.extensions_config import ExtensionsConfig
from src.mcp.client import build_servers_config
from src.mcp.oauth import build_oauth_tool_interceptor, get_initial_oauth_headers

logger = logging.getLogger(__name__)

# Retry settings for HTTP/SSE MCP servers (handles cold starts on services like Render)
_HTTP_RETRY_ATTEMPTS = 3
_HTTP_RETRY_BASE_DELAY = 5  # seconds — Render cold start can take 30-60s


async def get_mcp_tools_by_server() -> dict[str, list[BaseTool]]:
    """Get tools from all enabled MCP servers, indexed by server name.

    Returns:
        Dict mapping server name to list of tools from that server.
    """
    try:
        from langchain_mcp_adapters.client import MultiServerMCPClient  # noqa: F401
    except ImportError:
        logger.warning("langchain-mcp-adapters not installed. Install it to enable MCP tools: pip install langchain-mcp-adapters")
        return {}

    extensions_config = ExtensionsConfig.from_file()
    servers_config = build_servers_config(extensions_config)

    if not servers_config:
        logger.info("No enabled MCP servers configured")
        return {}

    try:
        logger.info(f"Initializing MCP client with {len(servers_config)} server(s)")

        # Inject initial OAuth headers for server connections
        initial_oauth_headers = await get_initial_oauth_headers(extensions_config)
        for server_name, auth_header in initial_oauth_headers.items():
            if server_name not in servers_config:
                continue
            if servers_config[server_name].get("transport") in ("sse", "http"):
                existing_headers = dict(servers_config[server_name].get("headers", {}))
                existing_headers["Authorization"] = auth_header
                servers_config[server_name]["headers"] = existing_headers

        tool_interceptors = []
        oauth_interceptor = build_oauth_tool_interceptor(extensions_config)
        if oauth_interceptor is not None:
            tool_interceptors.append(oauth_interceptor)

        # Load all servers concurrently, keeping results per server
        server_names = list(servers_config.keys())
        results = await asyncio.gather(
            *[
                _load_tools_from_server(server_name, {server_name: servers_config[server_name]}, tool_interceptors)
                for server_name in server_names
            ]
        )

        tools_by_server: dict[str, list[BaseTool]] = {}
        total = 0
        for server_name, tools in zip(server_names, results):
            if tools:
                tools_by_server[server_name] = tools
                total += len(tools)

        logger.info(f"Successfully loaded {total} total MCP tool(s) across {len(tools_by_server)} server(s)")
        return tools_by_server

    except Exception as e:
        logger.error(f"Failed to load MCP tools: {e}", exc_info=True)
        return {}


async def get_mcp_tools() -> list[BaseTool]:
    """Get all tools from enabled MCP servers (flat list, backward compatible).

    Returns:
        List of LangChain tools from all enabled MCP servers.
    """
    by_server = await get_mcp_tools_by_server()
    return [tool for tools in by_server.values() for tool in tools]


def _is_http_transport(server_config: dict) -> bool:
    """Check if any server in the config uses HTTP/SSE transport."""
    for cfg in server_config.values():
        if cfg.get("transport") in ("sse", "http"):
            return True
    return False


async def _load_tools_from_server(server_name: str, server_config: dict, tool_interceptors: list) -> list[BaseTool]:
    """Load tools from a single MCP server, returning empty list on failure.

    For HTTP/SSE servers, retries with exponential backoff to handle cold starts
    on services like Render (which can take 30-60s to spin up).
    """
    from langchain_mcp_adapters.client import MultiServerMCPClient

    max_attempts = _HTTP_RETRY_ATTEMPTS if _is_http_transport(server_config) else 1

    for attempt in range(1, max_attempts + 1):
        try:
            client = MultiServerMCPClient(server_config, tool_interceptors=tool_interceptors)
            tools = await client.get_tools()
            tool_names = [t.name for t in tools]
            logger.info(f"Loaded {len(tools)} tool(s) from MCP server '{server_name}': {tool_names}")
            return tools
        except Exception as e:
            if attempt < max_attempts:
                delay = _HTTP_RETRY_BASE_DELAY * (2 ** (attempt - 1))
                logger.warning(f"Attempt {attempt}/{max_attempts} failed for MCP server '{server_name}': {e}. Retrying in {delay}s...")
                await asyncio.sleep(delay)
            else:
                logger.error(f"Failed to load tools from MCP server '{server_name}' after {max_attempts} attempt(s): {e}")
                return []

    return []  # unreachable, but keeps type checker happy
