"""Tests for SkillToolFilterMiddleware integration in lead agent build_middlewares."""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from src.agents.middlewares.skill_tool_filter_middleware import SkillToolFilterMiddleware


def _make_mock_tool(name: str) -> MagicMock:
    """Create a mock tool with the given name."""
    tool = MagicMock()
    tool.name = name
    return tool


class TestBuildMiddlewaresIncludesSkillFilter:
    """Tests that _build_middlewares includes the skill tool filter when tools are provided."""

    @patch("src.mcp.cache.get_cached_mcp_tools")
    @patch("src.agents.lead_agent.agent.build_lead_runtime_middlewares")
    @patch("src.agents.lead_agent.agent.get_app_config")
    @patch("src.agents.lead_agent.agent.get_summarization_config")
    def test_includes_skill_filter_when_tools_provided(self, mock_summ_config, mock_app_config, mock_build_runtime, mock_get_mcp):
        from src.agents.lead_agent.agent import _build_middlewares

        mock_build_runtime.return_value = []
        mock_get_mcp.return_value = []
        mock_summ_config.return_value = SimpleNamespace(enabled=False)
        mock_app_config.return_value = SimpleNamespace(get_model_config=lambda _: None)

        config = {"configurable": {}}
        tools = [_make_mock_tool("bash"), _make_mock_tool("read_file")]

        middlewares = _build_middlewares(config, model_name="nemotron-3-nano", tools=tools)

        has_filter = any(isinstance(m, SkillToolFilterMiddleware) for m in middlewares)
        assert has_filter, "SkillToolFilterMiddleware should be in middleware chain when tools are provided"

    @patch("src.agents.lead_agent.agent.build_lead_runtime_middlewares")
    @patch("src.agents.lead_agent.agent.get_app_config")
    @patch("src.agents.lead_agent.agent.get_summarization_config")
    def test_no_skill_filter_when_tools_is_none(self, mock_summ_config, mock_app_config, mock_build_runtime):
        from src.agents.lead_agent.agent import _build_middlewares

        mock_build_runtime.return_value = []
        mock_summ_config.return_value = SimpleNamespace(enabled=False)
        mock_app_config.return_value = SimpleNamespace(get_model_config=lambda _: None)

        config = {"configurable": {}}

        middlewares = _build_middlewares(config, model_name="nemotron-3-nano", tools=None)

        has_filter = any(isinstance(m, SkillToolFilterMiddleware) for m in middlewares)
        assert not has_filter, "SkillToolFilterMiddleware should NOT be in middleware chain when tools is None"
