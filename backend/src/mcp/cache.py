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

_mcp_tools_cache: list[BaseTool] | None = None
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


async def initialize_mcp_tools() -> list[BaseTool]:
    """Initialize and cache MCP tools.

    This should be called once at application startup.

    Returns:
        List of LangChain tools from all enabled MCP servers.
    """
    global _mcp_tools_cache, _cache_initialized, _config_mtime

    async with _initialization_lock:
        if _cache_initialized:
            logger.info("MCP tools already initialized")
            return _mcp_tools_cache or []

        from src.mcp.tools import get_mcp_tools

        logger.info("Initializing MCP tools...")
        _mcp_tools_cache = await get_mcp_tools()
        _cache_initialized = True
        _config_mtime = _get_config_mtime()  # Record config file mtime
        logger.info(f"MCP tools initialized: {len(_mcp_tools_cache)} tool(s) loaded (config mtime: {_config_mtime})")

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


def get_cached_mcp_tools() -> list[BaseTool]:
    """Get cached MCP tools, non-blocking.

    If background initialization is still running, returns whatever is
    available (empty list) so the agent can respond immediately with its
    built-in tools.  MCP tools will appear on subsequent requests once
    the background init completes.

    If no background init was started, falls back to synchronous init
    (original behaviour).

    Also checks if the config file has been modified since last initialization,
    and re-initializes if needed.

    Returns:
        List of cached MCP tools.
    """
    global _cache_initialized

    # Check if cache is stale due to config file changes
    if _is_cache_stale():
        logger.info("MCP cache is stale, resetting for re-initialization...")
        reset_mcp_tools_cache()

    if _cache_initialized:
        return _mcp_tools_cache or []

    # If background init is running, don't block — return empty for now
    if _bg_init_started and _bg_init_thread is not None and _bg_init_thread.is_alive():
        logger.info("MCP tools still loading in background — agent will use built-in tools for now")
        return []

    # If background init finished (thread done but cache set), return cache
    if _bg_init_started and _cache_initialized:
        return _mcp_tools_cache or []

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
        return []

    return _mcp_tools_cache or []


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
