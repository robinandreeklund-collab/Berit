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
    """Be användaren om förtydligande när du behöver mer information för att fortsätta. Ställ frågan på SVENSKA.

    Använd detta verktyg när du stöter på situationer där du inte kan fortsätta utan användarens input:

    - **Saknad information**: Nödvändiga detaljer har inte angetts (t.ex. filsökvägar, URLer, specifika krav)
    - **Tvetydiga krav**: Flera giltiga tolkningar finns
    - **Val av tillvägagångssätt**: Flera giltiga metoder finns och du behöver användarens preferens
    - **Riskfyllda operationer**: Destruktiva åtgärder som behöver uttrycklig bekräftelse (t.ex. radera filer, ändra produktion)
    - **Förslag**: Du har en rekommendation men vill ha användarens godkännande innan du fortsätter

    Utförandet avbryts och frågan presenteras för användaren.
    Vänta på användarens svar innan du fortsätter.

    När du ska använda ask_clarification:
    - Du behöver information som inte angavs i användarens förfrågan
    - Kravet kan tolkas på flera sätt
    - Flera giltiga implementeringsmetoder finns
    - Du är på väg att utföra en potentiellt farlig operation
    - Du har en rekommendation men behöver användarens godkännande

    Bästa praxis:
    - Ställ EN förtydligande fråga åt gången för tydlighet
    - Var specifik och tydlig i din fråga — på svenska
    - Gör inte antaganden när förtydligande behövs
    - För riskfyllda operationer, be ALLTID om bekräftelse
    - Efter att detta verktyg anropats avbryts utförandet automatiskt

    Args:
        question: Förtydligande frågan att ställa till användaren. Var specifik och tydlig. Skriv på SVENSKA.
        clarification_type: Typ av förtydligande som behövs (missing_info, ambiguous_requirement, approach_choice, risk_confirmation, suggestion).
        context: Valfri kontext som förklarar varför förtydligande behövs. Hjälper användaren förstå situationen. Skriv på SVENSKA.
        options: Valfri lista med alternativ (för approach_choice eller suggestion-typer). Presentera tydliga alternativ på svenska.
    """
    # This is a placeholder implementation
    # The actual logic is handled by ClarificationMiddleware which intercepts this tool call
    # and interrupts execution to present the question to the user
    return "Clarification request processed by middleware"
