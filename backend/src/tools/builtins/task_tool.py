"""Task tool for delegating work to subagents."""

import logging
import time
import uuid
from dataclasses import replace
from typing import Annotated, Literal

from langchain.tools import InjectedToolCallId, ToolRuntime, tool
from langgraph.config import get_stream_writer
from langgraph.typing import ContextT

from src.agents.lead_agent.prompt import get_skills_prompt_section
from src.agents.thread_state import ThreadState
from src.subagents import SubagentExecutor, get_subagent_config
from src.subagents.executor import SubagentStatus, cleanup_background_task, get_background_task_result

logger = logging.getLogger(__name__)


@tool("task", parse_docstring=True)
def task_tool(
    runtime: ToolRuntime[ContextT, ThreadState],
    description: str,
    prompt: str,
    subagent_type: Literal["general-purpose", "bash"],
    tool_call_id: Annotated[str, InjectedToolCallId],
    max_turns: int | None = None,
) -> str:
    """Delegera en uppgift till en specialiserad underagent som körs i sin egen kontext. Skriv prompt på svenska.

    Underagenter hjälper dig att:
    - Bevara kontext genom att hålla utforskning och implementering separata
    - Hantera komplexa flerstegsuppgifter självständigt
    - Utföra kommandon eller operationer i isolerade kontexter

    Tillgängliga underagenttyper:
    - **general-purpose**: En kapabel agent för komplexa flerstegsuppgifter som kräver
      både utforskning och handling. Använd när uppgiften kräver komplext resonemang,
      flera beroende steg, eller skulle gynnas av isolerad kontext.
    - **bash**: Kommandoexekveringsspecialist för bash-kommandon. Använd för
      git-operationer, byggprocesser eller när kommandoutdata är utförlig.

    När du ska använda detta verktyg:
    - Komplexa uppgifter som kräver flera steg eller verktyg
    - Uppgifter som producerar utförlig utdata
    - När du vill isolera kontext från huvudkonversationen
    - Parallella forsknings- eller utforskningsuppgifter

    När du INTE ska använda detta verktyg:
    - Enkla enstegoperationer (använd verktyg direkt)
    - Uppgifter som kräver användarinteraktion eller förtydligande

    Args:
        description: En kort (3-5 ord) beskrivning av uppgiften för loggning/visning. ANGE ALLTID DENNA PARAMETER FÖRST.
        prompt: Uppgiftsbeskrivningen för underagenten. Var specifik och tydlig om vad som behöver göras. Skriv på svenska. ANGE ALLTID DENNA PARAMETER SOM ANDRA.
        subagent_type: Typ av underagent att använda. ANGE ALLTID DENNA PARAMETER SOM TREDJE.
        max_turns: Valfritt maximalt antal agentomgångar. Standardvärde: underagentens konfigurerade max.
    """
    # Get subagent configuration
    config = get_subagent_config(subagent_type)
    if config is None:
        return f"Error: Unknown subagent type '{subagent_type}'. Available: general-purpose, bash"

    # Build config overrides
    overrides: dict = {}

    skills_section = get_skills_prompt_section()
    if skills_section:
        overrides["system_prompt"] = config.system_prompt + "\n\n" + skills_section

    if max_turns is not None:
        overrides["max_turns"] = max_turns

    if overrides:
        config = replace(config, **overrides)

    # Extract parent context from runtime
    sandbox_state = None
    thread_data = None
    thread_id = None
    parent_model = None
    trace_id = None

    if runtime is not None:
        sandbox_state = runtime.state.get("sandbox")
        thread_data = runtime.state.get("thread_data")
        thread_id = runtime.context.get("thread_id")

        # Try to get parent model from configurable
        metadata = runtime.config.get("metadata", {})
        parent_model = metadata.get("model_name")

        # Get or generate trace_id for distributed tracing
        trace_id = metadata.get("trace_id") or str(uuid.uuid4())[:8]

    # Get available tools (excluding task tool to prevent nesting)
    # Lazy import to avoid circular dependency
    from src.tools import get_available_tools

    # Subagents should not have subagent tools enabled (prevent recursive nesting)
    tools = get_available_tools(model_name=parent_model, subagent_enabled=False)

    # Create executor
    executor = SubagentExecutor(
        config=config,
        tools=tools,
        parent_model=parent_model,
        sandbox_state=sandbox_state,
        thread_data=thread_data,
        thread_id=thread_id,
        trace_id=trace_id,
    )

    # Start background execution (always async to prevent blocking)
    # Use tool_call_id as task_id for better traceability
    task_id = executor.execute_async(prompt, task_id=tool_call_id)

    # Poll for task completion in backend (removes need for LLM to poll)
    poll_count = 0
    last_status = None
    last_message_count = 0  # Track how many AI messages we've already sent
    # Polling timeout: execution timeout + 60s buffer, checked every 5s
    max_poll_count = (config.timeout_seconds + 60) // 5

    logger.info(f"[trace={trace_id}] Started background task {task_id} (subagent={subagent_type}, timeout={config.timeout_seconds}s, polling_limit={max_poll_count} polls)")

    writer = get_stream_writer()
    # Send Task Started message'
    writer({"type": "task_started", "task_id": task_id, "description": description})

    while True:
        result = get_background_task_result(task_id)

        if result is None:
            logger.error(f"[trace={trace_id}] Task {task_id} not found in background tasks")
            writer({"type": "task_failed", "task_id": task_id, "error": "Task disappeared from background tasks"})
            cleanup_background_task(task_id)
            return f"Error: Task {task_id} disappeared from background tasks"

        # Log status changes for debugging
        if result.status != last_status:
            logger.info(f"[trace={trace_id}] Task {task_id} status: {result.status.value}")
            last_status = result.status

        # Check for new AI messages and send task_running events
        current_message_count = len(result.ai_messages)
        if current_message_count > last_message_count:
            # Send task_running event for each new message
            for i in range(last_message_count, current_message_count):
                message = result.ai_messages[i]
                writer(
                    {
                        "type": "task_running",
                        "task_id": task_id,
                        "message": message,
                        "message_index": i + 1,  # 1-based index for display
                        "total_messages": current_message_count,
                    }
                )
                logger.info(f"[trace={trace_id}] Task {task_id} sent message #{i + 1}/{current_message_count}")
            last_message_count = current_message_count

        # Check if task completed, failed, or timed out
        if result.status == SubagentStatus.COMPLETED:
            writer({"type": "task_completed", "task_id": task_id, "result": result.result})
            logger.info(f"[trace={trace_id}] Task {task_id} completed after {poll_count} polls")
            cleanup_background_task(task_id)
            return f"Task Succeeded. Result: {result.result}"
        elif result.status == SubagentStatus.FAILED:
            writer({"type": "task_failed", "task_id": task_id, "error": result.error})
            logger.error(f"[trace={trace_id}] Task {task_id} failed: {result.error}")
            cleanup_background_task(task_id)
            return f"Task failed. Error: {result.error}"
        elif result.status == SubagentStatus.TIMED_OUT:
            writer({"type": "task_timed_out", "task_id": task_id, "error": result.error})
            logger.warning(f"[trace={trace_id}] Task {task_id} timed out: {result.error}")
            cleanup_background_task(task_id)
            return f"Task timed out. Error: {result.error}"

        # Still running, wait before next poll
        time.sleep(5)  # Poll every 5 seconds
        poll_count += 1

        # Polling timeout as a safety net (in case thread pool timeout doesn't work)
        # Set to execution timeout + 60s buffer, in 5s poll intervals
        # This catches edge cases where the background task gets stuck
        # Note: We don't call cleanup_background_task here because the task may
        # still be running in the background. The cleanup will happen when the
        # executor completes and sets a terminal status.
        if poll_count > max_poll_count:
            timeout_minutes = config.timeout_seconds // 60
            logger.error(f"[trace={trace_id}] Task {task_id} polling timed out after {poll_count} polls (should have been caught by thread pool timeout)")
            writer({"type": "task_timed_out", "task_id": task_id})
            return f"Task polling timed out after {timeout_minutes} minutes. This may indicate the background task is stuck. Status: {result.status.value}"
