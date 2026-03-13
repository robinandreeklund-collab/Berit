import logging

from langchain.agents import create_agent
from langchain.agents.middleware import SummarizationMiddleware
from langchain_core.runnables import RunnableConfig

from src.agents.lead_agent.prompt import apply_prompt_template
from src.agents.middlewares.clarification_middleware import ClarificationMiddleware
from src.agents.middlewares.memory_middleware import MemoryMiddleware
from src.agents.middlewares.subagent_limit_middleware import SubagentLimitMiddleware
from src.agents.middlewares.title_middleware import TitleMiddleware
from src.agents.middlewares.todo_middleware import TodoMiddleware
from src.agents.middlewares.tool_error_handling_middleware import build_lead_runtime_middlewares
from src.agents.middlewares.view_image_middleware import ViewImageMiddleware
from src.agents.thread_state import ThreadState
from src.config.agents_config import load_agent_config
from src.config.app_config import get_app_config
from src.config.summarization_config import get_summarization_config
from src.models import create_chat_model

logger = logging.getLogger(__name__)


def _resolve_model_name(requested_model_name: str | None = None) -> str:
    """Resolve a runtime model name safely, falling back to default if invalid. Returns None if no models are configured."""
    app_config = get_app_config()
    default_model_name = app_config.models[0].name if app_config.models else None
    if default_model_name is None:
        raise ValueError("No chat models are configured. Please configure at least one model in config.yaml.")

    if requested_model_name and app_config.get_model_config(requested_model_name):
        return requested_model_name

    if requested_model_name and requested_model_name != default_model_name:
        logger.warning(f"Model '{requested_model_name}' not found in config; fallback to default model '{default_model_name}'.")
    return default_model_name


def _create_summarization_middleware() -> SummarizationMiddleware | None:
    """Create and configure the summarization middleware from config."""
    config = get_summarization_config()

    if not config.enabled:
        return None

    # Prepare trigger parameter
    trigger = None
    if config.trigger is not None:
        if isinstance(config.trigger, list):
            trigger = [t.to_tuple() for t in config.trigger]
        else:
            trigger = config.trigger.to_tuple()

    # Prepare keep parameter
    keep = config.keep.to_tuple()

    # Prepare model parameter
    if config.model_name:
        model = config.model_name
    else:
        # Use a lightweight model for summarization to save costs
        # Falls back to default model if not explicitly specified
        model = create_chat_model(thinking_enabled=False)

    # Prepare kwargs
    kwargs = {
        "model": model,
        "trigger": trigger,
        "keep": keep,
    }

    if config.trim_tokens_to_summarize is not None:
        kwargs["trim_tokens_to_summarize"] = config.trim_tokens_to_summarize

    if config.summary_prompt is not None:
        kwargs["summary_prompt"] = config.summary_prompt

    return SummarizationMiddleware(**kwargs)


