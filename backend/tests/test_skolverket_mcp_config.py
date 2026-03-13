"""Tests for Skolverket MCP server configuration integration."""

import json
import tempfile
from pathlib import Path

from src.config.extensions_config import ExtensionsConfig, McpServerConfig
from src.mcp.client import build_server_params, build_servers_config


def test_build_server_params_skolverket_http():
    """Test that Skolverket MCP HTTP config is correctly built."""
    config = McpServerConfig(
        enabled=True,
        type="http",
        url="http://skolverket-mcp:3000/mcp",
        env={},
        description="Skolverket — Svenska utbildningsdata via Skolverkets öppna API:er.",
    )

    params = build_server_params("skolverket", config)

    assert params["transport"] == "http"
    assert params["url"] == "http://skolverket-mcp:3000/mcp"


def test_build_server_params_skolverket_render_fallback():
    """Test that Skolverket MCP with Render fallback URL works."""
    config = McpServerConfig(
        enabled=True,
        type="http",
        url="https://skolverket-mcp.onrender.com/mcp",
    )

    params = build_server_params("skolverket", config)

    assert params["transport"] == "http"
    assert params["url"] == "https://skolverket-mcp.onrender.com/mcp"


def test_build_servers_config_includes_skolverket_when_enabled():
    """Test that Skolverket MCP is included in assembled server config when enabled."""
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
            "skolverket": McpServerConfig(
                enabled=True,
                type="http",
                url="http://skolverket-mcp:3000/mcp",
                description="Skolverket education data",
            ),
        },
        skills={},
    )

    result = build_servers_config(extensions)

    assert "skolverket" in result
    assert result["skolverket"]["transport"] == "http"
    assert result["skolverket"]["url"] == "http://skolverket-mcp:3000/mcp"
    assert "scb" in result
    assert "lightpanda" in result


def test_build_servers_config_excludes_skolverket_when_disabled():
    """Test that Skolverket MCP is excluded when disabled."""
    extensions = ExtensionsConfig(
        mcp_servers={
            "skolverket": McpServerConfig(
                enabled=False,
                type="http",
                url="http://skolverket-mcp:3000/mcp",
            ),
        },
        skills={},
    )

    result = build_servers_config(extensions)

    assert "skolverket" not in result


def test_skolverket_config_from_example_json():
    """Test that Skolverket MCP config loads correctly from the example JSON structure."""
    config_data = {
        "mcpServers": {
            "skolverket": {
                "enabled": True,
                "type": "http",
                "url": "http://skolverket-mcp:3000/mcp",
                "env": {},
                "description": "Skolverket — Svenska utbildningsdata via Skolverkets öppna API:er.",
            }
        },
        "skills": {},
    }

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(config_data, f)
        f.flush()
        config = ExtensionsConfig.from_file(f.name)

    assert "skolverket" in config.mcp_servers
    skolverket = config.mcp_servers["skolverket"]
    assert skolverket.enabled is True
    assert skolverket.type == "http"
    assert skolverket.url == "http://skolverket-mcp:3000/mcp"

    # Clean up
    Path(f.name).unlink(missing_ok=True)


def test_skolverket_env_variable_resolution():
    """Test that $SKOLVERKET_MCP_URL env variable is resolved in config."""
    import os

    config_data = {
        "mcpServers": {
            "skolverket": {
                "enabled": True,
                "type": "http",
                "url": "$SKOLVERKET_MCP_URL",
                "env": {},
            }
        },
        "skills": {},
    }

    os.environ["SKOLVERKET_MCP_URL"] = "http://skolverket-mcp:3000/mcp"
    try:
        ExtensionsConfig.resolve_env_variables(config_data)
        assert config_data["mcpServers"]["skolverket"]["url"] == "http://skolverket-mcp:3000/mcp"
    finally:
        del os.environ["SKOLVERKET_MCP_URL"]


def test_skolverket_env_variable_fallback_to_empty():
    """Test that missing $SKOLVERKET_MCP_URL resolves to empty string."""
    import os

    config_data = {
        "mcpServers": {
            "skolverket": {
                "enabled": True,
                "type": "http",
                "url": "$SKOLVERKET_MCP_URL_NONEXISTENT",
                "env": {},
            }
        },
        "skills": {},
    }

    # Ensure the env var doesn't exist
    os.environ.pop("SKOLVERKET_MCP_URL_NONEXISTENT", None)
    ExtensionsConfig.resolve_env_variables(config_data)
    assert config_data["mcpServers"]["skolverket"]["url"] == ""


def test_both_scb_and_skolverket_coexist():
    """Test that SCB and Skolverket MCP servers can coexist in config."""
    config_data = {
        "mcpServers": {
            "scb": {
                "enabled": True,
                "type": "http",
                "url": "http://scb-mcp:3000/mcp",
                "env": {},
                "description": "SCB statistics",
            },
            "skolverket": {
                "enabled": True,
                "type": "http",
                "url": "http://skolverket-mcp:3000/mcp",
                "env": {},
                "description": "Skolverket education data",
            },
        },
        "skills": {},
    }

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(config_data, f)
        f.flush()
        config = ExtensionsConfig.from_file(f.name)

    assert "scb" in config.mcp_servers
    assert "skolverket" in config.mcp_servers
    assert config.mcp_servers["scb"].url == "http://scb-mcp:3000/mcp"
    assert config.mcp_servers["skolverket"].url == "http://skolverket-mcp:3000/mcp"

    result = build_servers_config(config)
    assert "scb" in result
    assert "skolverket" in result

    # Clean up
    Path(f.name).unlink(missing_ok=True)
