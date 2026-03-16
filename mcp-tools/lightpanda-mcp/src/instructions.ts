/**
 * LLM instructions for the Lightpanda MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Lightpanda MCP — Instruktioner

Du har tillgång till 12 verktyg för webbsurfning, sökning och datautvinning via Lightpanda headless browser med full JavaScript-rendering.

**Varje verktygsanrop startar en ny isolerad session.** Alla verktyg tar en \`url\`-parameter.

## Verktyg per kategori

### Navigation (2 verktyg)
- **lightpanda_goto** — Navigera till en URL (full JS-rendering)
- **lightpanda_search** — Sök på webben via DuckDuckGo

### Innehåll (3 verktyg)
- **lightpanda_markdown** — Hämta sidinnehåll som Markdown
- **lightpanda_links** — Hämta alla länkar på en sida
- **lightpanda_get_text** — Hämta text från ett specifikt element (kräver url + selector)

### Interaktion (3 verktyg)
- **lightpanda_click** — Klicka på element (kräver url + selector)
- **lightpanda_fill_form** — Fyll i formulärfält (kräver url + selector + value)
- **lightpanda_wait_for** — Vänta på att element dyker upp (kräver url + selector)

### Avancerat (3 verktyg)
- **lightpanda_execute_js** — Kör JavaScript på sidan (kräver url + expression)
- **lightpanda_extract_data** — Extrahera strukturerad data (kräver url + selector)
- **lightpanda_fetch_api** — Hämta API-data via webbläsarens fetch()

### Output (1 verktyg)
- **lightpanda_screenshot** — Ta screenshot av sida (om stöds)

## Arbetsflöde

### Webbsökning
1. \`lightpanda_search(query="sökfråga")\` → sökresultat
2. \`lightpanda_markdown(url="intressant-url")\` → sidinnehåll

### Hämta webbsida
1. \`lightpanda_markdown(url="https://example.com")\` → innehåll som Markdown

### Extrahera text från element
1. \`lightpanda_get_text(url="https://example.com", selector=".article-body")\` → text

### Extrahera data
1. \`lightpanda_extract_data(url="https://example.com", selector=".item", attributes=["href", "title"])\` → strukturerad data

### Klicka + läsa i samma session
1. \`lightpanda_execute_js(url="https://example.com", expression="document.querySelector('.btn').click(); document.querySelector('.result').textContent")\`

## Tips

- Alla verktyg renderar JavaScript fullt ut — fungerar med SPA:er och dynamiska sidor
- URL:er måste inkludera schema: \`https://example.com\` (inte \`example.com\`)
- Kan INTE nå sidor bakom inloggning eller autentisering
- Markdown-output är begränsad till 8192 tecken
- Använd \`lightpanda_search\` + \`lightpanda_markdown\` för att söka och läsa

## KRITISKA REGLER
1. **Alla verktyg tar url** — ange alltid vilken sida verktyget ska operera på
2. **Max 4 verktygsanrop per fråga** — planera noggrant
3. **Om ett verktyg misslyckas — försök INTE igen.**
4. **Ange källa**: inkludera URL till källa i svaret
5. **Använd EXAKTA URL:er** — gissa inte URL:er, använd sökresultat
`;
