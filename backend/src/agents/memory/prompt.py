"""Prompt templates for memory update and injection."""

import math
import re
from typing import Any

try:
    import tiktoken

    TIKTOKEN_AVAILABLE = True
except ImportError:
    TIKTOKEN_AVAILABLE = False

# Prompt template for updating memory based on conversation
MEMORY_UPDATE_PROMPT = """Du är ett minneshanteringssystem. Din uppgift är att analysera en konversation och uppdatera användarens minnesprofil.

KRITISKT VIKTIGT — SPRÅKKRAV:
- ALLA sammanfattningar (summary) MÅSTE skrivas på SVENSKA.
- ALLA fakta (facts) MÅSTE skrivas på SVENSKA.
- Tekniska termer, egennamn och projektnamn behåller sin originalform (t.ex. LangGraph, Python, DeepSeek).
- Om konversationen är på svenska, skriv minnet på svenska.
- Om konversationen är på engelska, skriv ÄNDÅ minnet på svenska.
- SKRIV ALDRIG sammanfattningar eller fakta på engelska.

Nuvarande minnesdata:
<current_memory>
{current_memory}
</current_memory>

Ny konversation att bearbeta:
<conversation>
{conversation}
</conversation>

Instruktioner:
1. Analysera konversationen och identifiera viktig information om användaren
2. Extrahera relevanta fakta, preferenser och kontext med specifika detaljer (siffror, namn, teknologier)
3. Uppdatera minnessektioner vid behov enligt riktlinjerna nedan

Riktlinjer för minnessektioner:

**Användarkontext** (Nuläge — koncisa sammanfattningar PÅ SVENSKA):
- workContext: Yrkesroll, företag, nyckelprojekt, huvudteknologier (2-3 meningar)
  Exempel: "Är huvudutvecklare för Berit-projektet, arbetar med LangGraph och Next.js. Kör lokal LLM via LM Studio med Nemotron."
- personalContext: Språk, kommunikationspreferenser, intressen (1-2 meningar)
  Exempel: "Talar svenska och engelska. Intresserad av AI-agenter och öppen källkod."
- topOfMind: Flera pågående fokusområden och prioriteringar (3-5 meningar, detaljerat stycke)
  Exempel: "Arbetar aktivt med att optimera MCP-verktyg för svenska myndighetsdata. Utforskar parallellt..."
  Inkludera: Aktivt implementeringsarbete, felsökningsproblem, forsknings-/marknadsintressen
  OBS: Fånga FLERA samtidiga fokusområden, inte bara en uppgift

**Historik** (Tidsmässig kontext — utförliga stycken PÅ SVENSKA):
- recentMonths: Detaljerad sammanfattning av senaste aktiviteter (4-6 meningar eller 1-2 stycken)
  Tidsperiod: Senaste 1-3 månaderna
  Inkludera: Utforskade teknologier, projekt, lösta problem, visade intressen
- earlierContext: Viktiga historiska mönster (3-5 meningar eller 1 stycke)
  Tidsperiod: 3-12 månader sedan
  Inkludera: Tidigare projekt, läranderesor, etablerade mönster
- longTermBackground: Bestående bakgrund och grundläggande kontext (2-4 meningar)
  Tidsperiod: Övergripande/fundamental information
  Inkludera: Kärnkompetens, långvariga intressen, grundläggande arbetsstil

**Faktaextraktion** (ALLA fakta PÅ SVENSKA):
- Extrahera specifika, kvantifierbara detaljer (t.ex. "16k+ GitHub-stjärnor", "200+ dataset")
- Inkludera egennamn (företagsnamn, projektnamn, teknologinamn)
- Bevara teknisk terminologi och versionsnummer
- Kategorier:
  * preference: Verktyg, stilar, tillvägagångssätt som användaren föredrar/ogillar
  * knowledge: Specifik expertis, bemästrade teknologier, domänkunskap
  * context: Bakgrundsfakta (jobbtitel, projekt, platser, språk)
  * behavior: Arbetsmönster, kommunikationsvanor, problemlösningsmetoder
  * goal: Uttalade mål, lärandemål, projektambitioner
- Konfidensnivåer:
  * 0.9-1.0: Uttryckligt angivna fakta ("Jag jobbar med X", "Min roll är Y")
  * 0.7-0.8: Starkt antydda från handlingar/diskussioner
  * 0.5-0.6: Härledda mönster (använd sparsamt, bara vid tydliga mönster)

**Vad placeras var**:
- workContext: Nuvarande jobb, aktiva projekt, primär teknikstack
- personalContext: Språk, personlighet, intressen utanför direkt arbete
- topOfMind: Flera pågående prioriteringar och fokusområden (uppdateras oftast)
  Bör fånga 3-5 samtida teman: huvudarbete, sidoutforskningar, bevakning
- recentMonths: Detaljerad redogörelse för senaste tekniska utforskningar och arbete
- earlierContext: Mönster från äldre interaktioner som fortfarande är relevanta
- longTermBackground: Oföränderliga grundläggande fakta om användaren

**Flerspråkigt innehåll**:
- Bevara egennamn och företagsnamn i originalform
- Behåll tekniska termer i sin originalform (DeepSeek, LangGraph, etc.)
- Notera språkförmågor i personalContext

Utdataformat (JSON):
{{
  "user": {{
    "workContext": {{ "summary": "...", "shouldUpdate": true/false }},
    "personalContext": {{ "summary": "...", "shouldUpdate": true/false }},
    "topOfMind": {{ "summary": "...", "shouldUpdate": true/false }}
  }},
  "history": {{
    "recentMonths": {{ "summary": "...", "shouldUpdate": true/false }},
    "earlierContext": {{ "summary": "...", "shouldUpdate": true/false }},
    "longTermBackground": {{ "summary": "...", "shouldUpdate": true/false }}
  }},
  "newFacts": [
    {{ "content": "...", "category": "preference|knowledge|context|behavior|goal", "confidence": 0.0-1.0 }}
  ],
  "factsToRemove": ["fact_id_1", "fact_id_2"]
}}

VIKTIGA REGLER:
- SKRIV ALLA summary-fält och alla content-fält i newFacts PÅ SVENSKA
- Sätt bara shouldUpdate=true om det finns meningsfull ny information
- Följ längdriktlinjerna: workContext/personalContext är koncisa (1-3 meningar), topOfMind och historik är detaljerade (stycken)
- Inkludera specifika mätvärden, versionsnummer och egennamn i fakta
- Lägg bara till fakta som är tydligt angivna (0.9+) eller starkt antydda (0.7+)
- Ta bort fakta som motsägs av ny information
- Vid uppdatering av topOfMind, integrera nya fokusområden och ta bort avslutade/övergivna
  Behåll 3-5 samtida fokusteman som fortfarande är aktiva och relevanta
- För historiksektioner, integrera ny information kronologiskt i rätt tidsperiod
- Bevara teknisk precision — behåll exakta namn på teknologier, företag, projekt
- Fokusera på information som är användbar för framtida interaktioner och personalisering
- VIKTIGT: Spara INTE filuppladdningshändelser i minnet. Uppladdade filer är
  sessionsspecifika och tillfälliga — de kommer inte vara tillgängliga i framtida sessioner.

Returnera ENBART giltig JSON, ingen förklaring eller markdown."""


