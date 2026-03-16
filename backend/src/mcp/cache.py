"""Cache for MCP tools to avoid repeated loading.

Supports eager background initialization so the first chat message
is not blocked by MCP tool loading (20+ servers can take 30-60 s).

Tools are stored **per server** so the skill-driven middleware can
retrieve only the tools needed for the current conversation turn.
"""

import asyncio
import logging
import os
import threading

from langchain_core.tools import BaseTool

logger = logging.getLogger(__name__)

_mcp_tools_cache: dict[str, list[BaseTool]] | None = None
_cache_initialized = False
_initialization_lock = asyncio.Lock()
_config_mtime: float | None = None  # Track config file modification time
_bg_init_started = False  # Whether background initialization has been kicked off
_bg_init_thread: threading.Thread | None = None


def _get_config_mtime() -> float | None:
    """Get the modification time of the extensions config file.

    Returns:
        The modification time as a float, or None if the file doesn't exist.
    """
    from src.config.extensions_config import ExtensionsConfig

    config_path = ExtensionsConfig.resolve_config_path()
    if config_path and config_path.exists():
        return os.path.getmtime(config_path)
    return None


def _is_cache_stale() -> bool:
    """Check if the cache is stale due to config file changes.

    Returns:
        True if the cache should be invalidated, False otherwise.
    """
    global _config_mtime

    if not _cache_initialized:
        return False  # Not initialized yet, not stale

    current_mtime = _get_config_mtime()

    # If we couldn't get mtime before or now, assume not stale
    if _config_mtime is None or current_mtime is None:
        return False

    # If the config file has been modified since we cached, it's stale
    if current_mtime > _config_mtime:
        logger.info(f"MCP config file has been modified (mtime: {_config_mtime} -> {current_mtime}), cache is stale")
        return True

    return False


async def initialize_mcp_tools() -> dict[str, list[BaseTool]]:
    """Initialize and cache MCP tools, indexed by server name.

    This should be called once at application startup.

    Returns:
        Dict mapping server name to list of tools from that server.
    """
    global _mcp_tools_cache, _cache_initialized, _config_mtime

    async with _initialization_lock:
        if _cache_initialized:
            logger.info("MCP tools already initialized")
            return _mcp_tools_cache or {}

        from src.mcp.tools import get_mcp_tools_by_server

        logger.info("Initializing MCP tools...")
        _mcp_tools_cache = await get_mcp_tools_by_server()
        _cache_initialized = True
        _config_mtime = _get_config_mtime()  # Record config file mtime
        total = sum(len(tools) for tools in _mcp_tools_cache.values())
        logger.info(f"MCP tools initialized: {total} tool(s) across {len(_mcp_tools_cache)} server(s) (config mtime: {_config_mtime})")

        return _mcp_tools_cache


def _run_background_init() -> None:
    """Run MCP initialization in a background thread with its own event loop."""
    try:
        asyncio.run(initialize_mcp_tools())
    except Exception as e:
        logger.error(f"Background MCP initialization failed: {e}")


def start_background_initialization() -> None:
    """Start MCP tool initialization in a background thread.

    This should be called early (e.g. at module import or server start)
    so that tools are ready by the time the first chat message arrives.
    Safe to call multiple times — only the first call starts the thread.
    """
    global _bg_init_started, _bg_init_thread

    if _bg_init_started or _cache_initialized:
        return

    # Quick check: are there even any enabled MCP servers?
    try:
        from src.config.extensions_config import ExtensionsConfig

        extensions_config = ExtensionsConfig.from_file()
        if not extensions_config.get_enabled_mcp_servers():
            logger.info("No enabled MCP servers — skipping background initialization")
            return
    except Exception:
        return

    _bg_init_started = True
    logger.info("Starting background MCP tools initialization...")
    _bg_init_thread = threading.Thread(target=_run_background_init, daemon=True, name="mcp-init")
    _bg_init_thread.start()


