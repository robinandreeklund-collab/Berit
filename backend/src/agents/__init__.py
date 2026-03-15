from .checkpointer import get_checkpointer, make_checkpointer, reset_checkpointer
from .lead_agent import make_lead_agent
from .thread_state import SandboxState, ThreadState

__all__ = ["make_lead_agent", "SandboxState", "ThreadState", "get_checkpointer", "reset_checkpointer", "make_checkpointer"]

# Eagerly start MCP tool loading in the background so they are ready
# by the time the first chat message arrives.  This import happens when
# LangGraph Server boots and resolves the "lead_agent" graph entry point.
try:
    from src.mcp.cache import start_background_initialization

    start_background_initialization()
except Exception:
    pass  # Non-fatal — tools will be lazily loaded on first request
