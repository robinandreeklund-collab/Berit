# Fullständig Analys: Skills & Tools i Berit

**Datum:** 2026-03-16
**Syfte:** Förstå exakt hur skills och MCP-verktyg fungerar, identifiera prestandaflaskhalsar, och föreslå optimeringar.

---

## Innehåll

1. [Sammanfattning & Huvudproblemet](#1-sammanfattning--huvudproblemet)
2. [Hur Skills Fungerar](#2-hur-skills-fungerar)
3. [Hur MCP-verktyg Fungerar](#3-hur-mcp-verktyg-fungerar)
4. [Hur Allt Binds Till Agenten](#4-hur-allt-binds-till-agenten)
5. [Exakt Vad LLM:en Får](#5-exakt-vad-llmen-får)
6. [Prestandaanalys & Flaskhalsar](#6-prestandaanalys--flaskhalsar)
7. [Skill.md — Gör De Verkligen Nytta?](#7-skillmd--gör-de-verkligen-nytta)
8. [Optimeringsförslag](#8-optimeringsförslag)
9. [Arkitekturdiagram](#9-arkitekturdiagram)

---

## 1. Sammanfattning & Huvudproblemet

### Din Uppfattning vs Verkligheten

Du antog att `SKILL.md`-filer fungerar som **korta beskrivningar** som låter modellen välja rätt verktyg utan att hela verktygskatalogen behöver laddas. **Det stämmer delvis, men inte på det sätt som löser prestandaproblemet.**

**Verkligheten:**

| Komponent | Vad som händer | Påverkar prestanda? |
|-----------|---------------|---------------------|
| **SKILL.md description** (metadata) | Injiceras i systemprompt som kort text (~50-100 ord per skill) | Minimalt (tokens) |
| **SKILL.md body** (instruktioner) | Laddas **on-demand** via `read_file` — bara om modellen väljer att använda den | Nej |
| **MCP tool-definitioner** (JSON schemas) | **ALLTID laddade, ALLA skickas till varje LLM-anrop** | **JA — DETTA ÄR PROBLEMET** |

### Rotorsaken

**Alla aktiverade MCP-verktyg skickas som tool-schemas i VARJE API-anrop till LM Studio.** Det finns ingen filtrering, lazy-loading eller smart routing av verktyg per fråga. Med 21 aktiverade MCP-servrar och ~250+ verktyg skickas **samtliga** tool-definitioner i varje request.

---

## 2. Hur Skills Fungerar

### 2.1 Övergripande Flöde

```
skills/public/                    extensions_config.json
  ├── swedish-statistics/           {"skills": {
  │   └── SKILL.md         ←─────    "swedish-statistics": {"enabled": true}
  ├── web-browsing/               }}
  │   └── SKILL.md
  └── ... (39 skills totalt)

        ↓ load_skills(enabled_only=True)

   Systemprompt injiceras med:
   <skill_system>
     <available_skills>
       <skill>
         <name>swedish-statistics</name>
         <description>Kort trigger-beskrivning...</description>
         <location>/mnt/skills/public/swedish-statistics/SKILL.md</location>
       </skill>
       ... (alla aktiverade skills)
     </available_skills>
   </skill_system>
```

### 2.2 Discovery & Laddning

**Fil:** `backend/src/skills/loader.py`

1. Rekursiv scanning av `skills/public/` och `skills/custom/`
2. Hittar `SKILL.md`-filer, parsar YAML frontmatter (namn, description)
3. Korsrefererar med `extensions_config.json` för enabled-status
4. Returnerar lista av `Skill`-objekt

**Nyckelkod:**
```python
def load_skills(enabled_only: bool = True) -> list[Skill]:
    # Walkar skills/public/ och skills/custom/
    # Parsar SKILL.md frontmatter
    # Filtrerar på enabled_only
```

### 2.3 Vad Finns i en SKILL.md

**Frontmatter (alltid laddad):**
```yaml
---
name: swedish-statistics
description: Använd denna färdighet när användaren frågar om svensk statistik,
  befolkning, SCB, ekonomi, arbetsmarknad, demografi, BNP, export, import...
---
```

**Body (laddas on-demand av modellen):**
- Workflow-instruktioner
- Vilka MCP-verktyg som finns och hur de ska användas
- Exempel, parametrar, tips

### 2.4 Nuvarande 39 Skills

| Skill | Beskrivnings-storlek | Kopplad MCP |
|-------|---------------------|-------------|
| avanza-market | 405 chars | avanza (34 tools) |
| blocket-tradera | 397 chars | blocket-tradera (10 tools) |
| bootstrap | 475 chars | — |
| chart-visualization | 231 chars | — |
| consulting-analysis | 1473 chars | — |
| data-analysis | 345 chars | — |
| deep-research | 378 chars | — |
| find-skills | 321 chars | — |
| frontend-design | 456 chars | — |
| google-maps | 387 chars | google-maps (13 tools) |
| image-generation | 240 chars | — |
| oecd-statistics | 441 chars | oecd (9 tools) |
| pdf-generation | 295 chars | — |
| podcast-generation | 215 chars | — |
| ppt-generation | 218 chars | — |
| skill-creator | 1762 chars | — |
| swedish-companies | 729 chars | bolagsverket (6 tools) |
| swedish-crisis-info | 479 chars | krisinformation (2 tools) |
| swedish-economy | 498 chars | riksbank (8 tools) |
| swedish-education | 400 chars | skolverket (87 tools) |
| swedish-electricity | 588 chars | elpris (4 tools) |
| swedish-library | 389 chars | kb (10 tools) |
| swedish-municipality-stats | 437 chars | kolada (10 tools) |
| swedish-nature-protection | 369 chars | nvv (8 tools) |
| swedish-parliament | 521 chars | riksdag (15 tools) |
| swedish-police-events | 461 chars | polisen (1 tool) |
| swedish-procurement | 334 chars | upphandlingsdata (7 tools) |
| swedish-statistics | 428 chars | scb (7 tools) |
| swedish-tourism | 571 chars | visitsweden (4 tools) |
| swedish-traffic | 461 chars | trafikverket (22 tools) |
| swedish-transport-statistics | 350 chars | trafikanalys (8 tools) |
| swedish-weather | 527 chars | smhi (10 tools) |
| web-browsing | 455 chars | lightpanda (12 tools) |
| ... (övriga utan MCP) | | |

### 2.5 Progressiv Laddning av Skills — Fungerar Bra

Skills-systemets progressiva laddning fungerar som tänkt:

1. **Alltid i prompt:** Namn + description (~50-100 ord per skill × 39 = ~2000-4000 tokens)
2. **On-demand:** Body laddas via `read_file` bara om modellen matchar en skill
3. **Djupare resurser:** References, scripts etc. laddas bara om SKILL.md refererar till dem

**Slutsats: Skills-systemet är INTE problemet.** Det kostar ~2000-4000 tokens i systemprompt, vilket är hanterbart.

---

## 3. Hur MCP-verktyg Fungerar

### 3.1 Startflöde

**Fil:** `backend/src/mcp/cache.py`

```
Server startar
    ↓
start_background_initialization()         ← Anropas vid import av agents/
    ↓
Skapar daemon-tråd "mcp-init"
    ↓
asyncio.gather(*[                         ← Alla servrar parallellt
    _load_tools_from_server("scb", ...),
    _load_tools_from_server("skolverket", ...),
    _load_tools_from_server("lightpanda", ...),
    ... (21 servrar)
])
    ↓
Alla tools cachas i _mcp_tools_cache      ← ~250+ BaseTool-objekt
```

### 3.2 Tool-laddning Per Server

**Fil:** `backend/src/mcp/tools.py`

- Varje server kontaktas via HTTP (`MultiServerMCPClient`)
- Returnerar en lista av `BaseTool`-objekt med JSON schemas
- HTTP-servrar har 3 retries med exponentiell backoff (5s, 10s, 20s)
- Om en server misslyckas, fortsätter övriga (graceful degradation)
- Tool-scheman saniteras (beskrivningar fixas för LM Studio)

### 3.3 Cache-mekanismen

```python
# Globala variabler i cache.py:
_mcp_tools_cache: list[BaseTool] | None = None
_cache_initialized = False
_config_mtime: float | None = None

# Cache invalideras om:
# 1. extensions_config.json ändras (mtime-kontroll)
# 2. Explicit reset via reset_mcp_tools_cache()
```

**Viktigt:** Cachen gäller hela tool-listan. Det finns **ingen per-server** eller **per-fråga** caching/filtrering.

### 3.4 Vad Som Faktiskt Skickas Till LLM

**Fil:** `backend/src/tools/tools.py` — `get_available_tools()`

```python
def get_available_tools(...) -> list[BaseTool]:
    # 1. Config tools (bash, read_file, write_file, ls, str_replace, image_search)
    loaded_tools = [resolve_variable(tool.use) for tool in config.tools]

    # 2. MCP tools — ALLA CACHAS, ALLA RETURNERAS
    mcp_tools = get_cached_mcp_tools()  # ← ~250+ verktyg, INGA filter

    # 3. Built-in tools
    builtin_tools = [present_file, ask_clarification]

    return loaded_tools + builtin_tools + mcp_tools  # ALLT
```

### 3.5 Tool-bindning Till Modellen

**Fil:** `backend/src/agents/lead_agent/agent.py`

```python
tools = get_available_tools(...)  # ~260 verktyg
agent = create_agent(
    model=create_chat_model(...),
    tools=tools,                   # ← ALLA 260 verktyg binds
    ...
)
```

**Fil:** `backend/src/models/sanitized_openai.py`

Varje LLM-anrop skickar ALLA verktyg som JSON-schemas:

```python
class SanitizedChatOpenAI(ChatOpenAI):
    def _get_request_payload(self, input_, **kwargs):
        payload = super()._get_request_payload(input_, **kwargs)
        if "tools" in payload:
            _sanitize_tools(payload["tools"])  # Fixar descriptions
        return payload
        # payload["tools"] innehåller ~260 tool-schemas
```

---

## 4. Hur Allt Binds Till Agenten

### 4.1 Komplett Request-flöde

```
Användarfråga: "Hur många bor i Stockholm?"
                    ↓
    ┌──────────────────────────────────────┐
    │          make_lead_agent()           │
    │                                      │
    │  1. Ladda config                     │
    │  2. get_available_tools()            │
    │     ├─ 6 config tools                │
    │     ├─ 2 built-in tools              │
    │     └─ ~250 MCP tools   ← ALLA      │
    │                                      │
    │  3. apply_prompt_template()          │
    │     ├─ System prompt (~2000 tok)     │
    │     ├─ Memory (~2000 tok max)        │
    │     ├─ Skills listing (~3000 tok)    │
    │     └─ SOUL.md (~500 tok)            │
    │                                      │
    │  4. create_agent(tools=258 verktyg)  │
    └──────────────────────────────────────┘
                    ↓
    ┌──────────────────────────────────────┐
    │    POST till LM Studio /v1/chat      │
    │                                      │
    │  {                                   │
    │    "model": "nemotron-3-nano",       │
    │    "messages": [                     │
    │      {"role": "system", "content":   │
    │        "...(~7500 tokens)..."},      │
    │      {"role": "user", "content":     │
    │        "Hur många bor i Stockholm?"} │
    │    ],                                │
    │    "tools": [                        │
    │      // ~258 tool-definitioner       │
    │      // varje ~50-200 tokens         │
    │      // TOTALT: ~15,000-50,000 tok   │  ← HÄR ÄR PROBLEMET
    │    ],                                │
    │    "max_tokens": 4096                │
    │  }                                   │
    └──────────────────────────────────────┘
```

### 4.2 Token-budget

**Nemotron 3 Nano kontextfönster:** begränsat

| Komponent | Ungefärliga tokens | Notering |
|-----------|-------------------|----------|
| System prompt + soul + memory | ~5,000-7,500 | Relativt konstant |
| Skills-listan (39 skills × namn+beskrivning) | ~2,000-4,000 | Metadata, inte hela SKILL.md |
| **Tool-schemas (258 verktyg)** | **~15,000-50,000** | **VARJE VERKTYG ~ 60-200 tokens** |
| Användarmeddelande | ~50-500 | Varierar |
| Konversationshistorik | Resten | Komprimeras vid behov |

**Matematiken:**
- Skolverket ensam: 87 verktyg × ~100 tokens per schema = **~8,700 tokens bara för Skolverket**
- Avanza: 34 verktyg × ~100 tokens = **~3,400 tokens**
- Alla 250+ verktyg: **~25,000-50,000 tokens**

**Summarization triggar vid 15,564 tokens.** Med alla tools aktiverade är du redan ÖVER den gränsen bara i tool-schemas, innan användaren ens har skickat ett meddelande.

---

## 5. Exakt Vad LLM:en Får

### 5.1 Systempromptens Struktur

```xml
<role>You are DeerFlow 2.0, an open-source super agent.</role>

<output_language>SWEDISH</output_language>

<soul>...</soul>                          ← Agent-personlighet (om den finns)
<memory>...</memory>                      ← Minnesfakta (max 2000 tokens)

<thinking_style>...</thinking_style>      ← Tänkandeinstruktioner
<clarification_system>...</clarification_system>

<skill_system>                            ← SKILL METADATA
  <available_skills>
    <skill>
      <name>swedish-statistics</name>
      <description>428 chars av trigger-text</description>
      <location>/mnt/skills/public/swedish-statistics/SKILL.md</location>
    </skill>
    ... × 39 skills
  </available_skills>
</skill_system>

<working_directory>...</working_directory>
<response_style>...</response_style>
<citations>...</citations>
<critical_reminders>...</critical_reminders>
<current_datetime>2026-03-16 14:30 (söndag)</current_datetime>
```

### 5.2 Tool-schemas (Skickas Separat, Inte i Prompt)

Tool-schemas skickas INTE i `messages`-arrayen utan i `tools`-arrayen i API-anropet. Men de konsumerar fortfarande kontext-tokens hos LLM:en:

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "scb_browse",
        "description": "Navigate SCB subject tree...",
        "parameters": {
          "type": "object",
          "properties": {
            "subjectCode": {"type": "string", "description": "..."},
            "includeMetadata": {"type": "boolean", "description": "..."}
          }
        }
      }
    },
    // ... × 258 verktyg
  ]
}
```

---

## 6. Prestandaanalys & Flaskhalsar

### 6.1 Flaskhals #1: Token-kostnad för Tool-schemas (KRITISK)

**Problem:** Varje API-anrop till LLM Studio inkluderar alla ~258 tool-schemas.

**Påverkan:**
- **Latens:** Mer tokens att bearbeta = längre svarstider
- **Kvalitet:** Med 250+ verktyg har en liten lokal modell (Nemotron 3 Nano) svårt att välja rätt
- **Kontext:** Tool-schemas äter upp kontextfönstret, lämnar mindre plats för konversation
- **Skolverket:** 87 verktyg ensamt tar ~8,700 tokens. Fråga dig: behöver ALLA 87 verktyg vara tillgängliga för varje fråga?

**Varför det går snabbt med få tools:** Med t.ex. 3 MCP-servrar (20 verktyg) skickas bara ~2,000 tokens i tool-schemas. Modellen har gott om kontext och kan snabbt identifiera rätt verktyg.

### 6.2 Flaskhals #2: Ingen Tool-filtrering (KRITISK)

**Problem:** `get_available_tools()` returnerar ALLA MCP-verktyg oavsett fråga.

**Nuvarande kod:**
```python
def get_available_tools(groups=None, include_mcp=True, ...):
    mcp_tools = get_cached_mcp_tools()  # ALLA verktyg, inga filter
    return loaded_tools + builtin_tools + mcp_tools
```

Det finns ett `tool_groups`-system för config-tools (bash, file:read etc.), men **MCP-verktyg har inga grupper och filtreras aldrig**.

### 6.3 Flaskhals #3: MCP Tool-laddning (Sekundär)

**Problem:** Initial laddning av 21 servrar tar 5-60 sekunder.

**Men:** Background-init löser detta — tools cachas efter första laddningen. Inte den primära flaskhalsen för runtime-prestanda.

### 6.4 Flaskhals #4: Skill-descriptions Brus (Mindre)

**Problem:** 39 skills × ~100 ord = ~3,000-4,000 tokens av skill-metadata.

**Men:** Jämfört med 25,000-50,000 tokens för tool-schemas är detta försumbart.

### 6.5 Kvantitativ Jämförelse

| Scenario | Antal tools | Tool-token-kostnad | Upplevd hastighet |
|----------|-------------|-------------------|--------------------|
| **Alla MCP av** | ~8 (config + built-in) | ~800 tokens | Supersnabbt |
| **3 MCP-servrar** | ~30 | ~3,000 tokens | Snabbt |
| **10 MCP-servrar** | ~100 | ~10,000 tokens | Märkbart långsammare |
| **Alla 21 servrar** | ~258 | ~25,000-50,000 tokens | Betydligt långsammare |

---

## 7. Skill.md — Gör De Verkligen Nytta?

### 7.1 Vad Skills GÖR

1. **Trigger-routing:** Descriptions i systemprompt hjälper modellen välja rätt arbetsflöde
2. **Workflow-dokumentation:** SKILL.md body ger steg-för-steg instruktioner
3. **Best practices:** Tips om caching, max antal anrop, etc.

### 7.2 Vad Skills INTE Gör

1. **Filtrerar INTE verktyg:** Skills beskriver vilka MCP-verktyg som finns, men alla tools skickas ändå
2. **Minskar INTE token-kostnad:** Tool-schemas skickas oavsett om skill lästs eller ej
3. **Routar INTE dynamiskt:** Modellen får alla 258 verktyg även om den bara behöver 7 (SCB)

### 7.3 Gapet Mellan Design och Verklighet

**Designtanken (implicit):**
> "SKILL.md beskriver verktygen kort → modellen läser SKILL.md → modellen vet vilka verktyg som finns → vi behöver inte skicka alla tool-schemas"

**Verkligheten:**
> "SKILL.md laddas on-demand ✓ MEN alla MCP tool-schemas skickas ALLTID ✗"

Skills ger värde som **workflow-dokumentation**, men de löser inte prestandaproblemet med för många tool-schemas.

### 7.4 `allowed-tools` i SKILL.md — Oanvänt Potential

SKILL.md-specifikationen stödjer ett `allowed-tools`-fält i frontmatter:

```yaml
---
name: swedish-statistics
description: ...
allowed-tools:
  - scb_browse
  - scb_fetch
  - scb_find_region_code
---
```

**Men detta fält parsas och lagras, men ANVÄNDS ALDRIG för att filtrera verktyg.** Det finns ingen kod som kopplar `allowed-tools` till `get_available_tools()`.

---

## 8. Optimeringsförslag

### 8.1 Strategi A: Dynamisk Tool-routing (Största Påverkan)

**Idé:** Använd skill-matchning för att filtrera vilka MCP-verktyg som skickas till LLM.

**Flöde:**
```
Användarfråga: "Hur många bor i Stockholm?"
    ↓
Steg 1: Snabb skill-matchning (LLM eller regelbaserad)
    → Matchar: "swedish-statistics"
    ↓
Steg 2: Läs skill.allowed-tools
    → ["scb_browse", "scb_fetch", "scb_find_region_code", ...]
    ↓
Steg 3: Filtrera MCP-tools till bara dessa
    → 7 tools istället för 258
    ↓
Steg 4: Skicka till LLM med bara relevanta tools
    → ~700 tokens istället för ~25,000
```

**Implementering:**
1. Gör `allowed-tools` obligatorisk i alla MCP-kopplade skills
2. Lägg till en "router"-nod i LangGraph-grafen före huvudagenten
3. Routern matchar fråga → skill(s) → extraherar `allowed-tools`
4. Filtrera `mcp_tools` i `get_available_tools()` baserat på matchade tools

**Token-besparing:** ~90-95%
**Implementeringskomplexitet:** Medel

### 8.2 Strategi B: MCP-server-grupper (Medelstor Påverkan)

**Idé:** Gruppera MCP-servrar och ladda per grupp istället för alla.

**Implementation:**
```json
// extensions_config.json
{
  "mcpServers": {
    "scb": {
      "enabled": true,
      "group": "swedish-data",
      ...
    },
    "skolverket": {
      "enabled": true,
      "group": "swedish-education",
      ...
    }
  }
}
```

**Flöde:**
1. Skill `swedish-statistics` → mappar till grupp `swedish-data`
2. Skill `swedish-education` → mappar till grupp `swedish-education`
3. Vid routing: ladda bara tools från matchade grupper

**Token-besparing:** ~80-90%

### 8.3 Strategi C: Två-stegs-modell (Enklast att Implementera)

**Idé:** Första LLM-anrop utan MCP-tools (bara skills). Andra anrop med rätt tools.

**Flöde:**
```
Steg 1: LLM med skills + config tools (inga MCP)
    → Modellen väljer skill + anropar read_file(SKILL.md)
    → SKILL.md listar vilka tools som behövs

Steg 2: LLM med bara matchade MCP tools
    → Utför arbetet med rätt verktyg
```

**Token-besparing:** ~90% (steg 1 är lätt, steg 2 har bara relevanta tools)
**Implementeringskomplexitet:** Medel-Hög (kräver ändring i LangGraph-grafen)

### 8.4 Strategi D: Tool-schema-komprimering (Snabb Fix)

**Idé:** Minska storleken på tool-schemas som skickas.

**Metoder:**
1. Korta ner tool-descriptions
2. Ta bort onödiga JSON-schemafält
3. Slå ihop relaterade tools (t.ex. Skolverkets 87 → 10 aggregerade)

**Token-besparing:** ~30-50%
**Implementeringskomplexitet:** Låg

### 8.5 Strategi E: Aktivera/Avaktivera Baserat på Skill-matchning (Snabbast att Implementera)

**Idé:** Koppla MCP-server enabled-status till skill-matchning.

**Implementation:**
1. Starta med ALLA MCP-servrar disabled
2. Skill-matchning aktiverar relevanta servrar
3. Nästa LLM-anrop har bara rätt tools

**Nackdel:** Kräver server-restart/cache-reset per fråga

### 8.6 Prioriterad Rekommendation

| Prioritet | Strategi | Påverkan | Komplexitet | Rekommendation |
|-----------|----------|----------|-------------|----------------|
| **1** | **A: Dynamisk tool-routing** | Mycket hög | Medel | **Implementera först** |
| **2** | **D: Schema-komprimering** | Medel | Låg | Komplement till A |
| **3** | **B: Server-grupper** | Hög | Medel | Om A inte räcker |
| **4** | **C: Två-stegs-modell** | Mycket hög | Hög | Mest komplett men störst ändring |

---

## 9. Arkitekturdiagram

### 9.1 Nuvarande Flöde (Problemet)

```
┌─────────────────┐
│  Användarfråga   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│           make_lead_agent()                  │
│                                              │
│  get_available_tools()                       │
│    ├── config tools (6)                      │
│    ├── built-in tools (2-4)                  │
│    └── get_cached_mcp_tools()                │
│         └── ALLA 250+ tools ◄── PROBLEMET    │
│                                              │
│  apply_prompt_template()                     │
│    └── skills_section (39 skills metadata)   │
│                                              │
│  create_agent(tools=258)                     │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  POST /v1/chat/completions (LM Studio)      │
│                                              │
│  messages: [...] (~7,500 tokens)             │
│  tools: [258 schemas] (~25,000-50,000 tok)   │
│                                              │
│  TOTAL INPUT: ~35,000-60,000 tokens          │
│  ← Nemotron 3 Nano kämpaar med detta        │
└─────────────────────────────────────────────┘
```

### 9.2 Önskat Flöde (Med Tool-routing)

```
┌─────────────────┐
│  Användarfråga   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  STEG 1: Skill Router           │
│  (Lättvikts LLM-anrop eller     │
│   regelbaserad matchning)        │
│                                  │
│  Input: fråga + skill-lista      │
│  Output: matchade skills         │
│    → "swedish-statistics"        │
│                                  │
│  Extrahera allowed-tools:        │
│    → [scb_browse, scb_fetch, ..] │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  STEG 2: Filtrera Tools          │
│                                  │
│  config tools (6)                │
│  + built-in tools (2-4)          │
│  + FILTRERADE MCP tools (7)      │
│  = ~15 verktyg                   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  POST /v1/chat/completions       │
│                                  │
│  messages: [...] (~7,500 tok)    │
│  tools: [15 schemas] (~1,500)    │
│                                  │
│  TOTAL: ~9,000 tokens            │
│  ← Nemotron 3 Nano klarar det   │
│     snabbt och precist           │
└─────────────────────────────────┘
```

### 9.3 Dataflöde: Skill vs Tool

```
                    SKILL SYSTEM                          TOOL SYSTEM
                    (Workflow docs)                        (Execution)

    ┌──────────────────────┐          ┌──────────────────────────────┐
    │                      │          │                              │
    │  SKILL.md metadata   │          │  MCP Server (Docker)         │
    │  ┌──────────────┐    │          │  ┌────────────────────┐      │
    │  │ name          │    │          │  │ scb_browse()       │      │
    │  │ description   │◄───┼──────────┼──│ scb_fetch()        │      │
    │  │ allowed-tools │    │  Borde   │  │ scb_find_region()  │      │
    │  └──────────────┘    │  filtrera │  │ ...                │      │
    │                      │          │  └────────────────────┘      │
    │  SKILL.md body       │          │                              │
    │  (on-demand via      │          │  Tool-schemas (JSON)         │
    │   read_file)         │          │  Skickas ALLTID till LLM     │
    │  ┌──────────────┐    │          │  ┌────────────────────┐      │
    │  │ Workflow      │    │          │  │ {"name": "scb_...",│      │
    │  │ Examples      │    │          │  │  "parameters":{..}}│      │
    │  │ Best practices│    │          │  └────────────────────┘      │
    │  └──────────────┘    │          │                              │
    └──────────────────────┘          └──────────────────────────────┘

    Injiceras i system prompt         Injiceras i tools-arrayen
    ~100 tokens per skill             ~60-200 tokens per tool
    39 skills = ~3,000 tok            258 tools = ~25,000-50,000 tok

                     ▲                              ▲
                     │                              │
                 INTE problemet               DETTA ÄR PROBLEMET
```

---

## Slutsats

**Problemet är inte skills — det är att ALLA MCP tool-schemas skickas till VARJE LLM-anrop.**

Skills-systemet med progressiv laddning är väldesignat. Metadata (namn + description) kostar lite kontext, och body laddas bara vid behov. Men tool-schemas saknar helt routing/filtrering — alla ~258 verktyg skickas varje gång, oavsett fråga.

**Lösningen:** Koppla ihop skill-systemets matchning med tool-filtrering. Skills har redan `allowed-tools`-fältet i sin spec — det behöver bara implementeras.

**Estimerad förbättring:**
- Nuvarande: ~35,000-60,000 input tokens per anrop
- Med tool-routing: ~9,000-12,000 input tokens per anrop
- **~75-85% minskning i input-tokens = drastiskt snabbare svarstider**