# Prompt template for extracting facts from a single message
FACT_EXTRACTION_PROMPT = """Extrahera fakta om användaren från detta meddelande. SKRIV ALLA fakta på SVENSKA.

Meddelande:
{message}

Extrahera fakta i detta JSON-format:
{{
  "facts": [
    {{ "content": "...", "category": "preference|knowledge|context|behavior|goal", "confidence": 0.0-1.0 }}
  ]
}}

Kategorier:
- preference: Användarens preferenser (gillar/ogillar, stilar, verktyg)
- knowledge: Användarens expertis eller kunskapsområden
- context: Bakgrundsinformation (plats, jobb, projekt)
- behavior: Beteendemönster
- goal: Användarens mål eller ambitioner

Regler:
- Extrahera bara tydliga, specifika fakta
- Konfidens ska reflektera säkerhet (uttryckligt uttalande = 0.9+, antytt = 0.6-0.8)
- Hoppa över vag eller tillfällig information
- VIKTIGT: Skriv ALLTID content-fältet på SVENSKA (tekniska termer behåller sin engelska form)

Returnera ENBART giltig JSON."""


def _count_tokens(text: str, encoding_name: str = "cl100k_base") -> int:
    """Count tokens in text using tiktoken.

    Args:
        text: The text to count tokens for.
        encoding_name: The encoding to use (default: cl100k_base for GPT-4/3.5).

    Returns:
        The number of tokens in the text.
    """
    if not TIKTOKEN_AVAILABLE:
        # Fallback to character-based estimation if tiktoken is not available
        return len(text) // 4

    try:
        encoding = tiktoken.get_encoding(encoding_name)
        return len(encoding.encode(text))
    except Exception:
        # Fallback to character-based estimation on error
        return len(text) // 4


def _coerce_confidence(value: Any, default: float = 0.0) -> float:
    """Coerce a confidence-like value to a bounded float in [0, 1].

    Non-finite values (NaN, inf, -inf) are treated as invalid and fall back
    to the default before clamping, preventing them from dominating ranking.
    The ``default`` parameter is assumed to be a finite value.
    """
    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return max(0.0, min(1.0, default))
    if not math.isfinite(confidence):
        return max(0.0, min(1.0, default))
    return max(0.0, min(1.0, confidence))


