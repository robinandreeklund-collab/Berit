"""Middleware to prevent LLMs from looping the same tool calls endlessly.

Small local models (e.g. Nemotron 3 Nano) often ignore prompt instructions
about not retrying tools. This middleware enforces hard limits by inspecting
the conversation history and stripping excess tool calls from the model's
response before they execute.
"""

import logging
from collections import Counter
from typing import override

from langchain.agents import AgentState
from langchain.agents.middleware import AgentMiddleware
from langchain_core.messages import ToolMessage
from langgraph.runtime import Runtime

logger = logging.getLogger(__name__)

# Maximum number of times the same tool can be called in a single conversation.
# After this limit the tool call is silently replaced with an error ToolMessage.
MAX_CALLS_PER_TOOL = 5

# Maximum total MCP/external tool calls per turn. Prevents the model
# from calling 5 different MCP tools × 5 times each = 25 tool calls total.
# Sandbox tools (bash, read_file, etc.) and built-in tools are exempt.
MAX_TOTAL_MCP_CALLS = 12

# Tools that are exempt from the loop guard (they are expected to be called
# many times in a single conversation by design).
EXEMPT_TOOLS = frozenset({
    "bash",
    "read_file",
    "write_file",
    "str_replace",
    "ls",
    "task",
    "present_files",
    "write_todos",
    "ask_clarification",
    "view_image",
    "setup_agent",
    # Browser tools that are used in multi-step navigation
    "goto",
    "click",
    "markdown",
    "links",
    "get_text",
    "fill_form",
    "wait_for",
    "execute_js",
    "screenshot",
})


def _count_tool_calls_since_last_human(messages: list) -> Counter:
    """Count tool calls since the last HumanMessage (i.e. the current turn).

    When a user sends a follow-up question a new HumanMessage is appended to the
    history.  We only want to count tool calls that happened *after* the most
    recent HumanMessage so that the per-tool and total-MCP limits reset between
    turns.
    """
    # Walk backwards to find the last HumanMessage
    start_idx = 0
    for i in range(len(messages) - 1, -1, -1):
        if getattr(messages[i], "type", None) == "human":
            start_idx = i + 1
            break

    counts: Counter = Counter()
    for msg in messages[start_idx:]:
        if getattr(msg, "type", None) != "ai":
            continue
        tool_calls = getattr(msg, "tool_calls", None)
        if not tool_calls:
            continue
        for tc in tool_calls:
            name = tc.get("name")
            if name:
                counts[name] += 1
    return counts


class ToolCallLoopMiddleware(AgentMiddleware[AgentState]):
    """Strip tool calls that exceed the per-tool limit within a turn.

    Inspects the message history since the last HumanMessage (current turn)
    to count how many times each tool has been called. If a new tool call in
    the model's response would exceed MAX_CALLS_PER_TOOL, it is removed and
    replaced with an error ToolMessage telling the model to stop retrying.
    Counters reset on each new user message so follow-up questions are not
    penalised by tool calls from earlier turns.

    Tools listed in EXEMPT_TOOLS are not affected.
    """

    def __init__(self, max_calls_per_tool: int = MAX_CALLS_PER_TOOL, max_total_mcp_calls: int = MAX_TOTAL_MCP_CALLS):
        super().__init__()
        self.max_calls_per_tool = max_calls_per_tool
        self.max_total_mcp_calls = max_total_mcp_calls

    def _guard_tool_loops(self, state: AgentState) -> dict | None:
        messages = state.get("messages", [])
        if not messages:
            return None

        last_msg = messages[-1]
        if getattr(last_msg, "type", None) != "ai":
            return None

        tool_calls = getattr(last_msg, "tool_calls", None)
        if not tool_calls:
            return None

        # Count existing calls since the last HumanMessage (excluding the current AI message)
        history = messages[:-1]
        existing_counts = _count_tool_calls_since_last_human(history)

        # Count total non-exempt (MCP) calls in history
        total_mcp_calls = sum(count for name, count in existing_counts.items() if name not in EXEMPT_TOOLS)

        # Track which calls to keep vs block
        kept_calls = []
        blocked_messages = []
        running_counts = Counter(existing_counts)

        for tc in tool_calls:
            name = tc.get("name", "")
            call_id = tc.get("id", "unknown")

            if name in EXEMPT_TOOLS:
                kept_calls.append(tc)
                continue

            # Check total MCP call limit first
            total_mcp_calls += 1
            if total_mcp_calls > self.max_total_mcp_calls:
                logger.warning(
                    "ToolCallLoopMiddleware blocked '%s' (total MCP calls %d > limit %d)",
                    name,
                    total_mcp_calls,
                    self.max_total_mcp_calls,
                )
                blocked_messages.append(
                    ToolMessage(
                        content=(
                            f"STOPP: Totalt {self.max_total_mcp_calls} MCP-verktygsanrop har redan gjorts för denna fråga. "
                            "Du har nått maxgränsen. Du MÅSTE nu presentera den information du har samlat för användaren. "
                            "Sammanfatta resultaten i en tydlig tabell eller text. Gör INGA fler verktygsanrop."
                        ),
                        tool_call_id=call_id,
                        name=name,
                        status="error",
                    )
                )
                continue

            # Check per-tool limit
            running_counts[name] += 1
            if running_counts[name] <= self.max_calls_per_tool:
                kept_calls.append(tc)
            else:
                # Block this call — create an error ToolMessage
                logger.warning(
                    "ToolCallLoopMiddleware blocked '%s' (call #%d, limit %d)",
                    name,
                    running_counts[name],
                    self.max_calls_per_tool,
                )
                blocked_messages.append(
                    ToolMessage(
                        content=(
                            f"STOPP: Verktyget '{name}' har redan anropats {self.max_calls_per_tool} gånger för denna fråga. "
                            "Du FÅR INTE anropa detta verktyg igen. "
                            "Presentera den information du redan har för användaren, eller förklara att verktyget inte kunde ge ett svar. "
                            "Försök INTE med andra varianter av samma anrop."
                        ),
                        tool_call_id=call_id,
                        name=name,
                        status="error",
                    )
                )

        if not blocked_messages:
            return None

        # Replace the AIMessage with only the kept tool calls
        updated_msg = last_msg.model_copy(update={"tool_calls": kept_calls})
        # Return both the updated message and the error ToolMessages
        return {"messages": [updated_msg] + blocked_messages}

    @override
    def after_model(self, state: AgentState, runtime: Runtime) -> dict | None:
        return self._guard_tool_loops(state)

    @override
    async def aafter_model(self, state: AgentState, runtime: Runtime) -> dict | None:
        return self._guard_tool_loops(state)
