"""Tests for ToolCallLoopMiddleware — prevents LLMs from looping the same tool calls."""

from unittest.mock import MagicMock

from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from src.agents.middlewares.tool_call_loop_middleware import (
    EXEMPT_TOOLS,
    MAX_CALLS_PER_TOOL,
    MAX_TOTAL_MCP_CALLS,
    ToolCallLoopMiddleware,
    _count_tool_calls_since_last_human,
)


def _make_ai_msg_with_tool_calls(tool_calls: list[dict], id: str = "ai1") -> AIMessage:
    return AIMessage(content="", tool_calls=tool_calls, id=id)


def _make_tool_call(name: str, call_id: str = "tc1", args: dict | None = None) -> dict:
    return {"name": name, "id": call_id, "args": args or {}}


class TestCountToolCallsSinceLastHuman:
    def test_empty_history(self):
        assert _count_tool_calls_since_last_human([]) == {}

    def test_counts_ai_tool_calls_after_human(self):
        messages = [
            HumanMessage(content="hello"),
            _make_ai_msg_with_tool_calls([_make_tool_call("scb_search", "tc1"), _make_tool_call("scb_fetch", "tc2")]),
            ToolMessage(content="ok", tool_call_id="tc1", name="scb_search"),
            ToolMessage(content="ok", tool_call_id="tc2", name="scb_fetch"),
            _make_ai_msg_with_tool_calls([_make_tool_call("scb_search", "tc3")]),
        ]
        counts = _count_tool_calls_since_last_human(messages)
        assert counts["scb_search"] == 2
        assert counts["scb_fetch"] == 1

    def test_ignores_non_ai_messages(self):
        messages = [
            HumanMessage(content="hello"),
            ToolMessage(content="ok", tool_call_id="tc1", name="scb_search"),
        ]
        counts = _count_tool_calls_since_last_human(messages)
        assert len(counts) == 0

    def test_resets_on_new_human_message(self):
        """Counts should only include tool calls after the LAST HumanMessage."""
        messages = [
            # Turn 1: user asks, model calls scb_search 3 times
            HumanMessage(content="first question"),
            _make_ai_msg_with_tool_calls([_make_tool_call("scb_search", "tc1")]),
            ToolMessage(content="ok", tool_call_id="tc1", name="scb_search"),
            _make_ai_msg_with_tool_calls([_make_tool_call("scb_search", "tc2")]),
            ToolMessage(content="ok", tool_call_id="tc2", name="scb_search"),
            _make_ai_msg_with_tool_calls([_make_tool_call("scb_search", "tc3")]),
            ToolMessage(content="ok", tool_call_id="tc3", name="scb_search"),
            AIMessage(content="Here are the results."),
            # Turn 2: follow-up question, model calls scb_search once
            HumanMessage(content="follow-up question"),
            _make_ai_msg_with_tool_calls([_make_tool_call("scb_search", "tc4")]),
            ToolMessage(content="ok", tool_call_id="tc4", name="scb_search"),
        ]
        counts = _count_tool_calls_since_last_human(messages)
        # Should only count the 1 call from turn 2, not the 3 from turn 1
        assert counts["scb_search"] == 1

    def test_no_human_message_counts_everything(self):
        """If there is no HumanMessage at all, count everything."""
        messages = [
            _make_ai_msg_with_tool_calls([_make_tool_call("scb_search", "tc1")]),
            ToolMessage(content="ok", tool_call_id="tc1", name="scb_search"),
        ]
        counts = _count_tool_calls_since_last_human(messages)
        assert counts["scb_search"] == 1


