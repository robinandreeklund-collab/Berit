---
name: web-browsing
description: Använd denna färdighet när användaren frågar om webbsurfning, webbsökning, hämta webbsida, läsa webbsida, scraping, web fetch, web search, websida, hemsida, URL, länk, Google, DuckDuckGo, söka på internet, hämta data från webb, JavaScript-rendering, headless browser, Lightpanda, extrahera data från webbsida, fylla i formulär, klicka på knapp, ta screenshot, API-anrop via webbläsare, eller navigera till en webbadress.
---

# Webbsurfning (Lightpanda MCP v1.0)

## Översikt

Denna färdighet ger dig tillgång till 12 verktyg för webbsurfning, sökning och datautvinning via Lightpanda headless browser med full JavaScript-rendering. Fungerar med SPA:er (Single Page Applications) och dynamiska sidor.

**Kräver ingen API-nyckel** — Lightpanda är gratis och open source.

## Tillgängliga MCP-verktyg

### Navigation

| Verktyg | Beskrivning |
|---------|-------------|
| `lightpanda_goto` | Navigera till en URL med full JS-rendering |
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

### Navigera och interagera med en sida

1. `lightpanda_goto(url="https://example.com")` → navigera
2. `lightpanda_click(selector=".button")` → klicka
3. `lightpanda_get_text(selector=".result")` → läs resultat

### Extrahera data från en sida

1. `lightpanda_goto(url="https://example.com/products")` → navigera
2. `lightpanda_extract_data(selector=".product-card", attributes=["href", "title"])` → strukturerad data

### Fylla i och skicka formulär

1. `lightpanda_goto(url="https://example.com/search")` → navigera
2. `lightpanda_fill_form(selector="#search-input", value="sökterm")` → fyll i
3. `lightpanda_click(selector="#search-button")` → skicka
4. `lightpanda_wait_for(selector=".results")` → vänta på resultat
5. `lightpanda_get_text(selector=".results")` → läs resultat

### Hämta API-data

1. `lightpanda_fetch_api(url="https://api.example.com/data", method="GET")` → JSON-svar

## KRITISKA REGLER

1. **Max 4 verktygsanrop per fråga** — planera noggrant
2. **Om ett verktyg misslyckas — försök INTE igen.** Svara med vad du har
3. **URL:er måste inkludera schema** — `https://example.com` (inte `example.com`)
4. **Kan INTE nå sidor bakom inloggning** — informera användaren
5. **Använd EXAKTA URL:er** — gissa aldrig URL:er, använd sökresultat
6. **Ange källa** — inkludera URL till källa i svaret
7. **Varje verktygsanrop skapar en ny session** — ingen delad state mellan anrop

## Felsökning

- **"Lightpanda webbläsare är inte tillgänglig"** — Starta med: `docker run -d -p 9222:9222 lightpanda/browser:nightly`
- **"Could not connect"** — Kontrollera att LIGHTPANDA_CDP_URL pekar rätt (standard: `ws://localhost:9222`)
- **Tom respons** — Sidan kan kräva autentisering eller blockera headless browsers
- **Timeout** — Sidan tar för lång tid att ladda. Prova enklare URL
- **"Element ej hittat"** — Kontrollera CSS-selektorn. Använd `lightpanda_execute_js` med `document.querySelectorAll()` för att utforska DOM
