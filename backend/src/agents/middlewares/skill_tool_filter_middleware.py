"""Middleware that filters MCP tools based on active_mcp_servers state.

Two-step flow:
  Step 1: No MCP tools → agent sees skill descriptions, calls retrieve_skill_tools
  Step 2: Agent has only the activated MCP server's tools + core tools
"""

import logging
from collections.abc import Awaitable, Callable
from typing import override

from langchain.agents import AgentState
from langchain.agents.middleware import AgentMiddleware
from langchain.agents.middleware.types import ModelCallResult, ModelRequest, ModelResponse

logger = logging.getLogger(__name__)


class SkillToolFilterMiddleware(AgentMiddleware[AgentState]):
    """Filter MCP tools based on which skills have been activated via retrieve_skill_tools.

    Before any skill is activated: agent sees only core tools (no MCP tools).
    After retrieve_skill_tools is called: agent sees core tools + activated MCP server tools.

    This replaces LLMToolSelectorMiddleware — instead of a secondary LLM call to pick
    from 258 tools, the lead agent reads skill descriptions and explicitly activates
    the relevant MCP server. Much faster, deterministic, and cheaper.
    """

    def __init__(self, mcp_tool_names: set[str]) -> None:
        """Initialize with the set of all MCP tool names.

        Args:
            mcp_tool_names: Names of all MCP tools (used to identify which tools to filter).
        """
        super().__init__()
        self.mcp_tool_names = mcp_tool_names

    def _get_active_servers(self, request: ModelRequest) -> list[str]:
        """Extract active MCP servers from message history.

        Looks for tool messages containing the activation pattern from retrieve_skill_tools.
        We match on content pattern rather than message name, because LangGraph's Command
        may not preserve the tool name on the resulting ToolMessage.
        """
        active_servers = []
        for msg in request.messages:
            content = getattr(msg, "content", "")
            if not isinstance(content, str):
                continue
            # Match activation pattern: "Aktiverade N verktyg från SERVER_NAME:"
            if "Aktiverade" in content and "verktyg från " in content:
                try:
                    server_part = content.split("verktyg från ")[1].split(":")[0]
                    if server_part not in active_servers:
                        active_servers.append(server_part)
                except (IndexError, ValueError):
                    pass
        return active_servers

    def _filter_tools(self, request: ModelRequest) -> ModelRequest:
        """Filter MCP tools based on active servers."""
        if not request.tools:
            return request

        active_servers = self._get_active_servers(request)

        if active_servers:
            # Get tools for active servers
            from src.mcp.cache import get_tools_for_servers
            active_tool_names = {t.name for t in get_tools_for_servers(active_servers)}

            # Keep: non-MCP tools (always) + activated MCP tools
            filtered = [
                t for t in request.tools
                if isinstance(t, dict) or (  # Keep provider-specific tool dicts
                    hasattr(t, "name") and (
                        t.name not in self.mcp_tool_names or  # Not an MCP tool → keep
                        t.name in active_tool_names  # Activated MCP tool → keep
                    )
                )
            ]
            logger.info(f"SkillToolFilter: {len(active_servers)} server(s) active, showing {len(filtered)}/{len(request.tools)} tools")
        else:
            # No servers activated yet → filter out ALL MCP tools
            filtered = [
                t for t in request.tools
                if isinstance(t, dict) or (
                    hasattr(t, "name") and t.name not in self.mcp_tool_names
                )
            ]
            logger.info(f"SkillToolFilter: no servers active, showing {len(filtered)}/{len(request.tools)} tools (core only)")

        return request.override(tools=filtered)

    @override
    def wrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelCallResult:
        return handler(self._filter_tools(request))

    @override
    async def awrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], Awaitable[ModelResponse]],
    ) -> ModelCallResult:
        return await handler(self._filter_tools(request))