class TestToolCallLoopMiddleware:
    def setup_method(self):
        self.middleware = ToolCallLoopMiddleware(max_calls_per_tool=3)
        self.runtime = MagicMock()

    def test_no_op_on_non_ai_message(self):
        state = {"messages": [HumanMessage(content="hello")]}
        result = self.middleware.after_model(state, self.runtime)
        assert result is None

    def test_no_op_on_ai_without_tool_calls(self):
        state = {"messages": [AIMessage(content="hello")]}
        result = self.middleware.after_model(state, self.runtime)
        assert result is None

    def test_allows_calls_within_limit(self):
        state = {
            "messages": [
                HumanMessage(content="test"),
                _make_ai_msg_with_tool_calls([_make_tool_call("kolada_sok_kommun", "tc1")]),
                ToolMessage(content="ok", tool_call_id="tc1", name="kolada_sok_kommun"),
                _make_ai_msg_with_tool_calls([_make_tool_call("kolada_sok_kommun", "tc2")]),
            ]
        }
        result = self.middleware.after_model(state, self.runtime)
        assert result is None  # 2nd call, limit is 3, so no blocking

    def test_blocks_calls_exceeding_limit(self):
        # Build history with 3 previous calls to kolada_sok_kommun
        history = [HumanMessage(content="test")]
        for i in range(3):
            history.append(_make_ai_msg_with_tool_calls([_make_tool_call("kolada_sok_kommun", f"tc{i}")]))
            history.append(ToolMessage(content="ok", tool_call_id=f"tc{i}", name="kolada_sok_kommun"))

        # Now the model tries to call it again (4th time)
        new_call = _make_ai_msg_with_tool_calls([_make_tool_call("kolada_sok_kommun", "tc_new")], id="ai_new")
        history.append(new_call)

        state = {"messages": history}
        result = self.middleware.after_model(state, self.runtime)

        assert result is not None
        messages = result["messages"]
        # Should have: 1 updated AIMessage (with empty tool_calls) + 1 error ToolMessage
        assert len(messages) == 2
        updated_ai = messages[0]
        assert updated_ai.tool_calls == []
        error_msg = messages[1]
        assert isinstance(error_msg, ToolMessage)
        assert error_msg.status == "error"
        assert "STOPP" in error_msg.content

    def test_exempt_tools_not_blocked(self):
        # bash is exempt — should never be blocked
        history = [HumanMessage(content="test")]
        for i in range(10):
            history.append(_make_ai_msg_with_tool_calls([_make_tool_call("bash", f"tc{i}")]))
            history.append(ToolMessage(content="ok", tool_call_id=f"tc{i}", name="bash"))

        new_call = _make_ai_msg_with_tool_calls([_make_tool_call("bash", "tc_new")], id="ai_new")
        history.append(new_call)

        state = {"messages": history}
        result = self.middleware.after_model(state, self.runtime)
        assert result is None  # bash is exempt, no blocking

    def test_mixed_calls_only_blocks_exceeded(self):
        # 3 calls to kolada_sok_nyckeltal in history
        history = [HumanMessage(content="test")]
        for i in range(3):
            history.append(_make_ai_msg_with_tool_calls([_make_tool_call("kolada_sok_nyckeltal", f"tc{i}")]))
            history.append(ToolMessage(content="ok", tool_call_id=f"tc{i}", name="kolada_sok_nyckeltal"))

        # New response with one allowed call (kolada_data_kommun) and one blocked (kolada_sok_nyckeltal)
        new_call = _make_ai_msg_with_tool_calls(
            [_make_tool_call("kolada_data_kommun", "tc_ok"), _make_tool_call("kolada_sok_nyckeltal", "tc_blocked")],
            id="ai_new",
        )
        history.append(new_call)

        state = {"messages": history}
        result = self.middleware.after_model(state, self.runtime)

        assert result is not None
        messages = result["messages"]
        updated_ai = messages[0]
        # Only kolada_data_kommun should remain
        assert len(updated_ai.tool_calls) == 1
        assert updated_ai.tool_calls[0]["name"] == "kolada_data_kommun"
        # Error message for blocked call
        error_msg = messages[1]
        assert isinstance(error_msg, ToolMessage)
        assert "kolada_sok_nyckeltal" in error_msg.content

    def test_default_max_calls(self):
        mw = ToolCallLoopMiddleware()
        assert mw.max_calls_per_tool == MAX_CALLS_PER_TOOL

    def test_exempt_tools_include_expected(self):
        assert "bash" in EXEMPT_TOOLS
        assert "read_file" in EXEMPT_TOOLS
        assert "task" in EXEMPT_TOOLS

    def test_total_mcp_cap_blocks_after_limit(self):
        """Total MCP call limit blocks even if per-tool limit is not reached."""
        mw = ToolCallLoopMiddleware(max_calls_per_tool=5, max_total_mcp_calls=4)
        runtime = MagicMock()

        # 4 different MCP tools called once each (at the total limit)
        history = [HumanMessage(content="test")]
        for i, tool_name in enumerate(["scb_browse", "scb_search", "scb_inspect", "scb_fetch"]):
            history.append(_make_ai_msg_with_tool_calls([_make_tool_call(tool_name, f"tc{i}")]))
            history.append(ToolMessage(content="ok", tool_call_id=f"tc{i}", name=tool_name))

        # 5th MCP call should be blocked (total limit = 4)
        new_call = _make_ai_msg_with_tool_calls([_make_tool_call("scb_browse", "tc_new")], id="ai_new")
        history.append(new_call)

        state = {"messages": history}
        result = mw.after_model(state, runtime)

        assert result is not None
        messages = result["messages"]
        error_msg = messages[1]
        assert isinstance(error_msg, ToolMessage)
        assert error_msg.status == "error"
        assert "MCP-verktygsanrop" in error_msg.content

    def test_total_mcp_cap_does_not_count_exempt_tools(self):
        """Exempt tools (bash, read_file, etc.) don't count toward total MCP cap."""
        mw = ToolCallLoopMiddleware(max_calls_per_tool=5, max_total_mcp_calls=2)
        runtime = MagicMock()

        # 10 bash calls + 1 MCP call (bash is exempt, only 1 MCP so far)
        history = [HumanMessage(content="test")]
        for i in range(10):
            history.append(_make_ai_msg_with_tool_calls([_make_tool_call("bash", f"tc_bash{i}")]))
            history.append(ToolMessage(content="ok", tool_call_id=f"tc_bash{i}", name="bash"))
        history.append(_make_ai_msg_with_tool_calls([_make_tool_call("scb_browse", "tc_mcp1")]))
        history.append(ToolMessage(content="ok", tool_call_id="tc_mcp1", name="scb_browse"))

        # 2nd MCP call should still be allowed (total = 2, limit = 2)
        new_call = _make_ai_msg_with_tool_calls([_make_tool_call("scb_fetch", "tc_mcp2")], id="ai_new")
        history.append(new_call)

        state = {"messages": history}
        result = mw.after_model(state, runtime)
        assert result is None  # 2nd MCP call is within limit

    def test_default_max_total_mcp_calls(self):
        mw = ToolCallLoopMiddleware()
        assert mw.max_total_mcp_calls == MAX_TOTAL_MCP_CALLS

    def test_follow_up_question_resets_counters(self):
        """Tool call limits reset when the user sends a follow-up question.

        Regression test: previously the middleware counted across the entire
        conversation, causing follow-up questions to be blocked by tool calls
        from earlier turns.
        """
        mw = ToolCallLoopMiddleware(max_calls_per_tool=3, max_total_mcp_calls=5)
        runtime = MagicMock()

        # Turn 1: user asks, model calls elpris_historik 3 times (at per-tool limit)
        history = [HumanMessage(content="Vad kostar elen?")]
        for i in range(3):
            history.append(_make_ai_msg_with_tool_calls([_make_tool_call("elpris_historik", f"tc{i}")]))
            history.append(ToolMessage(content="data", tool_call_id=f"tc{i}", name="elpris_historik"))
        history.append(AIMessage(content="Elpriset är 45 öre/kWh."))

        # Turn 2: follow-up question, model wants to call elpris_historik again
        history.append(HumanMessage(content="Hur var det förra veckan?"))
        new_call = _make_ai_msg_with_tool_calls([_make_tool_call("elpris_historik", "tc_followup")], id="ai_followup")
        history.append(new_call)

        state = {"messages": history}
        result = mw.after_model(state, runtime)

        # Should NOT be blocked — this is the first call in the new turn
        assert result is None

    def test_total_mcp_cap_resets_on_new_turn(self):
        """Total MCP call cap also resets per turn."""
        mw = ToolCallLoopMiddleware(max_calls_per_tool=5, max_total_mcp_calls=3)
        runtime = MagicMock()

        # Turn 1: 3 different MCP tools (at total limit)
        history = [HumanMessage(content="question 1")]
        for i, tool in enumerate(["scb_search", "scb_fetch", "scb_browse"]):
            history.append(_make_ai_msg_with_tool_calls([_make_tool_call(tool, f"tc{i}")]))
            history.append(ToolMessage(content="ok", tool_call_id=f"tc{i}", name=tool))
        history.append(AIMessage(content="Done."))

        # Turn 2: new question, model calls MCP tool
        history.append(HumanMessage(content="question 2"))
        new_call = _make_ai_msg_with_tool_calls([_make_tool_call("scb_search", "tc_new")], id="ai_new")
        history.append(new_call)

        state = {"messages": history}
        result = mw.after_model(state, runtime)

        # Should NOT be blocked — new turn, counters reset
        assert result is None
