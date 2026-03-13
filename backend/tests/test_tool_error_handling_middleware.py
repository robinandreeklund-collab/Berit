from types import SimpleNamespace

import pytest
from anyio import BrokenResourceError, ClosedResourceError
from langchain_core.messages import ToolMessage
from langgraph.errors import GraphInterrupt

from src.agents.middlewares.tool_error_handling_middleware import ToolErrorHandlingMiddleware, _extract_useful_error, _is_mcp_teardown_error


def _request(name: str = "web_search", tool_call_id: str | None = "tc-1"):
    tool_call = {"name": name}
    if tool_call_id is not None:
        tool_call["id"] = tool_call_id
    return SimpleNamespace(tool_call=tool_call)


def test_wrap_tool_call_passthrough_on_success():
    middleware = ToolErrorHandlingMiddleware()
    req = _request()
    expected = ToolMessage(content="ok", tool_call_id="tc-1", name="web_search")

    result = middleware.wrap_tool_call(req, lambda _req: expected)

    assert result is expected


def test_wrap_tool_call_returns_error_tool_message_on_exception():
    middleware = ToolErrorHandlingMiddleware()
    req = _request(name="web_search", tool_call_id="tc-42")

    def _boom(_req):
        raise RuntimeError("network down")

    result = middleware.wrap_tool_call(req, _boom)

    assert isinstance(result, ToolMessage)
    assert result.tool_call_id == "tc-42"
    assert result.name == "web_search"
    assert result.status == "error"
    assert "Tool 'web_search' failed" in result.text
    assert "network down" in result.text


def test_wrap_tool_call_uses_fallback_tool_call_id_when_missing():
    middleware = ToolErrorHandlingMiddleware()
    req = _request(name="mcp_tool", tool_call_id=None)

    def _boom(_req):
        raise ValueError("bad request")

    result = middleware.wrap_tool_call(req, _boom)

    assert isinstance(result, ToolMessage)
    assert result.tool_call_id == "missing_tool_call_id"
    assert result.name == "mcp_tool"
    assert result.status == "error"


def test_wrap_tool_call_reraises_graph_interrupt():
    middleware = ToolErrorHandlingMiddleware()
    req = _request(name="ask_clarification", tool_call_id="tc-int")

    def _interrupt(_req):
        raise GraphInterrupt(())

    with pytest.raises(GraphInterrupt):
        middleware.wrap_tool_call(req, _interrupt)


@pytest.mark.anyio
async def test_awrap_tool_call_returns_error_tool_message_on_exception():
    middleware = ToolErrorHandlingMiddleware()
    req = _request(name="mcp_tool", tool_call_id="tc-async")

    async def _boom(_req):
        raise TimeoutError("request timed out")

    result = await middleware.awrap_tool_call(req, _boom)

    assert isinstance(result, ToolMessage)
    assert result.tool_call_id == "tc-async"
    assert result.name == "mcp_tool"
    assert result.status == "error"
    assert "request timed out" in result.text


@pytest.mark.anyio
async def test_awrap_tool_call_reraises_graph_interrupt():
    middleware = ToolErrorHandlingMiddleware()
    req = _request(name="ask_clarification", tool_call_id="tc-int-async")

    async def _interrupt(_req):
        raise GraphInterrupt(())

    with pytest.raises(GraphInterrupt):
        await middleware.awrap_tool_call(req, _interrupt)


# --- Tests for _extract_useful_error ---


def test_extract_useful_error_plain_exception():
    exc = RuntimeError("network down")
    assert _extract_useful_error(exc) == "network down"


def test_extract_useful_error_empty_message_uses_class_name():
    exc = RuntimeError("")
    assert _extract_useful_error(exc) == "RuntimeError"


def test_extract_useful_error_exception_group_teardown_only():
    """BrokenResourceError-only ExceptionGroup returns a clear message."""
    group = ExceptionGroup("unhandled errors", [BrokenResourceError()])
    result = _extract_useful_error(group)
    assert "MCP tool session closed unexpectedly" in result


def test_extract_useful_error_exception_group_mixed():
    """ExceptionGroup with real error + teardown error returns the real error."""
    real = ValueError("no browser connection, try to use goto first")
    teardown = BrokenResourceError()
    group = ExceptionGroup("unhandled errors", [teardown, real])
    result = _extract_useful_error(group)
    assert "no browser connection" in result


def test_extract_useful_error_exception_group_closed_resource():
    """ClosedResourceError is also filtered as teardown noise."""
    group = ExceptionGroup("unhandled errors", [ClosedResourceError()])
    result = _extract_useful_error(group)
    assert "MCP tool session closed unexpectedly" in result


def test_is_mcp_teardown_error_true():
    group = ExceptionGroup("err", [BrokenResourceError()])
    assert _is_mcp_teardown_error(group) is True


def test_is_mcp_teardown_error_false_for_plain_exception():
    assert _is_mcp_teardown_error(RuntimeError("boom")) is False


def test_is_mcp_teardown_error_false_for_mixed_group():
    group = ExceptionGroup("err", [BrokenResourceError(), ValueError("real")])
    assert _is_mcp_teardown_error(group) is False


@pytest.mark.anyio
async def test_awrap_exception_group_returns_friendly_error():
    """ExceptionGroup from MCP stdio teardown produces a usable ToolMessage."""
    middleware = ToolErrorHandlingMiddleware()
    req = _request(name="links", tool_call_id="tc-eg")

    async def _raise_eg(_req):
        raise ExceptionGroup("unhandled errors", [BrokenResourceError()])

    result = await middleware.awrap_tool_call(req, _raise_eg)

    assert isinstance(result, ToolMessage)
    assert result.status == "error"
    assert "MCP tool session closed unexpectedly" in result.text
