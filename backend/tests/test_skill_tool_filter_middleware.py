"""Tests for SkillToolFilterMiddleware and retrieve_skill_tools integration."""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from src.agents.middlewares.skill_tool_filter_middleware import SkillToolFilterMiddleware


def _make_mock_tool(name: str) -> MagicMock:
    tool = MagicMock()
    tool.name = name
    return tool


def _make_request(tools: list, messages: list | None = None) -> SimpleNamespace:
    """Create a mock ModelRequest."""
    req = SimpleNamespace(
        tools=tools,
        messages=messages or [],
        model=MagicMock(),
    )
    req.override = lambda **kwargs: SimpleNamespace(**{**vars(req), **kwargs})
    return req


class TestSkillToolFilterMiddleware:
    """Tests for SkillToolFilterMiddleware."""

    def test_filters_out_all_mcp_tools_when_no_servers_active(self):
        mcp_names = {"smhi_forecast", "smhi_analysis", "riksbank_rates"}
        middleware = SkillToolFilterMiddleware(mcp_tool_names=mcp_names)

        tools = [
            _make_mock_tool("bash"),
            _make_mock_tool("read_file"),
            _make_mock_tool("smhi_forecast"),
            _make_mock_tool("smhi_analysis"),
            _make_mock_tool("riksbank_rates"),
            _make_mock_tool("retrieve_skill_tools"),
        ]
        request = _make_request(tools=tools, messages=[])

        result = middleware._filter_tools(request)

        result_names = {t.name for t in result.tools}
        assert "bash" in result_names
        assert "read_file" in result_names
        assert "retrieve_skill_tools" in result_names
        assert "smhi_forecast" not in result_names
        assert "riksbank_rates" not in result_names

    @patch("src.mcp.cache.get_tools_for_servers")
    def test_includes_activated_server_tools(self, mock_get_tools):
        mock_get_tools.return_value = [_make_mock_tool("smhi_forecast"), _make_mock_tool("smhi_analysis")]

        mcp_names = {"smhi_forecast", "smhi_analysis", "riksbank_rates"}
        middleware = SkillToolFilterMiddleware(mcp_tool_names=mcp_names)

        # Simulate a message from retrieve_skill_tools activating smhi
        tool_msg = MagicMock()
        tool_msg.name = "retrieve_skill_tools"
        tool_msg.content = "Aktiverade 2 verktyg från smhi: smhi_forecast, smhi_analysis. Du kan nu använda dessa verktyg."

        tools = [
            _make_mock_tool("bash"),
            _make_mock_tool("smhi_forecast"),
            _make_mock_tool("smhi_analysis"),
            _make_mock_tool("riksbank_rates"),
        ]
        request = _make_request(tools=tools, messages=[tool_msg])

        result = middleware._filter_tools(request)

        result_names = {t.name for t in result.tools}
        assert "bash" in result_names
        assert "smhi_forecast" in result_names
        assert "smhi_analysis" in result_names
        assert "riksbank_rates" not in result_names  # Not activated
        mock_get_tools.assert_called_once_with(["smhi"])

    def test_no_tools_returns_request_unchanged(self):
        middleware = SkillToolFilterMiddleware(mcp_tool_names=set())
        request = _make_request(tools=[], messages=[])

        result = middleware._filter_tools(request)

        assert result.tools == []

    def test_non_mcp_tools_always_pass_through(self):
        mcp_names = {"smhi_forecast"}
        middleware = SkillToolFilterMiddleware(mcp_tool_names=mcp_names)

        tools = [_make_mock_tool("bash"), _make_mock_tool("read_file"), _make_mock_tool("write_file")]
        request = _make_request(tools=tools, messages=[])

        result = middleware._filter_tools(request)

        result_names = {t.name for t in result.tools}
        assert result_names == {"bash", "read_file", "write_file"}

    def test_preserves_dict_tools(self):
        """Provider-specific tool dicts should always pass through."""
        mcp_names = {"smhi_forecast"}
        middleware = SkillToolFilterMiddleware(mcp_tool_names=mcp_names)

        tools = [{"type": "function", "function": {"name": "test"}}, _make_mock_tool("smhi_forecast")]
        request = _make_request(tools=tools, messages=[])

        result = middleware._filter_tools(request)

        assert any(isinstance(t, dict) for t in result.tools)

    def test_wrap_model_call_filters_and_delegates(self):
        mcp_names = {"smhi_forecast"}
        middleware = SkillToolFilterMiddleware(mcp_tool_names=mcp_names)

        tools = [_make_mock_tool("bash"), _make_mock_tool("smhi_forecast")]
        request = _make_request(tools=tools, messages=[])

        handler_called_with = []

        def handler(req):
            handler_called_with.append(req)
            return "result"

        result = middleware.wrap_model_call(request, handler)

        assert result == "result"
        assert len(handler_called_with) == 1
        filtered_names = {t.name for t in handler_called_with[0].tools}
        assert "bash" in filtered_names
        assert "smhi_forecast" not in filtered_names


