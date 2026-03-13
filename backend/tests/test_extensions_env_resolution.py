"""Tests for environment variable resolution in extensions config."""

from unittest.mock import patch

from src.config.extensions_config import ExtensionsConfig


class TestResolveEnvVariables:
    def test_resolve_env_in_dict_string(self):
        """Test $VAR in dict values is resolved."""
        config = {"env": {"MY_KEY": "$MY_VAR"}}
        with patch.dict("os.environ", {"MY_VAR": "resolved_value"}):
            ExtensionsConfig.resolve_env_variables(config)
        assert config["env"]["MY_KEY"] == "resolved_value"

    def test_resolve_env_in_dict_missing_var(self):
        """Test missing $VAR in dict values becomes empty string."""
        config = {"env": {"MY_KEY": "$NONEXISTENT_VAR_12345"}}
        with patch.dict("os.environ", {}, clear=True):
            ExtensionsConfig.resolve_env_variables(config)
        assert config["env"]["MY_KEY"] == ""

    def test_resolve_env_in_list_string(self):
        """Test $VAR in list items is resolved."""
        config = {"args": ["-y", "some-package", "$FILESYSTEM_ALLOWED_PATH"]}
        with patch.dict("os.environ", {"FILESYSTEM_ALLOWED_PATH": "/home/user/.deer-flow"}):
            ExtensionsConfig.resolve_env_variables(config)
        assert config["args"] == ["-y", "some-package", "/home/user/.deer-flow"]

    def test_resolve_env_in_list_missing_var(self):
        """Test missing $VAR in list items becomes empty string."""
        config = {"args": ["-y", "$NONEXISTENT_VAR_12345"]}
        with patch.dict("os.environ", {}, clear=True):
            ExtensionsConfig.resolve_env_variables(config)
        assert config["args"] == ["-y", ""]

    def test_resolve_env_in_list_non_env_strings_unchanged(self):
        """Test non-$VAR strings in lists are preserved."""
        config = {"args": ["-y", "@modelcontextprotocol/server-filesystem", "/some/path"]}
        ExtensionsConfig.resolve_env_variables(config)
        assert config["args"] == ["-y", "@modelcontextprotocol/server-filesystem", "/some/path"]

    def test_resolve_env_in_list_dict_items(self):
        """Test dict items inside lists are recursively resolved."""
        config = {"items": [{"key": "$MY_VAR"}]}
        with patch.dict("os.environ", {"MY_VAR": "value"}):
            ExtensionsConfig.resolve_env_variables(config)
        assert config["items"] == [{"key": "value"}]
