"""Tests for SCB MCP server configuration integration."""

import json
import tempfile
from pathlib import Path

from src.config.extensions_config import ExtensionsConfig, McpServerConfig
from src.mcp.client import build_server_params, build_servers_config


def test_build_server_params_scb_http():
    """Test that SCB MCP HTTP config is correctly built."""
    config = McpServerConfig(
        enabled=True,
        type="http",
        url="http://scb-mcp:3000/mcp",
        env={},
        description="SCB — Sveriges officiella statistik via PxWebAPI 2.0.",
    )

    params = build_server_params("scb", config)

    assert params["transport"] == "http"
    assert params["url"] == "http://scb-mcp:3000/mcp"


def test_build_server_params_scb_render_fallback():
    """Test that SCB MCP with Render fallback URL works."""
    config = McpServerConfig(
        enabled=True,
        type="http",
        url="https://scb-mcp.onrender.com/mcp",
    )

    params = build_server_params("scb", config)

    assert params["transport"] == "http"
    assert params["url"] == "https://scb-mcp.onrender.com/mcp"


def test_build_servers_config_includes_scb_when_enabled():
    """Test that SCB MCP is included in assembled server config when enabled."""
    extensions = ExtensionsConfig(
        mcp_servers={
            "lightpanda": McpServerConfig(
                enabled=True,
                type="stdio",
                command="../scripts/run-gomcp.sh",
                args=[],
                env={"LIGHTPANDA_CDP_URL": "ws://lightpanda:9222"},
            ),
            "scb": McpServerConfig(
                enabled=True,
                type="http",
                url="http://scb-mcp:3000/mcp",
                description="SCB statistics",
            ),
        },
        skills={},
    )

    result = build_servers_config(extensions)

    assert "scb" in result
    assert result["scb"]["transport"] == "http"
    assert result["scb"]["url"] == "http://scb-mcp:3000/mcp"
    assert "lightpanda" in result


def test_build_servers_config_excludes_scb_when_disabled():
    """Test that SCB MCP is excluded when disabled."""
    extensions = ExtensionsConfig(
        mcp_servers={
            "scb": McpServerConfig(
                enabled=False,
                type="http",
                url="http://scb-mcp:3000/mcp",
            ),
        },
        skills={},
    )

    result = build_servers_config(extensions)

    assert "scb" not in result


def test_scb_config_from_example_json():
    """Test that SCB MCP config loads correctly from the example JSON structure."""
    config_data = {
        "mcpServers": {
            "scb": {
                "enabled": True,
                "type": "http",
                "url": "http://scb-mcp:3000/mcp",
                "env": {},
                "description": "SCB — Sveriges officiella statistik via PxWebAPI 2.0.",
            }
        },
        "skills": {},
    }

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(config_data, f)
        f.flush()
        config = ExtensionsConfig.from_file(f.name)

    assert "scb" in config.mcp_servers
    scb = config.mcp_servers["scb"]
    assert scb.enabled is True
    assert scb.type == "http"
    assert scb.url == "http://scb-mcp:3000/mcp"

    # Clean up
    Path(f.name).unlink(missing_ok=True)


def test_scb_env_variable_resolution():
    """Test that $SCB_MCP_URL env variable is resolved in config."""
    import os

    config_data = {
        "mcpServers": {
            "scb": {
                "enabled": True,
                "type": "http",
                "url": "$SCB_MCP_URL",
                "env": {},
            }
        },
        "skills": {},
    }

    os.environ["SCB_MCP_URL"] = "http://scb-mcp:3000/mcp"
    try:
        ExtensionsConfig.resolve_env_variables(config_data)
        assert config_data["mcpServers"]["scb"]["url"] == "http://scb-mcp:3000/mcp"
    finally:
        del os.environ["SCB_MCP_URL"]


def test_scb_env_variable_fallback_to_empty():
    """Test that missing $SCB_MCP_URL resolves to empty string."""
    import os

    config_data = {
        "mcpServers": {
            "scb": {
                "enabled": True,
                "type": "http",
                "url": "$SCB_MCP_URL_NONEXISTENT",
                "env": {},
            }
        },
        "skills": {},
    }

    # Ensure the env var doesn't exist
    os.environ.pop("SCB_MCP_URL_NONEXISTENT", None)
    ExtensionsConfig.resolve_env_variables(config_data)
    assert config_data["mcpServers"]["scb"]["url"] == ""