def _create_todo_list_middleware(is_plan_mode: bool) -> TodoMiddleware | None:
    """Create and configure the TodoList middleware.

    Args:
        is_plan_mode: Whether to enable plan mode with TodoList middleware.

    Returns:
        TodoMiddleware instance if plan mode is enabled, None otherwise.
    """
    if not is_plan_mode:
        return None

    # Custom prompts matching DeerFlow's style - Swedish
    system_prompt = """
<todo_list_system>
Du har tillgång till verktyget `write_todos` för att hantera och spåra komplexa flerstegsuppgifter.

**KRITISKA REGLER:**
- Markera uppgifter som slutförda OMEDELBART efter varje steg — batcha INTE slutföranden
- Håll EXAKT EN uppgift som `in_progress` åt gången (om inte uppgifter kan köras parallellt)
- Uppdatera att-göra-listan i REALTID medan du arbetar — detta ger användaren insyn i dina framsteg
- Använd INTE detta verktyg för enkla uppgifter (< 3 steg) — slutför dem direkt

**När du ska använda det:**
Detta verktyg är utformat för komplexa mål som kräver systematisk spårning:
- Komplexa flerstegsuppgifter som kräver 3+ distinkta steg
- Icke-triviala uppgifter som kräver noggrann planering och utförande
- Användaren ber uttryckligen om en att-göra-lista
- Användaren ger flera uppgifter (numrerade eller kommaseparerade)
- Planen kan behöva revideras baserat på mellanliggande resultat

**När du INTE ska använda det:**
- Enstaka, enkla uppgifter
- Triviala uppgifter (< 3 steg)
- Rent konversationella eller informationella förfrågningar
- Enkla verktygsanrop där tillvägagångssättet är uppenbart

**Bästa praxis:**
- Bryt ner komplexa uppgifter i mindre, hanterbara steg
- Använd tydliga, beskrivande uppgiftsnamn
- Ta bort uppgifter som inte längre är relevanta
- Lägg till nya uppgifter som upptäcks under implementering
- Tveka inte att revidera att-göra-listan när du lär dig mer

**Uppgiftshantering:**
Att skriva uppgifter tar tid och tokens — använd det när det hjälper för att hantera komplexa problem, inte för enkla förfrågningar.
</todo_list_system>
"""

    tool_description = """Använd detta verktyg för att skapa och hantera en strukturerad uppgiftslista för komplexa arbetssessioner.

**VIKTIGT: Använd bara detta verktyg för komplexa uppgifter (3+ steg). För enkla förfrågningar, gör bara arbetet direkt.**

## När du ska använda det

Använd detta verktyg i dessa scenarier:
1. **Komplexa flerstegsuppgifter**: När en uppgift kräver 3 eller fler distinkta steg eller åtgärder
2. **Icke-triviala uppgifter**: Uppgifter som kräver noggrann planering eller flera operationer
3. **Användaren ber uttryckligen om uppgiftslista**: När användaren direkt ber dig spåra uppgifter
4. **Flera uppgifter**: När användare ger en lista med saker att göra
5. **Dynamisk planering**: När planen kan behöva uppdateringar baserat på mellanliggande resultat

## När du INTE ska använda det

Hoppa över detta verktyg när:
1. Uppgiften är enkel och tar färre än 3 steg
2. Uppgiften är trivial och spårning ger ingen nytta
3. Uppgiften är rent konversationell eller informationell
4. Det är tydligt vad som behöver göras och du kan bara göra det

## Hur du använder det

1. **Starta en uppgift**: Markera den som `in_progress` INNAN du börjar arbeta
2. **Slutföra en uppgift**: Markera den som `completed` OMEDELBART efter avslut
3. **Uppdatera listan**: Lägg till nya uppgifter, ta bort irrelevanta eller uppdatera beskrivningar vid behov
4. **Flera uppdateringar**: Du kan göra flera uppdateringar samtidigt (t.ex. slutföra en uppgift och starta nästa)

## Uppgiftsstatus

- `pending`: Uppgift ej påbörjad
- `in_progress`: Arbetar med just nu (kan ha flera om uppgifter körs parallellt)
- `completed`: Uppgift slutförd

## Krav för uppgiftsslutförande

**KRITISKT: Markera en uppgift som slutförd BARA när du har FULLSTÄNDIGT genomfört den.**

Markera aldrig en uppgift som slutförd om:
- Det finns olösta problem eller fel
- Arbetet är delvis eller ofullständigt
- Du stötte på hinder som förhindrar slutförande
- Du inte kunde hitta nödvändiga resurser eller beroenden
- Kvalitetsstandarder inte har uppfyllts

Om du är blockerad, behåll uppgiften som `in_progress` och skapa en ny uppgift som beskriver vad som behöver lösas.

## Bästa praxis

- Skapa specifika, handlingsbara uppgifter
- Bryt ner komplexa uppgifter i mindre, hanterbara steg
- Använd tydliga, beskrivande uppgiftsnamn
- Uppdatera uppgiftsstatus i realtid medan du arbetar
- Markera uppgifter som slutförda OMEDELBART (batcha inte slutföranden)
- Ta bort uppgifter som inte längre är relevanta
- **VIKTIGT**: När du skriver att-göra-listan, markera din(a) första uppgift(er) som `in_progress` omedelbart
- **VIKTIGT**: Om inte alla uppgifter är slutförda, ha alltid minst en uppgift som `in_progress` för att visa framsteg

Att vara proaktiv med uppgiftshantering visar grundlighet och säkerställer att alla krav slutförs framgångsrikt.

**Kom ihåg**: Om du bara behöver några verktygsanrop för att slutföra en uppgift och det är tydligt vad som ska göras, är det bättre att bara göra uppgiften direkt och INTE använda detta verktyg alls.
"""

    return TodoMiddleware(system_prompt=system_prompt, tool_description=tool_description)


