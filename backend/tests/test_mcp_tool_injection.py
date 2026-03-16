"""Tests for McpToolInjectionMiddleware and related skill/cache changes."""

import sys
from dataclasses import dataclass, field
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# --- Stub heavy dependencies before importing our modules ---
for mod_name in (
    "langchain_mcp_adapters",
    "langchain_mcp_adapters.client",
    "src.subagents.executor",
):
    if mod_name not in sys.modules:
        sys.modules[mod_name] = MagicMock()


from src.agents.middlewares.mcp_tool_injection_middleware import (
    _extract_activated_skills,
    _get_mcp_servers_for_skills,
)
from src.skills.parser import parse_skill_file
from src.skills.types import Skill


# ---------------------------------------------------------------------------
# Test: _extract_activated_skills
# ---------------------------------------------------------------------------

class TestExtractActivatedSkills:
    @staticmethod
    def _make_ai_msg(tool_calls):
        msg = MagicMock()
        msg.type = "ai"
        msg.tool_calls = tool_calls
        return msg

    @staticmethod
    def _make_human_msg(content="hello"):
        msg = MagicMock()
        msg.type = "human"
        msg.tool_calls = None
        return msg

    def test_extracts_skill_from_container_path(self):
        ai = self._make_ai_msg([
            {"name": "read_file", "args": {"path": "/mnt/skills/public/swedish-statistics/SKILL.md"}, "id": "1"}
        ])
        result = _extract_activated_skills([ai])
        assert result == {"swedish-statistics"}

    def test_extracts_skill_from_local_path(self):
        ai = self._make_ai_msg([
            {"name": "read_file", "args": {"path": "/home/user/Berit/skills/public/web-browsing/SKILL.md"}, "id": "1"}
        ])
        result = _extract_activated_skills([ai])
        assert result == {"web-browsing"}

    def test_extracts_custom_skill(self):
        ai = self._make_ai_msg([
            {"name": "read_file", "args": {"path": "/mnt/skills/custom/my-skill/SKILL.md"}, "id": "1"}
        ])
        result = _extract_activated_skills([ai])
        assert result == {"my-skill"}

    def test_ignores_non_skill_reads(self):
        ai = self._make_ai_msg([
            {"name": "read_file", "args": {"path": "/mnt/user-data/uploads/report.pdf"}, "id": "1"}
        ])
        result = _extract_activated_skills([ai])
        assert result == set()

    def test_ignores_non_read_file_tools(self):
        ai = self._make_ai_msg([
            {"name": "bash", "args": {"command": "ls"}, "id": "1"}
        ])
        result = _extract_activated_skills([ai])
        assert result == set()

    def test_multiple_skills_in_conversation(self):
        ai1 = self._make_ai_msg([
            {"name": "read_file", "args": {"path": "/mnt/skills/public/swedish-statistics/SKILL.md"}, "id": "1"}
        ])
        ai2 = self._make_ai_msg([
            {"name": "read_file", "args": {"path": "/mnt/skills/public/web-browsing/SKILL.md"}, "id": "2"}
        ])
        human = self._make_human_msg()
        result = _extract_activated_skills([ai1, human, ai2])
        assert result == {"swedish-statistics", "web-browsing"}

    def test_empty_messages(self):
        assert _extract_activated_skills([]) == set()

    def test_no_args_in_tool_call(self):
        ai = self._make_ai_msg([{"name": "read_file", "id": "1"}])
        result = _extract_activated_skills([ai])
        assert result == set()


# ---------------------------------------------------------------------------
# Test: _get_mcp_servers_for_skills
# ---------------------------------------------------------------------------

class TestGetMcpServersForSkills:
    def test_returns_servers_for_matching_skill(self):
        mock_skills = [
            Skill(
                name="swedish-statistics",
                description="SCB data",
                license=None,
                skill_dir=Path("/skills/public/swedish-statistics"),
                skill_file=Path("/skills/public/swedish-statistics/SKILL.md"),
                relative_path=Path("swedish-statistics"),
                category="public",
                enabled=True,
                mcp_servers=["scb"],
            )
        ]
        with patch("src.skills.load_skills", return_value=mock_skills):
            result = _get_mcp_servers_for_skills({"swedish-statistics"})
        assert result == ["scb"]

    def test_returns_empty_for_skill_without_mcp(self):
        mock_skills = [
            Skill(
                name="data-analysis",
                description="Analyze data",
                license=None,
                skill_dir=Path("/skills/public/data-analysis"),
                skill_file=Path("/skills/public/data-analysis/SKILL.md"),
                relative_path=Path("data-analysis"),
                category="public",
                enabled=True,
                mcp_servers=None,
            )
        ]
        with patch("src.skills.load_skills", return_value=mock_skills):
            result = _get_mcp_servers_for_skills({"data-analysis"})
        assert result == []

    def test_deduplicates_servers(self):
        mock_skills = [
            Skill(name="skill-a", description="a", license=None, skill_dir=Path("."), skill_file=Path("SKILL.md"), relative_path=Path("skill-a"), category="public", enabled=True, mcp_servers=["scb"]),
            Skill(name="skill-b", description="b", license=None, skill_dir=Path("."), skill_file=Path("SKILL.md"), relative_path=Path("skill-b"), category="public", enabled=True, mcp_servers=["scb", "smhi"]),
        ]
        with patch("src.skills.load_skills", return_value=mock_skills):
            result = _get_mcp_servers_for_skills({"skill-a", "skill-b"})
        assert set(result) == {"scb", "smhi"}

    def test_ignores_unknown_skills(self):
        with patch("src.skills.load_skills", return_value=[]):
            result = _get_mcp_servers_for_skills({"nonexistent"})
        assert result == []


