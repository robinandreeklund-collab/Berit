---
name: web-browsing
description: Använd denna färdighet när användaren frågar om webbsurfning, webbsökning, hämta webbsida, läsa webbsida, scraping, web fetch, web search, websida, hemsida, URL, länk, Google, DuckDuckGo, söka på internet, hämta data från webb, JavaScript-rendering, headless browser, Lightpanda, extrahera data från webbsida, fylla i formulär, klicka på knapp, ta screenshot, API-anrop via webbläsare, eller navigera till en webbadress.
---

# Webbsurfning (Lightpanda MCP v1.0)

## Översikt

Denna färdighet ger dig tillgång till 12 verktyg för webbsurfning, sökning och datautvinning via Lightpanda headless browser med full JavaScript-rendering. Fungerar med SPA:er (Single Page Applications) och dynamiska sidor.

**Kräver ingen API-nyckel** — Lightpanda är gratis och open source.

**Varje verktygsanrop startar en ny isolerad webbläsarsession.** Det finns ingen delad state mellan anrop — alla verktyg tar en `url`-parameter som anger vilken sida de opererar på.

## Tillgängliga MCP-verktyg

### Navigation

| Verktyg | Beskrivning |
|---------|-------------|
| `lightpanda_goto` | Navigera till en URL — returnerar titel och URL |
| `lightpanda_search` | Sök på webben via DuckDuckGo |

### Innehåll

| Verktyg | Beskrivning |
|---------|-------------|
| `lightpanda_markdown` | Hämta sidinnehåll som Markdown (max 8192 tecken) |
| `lightpanda_links` | Hämta alla länkar på en sida |
| `lightpanda_get_text` | Hämta text från specifikt element via CSS-selektor |

### Interaktion

| Verktyg | Beskrivning |
|---------|-------------|
| `lightpanda_click` | Klicka på element via CSS-selektor |
| `lightpanda_fill_form` | Fyll i formulärfält |
| `lightpanda_wait_for` | Vänta på att element dyker upp (dynamiskt innehåll) |

### Avancerat

| Verktyg | Beskrivning |
|---------|-------------|
| `lightpanda_execute_js` | Kör godtycklig JavaScript på sidan |
| `lightpanda_extract_data` | Extrahera strukturerad data via CSS-selektorer |
| `lightpanda_fetch_api` | Hämta API-data via webbläsarens fetch() (kringgår CORS) |

### Output

| Verktyg | Beskrivning |
|---------|-------------|
| `lightpanda_screenshot` | Ta screenshot av sida (om Lightpanda stödjer det) |

## Arbetsflöde

### Söka och läsa en webbsida

1. `lightpanda_search(query="sökfråga")` → sökresultat med URL:er
2. `lightpanda_markdown(url="bästa-resultatet-url")` → sidinnehåll som Markdown

### Hämta innehållet på en specifik URL

1. `lightpanda_markdown(url="https://example.com")` → Markdown-innehåll

### Extrahera specifik text från en sida

1. `lightpanda_get_text(url="https://example.com", selector=".article-body")` → textinnehåll

### Extrahera strukturerad data

1. `lightpanda_extract_data(url="https://example.com/products", selector=".product-card", attributes=["href", "title"])` → strukturerad data i JSON

### Klicka och läsa resultat (kräver 2 anrop)

1. `lightpanda_click(url="https://example.com", selector=".show-more")` → klicka
2. `lightpanda_get_text(url="https://example.com", selector=".expanded-content")` → läs resultat

**OBS:** Klick-effekter som kräver JavaScript-state (t.ex. "visa mer"-knappar) bevaras INTE mellan anrop. Använd `lightpanda_execute_js` för att klicka + läsa i samma session:

```
lightpanda_execute_js(url="https://example.com", expression="document.querySelector('.show-more').click(); document.querySelector('.expanded-content').textContent")
```

### Hämta API-data

1. `lightpanda_fetch_api(url="https://api.example.com/data", method="GET")` → JSON-svar

## KRITISKA REGLER

1. **Alla verktyg tar `url`** — ange alltid vilken sida verktyget ska operera på
2. **Max 4 verktygsanrop per fråga** — planera noggrant
3. **Om ett verktyg misslyckas — försök INTE igen.** Svara med vad du har
4. **URL:er måste inkludera schema** — `https://example.com` (inte `example.com`)
5. **Kan INTE nå sidor bakom inloggning** — informera användaren
6. **Använd EXAKTA URL:er** — gissa aldrig URL:er, använd sökresultat
7. **Ange källa** — inkludera URL till källa i svaret

## Felsökning

- **"Lightpanda webbläsare är inte tillgänglig"** — Starta med: `docker run -d -p 9222:9222 lightpanda/browser:nightly`
- **"Could not connect"** — Kontrollera att LIGHTPANDA_CDP_URL pekar rätt (standard: `ws://localhost:9222`)
- **Tom respons** — Sidan kan kräva autentisering eller blockera headless browsers
- **Timeout** — Sidan tar för lång tid att ladda. Prova enklare URL
- **"Element ej hittat"** — Kontrollera CSS-selektorn. Använd `lightpanda_execute_js` med `document.querySelectorAll()` för att utforska DOM
