/**
 * Format Visit Sweden API responses into readable Markdown.
 */

import { ENTITY_TYPES } from './types.js';

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function markdownTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return '_Inga resultat._';
  const sep = headers.map(() => '---');
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${sep.join(' | ')} |`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
  ];
  return lines.join('\n');
}

function truncate(text: string | undefined | null, maxLen = 120): string {
  if (!text) return '—';
  const clean = text.replace(/\n/g, ' ').trim();
  return clean.length > maxLen ? clean.slice(0, maxLen - 3) + '...' : clean;
}

function extractField(entry: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = entry[key];
    if (typeof val === 'string' && val.trim()) return val.trim();
    if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>;
      if (typeof obj['@value'] === 'string') return obj['@value'];
      if (typeof obj['name'] === 'string') return obj['name'];
    }
  }
  return '—';
}

// ---------------------------------------------------------------------------
// Search results formatter
// ---------------------------------------------------------------------------

export function formatSearchResults(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = extractEntries(data);
  if (items.length === 0) return { markdown: '_Inga resultat hittades._', count: 0, raw: [] };

  const headers = ['#', 'Namn', 'Typ', 'Beskrivning', 'ID'];
  const rows: string[][] = [];

  for (let i = 0; i < items.length; i++) {
    const entry = items[i] as Record<string, unknown>;
    const name = extractField(entry, 'schema:name', 'name', 'title', 'rdfs:label');
    const type = extractField(entry, '@type', 'rdfType');
    const typeName = mapTypeName(type);
    const desc = truncate(extractField(entry, 'schema:description', 'description'), 80);
    const id = extractField(entry, 'entryId', '@id', 'uri');

    rows.push([String(i + 1), name, typeName, desc, id]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

// ---------------------------------------------------------------------------
// Details formatter
// ---------------------------------------------------------------------------

export function formatDetails(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const entry = (typeof data === 'object' && data !== null) ? data as Record<string, unknown> : {};

  const name = extractField(entry, 'schema:name', 'name', 'title');
  const desc = extractField(entry, 'schema:description', 'description');
  const type = extractField(entry, '@type', 'rdfType');
  const address = extractField(entry, 'schema:address', 'address');
  const url = extractField(entry, 'schema:url', 'url');
  const phone = extractField(entry, 'schema:telephone', 'telephone');
  const email = extractField(entry, 'schema:email', 'email');

  const lines = [
    `## ${name}`,
    '',
    `**Typ:** ${mapTypeName(type)}`,
    desc !== '—' ? `\n**Beskrivning:** ${desc}` : '',
    address !== '—' ? `**Adress:** ${address}` : '',
    phone !== '—' ? `**Telefon:** ${phone}` : '',
    email !== '—' ? `**E-post:** ${email}` : '',
    url !== '—' ? `**Webb:** ${url}` : '',
  ].filter(Boolean);

  return { markdown: lines.join('\n'), count: 1, raw: [entry] };
}

// ---------------------------------------------------------------------------
// Events formatter
// ---------------------------------------------------------------------------

export function formatEvents(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = extractEntries(data);
  if (items.length === 0) return { markdown: '_Inga evenemang hittades._', count: 0, raw: [] };

  const headers = ['#', 'Evenemang', 'Datum', 'Plats', 'Beskrivning'];
  const rows: string[][] = [];

  for (let i = 0; i < items.length; i++) {
    const entry = items[i] as Record<string, unknown>;
    const name = extractField(entry, 'schema:name', 'name', 'title');
    const startDate = extractField(entry, 'schema:startDate', 'startDate');
    const location = extractField(entry, 'schema:location', 'location', 'schema:addressLocality');
    const desc = truncate(extractField(entry, 'schema:description', 'description'), 60);

    rows.push([String(i + 1), name, startDate, location, desc]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractEntries(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results;
    if (Array.isArray(obj.resource)) return obj.resource;
    if (Array.isArray(obj['@graph'])) return obj['@graph'];
    if (Array.isArray(obj.entries)) return obj.entries;
    if (Array.isArray(obj.items)) return obj.items;
  }
  return [];
}

function mapTypeName(type: string): string {
  for (const [key, label] of Object.entries(ENTITY_TYPES)) {
    if (type.includes(key)) return label;
  }
  return type === '—' ? '—' : type;
}

export { markdownTable, truncate };
