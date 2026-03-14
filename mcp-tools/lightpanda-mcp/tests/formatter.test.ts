/**
 * Tests for the HTML → Markdown formatter.
 */

import { describe, it, expect } from 'vitest';
import { htmlToMarkdown, extractTitle, parseDuckDuckGoResults } from '../src/formatter.js';

describe('htmlToMarkdown', () => {
  it('should convert simple HTML to markdown', () => {
    const html = '<h1>Hello</h1><p>World</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('Hello');
    expect(md).toContain('World');
  });

  it('should strip script and style tags', () => {
    const html = '<p>Text</p><script>alert("bad")</script><style>.x{}</style>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('Text');
    expect(md).not.toContain('alert');
    expect(md).not.toContain('.x');
  });

  it('should truncate long content', () => {
    const html = '<p>' + 'a'.repeat(10000) + '</p>';
    const md = htmlToMarkdown(html, 100);
    expect(md.length).toBeLessThanOrEqual(100);
    expect(md).toContain('...');
  });

  it('should handle empty input', () => {
    expect(htmlToMarkdown('')).toBe('');
    expect(htmlToMarkdown('   ')).toBe('');
  });

  it('should convert links to markdown', () => {
    const html = '<a href="https://example.com">Example</a>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('Example');
    expect(md).toContain('https://example.com');
  });
});

describe('extractTitle', () => {
  it('should extract title from HTML', () => {
    const html = '<html><head><title>My Page</title></head><body></body></html>';
    expect(extractTitle(html)).toBe('My Page');
  });

  it('should return empty string for no title', () => {
    expect(extractTitle('<html><body>No title</body></html>')).toBe('');
  });
});

describe('parseDuckDuckGoResults', () => {
  it('should parse DDG result format', () => {
    const html = `
      <a class="result__a" href="https://example.com">Example</a>
      <a class="result__snippet">A snippet</a>
      <a class="result__a" href="https://other.com">Other</a>
      <a class="result__snippet">Another snippet</a>
    `;
    const results = parseDuckDuckGoResults(html, 5);
    expect(results.length).toBe(2);
    expect(results[0].title).toBe('Example');
    expect(results[0].url).toBe('https://example.com');
    expect(results[0].snippet).toBe('A snippet');
  });

  it('should respect max_results', () => {
    const html = `
      <a class="result__a" href="https://a.com">A</a><a class="result__snippet">S1</a>
      <a class="result__a" href="https://b.com">B</a><a class="result__snippet">S2</a>
      <a class="result__a" href="https://c.com">C</a><a class="result__snippet">S3</a>
    `;
    const results = parseDuckDuckGoResults(html, 2);
    expect(results.length).toBe(2);
  });

  it('should unwrap DDG redirect URLs', () => {
    const html = `
      <a class="result__a" href="https://duckduckgo.com/l/?uddg=https%3A%2F%2Freal.com&rut=123">Real</a>
      <a class="result__snippet">Desc</a>
    `;
    const results = parseDuckDuckGoResults(html, 5);
    expect(results.length).toBe(1);
    expect(results[0].url).toBe('https://real.com');
  });

  it('should return empty array for no results', () => {
    const results = parseDuckDuckGoResults('<html></html>', 5);
    expect(results).toEqual([]);
  });
});
