/**
 * HTML → Markdown formatter using Turndown.
 *
 * Converts HTML content from the Lightpanda browser into clean Markdown
 * with configurable content length limits.
 */

import TurndownService from 'turndown';
import { MAX_CONTENT_LENGTH } from './types.js';

// ---------------------------------------------------------------------------
// Turndown instance (singleton)
// ---------------------------------------------------------------------------

let _turndown: TurndownService | null = null;

function getTurndown(): TurndownService {
  if (!_turndown) {
    _turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    // Remove script and style tags
    _turndown.remove(['script', 'style', 'noscript', 'iframe', 'svg']);
  }
  return _turndown;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert HTML to Markdown, truncated to maxLength.
 */
export function htmlToMarkdown(html: string, maxLength = MAX_CONTENT_LENGTH): string {
  if (!html || html.trim().length === 0) {
    return '';
  }

  try {
    const turndown = getTurndown();
    let markdown = turndown.turndown(html);

    // Clean up excessive whitespace
    markdown = markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      .trim();

    if (markdown.length > maxLength) {
      markdown = markdown.slice(0, maxLength - 3) + '...';
    }

    return markdown;
  } catch {
    // Fallback: strip HTML tags
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text.length > maxLength ? text.slice(0, maxLength - 3) + '...' : text;
  }
}

/**
 * Extract the page title from HTML.
 */
export function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : '';
}

/**
 * Parse DuckDuckGo HTML search results.
 */
export function parseDuckDuckGoResults(
  html: string,
  maxResults: number,
): Array<{ title: string; url: string; snippet: string }> {
  const results: Array<{ title: string; url: string; snippet: string }> = [];

  // Primary pattern: DuckDuckGo result links + snippets
  const resultPattern =
    /<a[^>]+class="result__a"[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  let match;
  while ((match = resultPattern.exec(html)) !== null) {
    if (results.length >= maxResults) break;

    let url = match[1].trim();
    const title = stripHtmlTags(match[2]).trim();
    const snippet = stripHtmlTags(match[3]).trim();

    // Unwrap DuckDuckGo redirect URLs
    if (url.includes('uddg=')) {
      try {
        const parsed = new URL(url, 'https://duckduckgo.com');
        const uddg = parsed.searchParams.get('uddg');
        if (uddg) url = uddg;
      } catch {
        // Keep original URL
      }
    }

    if (title && url) {
      results.push({ title, url, snippet });
    }
  }

  // Fallback: simpler pattern
  if (results.length === 0) {
    const linkPattern =
      /<a[^>]+class="result__url"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    while ((match = linkPattern.exec(html)) !== null) {
      if (results.length >= maxResults) break;
      const url = match[1].trim();
      const title = stripHtmlTags(match[2]).trim();
      if (title && url) {
        results.push({ title, url, snippet: '' });
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
