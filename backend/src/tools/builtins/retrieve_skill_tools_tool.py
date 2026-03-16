"""Tool for retrieving MCP tools associated with a specific skill."""

import logging

from langchain.tools import tool
from langgraph.types import Command

from src.mcp.cache import get_cached_mcp_tools_by_server, get_tools_for_servers
from src.skills.loader import load_skills

logger = logging.getLogger(__name__)


def _get_skill_server_mapping() -> dict[str, str]:
    """Build mapping from skill name to MCP server name.

    Returns:
        Dict mapping skill name to MCP server name (only for skills with mcp_server set).
    """
    skills = load_skills(enabled_only=True)
    return {skill.name: skill.mcp_server for skill in skills if skill.mcp_server}


@tool("retrieve_skill_tools", parse_docstring=True)
def retrieve_skill_tools_tool(skill_name: str) -> Command:
    """Hämta MCP-verktyg för en specifik skill. Anropa detta INNAN du använder MCP-verktyg.

    När du identifierar att en fråga kräver en specifik skill (t.ex. swedish-weather för väderfrågor),
    anropa detta verktyg FÖRST för att aktivera rätt MCP-verktyg. Efter aktivering kan du använda
    de returnerade verktygen direkt.

    Args:
        skill_name: Namnet på den skill vars MCP-verktyg ska hämtas (t.ex. "swedish-weather", "swedish-economy").
    """
    # Try skill name → server mapping first
    skill_to_server = _get_skill_server_mapping()
    server_name = skill_to_server.get(skill_name)

    # If not found as skill, try as direct MCP server name
    if server_name is None:
        available_servers = get_cached_mcp_tools_by_server()
        if skill_name in available_servers:
            server_name = skill_name
        else:
            available_skills = sorted(skill_to_server.keys())
            available_server_names = sorted(available_servers.keys())
            return Command(
                update={
                    "messages": [{
                        "role": "tool",
                        "content": f"Fel: Skill '{skill_name}' hittades inte. Tillgängliga skills med MCP-verktyg: {available_skills}. Tillgängliga MCP-servrar: {available_server_names}",
                    }],
                },
            )

    # Get tools for the server
    tools = get_tools_for_servers([server_name])
    tool_names = [t.name for t in tools]

    if not tool_names:
        return Command(
            update={
                "messages": [{
                    "role": "tool",
                    "content": f"MCP-server '{server_name}' har inga laddade verktyg. Servern kanske inte är igång.",
                }],
            },
        )

    logger.info(f"Retrieved {len(tool_names)} tool(s) from MCP server '{server_name}' for skill '{skill_name}': {tool_names}")

    return Command(
        update={
            "active_mcp_servers": [server_name],
            "messages": [{
                "role": "tool",
                "name": "retrieve_skill_tools",
                "content": f"Aktiverade {len(tool_names)} verktyg från {server_name}: {', '.join(tool_names)}. Du kan nu använda dessa verktyg.",
            }],
        },
    )
