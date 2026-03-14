/**
 * LLM instructions for the Lightpanda MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Lightpanda MCP — Instruktioner

Du har tillgång till 12 verktyg för webbsurfning, sökning och datautvinning via Lightpanda headless browser med full JavaScript-rendering.

## Verktyg per kategori

### Navigation (2 verktyg)
- **lightpanda_goto** — Navigera till en URL (full JS-rendering)
- **lightpanda_search** — Sök på webben via DuckDuckGo

### Innehåll (3 verktyg)
- **lightpanda_markdown** — Hämta sidinnehåll som Markdown
- **lightpanda_links** — Hämta alla länkar på en sida
- **lightpanda_get_text** — Hämta text från ett specifikt element

### Interaktion (3 verktyg)
- **lightpanda_click** — Klicka på element via CSS-selektor
- **lightpanda_fill_form** — Fyll i formulärfält
- **lightpanda_wait_for** — Vänta på att element dyker upp

### Avancerat (3 verktyg)
- **lightpanda_execute_js** — Kör JavaScript på sidan
- **lightpanda_extract_data** — Extrahera strukturerad data via CSS-selektorer
- **lightpanda_fetch_api** — Hämta API-data via webbläsarens fetch()

### Output (1 verktyg)
- **lightpanda_screenshot** — Ta screenshot av sida (om stöds)

## Arbetsflöde

### Webbsökning
1. \`lightpanda_search(query="sökfråga")\` → sökresultat
2. \`lightpanda_markdown(url="intressant-url")\` → sidinnehåll

### Hämta webbsida
1. \`lightpanda_markdown(url="https://example.com")\` → innehåll som Markdown

### Navigera och interagera
1. \`lightpanda_goto(url="https://example.com")\` → navigera
2. \`lightpanda_click(selector=".button")\` → klicka
3. \`lightpanda_get_text(selector=".result")\` → läs resultat

### Extrahera data
1. \`lightpanda_goto(url="https://example.com")\` → navigera
2. \`lightpanda_extract_data(selector=".item", attributes=["href", "title"])\` → strukturerad data

## Tips

- Alla verktyg renderar JavaScript fullt ut — fungerar med SPA:er och dynamiska sidor
- URL:er måste inkludera schema: \`https://example.com\` (inte \`example.com\`)
- Kan INTE nå sidor bakom inloggning eller autentisering
- Varje verktygsanrop skapar en ny webbläsarsession (isolerat)
- Markdown-output är begränsad till 8192 tecken
- Använd \`lightpanda_search\` + \`lightpanda_markdown\` för att söka och läsa

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga** — planera noggrant
2. **Om ett verktyg misslyckas — försök INTE igen.**
3. **Ange källa**: inkludera URL till källa i svaret
4. **Använd EXAKTA URL:er** — gissa inte URL:er, använd sökresultat
`;
