from pathlib import Path
from typing import Annotated

from langchain.tools import InjectedToolCallId, ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from langgraph.typing import ContextT

from src.agents.thread_state import ThreadState
from src.config.paths import VIRTUAL_PATH_PREFIX, get_paths

OUTPUTS_VIRTUAL_PREFIX = f"{VIRTUAL_PATH_PREFIX}/outputs"


def _normalize_presented_filepath(
    runtime: ToolRuntime[ContextT, ThreadState],
    filepath: str,
) -> str:
    """Normalize a presented file path to the `/mnt/user-data/outputs/*` contract.

    Accepts either:
    - A virtual sandbox path such as `/mnt/user-data/outputs/report.md`
    - A host-side thread outputs path such as
      `/app/backend/.deer-flow/threads/<thread>/user-data/outputs/report.md`

    Returns:
        The normalized virtual path.

    Raises:
        ValueError: If runtime metadata is missing or the path is outside the
            current thread's outputs directory.
    """
    if runtime.state is None:
        raise ValueError("Thread runtime state is not available")

    thread_id = runtime.context.get("thread_id")
    if not thread_id:
        raise ValueError("Thread ID is not available in runtime context")

    thread_data = runtime.state.get("thread_data") or {}
    outputs_path = thread_data.get("outputs_path")
    if not outputs_path:
        raise ValueError("Thread outputs path is not available in runtime state")

    outputs_dir = Path(outputs_path).resolve()
    stripped = filepath.lstrip("/")
    virtual_prefix = VIRTUAL_PATH_PREFIX.lstrip("/")

    if stripped == virtual_prefix or stripped.startswith(virtual_prefix + "/"):
        actual_path = get_paths().resolve_virtual_path(thread_id, filepath)
    else:
        actual_path = Path(filepath).expanduser().resolve()

    try:
        relative_path = actual_path.relative_to(outputs_dir)
    except ValueError as exc:
        raise ValueError(f"Only files in {OUTPUTS_VIRTUAL_PREFIX} can be presented: {filepath}") from exc

    return f"{OUTPUTS_VIRTUAL_PREFIX}/{relative_path.as_posix()}"


@tool("present_files", parse_docstring=True)
def present_file_tool(
    runtime: ToolRuntime[ContextT, ThreadState],
    filepaths: list[str],
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    """Gör filer synliga för användaren för visning och rendering i klientgränssnittet.

    När du ska använda present_files-verktyget:

    - Göra filer tillgängliga för användaren att visa, ladda ner eller interagera med
    - Presentera flera relaterade filer samtidigt
    - Efter att filer skapats som ska presenteras för användaren

    När du INTE ska använda present_files-verktyget:
    - När du bara behöver läsa filinnehåll för din egen bearbetning
    - För temporära eller mellanliggande filer som inte är avsedda för användarvisning

    Noteringar:
    - Du bör anropa detta verktyg efter att ha skapat filer och flyttat dem till katalogen `/mnt/user-data/outputs`.
    - Detta verktyg kan säkert anropas parallellt med andra verktyg. Tillståndsuppdateringar hanteras av en reducer för att förhindra konflikter.

    Args:
        filepaths: Lista med absoluta filsökvägar att presentera för användaren. **Bara** filer i `/mnt/user-data/outputs` kan presenteras.
    """
    try:
        normalized_paths = [_normalize_presented_filepath(runtime, filepath) for filepath in filepaths]
    except ValueError as exc:
        return Command(
            update={"messages": [ToolMessage(f"Error: {exc}", tool_call_id=tool_call_id)]},
        )

    # Verify files actually exist on disk before presenting them
    thread_data = runtime.state.get("thread_data") or {}
    outputs_dir = Path(thread_data.get("outputs_path", "")).resolve()
    missing = []
    for vpath in normalized_paths:
        # Extract relative path from virtual prefix and resolve against actual outputs dir
        relative = vpath[len(OUTPUTS_VIRTUAL_PREFIX):].lstrip("/")
        actual = outputs_dir / relative
        if not actual.exists():
            missing.append(vpath)

    if missing:
        names = ", ".join(missing)
        return Command(
            update={"messages": [ToolMessage(f"Error: Files do not exist yet: {names}. Use write_file to create them in /mnt/user-data/outputs/ first, then call present_files again.", tool_call_id=tool_call_id)]},
        )

    # The merge_artifacts reducer will handle merging and deduplication
    return Command(
        update={
            "artifacts": normalized_paths,
            "messages": [ToolMessage("Successfully presented files", tool_call_id=tool_call_id)],
        },
    )
