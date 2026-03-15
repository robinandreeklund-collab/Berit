"""Prompts management router — view and edit all agent prompt templates."""

import logging

from fastapi import APIRouter
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


class PromptEntry(BaseModel):
    id: str = Field(..., description="Unique prompt identifier")
    label: str = Field(..., description="Human-readable label (Swedish)")
    description: str = Field(..., description="Short description of what the prompt does")
    content: str = Field(..., description="The prompt template text")
    source_file: str = Field(..., description="Backend source file (read-only)")


class PromptsListResponse(BaseModel):
    prompts: list[PromptEntry] = Field(default_factory=list)


class PromptUpdateRequest(BaseModel):
    content: str = Field(..., description="Updated prompt content")


class PromptUpdateResponse(BaseModel):
    success: bool
    id: str
    content: str


# ---------------------------------------------------------------------------
# Prompt registry — maps prompt ID to (module_path, variable_name, label, description)
# ---------------------------------------------------------------------------

_PROMPT_REGISTRY: list[dict] = [
    {
        "id": "system_prompt",
        "module": "src.agents.lead_agent.prompt",
        "variable": "SYSTEM_PROMPT_TEMPLATE",
        "label": "Systemprompt (huvudagent)",
        "description": "Huvudprompt för agenten — roll, språkregler, arbetsflöde, verktygsguider, stil.",
        "source_file": "backend/src/agents/lead_agent/prompt.py",
    },
    {
        "id": "memory_update_prompt",
        "module": "src.agents.memory.prompt",
        "variable": "MEMORY_UPDATE_PROMPT",
        "label": "Minnesuppdatering",
        "description": "Instruktioner för hur minnet extraheras och sparas från konversationer.",
        "source_file": "backend/src/agents/memory/prompt.py",
    },
    {
        "id": "fact_extraction_prompt",
        "module": "src.agents.memory.prompt",
        "variable": "FACT_EXTRACTION_PROMPT",
        "label": "Faktaextraktion",
        "description": "Prompt för att extrahera enskilda fakta från meddelanden.",
        "source_file": "backend/src/agents/memory/prompt.py",
    },
    {
        "id": "suggestions_prompt",
        "module": "src.gateway.routers.suggestions",
        "variable": "SUGGESTIONS_PROMPT_TEMPLATE",
        "label": "Uppföljningsfrågor",
        "description": "Mall för att generera uppföljningsfrågor som visas under textinput.",
        "source_file": "backend/src/gateway/routers/suggestions.py",
    },
]


def _get_prompt_value(module_path: str, variable_name: str) -> str:
    """Import module and read the current value of a prompt variable."""
    import importlib

    mod = importlib.import_module(module_path)
    return str(getattr(mod, variable_name, ""))


def _set_prompt_value(module_path: str, variable_name: str, value: str) -> None:
    """Update a prompt variable at runtime (in-memory, not on disk)."""
    import importlib

    mod = importlib.import_module(module_path)
    setattr(mod, variable_name, value)


@router.get(
    "/",
    response_model=PromptsListResponse,
    summary="List all editable prompts",
    description="Returns all prompt templates used in the agent flow.",
)
async def list_prompts() -> PromptsListResponse:
    prompts = []
    for entry in _PROMPT_REGISTRY:
        try:
            content = _get_prompt_value(entry["module"], entry["variable"])
        except Exception as exc:
            logger.warning("Failed to load prompt %s: %s", entry["id"], exc)
            content = f"(Failed to load: {exc})"
        prompts.append(
            PromptEntry(
                id=entry["id"],
                label=entry["label"],
                description=entry["description"],
                content=content,
                source_file=entry["source_file"],
            )
        )
    return PromptsListResponse(prompts=prompts)


@router.get(
    "/{prompt_id}",
    response_model=PromptEntry,
    summary="Get a specific prompt",
)
async def get_prompt(prompt_id: str) -> PromptEntry:
    for entry in _PROMPT_REGISTRY:
        if entry["id"] == prompt_id:
            content = _get_prompt_value(entry["module"], entry["variable"])
            return PromptEntry(
                id=entry["id"],
                label=entry["label"],
                description=entry["description"],
                content=content,
                source_file=entry["source_file"],
            )
    from fastapi import HTTPException

    raise HTTPException(status_code=404, detail=f"Prompt '{prompt_id}' not found")


@router.put(
    "/{prompt_id}",
    response_model=PromptUpdateResponse,
    summary="Update a prompt",
    description="Update a prompt template at runtime (in-memory). Changes persist until server restart.",
)
async def update_prompt(prompt_id: str, request: PromptUpdateRequest) -> PromptUpdateResponse:
    for entry in _PROMPT_REGISTRY:
        if entry["id"] == prompt_id:
            try:
                _set_prompt_value(entry["module"], entry["variable"], request.content)
                logger.info("Prompt '%s' updated successfully", prompt_id)
                return PromptUpdateResponse(success=True, id=prompt_id, content=request.content)
            except Exception as exc:
                logger.exception("Failed to update prompt '%s'", prompt_id)
                from fastapi import HTTPException

                raise HTTPException(status_code=500, detail=str(exc))

    from fastapi import HTTPException

    raise HTTPException(status_code=404, detail=f"Prompt '{prompt_id}' not found")
