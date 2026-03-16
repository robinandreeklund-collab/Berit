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


class McpToolInjectionMiddleware(AgentMiddleware[AgentState]):
    """Injects MCP tools on-demand based on which skills the model has activated.

    Scans conversation history for read_file calls on SKILL.md files,
    resolves which MCP servers those skills require, and adds those
    servers' tools to the model request.
    """

    def _inject_tools(self, request: ModelRequest) -> ModelRequest:
        """Conditionally add MCP tools to the request based on activated skills."""
        activated = _extract_activated_skills(request.messages)
        if not activated:
            return request

        server_names = _get_mcp_servers_for_skills(activated)
        if not server_names:
            return request

        mcp_tools = _get_tools_for_servers(server_names)
        if not mcp_tools:
            return request

        # Merge: keep existing tools + add MCP tools (avoid duplicates by name)
        existing_names: set[str] = set()
        for t in request.tools:
            if isinstance(t, dict):
                func = t.get("function", t)
                existing_names.add(func.get("name", ""))
            elif hasattr(t, "name"):
                existing_names.add(t.name)

        new_tools = [t for t in mcp_tools if t.name not in existing_names]
        if not new_tools:
            return request

        logger.info(f"Injecting {len(new_tools)} MCP tool(s) for skills {activated} (servers: {server_names})")
        return request.override(tools=list(request.tools) + new_tools)

    @override
    def wrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelCallResult:
        request = self._inject_tools(request)
        return handler(request)

    @override
    async def awrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], Awaitable[ModelResponse]],
    ) -> ModelCallResult:
        request = self._inject_tools(request)
        return await handler(request)