class TestGetActiveServers:
    """Tests for _get_active_servers extraction from messages."""

    def test_extracts_server_from_activation_message(self):
        middleware = SkillToolFilterMiddleware(mcp_tool_names=set())

        tool_msg = MagicMock()
        tool_msg.name = "retrieve_skill_tools"
        tool_msg.content = "Aktiverade 10 verktyg från smhi: smhi_forecast, smhi_analysis. Du kan nu använda dessa verktyg."

        request = _make_request(tools=[], messages=[tool_msg])
        servers = middleware._get_active_servers(request)

        assert servers == ["smhi"]

    def test_extracts_multiple_servers(self):
        middleware = SkillToolFilterMiddleware(mcp_tool_names=set())

        msg1 = MagicMock()
        msg1.name = "retrieve_skill_tools"
        msg1.content = "Aktiverade 10 verktyg från smhi: ..."

        msg2 = MagicMock()
        msg2.name = "retrieve_skill_tools"
        msg2.content = "Aktiverade 8 verktyg från riksbank: ..."

        request = _make_request(tools=[], messages=[msg1, msg2])
        servers = middleware._get_active_servers(request)

        assert "smhi" in servers
        assert "riksbank" in servers

    def test_no_activation_messages_returns_empty(self):
        middleware = SkillToolFilterMiddleware(mcp_tool_names=set())

        user_msg = MagicMock()
        user_msg.name = None
        user_msg.content = "Hur blir vädret?"

        request = _make_request(tools=[], messages=[user_msg])
        servers = middleware._get_active_servers(request)

        assert servers == []

    def test_deduplicates_servers(self):
        middleware = SkillToolFilterMiddleware(mcp_tool_names=set())

        msg1 = MagicMock()
        msg1.name = "retrieve_skill_tools"
        msg1.content = "Aktiverade 10 verktyg från smhi: ..."

        msg2 = MagicMock()
        msg2.name = "retrieve_skill_tools"
        msg2.content = "Aktiverade 10 verktyg från smhi: ..."

        request = _make_request(tools=[], messages=[msg1, msg2])
        servers = middleware._get_active_servers(request)

        assert servers == ["smhi"]


class TestMcpCachePerServer:
    """Tests for per-server MCP tool caching."""

    @patch("src.mcp.cache._mcp_tools_cache", {"smhi": [MagicMock(name="smhi_forecast")], "riksbank": [MagicMock(name="riksbank_rates")]})
    @patch("src.mcp.cache._cache_initialized", True)
    def test_get_cached_mcp_tools_returns_flat_list(self):
        from src.mcp.cache import get_cached_mcp_tools
        tools = get_cached_mcp_tools()
        assert isinstance(tools, list)
        assert len(tools) == 2

    @patch("src.mcp.cache._mcp_tools_cache", {"smhi": [MagicMock(name="smhi_forecast")], "riksbank": [MagicMock(name="riksbank_rates")]})
    @patch("src.mcp.cache._cache_initialized", True)
    def test_get_cached_mcp_tools_by_server_returns_dict(self):
        from src.mcp.cache import get_cached_mcp_tools_by_server
        tools = get_cached_mcp_tools_by_server()
        assert isinstance(tools, dict)
        assert "smhi" in tools
        assert "riksbank" in tools

    @patch("src.mcp.cache._mcp_tools_cache", {"smhi": [MagicMock(name="smhi_forecast"), MagicMock(name="smhi_analysis")], "riksbank": [MagicMock(name="riksbank_rates")]})
    @patch("src.mcp.cache._cache_initialized", True)
    def test_get_tools_for_servers_filters_correctly(self):
        from src.mcp.cache import get_tools_for_servers
        tools = get_tools_for_servers(["smhi"])
        assert len(tools) == 2

    @patch("src.mcp.cache._mcp_tools_cache", {"smhi": [MagicMock(name="smhi_forecast")]})
    @patch("src.mcp.cache._cache_initialized", True)
    def test_get_tools_for_unknown_server_returns_empty(self):
        from src.mcp.cache import get_tools_for_servers
        tools = get_tools_for_servers(["nonexistent"])
        assert tools == []


class TestSkillMcpServerField:
    """Tests for mcp_server field in Skill dataclass and parser."""

    def test_skill_dataclass_has_mcp_server_field(self):
        from src.skills.types import Skill
        from pathlib import Path
        skill = Skill(
            name="test",
            description="test",
            license=None,
            skill_dir=Path("."),
            skill_file=Path("SKILL.md"),
            relative_path=Path("test"),
            category="public",
            mcp_server="smhi",
        )
        assert skill.mcp_server == "smhi"

    def test_skill_mcp_server_defaults_to_none(self):
        from src.skills.types import Skill
        from pathlib import Path
        skill = Skill(
            name="test",
            description="test",
            license=None,
            skill_dir=Path("."),
            skill_file=Path("SKILL.md"),
            relative_path=Path("test"),
            category="public",
        )
        assert skill.mcp_server is None

    def test_parser_extracts_mcp_server(self, tmp_path):
        from src.skills.parser import parse_skill_file

        skill_file = tmp_path / "SKILL.md"
        skill_file.write_text("---\nname: test-skill\ndescription: A test skill\nmcp-server: smhi\n---\nBody content\n")

        skill = parse_skill_file(skill_file, "public")
        assert skill is not None
        assert skill.mcp_server == "smhi"

    def test_parser_handles_missing_mcp_server(self, tmp_path):
        from src.skills.parser import parse_skill_file

        skill_file = tmp_path / "SKILL.md"
        skill_file.write_text("---\nname: test-skill\ndescription: A test skill\n---\nBody content\n")

        skill = parse_skill_file(skill_file, "public")
        assert skill is not None
        assert skill.mcp_server is None


class TestThreadStateActiveMcpServers:
    """Tests for active_mcp_servers in ThreadState."""

    def test_merge_mcp_servers_deduplicates(self):
        from src.agents.thread_state import merge_mcp_servers
        result = merge_mcp_servers(["smhi"], ["smhi", "riksbank"])
        assert result == ["smhi", "riksbank"]

    def test_merge_mcp_servers_handles_none(self):
        from src.agents.thread_state import merge_mcp_servers
        assert merge_mcp_servers(None, ["smhi"]) == ["smhi"]
        assert merge_mcp_servers(["smhi"], None) == ["smhi"]
        assert merge_mcp_servers(None, None) == []