def format_memory_for_injection(memory_data: dict[str, Any], max_tokens: int = 2000) -> str:
    """Format memory data for injection into system prompt.

    Args:
        memory_data: The memory data dictionary.
        max_tokens: Maximum tokens to use (counted via tiktoken for accuracy).

    Returns:
        Formatted memory string for system prompt injection.
    """
    if not memory_data:
        return ""

    sections = []

    # Format user context
    user_data = memory_data.get("user", {})
    if user_data:
        user_sections = []

        work_ctx = user_data.get("workContext", {})
        if work_ctx.get("summary"):
            user_sections.append(f"Arbete: {work_ctx['summary']}")

        personal_ctx = user_data.get("personalContext", {})
        if personal_ctx.get("summary"):
            user_sections.append(f"Personligt: {personal_ctx['summary']}")

        top_of_mind = user_data.get("topOfMind", {})
        if top_of_mind.get("summary"):
            user_sections.append(f"Aktuellt fokus: {top_of_mind['summary']}")

        if user_sections:
            sections.append("Användarkontext:\n" + "\n".join(f"- {s}" for s in user_sections))

    # Format history
    history_data = memory_data.get("history", {})
    if history_data:
        history_sections = []

        recent = history_data.get("recentMonths", {})
        if recent.get("summary"):
            history_sections.append(f"Senaste: {recent['summary']}")

        earlier = history_data.get("earlierContext", {})
        if earlier.get("summary"):
            history_sections.append(f"Tidigare: {earlier['summary']}")

        if history_sections:
            sections.append("Historik:\n" + "\n".join(f"- {s}" for s in history_sections))

    # Format facts (sorted by confidence; include as many as token budget allows)
    facts_data = memory_data.get("facts", [])
    if isinstance(facts_data, list) and facts_data:
        ranked_facts = sorted(
            (
                f
                for f in facts_data
                if isinstance(f, dict)
                and isinstance(f.get("content"), str)
                and f.get("content").strip()
            ),
            key=lambda fact: _coerce_confidence(fact.get("confidence"), default=0.0),
            reverse=True,
        )

        # Compute token count for existing sections once, then account
        # incrementally for each fact line to avoid full-string re-tokenization.
        base_text = "\n\n".join(sections)
        base_tokens = _count_tokens(base_text) if base_text else 0
        # Account for the separator between existing sections and the facts section.
        facts_header = "Facts:\n"
        separator_tokens = _count_tokens("\n\n" + facts_header) if base_text else _count_tokens(facts_header)
        running_tokens = base_tokens + separator_tokens

        fact_lines: list[str] = []
        for fact in ranked_facts:
            content_value = fact.get("content")
            if not isinstance(content_value, str):
                continue
            content = content_value.strip()
            if not content:
                continue
            category = str(fact.get("category", "context")).strip() or "context"
            confidence = _coerce_confidence(fact.get("confidence"), default=0.0)
            line = f"- [{category} | {confidence:.2f}] {content}"

            # Each additional line is preceded by a newline (except the first).
            line_text = ("\n" + line) if fact_lines else line
            line_tokens = _count_tokens(line_text)

            if running_tokens + line_tokens <= max_tokens:
                fact_lines.append(line)
                running_tokens += line_tokens
            else:
                break

        if fact_lines:
            sections.append("Fakta:\n" + "\n".join(fact_lines))

    if not sections:
        return ""

    result = "\n\n".join(sections)

    # Use accurate token counting with tiktoken
    token_count = _count_tokens(result)
    if token_count > max_tokens:
        # Truncate to fit within token limit
        # Estimate characters to remove based on token ratio
        char_per_token = len(result) / token_count
        target_chars = int(max_tokens * char_per_token * 0.95)  # 95% to leave margin
        result = result[:target_chars] + "\n..."

    return result


def format_conversation_for_update(messages: list[Any]) -> str:
    """Format conversation messages for memory update prompt.

    Args:
        messages: List of conversation messages.

    Returns:
        Formatted conversation string.
    """
    lines = []
    for msg in messages:
        role = getattr(msg, "type", "unknown")
        content = getattr(msg, "content", str(msg))

        # Handle content that might be a list (multimodal)
        if isinstance(content, list):
            text_parts = [p.get("text", "") for p in content if isinstance(p, dict) and "text" in p]
            content = " ".join(text_parts) if text_parts else str(content)

        # Strip uploaded_files tags from human messages to avoid persisting
        # ephemeral file path info into long-term memory.  Skip the turn entirely
        # when nothing remains after stripping (upload-only message).
        if role == "human":
            content = re.sub(r"<uploaded_files>[\s\S]*?</uploaded_files>\n*", "", str(content)).strip()
            if not content:
                continue

        # Truncate very long messages
        if len(str(content)) > 1000:
            content = str(content)[:1000] + "..."

        if role == "human":
            lines.append(f"User: {content}")
        elif role == "ai":
            lines.append(f"Assistant: {content}")

    return "\n\n".join(lines)
