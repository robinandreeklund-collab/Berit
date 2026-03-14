/**
 * 12 tool definitions for the Lightpanda MCP server.
 *
 * Each tool includes a full JSON Schema `inputSchema` so the LLM knows
 * exactly which parameters to provide for browser automation tasks.
 *
 * Tools are organized by category:
 * - navigation: goto, search
 * - content: markdown, links, get_text
 * - interaction: click, fill_form, wait_for
 * - advanced: execute_js, extract_data, fetch_api
 * - output: screenshot
 */

// ---------------------------------------------------------------------------
// ToolDefinition interface
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 12 tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Navigation (2) ──────────────────────────────────────────────────────
  {
    id: 'lightpanda_goto',
    name: 'Navigera till URL',
    description:
      'Navigera till en webbsida med full JavaScript-rendering via Lightpanda.\n\n' +
      '**Användningsfall:** Besök en webbsida, SPA eller dynamisk sida.\n' +
      '**Returnerar:** Sidans titel och URL efter navigering.\n' +
      '**Exempel:** "Gå till https://svt.se", "Öppna https://github.com"\n' +
      '**OBS:** URL måste inkludera schema (https://). Kan INTE nå sidor bakom inloggning.',
    category: 'navigation',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL att navigera till. Måste inkludera schema (https://).',
        },
      },
      required: ['url'],
    },
  },
  {
    id: 'lightpanda_search',
    name: 'Webbsökning',
    description:
      'Sök på webben via DuckDuckGo med full JavaScript-rendering.\n\n' +
      '**Användningsfall:** Sök efter information, nyheter, artiklar på webben.\n' +
      '**Returnerar:** Lista med sökresultat (titel, URL, snippet) i JSON.\n' +
      '**Exempel:** "Sök efter klimatförändringar Sverige", "Hitta senaste nyheter om AI"\n' +
      '**Tips:** Använd sedan lightpanda_goto eller lightpanda_markdown för att hämta resultatens innehåll.',
    category: 'navigation',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sökfråga att söka efter på webben via DuckDuckGo.',
        },
        max_results: {
          type: 'number',
          description: 'Max antal resultat (standard: 5, max: 10).',
          minimum: 1,
          maximum: 10,
        },
      },
      required: ['query'],
    },
  },

  // ── Content (3) ─────────────────────────────────────────────────────────
  {
    id: 'lightpanda_markdown',
    name: 'Hämta sida som Markdown',
    description:
      'Hämta en webbsidas innehåll som Markdown med full JavaScript-rendering.\n\n' +
      '**Användningsfall:** Läs innehållet på en webbsida, extrahera text och rubriker.\n' +
      '**Returnerar:** Sidans innehåll konverterat till Markdown (max 8192 tecken).\n' +
      '**Exempel:** "Hämta innehållet på https://svt.se/nyheter", "Läs artikeln"',
    category: 'content',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL att hämta som Markdown. Om tom används aktuell sida.',
        },
      },
      required: [],
    },
  },
  {
    id: 'lightpanda_links',
    name: 'Hämta länkar',
    description:
      'Hämta alla länkar på en webbsida.\n\n' +
      '**Användningsfall:** Se vilka sidor som länkas från en sida.\n' +
      '**Returnerar:** Lista med länkar (text, URL) i JSON.\n' +
      '**Exempel:** "Vilka länkar finns på https://svt.se?"',
    category: 'content',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL att hämta länkar från. Om tom används aktuell sida.',
        },
      },
      required: [],
    },
  },
  {
    id: 'lightpanda_get_text',
    name: 'Hämta text från element',
    description:
      'Hämta textinnehållet från ett specifikt element via CSS-selektor.\n\n' +
      '**Användningsfall:** Extrahera text från en viss del av sidan.\n' +
      '**Returnerar:** Textinnehållet i elementet.\n' +
      '**Exempel:** "Hämta text från .article-body", "Vad står i #main-content?"',
    category: 'content',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS-selektor för element att hämta text från.',
        },
      },
      required: ['selector'],
    },
  },

  // ── Interaction (3) ──────────────────────────────────────────────────────
  {
    id: 'lightpanda_click',
    name: 'Klicka på element',
    description:
      'Klicka på ett element på sidan via CSS-selektor.\n\n' +
      '**Användningsfall:** Klicka på knappar, länkar, menyval.\n' +
      '**Returnerar:** Bekräftelse att elementet klickades.\n' +
      '**Exempel:** "Klicka på .submit-button", "Tryck på #next-page"',
    category: 'interaction',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS-selektor för elementet att klicka på.',
        },
      },
      required: ['selector'],
    },
  },
  {
    id: 'lightpanda_fill_form',
    name: 'Fyll i formulärfält',
    description:
      'Fyll i ett formulärfält med ett värde via CSS-selektor.\n\n' +
      '**Användningsfall:** Fyll i sökfält, textfält, input-element.\n' +
      '**Returnerar:** Bekräftelse att värdet fylldes i.\n' +
      '**Exempel:** "Fyll i sökfältet med \'klimat\'", "Ange namn i #name-field"',
    category: 'interaction',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS-selektor för formulärfältet.',
        },
        value: {
          type: 'string',
          description: 'Värde att fylla i.',
        },
      },
      required: ['selector', 'value'],
    },
  },
  {
    id: 'lightpanda_wait_for',
    name: 'Vänta på element',
    description:
      'Vänta tills ett element dyker upp på sidan.\n\n' +
      '**Användningsfall:** Vänta på att dynamiskt innehåll laddas.\n' +
      '**Returnerar:** Bekräftelse att elementet hittades, eller timeout.\n' +
      '**Exempel:** "Vänta på .results-container", "Vänta på #loaded-content"',
    category: 'interaction',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS-selektor att vänta på.',
        },
        timeout: {
          type: 'number',
          description: 'Timeout i millisekunder (standard: 5000).',
          minimum: 100,
          maximum: 30000,
        },
      },
      required: ['selector'],
    },
  },

  // ── Advanced (3) ─────────────────────────────────────────────────────────
  {
    id: 'lightpanda_execute_js',
    name: 'Kör JavaScript',
    description:
      'Kör ett JavaScript-uttryck på aktuell sida.\n\n' +
      '**Användningsfall:** Avancerad interaktion, datautvinning, DOM-manipulation.\n' +
      '**Returnerar:** Returvärdet från JavaScript-uttrycket.\n' +
      '**Exempel:** "Kör document.title", "Hämta document.querySelectorAll(\'.item\').length"',
    category: 'advanced',
    inputSchema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'JavaScript-uttryck att köra på aktuell sida.',
        },
      },
      required: ['expression'],
    },
  },
  {
    id: 'lightpanda_extract_data',
    name: 'Extrahera data',
    description:
      'Extrahera strukturerad data från element via CSS-selektor.\n\n' +
      '**Användningsfall:** Samla data från tabeller, listor, upprepade element.\n' +
      '**Returnerar:** Array med extraherade data (text eller attributvärden) i JSON.\n' +
      '**Exempel:** "Extrahera data från .product-card", "Hämta alla href från .nav-link"',
    category: 'advanced',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS-selektor för element att extrahera data från.',
        },
        attributes: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Attribut att extrahera (t.ex. ["href", "src"]). Om tom extraheras textinnehåll.',
        },
      },
      required: ['selector'],
    },
  },
  {
    id: 'lightpanda_fetch_api',
    name: 'Hämta API-data',
    description:
      'Hämta data från ett API-endpoint via webbläsarens fetch() (kringgår CORS via browser context).\n\n' +
      '**Användningsfall:** Anropa REST API:er, hämta JSON-data.\n' +
      '**Returnerar:** API-responsen som text.\n' +
      '**Exempel:** "Hämta https://api.example.com/data", "POST till API"',
    category: 'advanced',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'API-URL att hämta.',
        },
        method: {
          type: 'string',
          description: 'HTTP-metod (GET, POST, PUT, DELETE). Standard: GET.',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        },
        headers: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'HTTP-headers att skicka.',
        },
        body: {
          type: 'string',
          description: 'Request body (för POST/PUT).',
        },
      },
      required: ['url'],
    },
  },

  // ── Output (1) ──────────────────────────────────────────────────────────
  {
    id: 'lightpanda_screenshot',
    name: 'Ta screenshot',
    description:
      'Ta en screenshot av en webbsida (om stöds av webbläsaren).\n\n' +
      '**Användningsfall:** Visuell inspektion av en sida.\n' +
      '**Returnerar:** Base64-kodad bild (PNG) eller felmeddelande.\n' +
      '**OBS:** Kräver att Lightpanda stödjer Page.captureScreenshot.',
    category: 'output',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL att ta screenshot av. Om tom används aktuell sida.',
        },
      },
      required: [],
    },
  },
];

/** Look up tool definition by ID (case-insensitive). */
export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.id === id.toLowerCase());
}

/** All tool IDs grouped by category. */
export function getToolsByCategory(): Record<string, ToolDefinition[]> {
  const grouped: Record<string, ToolDefinition[]> = {};
  for (const tool of TOOL_DEFINITIONS) {
    if (!grouped[tool.category]) grouped[tool.category] = [];
    grouped[tool.category].push(tool);
  }
  return grouped;
}