# ThreadDataMiddleware must be before SandboxMiddleware to ensure thread_id is available
# UploadsMiddleware should be after ThreadDataMiddleware to access thread_id
# DanglingToolCallMiddleware patches missing ToolMessages before model sees the history
# SummarizationMiddleware should be early to reduce context before other processing
# TodoListMiddleware should be before ClarificationMiddleware to allow todo management
# TitleMiddleware generates title after first exchange
# MemoryMiddleware queues conversation for memory update (after TitleMiddleware)
# ViewImageMiddleware should be before ClarificationMiddleware to inject image details before LLM
# ToolErrorHandlingMiddleware should be before ClarificationMiddleware to convert tool exceptions to ToolMessages
# ClarificationMiddleware should be last to intercept clarification requests after model calls
def _build_middlewares(config: RunnableConfig, model_name: str | None, agent_name: str | None = None):
    """Build middleware chain based on runtime configuration.

    Args:
        config: Runtime configuration containing configurable options like is_plan_mode.
        agent_name: If provided, MemoryMiddleware will use per-agent memory storage.

    Returns:
        List of middleware instances.
    """
    middlewares = build_lead_runtime_middlewares(lazy_init=True)

    # Add summarization middleware if enabled
    summarization_middleware = _create_summarization_middleware()
    if summarization_middleware is not None:
        middlewares.append(summarization_middleware)

    # Add TodoList middleware if plan mode is enabled
    is_plan_mode = config.get("configurable", {}).get("is_plan_mode", False)
    todo_list_middleware = _create_todo_list_middleware(is_plan_mode)
    if todo_list_middleware is not None:
        middlewares.append(todo_list_middleware)

    # Add TitleMiddleware
    middlewares.append(TitleMiddleware())

    # Add MemoryMiddleware (after TitleMiddleware)
    middlewares.append(MemoryMiddleware(agent_name=agent_name))

    # Add ViewImageMiddleware only if the current model supports vision.
    # Use the resolved runtime model_name from make_lead_agent to avoid stale config values.
    app_config = get_app_config()
    model_config = app_config.get_model_config(model_name) if model_name else None
    if model_config is not None and model_config.supports_vision:
        middlewares.append(ViewImageMiddleware())

    # Add SubagentLimitMiddleware to truncate excess parallel task calls
    subagent_enabled = config.get("configurable", {}).get("subagent_enabled", False)
    if subagent_enabled:
        max_concurrent_subagents = config.get("configurable", {}).get("max_concurrent_subagents", 3)
        middlewares.append(SubagentLimitMiddleware(max_concurrent=max_concurrent_subagents))

    # ClarificationMiddleware should always be last
    middlewares.append(ClarificationMiddleware())
    return middlewares


def make_lead_agent(config: RunnableConfig):
    # Lazy import to avoid circular dependency
    from src.tools import get_available_tools
    from src.tools.builtins import setup_agent

    cfg = config.get("configurable", {})

    thinking_enabled = cfg.get("thinking_enabled", True)
    reasoning_effort = cfg.get("reasoning_effort", None)
    requested_model_name: str | None = cfg.get("model_name") or cfg.get("model")
    is_plan_mode = cfg.get("is_plan_mode", False)
    subagent_enabled = cfg.get("subagent_enabled", False)
    max_concurrent_subagents = cfg.get("max_concurrent_subagents", 3)
    is_bootstrap = cfg.get("is_bootstrap", False)
    agent_name = cfg.get("agent_name")

    agent_config = load_agent_config(agent_name) if not is_bootstrap else None
    # Custom agent model or fallback to global/default model resolution
    agent_model_name = agent_config.model if agent_config and agent_config.model else _resolve_model_name()

    # Final model name resolution with request override, then agent config, then global default
    model_name = requested_model_name or agent_model_name

    app_config = get_app_config()
    model_config = app_config.get_model_config(model_name) if model_name else None

    if model_config is None:
        raise ValueError("No chat model could be resolved. Please configure at least one model in config.yaml or provide a valid 'model_name'/'model' in the request.")
    if thinking_enabled and not model_config.supports_thinking:
        logger.warning(f"Thinking mode is enabled but model '{model_name}' does not support it; fallback to non-thinking mode.")
        thinking_enabled = False

    logger.info(
        "Create Agent(%s) -> thinking_enabled: %s, reasoning_effort: %s, model_name: %s, is_plan_mode: %s, subagent_enabled: %s, max_concurrent_subagents: %s",
        agent_name or "default",
        thinking_enabled,
        reasoning_effort,
        model_name,
        is_plan_mode,
        subagent_enabled,
        max_concurrent_subagents,
    )

    # Inject run metadata for LangSmith trace tagging
    if "metadata" not in config:
        config["metadata"] = {}

    config["metadata"].update(
        {
            "agent_name": agent_name or "default",
            "model_name": model_name or "default",
            "thinking_enabled": thinking_enabled,
            "reasoning_effort": reasoning_effort,
            "is_plan_mode": is_plan_mode,
            "subagent_enabled": subagent_enabled,
        }
    )

    if is_bootstrap:
        # Special bootstrap agent with minimal prompt for initial custom agent creation flow
        system_prompt = apply_prompt_template(subagent_enabled=subagent_enabled, max_concurrent_subagents=max_concurrent_subagents, available_skills=set(["bootstrap"]))

        return create_agent(
            model=create_chat_model(name=model_name, thinking_enabled=thinking_enabled),
            tools=get_available_tools(model_name=model_name, subagent_enabled=subagent_enabled) + [setup_agent],
            middleware=_build_middlewares(config, model_name=model_name),
            system_prompt=system_prompt,
            state_schema=ThreadState,
        )

    # Default lead agent (unchanged behavior)
    return create_agent(
        model=create_chat_model(name=model_name, thinking_enabled=thinking_enabled, reasoning_effort=reasoning_effort),
        tools=get_available_tools(model_name=model_name, groups=agent_config.tool_groups if agent_config else None, subagent_enabled=subagent_enabled),
        middleware=_build_middlewares(config, model_name=model_name, agent_name=agent_name),
        system_prompt=apply_prompt_template(subagent_enabled=subagent_enabled, max_concurrent_subagents=max_concurrent_subagents, agent_name=agent_name),
        state_schema=ThreadState,
    )
