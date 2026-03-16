---
name: swedish-library
description: Använd denna färdighet när användaren frågar om svenska böcker, bibliotek, Libris, Kungliga Biblioteket, KB, bokssökning, författare, ISBN, kulturarv, K-samsök, kulturarvsdata, museiföremål, runstenar, fotografier, historiska objekt, Swepub, forskningspublikationer, akademiska artiklar, avhandlingar, svenska universitet, bibliografi, eller svenskt kulturarv.
mcp-servers: [kb]
---

# Svenska bibliotek & kulturarv (KB MCP v1.0)

## Översikt
Sök i Kungliga Bibliotekets databaser — Libris (20M+ böcker/tidskrifter), K-samsök (10M+ kulturarvsföremål från 83 institutioner), och Swepub (2M+ forskningspublikationer).

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `kb_libris_search` | Fritextsökning i Libris (böcker, tidskrifter, e-resurser) |
| `kb_libris_search_author` | Sök efter författare |
| `kb_libris_search_title` | Sök efter titel |
| `kb_libris_search_isbn` | Sök efter ISBN |
| `kb_libris_find` | Avancerad sökning med operatorer (AND, OR, fält:värde) |
| `kb_libris_holdings` | Vilka bibliotek har boken? (ange post-ID) |
| `kb_ksamsok_search` | Sök kulturarvsföremål i K-samsök |
| `kb_ksamsok_search_location` | Geografisk sökning (län/kommun) |
| `kb_ksamsok_get_object` | Hämta specifikt kulturarvsföremål |
| `kb_swepub_search` | Sök svenska forskningspublikationer |

## Arbetsflöde

### Boksökning
1. Börja med `kb_libris_search` för fritextsökning
2. Använd `kb_libris_search_author` eller `kb_libris_search_title` för mer specifika sökningar
3. Använd `kb_libris_holdings` för att se vilka bibliotek som har boken

### Kulturarvssökning
1. Använd `kb_ksamsok_search` för generell sökning
2. Använd `kb_ksamsok_search_location` för att hitta objekt i ett visst län/kommun
3. Använd `kb_ksamsok_get_object` för detaljerad information om ett specifikt objekt

### Forskningssökning
1. Använd `kb_swepub_search` för att hitta svenska forskningspublikationer

## Vanliga parametrar

### Libris sökparametrar
- `query`: Sökord (fritext)
- `limit`: Max antal resultat (standard: 10)

### K-samsök objekttyper
- Photograph, Painting, Drawing, Map, Runestone, Building, Coin, Letter, Manuscript

### K-samsök län
- Stockholms län, Uppsala län, Södermanlands län, Östergötlands län, etc.

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen.**
3. **Presentera data överskådligt** — använd tabeller
4. **Ange källa**: "Källa: Kungliga Biblioteket (Libris/K-samsök/Swepub)"

## Felsökning
- 404: Post-ID eller objekt-ID finns inte — kontrollera ID:t
- Tomt resultat: Prova bredare söktermer
- Timeout: KB:s API:er kan vara långsamma — vänta inte, rapportera till användaren
