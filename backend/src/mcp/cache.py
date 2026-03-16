"""Cache for MCP tools to avoid repeated loading.

Supports eager background initialization so the first chat message
is not blocked by MCP tool loading (20+ servers can take 30-60 s).
"""

import asyncio
import logging
import os
import threading

from langchain_core.tools import BaseTool

logger = logging.getLogger(__name__)

_mcp_tools_cache: dict[str, list[BaseTool]] | None = None  # server_name -> tools
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
    """Initialize and cache MCP tools grouped by server name.

    This should be called once at application startup.

    Returns:
        Dict mapping server name to list of LangChain tools from that server.
    """
    global _mcp_tools_cache, _cache_initialized, _config_mtime

    async with _initialization_lock:
        if _cache_initialized:
            logger.info("MCP tools already initialized")
            return _mcp_tools_cache or {}

        from src.mcp.tools import get_mcp_tools

        logger.info("Initializing MCP tools...")
        _mcp_tools_cache = await get_mcp_tools()
        _cache_initialized = True
        _config_mtime = _get_config_mtime()  # Record config file mtime
        total = sum(len(tools) for tools in _mcp_tools_cache.values())
        logger.info(f"MCP tools initialized: {total} tool(s) from {len(_mcp_tools_cache)} server(s) (config mtime: {_config_mtime})")

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


def _ensure_cache_loaded() -> dict[str, list[BaseTool]]:
    """Ensure MCP tools cache is loaded, returning per-server dict.

    Non-blocking if background init is still running (returns empty dict).
    Falls back to synchronous init if no background thread was started.
    """
    global _cache_initialized

    # Check if cache is stale due to config file changes
    if _is_cache_stale():
        logger.info("MCP cache is stale, resetting for re-initialization...")
        reset_mcp_tools_cache()

    if _cache_initialized:
        return _mcp_tools_cache or {}

    # If background init is running, don't block — return empty for now
    if _bg_init_started and _bg_init_thread is not None and _bg_init_thread.is_alive():
        logger.info("MCP tools still loading in background — agent will use built-in tools for now")
        return {}

    # If background init finished (thread done but cache set), return cache
    if _bg_init_started and _cache_initialized:
        return _mcp_tools_cache or {}

    # Fallback: synchronous initialization (no background init was started)
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
        return {}

    return _mcp_tools_cache or {}


def get_cached_mcp_tools() -> list[BaseTool]:
    """Get cached MCP tools as a flat list (backward compatible).

    Returns:
        List of all cached MCP tools from all servers.
    """
    tools_by_server = _ensure_cache_loaded()
    return [tool for tools in tools_by_server.values() for tool in tools]


def get_cached_mcp_tools_by_server() -> dict[str, list[BaseTool]]:
    """Get cached MCP tools grouped by server name.

    Returns:
        Dict mapping server name to list of tools from that server.
    """
    return _ensure_cache_loaded()


def get_tools_for_servers(server_names: list[str]) -> list[BaseTool]:
    """Get MCP tools for specific servers only.

    Args:
        server_names: List of MCP server names to get tools for.

    Returns:
        List of tools from the specified servers.
    """
    tools_by_server = _ensure_cache_loaded()
    result = []
    for name in server_names:
        if name in tools_by_server:
            result.extend(tools_by_server[name])
    return result


def reset_mcp_tools_cache() -> None:
    """Reset the MCP tools cache.

    This is useful for testing or when you want to reload MCP tools.
    """
    global _mcp_tools_cache, _cache_initialized, _config_mtime, _bg_init_started
    _mcp_tools_cache = None  # type: ignore[assignment]
    _cache_initialized = False
    _config_mtime = None
    _bg_init_started = False
    logger.info("MCP tools cache reset")
