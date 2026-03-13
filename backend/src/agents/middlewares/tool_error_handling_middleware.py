"""Tool error handling middleware and shared runtime middleware builders."""

import logging
from collections.abc import Awaitable, Callable
from typing import override

from langchain.agents import AgentState
from langchain.agents.middleware import AgentMiddleware
from langchain_core.messages import ToolMessage
from langgraph.errors import GraphBubbleUp
from langgraph.prebuilt.tool_node import ToolCallRequest
from langgraph.types import Command

logger = logging.getLogger(__name__)

_MISSING_TOOL_CALL_ID = "missing_tool_call_id"

# Known MCP stdio teardown errors that mask the real tool error
_TEARDOWN_ERROR_TYPES = ("BrokenResourceError", "ClosedResourceError")


def _is_mcp_teardown_error(exc: Exception) -> bool:
    """Return True if the exception is purely MCP stdio session teardown noise."""
    if not isinstance(exc, BaseExceptionGroup):
        return False
    return all(type(e).__name__ in _TEARDOWN_ERROR_TYPES for e in exc.exceptions)


def _extract_useful_error(exc: Exception) -> str:
    """Extract a useful error message, filtering out MCP stdio teardown noise.

    When an MCP stdio tool returns an error, the session teardown can race and
    raise a BrokenResourceError ExceptionGroup that masks the original message.
    This function filters those out and returns the most useful detail.
    """
    if isinstance(exc, BaseExceptionGroup):
        # Filter out known teardown errors to find the real cause
        useful = [e for e in exc.exceptions if type(e).__name__ not in _TEARDOWN_ERROR_TYPES]
        teardown_only = len(useful) == 0
        if teardown_only:
            # All sub-exceptions are teardown artifacts — return a clear message
            return "MCP tool session closed unexpectedly (possible tool error — check the tool's logs)"
        # Return the first non-teardown error
        return str(useful[0]).strip() or type(useful[0]).__name__
    detail = str(exc).strip()
    return detail or exc.__class__.__name__


def _log_tool_error(exc: Exception, request: ToolCallRequest, mode: str) -> None:
    """Log tool errors — warning-level for MCP teardown noise, exception-level otherwise."""
    name = request.tool_call.get("name")
    call_id = request.tool_call.get("id")
    if _is_mcp_teardown_error(exc):
        logger.warning("MCP tool session teardown error (%s): name=%s id=%s — %s", mode, name, call_id, _extract_useful_error(exc))
    else:
        logger.exception("Tool execution failed (%s): name=%s id=%s", mode, name, call_id)


class ToolErrorHandlingMiddleware(AgentMiddleware[AgentState]):
    """Convert tool exceptions into error ToolMessages so the run can continue."""

    def _build_error_message(self, request: ToolCallRequest, exc: Exception) -> ToolMessage:
        tool_name = str(request.tool_call.get("name") or "unknown_tool")
        tool_call_id = str(request.tool_call.get("id") or _MISSING_TOOL_CALL_ID)
        detail = _extract_useful_error(exc)
        if len(detail) > 500:
            detail = detail[:497] + "..."

        content = (
            f"Error: Tool '{tool_name}' failed with {exc.__class__.__name__}: {detail}. "
            "Continue with available context, or choose an alternative tool."
        )
        return ToolMessage(
            content=content,
            tool_call_id=tool_call_id,
            name=tool_name,
            status="error",
        )

    @override
    def wrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], ToolMessage | Command],
    ) -> ToolMessage | Command:
        try:
            return handler(request)
        except GraphBubbleUp:
            # Preserve LangGraph control-flow signals (interrupt/pause/resume).
            raise
        except Exception as exc:
            _log_tool_error(exc, request, "sync")
            return self._build_error_message(request, exc)

    @override
    async def awrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], Awaitable[ToolMessage | Command]],
    ) -> ToolMessage | Command:
        try:
            return await handler(request)
        except GraphBubbleUp:
            # Preserve LangGraph control-flow signals (interrupt/pause/resume).
            raise
        except Exception as exc:
            _log_tool_error(exc, request, "async")
            return self._build_error_message(request, exc)


def _build_runtime_middlewares(
    *,
    include_uploads: bool,
    include_dangling_tool_call_patch: bool,
    lazy_init: bool = True,
) -> list[AgentMiddleware]:
    """Build shared base middlewares for agent execution."""
    from src.agents.middlewares.thread_data_middleware import ThreadDataMiddleware
    from src.sandbox.middleware import SandboxMiddleware

    middlewares: list[AgentMiddleware] = [
        ThreadDataMiddleware(lazy_init=lazy_init),
        SandboxMiddleware(lazy_init=lazy_init),
    ]

    if include_uploads:
        from src.agents.middlewares.uploads_middleware import UploadsMiddleware

        middlewares.insert(1, UploadsMiddleware())

    if include_dangling_tool_call_patch:
        from src.agents.middlewares.dangling_tool_call_middleware import DanglingToolCallMiddleware

        middlewares.append(DanglingToolCallMiddleware())

    middlewares.append(ToolErrorHandlingMiddleware())
    return middlewares


def build_lead_runtime_middlewares(*, lazy_init: bool = True) -> list[AgentMiddleware]:
    """Middlewares shared by lead agent runtime before lead-only middlewares."""
    return _build_runtime_middlewares(
        include_uploads=True,
        include_dangling_tool_call_patch=True,
        lazy_init=lazy_init,
    )


def build_subagent_runtime_middlewares(*, lazy_init: bool = True) -> list[AgentMiddleware]:
    """Middlewares shared by subagent runtime before subagent-only middlewares."""
    return _build_runtime_middlewares(
        include_uploads=False,
        include_dangling_tool_call_patch=False,
        lazy_init=lazy_init,
    )