# ---------------------------------------------------------------------------
# Test: Skill parser mcp-servers field
# ---------------------------------------------------------------------------

class TestSkillParserMcpServers:
    def test_parses_single_server(self, tmp_path):
        skill_file = tmp_path / "SKILL.md"
        skill_file.write_text("---\nname: test-skill\ndescription: A test\nmcp-servers: [scb]\n---\n\n# Test")
        skill = parse_skill_file(skill_file, "public", Path("test-skill"))
        assert skill is not None
        assert skill.mcp_servers == ["scb"]

    def test_parses_multiple_servers(self, tmp_path):
        skill_file = tmp_path / "SKILL.md"
        skill_file.write_text("---\nname: test-skill\ndescription: A test\nmcp-servers: [scb, smhi]\n---\n\n# Test")
        skill = parse_skill_file(skill_file, "public", Path("test-skill"))
        assert skill is not None
        assert skill.mcp_servers == ["scb", "smhi"]

    def test_no_mcp_servers_field(self, tmp_path):
        skill_file = tmp_path / "SKILL.md"
        skill_file.write_text("---\nname: test-skill\ndescription: A test\n---\n\n# Test")
        skill = parse_skill_file(skill_file, "public", Path("test-skill"))
        assert skill is not None
        assert skill.mcp_servers is None

    def test_empty_mcp_servers(self, tmp_path):
        skill_file = tmp_path / "SKILL.md"
        skill_file.write_text("---\nname: test-skill\ndescription: A test\nmcp-servers: []\n---\n\n# Test")
        skill = parse_skill_file(skill_file, "public", Path("test-skill"))
        assert skill is not None
        assert skill.mcp_servers is None  # empty list becomes None


# ---------------------------------------------------------------------------
# Test: MCP cache per-server retrieval
# ---------------------------------------------------------------------------

class TestMcpCachePerServer:
    def test_get_tools_for_specific_servers(self):
        from src.mcp import cache

        # Manually set cache state
        mock_tool_a = MagicMock(spec=["name"])
        mock_tool_a.name = "scb_browse"
        mock_tool_b = MagicMock(spec=["name"])
        mock_tool_b.name = "smhi_weather"

        old_cache = cache._mcp_tools_cache
        old_init = cache._cache_initialized
        try:
            cache._mcp_tools_cache = {"scb": [mock_tool_a], "smhi": [mock_tool_b]}
            cache._cache_initialized = True

            result = cache.get_cached_mcp_tools_for_servers(["scb"])
            assert len(result) == 1
            assert result[0].name == "scb_browse"

            result_both = cache.get_cached_mcp_tools_for_servers(["scb", "smhi"])
            assert len(result_both) == 2

            result_none = cache.get_cached_mcp_tools_for_servers(["nonexistent"])
            assert result_none == []
        finally:
            cache._mcp_tools_cache = old_cache
            cache._cache_initialized = old_init

    def test_get_all_tools_flat(self):
        from src.mcp import cache

        mock_tool_a = MagicMock(spec=["name"])
        mock_tool_a.name = "scb_browse"
        mock_tool_b = MagicMock(spec=["name"])
        mock_tool_b.name = "smhi_weather"

        old_cache = cache._mcp_tools_cache
        old_init = cache._cache_initialized
        try:
            cache._mcp_tools_cache = {"scb": [mock_tool_a], "smhi": [mock_tool_b]}
            cache._cache_initialized = True

            result = cache.get_cached_mcp_tools()
            assert len(result) == 2
            names = {t.name for t in result}
            assert names == {"scb_browse", "smhi_weather"}
        finally:
            cache._mcp_tools_cache = old_cache
            cache._cache_initialized = old_init
