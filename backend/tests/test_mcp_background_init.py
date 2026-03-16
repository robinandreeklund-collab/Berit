"""Tests for MCP background initialization to avoid blocking first chat."""

import asyncio
import threading
import time
from unittest.mock import AsyncMock, patch

import pytest


class TestBackgroundInit:
    """Test that MCP tools load in the background without blocking the agent."""

    def setup_method(self):
        """Reset cache state before each test."""
        from src.mcp.cache import reset_mcp_tools_cache

        reset_mcp_tools_cache()

    def test_start_background_initialization_starts_thread(self):
        """Background init should start a daemon thread."""
        from src.mcp import cache

        cache.reset_mcp_tools_cache()

        with patch("src.config.extensions_config.ExtensionsConfig.from_file") as mock_config:
            mock_config.return_value.get_enabled_mcp_servers.return_value = {"scb": {"enabled": True}}

            with patch("src.mcp.cache._run_background_init"):
                cache.start_background_initialization()

                assert cache._bg_init_started is True
                assert cache._bg_init_thread is not None
                assert cache._bg_init_thread.daemon is True

    def test_start_background_initialization_idempotent(self):
        """Calling start_background_initialization twice should only start one thread."""
        from src.mcp import cache

        cache.reset_mcp_tools_cache()

        with patch("src.config.extensions_config.ExtensionsConfig.from_file") as mock_config:
            mock_config.return_value.get_enabled_mcp_servers.return_value = {"scb": {"enabled": True}}

            with patch("src.mcp.cache._run_background_init"):
                cache.start_background_initialization()
                first_thread = cache._bg_init_thread

                cache.start_background_initialization()
                assert cache._bg_init_thread is first_thread

    def test_get_cached_mcp_tools_nonblocking_during_init(self):
        """get_cached_mcp_tools should return empty list while background init is running."""
        from src.mcp import cache

        cache.reset_mcp_tools_cache()

        # Simulate background init in progress
        cache._bg_init_started = True
        cache._bg_init_thread = threading.Thread(target=lambda: time.sleep(10), daemon=True)
        cache._bg_init_thread.start()

        # Should return empty immediately, not block
        start = time.monotonic()
        result = cache.get_cached_mcp_tools()
        elapsed = time.monotonic() - start

        assert result == []
        assert elapsed < 1.0, f"get_cached_mcp_tools blocked for {elapsed:.1f}s — should be non-blocking"

        # Clean up the thread
        cache._bg_init_thread = None

    def test_get_cached_mcp_tools_returns_tools_after_init(self):
        """After background init completes, tools should be available."""
        from src.mcp import cache

        cache.reset_mcp_tools_cache()

        # Simulate completed initialization (cache is now a dict keyed by server)
        cache._cache_initialized = True
        cache._mcp_tools_cache = {"server1": ["tool1", "tool2"]}

        result = cache.get_cached_mcp_tools()
        assert result == ["tool1", "tool2"]

    def test_no_servers_skips_background_init(self):
        """If no MCP servers are enabled, background init should not start."""
        from src.mcp import cache

        cache.reset_mcp_tools_cache()

        with patch("src.config.extensions_config.ExtensionsConfig.from_file") as mock_config:
            mock_config.return_value.get_enabled_mcp_servers.return_value = {}

            cache.start_background_initialization()

            assert cache._bg_init_started is False
            assert cache._bg_init_thread is None

    def test_reset_clears_background_state(self):
        """reset_mcp_tools_cache should clear background init state."""
        from src.mcp import cache

        cache._bg_init_started = True
        cache._cache_initialized = True
        cache._mcp_tools_cache = {"server1": ["tool1"]}

        cache.reset_mcp_tools_cache()

        assert cache._bg_init_started is False
        assert cache._cache_initialized is False
        assert cache._mcp_tools_cache is None
