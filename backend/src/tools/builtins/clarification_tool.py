from typing import Literal

from langchain.tools import tool


@tool("ask_clarification", parse_docstring=True, return_direct=True)
def ask_clarification_tool(
    question: str,
    clarification_type: Literal[
        "missing_info",
        "ambiguous_requirement",
        "approach_choice",
        "risk_confirmation",
        "suggestion",
    ],
    context: str | None = None,
    options: list[str] | None = None,
) -> str:
    """Ask the user for clarification when you need more information to proceed. Write the question in SWEDISH.

    Use this tool when you encounter situations where you cannot proceed without user input:

    - **Missing information**: Required details have not been specified (e.g. file paths, URLs, specific requirements)
    - **Ambiguous requirements**: Multiple valid interpretations exist
    - **Approach choice**: Multiple valid methods exist and you need the user's preference
    - **Risky operations**: Destructive actions that need explicit confirmation (e.g. delete files, modify production)
    - **Suggestions**: You have a recommendation but want the user's approval before proceeding

    Execution is interrupted and the question is presented to the user.
    Wait for the user's response before continuing.

    When to use ask_clarification:
    - You need information that was not specified in the user's request
    - The requirement can be interpreted in multiple ways
    - Multiple valid implementation methods exist
    - You are about to perform a potentially dangerous operation
    - You have a recommendation but need the user's approval

    Best practices:
    - Ask ONE clarification question at a time for clarity
    - Be specific and clear in your question — write in Swedish
    - Do not make assumptions when clarification is needed
    - For risky operations, ALWAYS ask for confirmation
    - After this tool is called, execution is automatically interrupted

    Args:
        question: The clarification question to ask the user. Be specific and clear. Write in SWEDISH.
        clarification_type: Type of clarification needed (missing_info, ambiguous_requirement, approach_choice, risk_confirmation, suggestion).
        context: Optional context explaining why clarification is needed. Helps the user understand the situation. Write in SWEDISH.
        options: Optional list of alternatives (for approach_choice or suggestion types). Present clear options in Swedish.
    """
    # This is a placeholder implementation
    # The actual logic is handled by ClarificationMiddleware which intercepts this tool call
    # and interrupts execution to present the question to the user
    return "Clarification request processed by middleware"