def _ensure_cache_fresh() -> None:
    """Check staleness and re-initialize synchronously if needed."""
    global _cache_initialized

    if _is_cache_stale():
        logger.info("MCP cache is stale, resetting for re-initialization...")
        reset_mcp_tools_cache()

    if _cache_initialized:
        return

    # If background init is running, don't block
    if _bg_init_started and _bg_init_thread is not None and _bg_init_thread.is_alive():
        logger.info("MCP tools still loading in background — agent will use built-in tools for now")
        return

    if _bg_init_started and _cache_initialized:
        return

    # Fallback: synchronous initialization
    logger.info("MCP tools not initialized, performing lazy initialization...")
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, initialize_mcp_tools())
                future.result()
        else:
            loop.run_until_complete(initialize_mcp_tools())
    except RuntimeError:
        asyncio.run(initialize_mcp_tools())
    except Exception as e:
        logger.error(f"Failed to lazy-initialize MCP tools: {e}")


def wait_for_mcp_tools(timeout: float = 120.0) -> list[BaseTool]:
    """Wait for background MCP initialization to complete and return all tools.

    Unlike ``get_cached_mcp_tools`` which returns immediately (possibly empty)
    when background init is running, this function blocks until the tools are
    available or the timeout expires.  Used by ``McpToolInjectionMiddleware``
    at construction time to register tools with LangGraph's ToolNode.

    Args:
        timeout: Maximum seconds to wait for background initialization.

    Returns:
        List of all cached MCP tools, or empty list on timeout.
    """
    global _bg_init_thread

    # If already initialized, return immediately
    if _cache_initialized and _mcp_tools_cache is not None:
        return [tool for tools in _mcp_tools_cache.values() for tool in tools]

    # Wait for background thread if running
    if _bg_init_thread is not None and _bg_init_thread.is_alive():
        logger.info("Waiting for background MCP initialization to complete (timeout=%.1fs)...", timeout)
        _bg_init_thread.join(timeout=timeout)
        if _bg_init_thread.is_alive():
            logger.warning("Background MCP initialization did not complete within %.1fs", timeout)
            return []

    # After join, cache should be populated
    if _cache_initialized and _mcp_tools_cache is not None:
        return [tool for tools in _mcp_tools_cache.values() for tool in tools]

    # Fallback to lazy init
    _ensure_cache_fresh()
    if _mcp_tools_cache is not None:
        return [tool for tools in _mcp_tools_cache.values() for tool in tools]

    return []


def get_cached_mcp_tools() -> list[BaseTool]:
    """Get all cached MCP tools as a flat list (backward compatible).

    Returns:
        List of all cached MCP tools from all servers.
    """
    _ensure_cache_fresh()
    if not _mcp_tools_cache:
        return []
    return [tool for tools in _mcp_tools_cache.values() for tool in tools]


def get_cached_mcp_tools_for_servers(server_names: list[str]) -> list[BaseTool]:
    """Get cached MCP tools for specific servers only.

    Args:
        server_names: List of MCP server names to retrieve tools for.

    Returns:
        List of tools from the requested servers only.
    """
    _ensure_cache_fresh()
    if not _mcp_tools_cache:
        return []
    tools: list[BaseTool] = []
    for name in server_names:
        server_tools = _mcp_tools_cache.get(name, [])
        if server_tools:
            tools.extend(server_tools)
            logger.debug(f"Injecting {len(server_tools)} tool(s) from MCP server '{name}'")
        else:
            logger.warning(f"No cached tools found for MCP server '{name}'")
    return tools


def reset_mcp_tools_cache() -> None:
    """Reset the MCP tools cache.

    This is useful for testing or when you want to reload MCP tools.
    """
    global _mcp_tools_cache, _cache_initialized, _config_mtime, _bg_init_started
    _mcp_tools_cache = None
    _cache_initialized = False
    _config_mtime = None
    _bg_init_started = False
    logger.info("MCP tools cache reset")
