"""Tests for LLMToolSelectorMiddleware integration in lead agent."""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from langchain.agents.middleware import LLMToolSelectorMiddleware
from langchain_core.language_models import BaseChatModel

from src.agents.lead_agent.agent import _TOOL_SELECTOR_SYSTEM_PROMPT, _create_tool_selector_middleware


def _make_mock_tool(name: str) -> MagicMock:
    """Create a mock tool with the given name."""
    tool = MagicMock()
    tool.name = name
    return tool


def _make_mock_model() -> MagicMock:
    """Create a mock model that passes isinstance checks for BaseChatModel."""
    return MagicMock(spec=BaseChatModel)


class TestCreateToolSelectorMiddleware:
    """Tests for _create_tool_selector_middleware factory function."""

    @patch("src.agents.lead_agent.agent.create_chat_model")
    def test_returns_llm_tool_selector_middleware(self, mock_create_model):
        mock_create_model.return_value = _make_mock_model()
        tools = [_make_mock_tool("bash"), _make_mock_tool("read_file"), _make_mock_tool("smhi_forecast")]

        result = _create_tool_selector_middleware("nemotron-3-nano", tools)

        assert isinstance(result, LLMToolSelectorMiddleware)

    @patch("src.agents.lead_agent.agent.create_chat_model")
    def test_always_include_intersects_with_actual_tools(self, mock_create_model):
        mock_create_model.return_value = _make_mock_model()
        tools = [_make_mock_tool("bash"), _make_mock_tool("read_file"), _make_mock_tool("mcp_tool_1")]

        result = _create_tool_selector_middleware("nemotron-3-nano", tools)

        assert "bash" in result.always_include
        assert "read_file" in result.always_include
        assert "mcp_tool_1" not in result.always_include
        assert "write_file" not in result.always_include
        assert "task" not in result.always_include

    @patch("src.agents.lead_agent.agent.create_chat_model")
    def test_always_include_contains_all_present_core_tools(self, mock_create_model):
        mock_create_model.return_value = _make_mock_model()
        core_names = ["bash", "read_file", "write_file", "ls", "str_replace", "present_files", "ask_clarification", "image_search", "task", "setup_agent", "view_image", "write_todos"]
        tools = [_make_mock_tool(n) for n in core_names] + [_make_mock_tool("smhi_forecast")]

        result = _create_tool_selector_middleware("nemotron-3-nano", tools)

        for name in core_names:
            assert name in result.always_include, f"{name} should be in always_include"
        assert "smhi_forecast" not in result.always_include

    @patch("src.agents.lead_agent.agent.create_chat_model")
    def test_max_tools_is_15(self, mock_create_model):
        mock_create_model.return_value = _make_mock_model()
        tools = [_make_mock_tool("bash")]

        result = _create_tool_selector_middleware("nemotron-3-nano", tools)

        assert result.max_tools == 15

    @patch("src.agents.lead_agent.agent.create_chat_model")
    def test_uses_swedish_system_prompt(self, mock_create_model):
        mock_create_model.return_value = _make_mock_model()
        tools = [_make_mock_tool("bash")]

        result = _create_tool_selector_middleware("nemotron-3-nano", tools)

        assert result.system_prompt == _TOOL_SELECTOR_SYSTEM_PROMPT
        assert "verktygsväljare" in result.system_prompt

    @patch("src.agents.lead_agent.agent.create_chat_model")
    def test_creates_model_with_thinking_disabled(self, mock_create_model):
        mock_create_model.return_value = _make_mock_model()
        tools = [_make_mock_tool("bash")]

        _create_tool_selector_middleware("nemotron-3-nano", tools)

        mock_create_model.assert_called_once_with(name="nemotron-3-nano", thinking_enabled=False)

    @patch("src.agents.lead_agent.agent.create_chat_model")
    def test_empty_tools_list_gives_empty_always_include(self, mock_create_model):
        mock_create_model.return_value = _make_mock_model()

        result = _create_tool_selector_middleware("nemotron-3-nano", [])

        assert result.always_include == []


class TestBuildMiddlewaresIncludesToolSelector:
    """Tests that _build_middlewares includes the tool selector when tools are provided."""

    @patch("src.agents.lead_agent.agent.create_chat_model")
    @patch("src.agents.lead_agent.agent.build_lead_runtime_middlewares")
    @patch("src.agents.lead_agent.agent.get_app_config")
    @patch("src.agents.lead_agent.agent.get_summarization_config")
    def test_includes_tool_selector_when_tools_provided(self, mock_summ_config, mock_app_config, mock_build_runtime, mock_create_model):
        from src.agents.lead_agent.agent import _build_middlewares

        mock_build_runtime.return_value = []
        mock_create_model.return_value = _make_mock_model()
        mock_summ_config.return_value = SimpleNamespace(enabled=False)
        mock_app_config.return_value = SimpleNamespace(get_model_config=lambda _: None)

        config = {"configurable": {}}
        tools = [_make_mock_tool("bash"), _make_mock_tool("read_file")]

        middlewares = _build_middlewares(config, model_name="nemotron-3-nano", tools=tools)

        has_tool_selector = any(isinstance(m, LLMToolSelectorMiddleware) for m in middlewares)
        assert has_tool_selector, "LLMToolSelectorMiddleware should be in middleware chain when tools are provided"

    @patch("src.agents.lead_agent.agent.create_chat_model")
    @patch("src.agents.lead_agent.agent.build_lead_runtime_middlewares")
    @patch("src.agents.lead_agent.agent.get_app_config")
    @patch("src.agents.lead_agent.agent.get_summarization_config")
    def test_no_tool_selector_when_tools_is_none(self, mock_summ_config, mock_app_config, mock_build_runtime, mock_create_model):
        from src.agents.lead_agent.agent import _build_middlewares

        mock_build_runtime.return_value = []
        mock_create_model.return_value = _make_mock_model()
        mock_summ_config.return_value = SimpleNamespace(enabled=False)
        mock_app_config.return_value = SimpleNamespace(get_model_config=lambda _: None)

        config = {"configurable": {}}

        middlewares = _build_middlewares(config, model_name="nemotron-3-nano", tools=None)

        has_tool_selector = any(isinstance(m, LLMToolSelectorMiddleware) for m in middlewares)
        assert not has_tool_selector, "LLMToolSelectorMiddleware should NOT be in middleware chain when tools is None"
