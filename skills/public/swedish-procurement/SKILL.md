---
name: swedish-procurement
description: Använd denna färdighet när användaren frågar om offentlig upphandling, upphandlingsmyndigheten, LOU, LOV, valfrihetssystem, hållbarhetskriterier, upphandlingskriterier, TED, EU-upphandlingar, offentliga affärer, anbudsförfarande, ramavtal, leverantör, offentlig sektor inköp, eller svensk upphandlingsdata.
mcp-servers: [upphandlingsdata]
---

# Svensk offentlig upphandling (Upphandlingsdata MCP v1.0)

## Översikt
Sök i Upphandlingsmyndighetens databaser — webbinnehåll, frågeportal, LOV-annonser, hållbarhetskriterier, samt EU TED (svenska upphandlingar).

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `uhm_overview` | Översikt av alla tillgängliga API:er |
| `uhm_search_website` | Sök på upphandlingsmyndigheten.se |
| `uhm_search_questions` | Sök i Frågeportalen (vanliga upphandlingsfrågor) |
| `uhm_search_lov` | Sök LOV-annonser (valfrihetssystem) |
| `uhm_search_criteria` | Sök hållbarhetskriterier för upphandling |
| `uhm_get_criteria_categories` | Lista alla kriteriekategorier |
| `uhm_search_ted` | Sök EU TED-upphandlingar (svenska) |

## Arbetsflöde

### Generell upphandlingsinformation
1. Använd `uhm_search_website` för att hitta information på webbplatsen
2. Använd `uhm_search_questions` för vanliga frågor och svar

### Hitta affärsmöjligheter
1. Använd `uhm_search_lov` för LOV-annonser (valfrihetssystem)
2. Använd `uhm_search_ted` för EU-upphandlingar (scope: ACTIVE för pågående)

### Hållbar upphandling
1. Använd `uhm_get_criteria_categories` för att lista kategorier
2. Använd `uhm_search_criteria` för specifika hållbarhetskriterier

## Parametrar

### LOV-sökning
- `query`: Sökord
- `region`: Filtrera per region (valfritt)

### Kriteriesökning
- `type`: Kriterium, Kriteriegrupp, eller Produktgrupp

### TED-sökning
- `scope`: ACTIVE (pågående), ARCHIVE (avslutade), ALL (alla)
- `limit`: Max resultat (1-100)

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen.**
3. **Presentera data överskådligt** — använd tabeller
4. **Ange källa**: "Källa: Upphandlingsmyndigheten / EU TED"

## Felsökning
- Tomt resultat: Prova bredare söktermer eller annan scope (TED)
- TED API timeout: EU TED kan vara långsamt — rapportera till användaren
