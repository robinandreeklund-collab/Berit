"""Middleware for on-demand MCP tool injection based on activated skills.

Instead of binding all ~287 MCP tools to every API call, this middleware
detects when the model has read a SKILL.md file (via the read_file tool)
and dynamically injects only the MCP tools declared by that skill.

This reduces the per-request token overhead from ~12 000 tokens to a few
hundred, dramatically improving inference speed with local models.

Flow:
1. Agent starts with only base tools (bash, read_file, present_files, etc.)
2. Model reads a SKILL.md → ToolMessage appears in conversation history
3. This middleware detects the skill path, looks up its mcp_servers field,
   and injects those servers' tools into the next model call via
   request.override(tools=...).
"""

import logging
import re
from collections.abc import Awaitable, Callable
from typing import override

from langchain.agents import AgentState
from langchain.agents.middleware import AgentMiddleware
from langchain.agents.middleware.types import ModelCallResult, ModelRequest, ModelResponse
from langchain_core.messages import ToolMessage
from langchain_core.tools import BaseTool

logger = logging.getLogger(__name__)

# Pattern to match skill paths in read_file tool calls.
# Matches both container paths (/mnt/skills/public/swedish-statistics/SKILL.md)
# and local paths (.../skills/public/swedish-statistics/SKILL.md).
_SKILL_PATH_PATTERN = re.compile(r"skills/(?:public|custom)/([^/]+)/SKILL\.md")


def _extract_activated_skills(messages: list) -> set[str]:
    """Scan conversation history for skill activations via read_file calls.

    When the model calls read_file on a SKILL.md path, the tool_call args
    contain the path. We extract the skill directory name from these paths.

    Returns:
        Set of activated skill directory names (e.g. {"swedish-statistics", "web-browsing"}).
    """
    activated: set[str] = set()
    for msg in messages:
        # Check AIMessage tool_calls for read_file calls targeting SKILL.md
        if getattr(msg, "type", None) == "ai":
            for tc in getattr(msg, "tool_calls", None) or []:
                if tc.get("name") == "read_file":
                    args = tc.get("args", {})
                    path = args.get("path", "")
                    match = _SKILL_PATH_PATTERN.search(path)
                    if match:
                        activated.add(match.group(1))
    return activated


def _get_mcp_servers_for_skills(skill_names: set[str]) -> list[str]:
    """Look up which MCP servers are needed for the given skill names.

    Args:
        skill_names: Set of skill directory names.

    Returns:
        Deduplicated list of MCP server names.
    """
    from src.skills import load_skills

    skills = load_skills(enabled_only=True)
    servers: set[str] = set()
    for skill in skills:
        # Match by skill name or by directory name
        skill_dir = skill.relative_path.name if skill.relative_path else ""
        if skill.name in skill_names or skill_dir in skill_names:
            if skill.mcp_servers:
                servers.update(skill.mcp_servers)
    return list(servers)


def _get_tools_for_servers(server_names: list[str]) -> list[BaseTool]:
    """Retrieve cached MCP tools for the given server names."""
    if not server_names:
        return []
    from src.mcp.cache import get_cached_mcp_tools_for_servers
    from src.tools.tools import _sanitize_tool_schemas

    tools = get_cached_mcp_tools_for_servers(server_names)
    if tools:
        tools = _sanitize_tool_schemas(tools)
    return tools


def _get_all_mcp_tools() -> list[BaseTool]:
    """Return all cached MCP tools (sanitized) for ToolNode registration.

    Called once at middleware init to populate ``self.tools`` so that
    LangGraph's ``create_agent`` knows about every MCP tool that might
    be injected later.  Blocks (up to 120 s) for background MCP
    initialization to finish so that all tools are available.
    """
    from src.mcp.cache import wait_for_mcp_tools
    from src.tools.tools import _sanitize_tool_schemas

    tools = wait_for_mcp_tools(timeout=120.0)
    if tools:
        tools = _sanitize_tool_schemas(tools)
    return tools


class McpToolInjectionMiddleware(AgentMiddleware[AgentState]):
    """Injects MCP tools on-demand based on which skills the model has activated.

    Scans conversation history for read_file calls on SKILL.md files,
    resolves which MCP servers those skills require, and adds those
    servers' tools to the model request.

    All cached MCP tools are registered via ``self.tools`` so that
    ``create_agent()`` includes them in its ``ToolNode`` (required for
    tool execution).  However, the middleware **strips** all MCP tools
    from ``request.tools`` by default and only re-adds the subset
    matching activated skills.  This keeps the LLM prompt small while
    still allowing execution of any MCP tool once its skill is loaded.
    """

    def __init__(self) -> None:
        super().__init__()
        # Register ALL cached MCP tools so ToolNode knows about them.
        self.tools: list[BaseTool] = _get_all_mcp_tools()
        # Keep a set of MCP tool names for fast filtering.
        self._mcp_tool_names: set[str] = {t.name for t in self.tools}
        logger.info(f"Registered {len(self.tools)} MCP tool(s) in ToolNode ({len(self._mcp_tool_names)} unique names)")

    def _filter_and_inject_tools(self, request: ModelRequest) -> ModelRequest:
        """Strip MCP tools from request, then re-add only those for activated skills."""
        # Step 1: Remove all MCP tools from request.tools (they were added
        # by default because they're in ToolNode).  This keeps the LLM
        # prompt small — only base tools are sent unless a skill is active.
        if self._mcp_tool_names:
            base_tools = [
                t for t in request.tools
                if isinstance(t, dict) or (hasattr(t, "name") and t.name not in self._mcp_tool_names)
            ]
        else:
            base_tools = list(request.tools)

        # Step 2: Check which skills have been activated in this conversation.
        activated = _extract_activated_skills(request.messages)
        if not activated:
            if len(base_tools) != len(request.tools):
                return request.override(tools=base_tools)
            return request

        # Step 3: Look up which MCP servers those skills need and get their tools.
        server_names = _get_mcp_servers_for_skills(activated)
        if not server_names:
            if len(base_tools) != len(request.tools):
                return request.override(tools=base_tools)
            return request

        mcp_tools = _get_tools_for_servers(server_names)
        if not mcp_tools:
            if len(base_tools) != len(request.tools):
                return request.override(tools=base_tools)
            return request

        # Step 4: Merge base tools + skill-specific MCP tools (avoid duplicates).
        existing_names: set[str] = set()
        for t in base_tools:
            if isinstance(t, dict):
                func = t.get("function", t)
                existing_names.add(func.get("name", ""))
            elif hasattr(t, "name"):
                existing_names.add(t.name)

        new_tools = [t for t in mcp_tools if t.name not in existing_names]

        logger.info(f"Injecting {len(new_tools)} MCP tool(s) for skills {activated} (servers: {server_names})")
        return request.override(tools=base_tools + new_tools)

    @override
    def wrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelCallResult:
        request = self._filter_and_inject_tools(request)
        return handler(request)

    @override
    async def awrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], Awaitable[ModelResponse]],
    ) -> ModelCallResult:
        request = self._filter_and_inject_tools(request)
        return await handler(request)
