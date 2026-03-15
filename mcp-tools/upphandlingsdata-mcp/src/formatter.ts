/**
 * Format Upphandlingsdata API responses into readable Markdown tables.
 */

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Format a date string for display. */
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  return dateStr;
}

/** Truncate a string to a given length. */
function truncate(str: string | undefined | null, maxLen = 80): string {
  if (!str) return '—';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/** Build a Markdown table from headers and rows. */
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

// ---------------------------------------------------------------------------
// Category-specific formatters
// ---------------------------------------------------------------------------

/** Format website search results. */
export function formatSearchResults(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response.results)
    ? response.results
    : Array.isArray(response.hits)
      ? response.hits
      : Array.isArray(data) ? data : [];
  const totalHits = (response.numberOfHits as number) || (response.totalHits as number) || items.length;

  if (items.length === 0) return { markdown: '_Inga sökresultat._', count: 0, raw: [] };

  const headers = ['Titel', 'Beskrivning', 'Typ', 'URL'];
  const rows: string[][] = [];

  for (const item of items) {
    const hit = item as Record<string, unknown>;
    rows.push([
      truncate((hit.heading || hit.title) as string, 60),
      truncate((hit.excerpt || hit.description) as string, 80),
      String(hit.type || '—'),
      String(hit.url || '—'),
    ]);
  }

  const summary = totalHits > items.length
    ? `\n\n_Visar ${items.length} av ${totalHits} träffar._`
    : '';

  return { markdown: markdownTable(headers, rows) + summary, count: items.length, raw: items };
}

/** Format question portal results. */
export function formatQuestionResults(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response.results)
    ? response.results
    : Array.isArray(response.hits)
      ? response.hits
      : Array.isArray(data) ? data : [];
  const totalHits = (response.numberOfHits as number) || (response.totalHits as number) || items.length;

  if (items.length === 0) return { markdown: '_Inga frågor hittades._', count: 0, raw: [] };

  const headers = ['Fråga', 'Beskrivning', 'Kategori', 'URL'];
  const rows: string[][] = [];

  for (const item of items) {
    const hit = item as Record<string, unknown>;
    rows.push([
      truncate((hit.heading || hit.title) as string, 60),
      truncate((hit.excerpt || hit.description) as string, 80),
      String(hit.category || '—'),
      String(hit.url || '—'),
    ]);
  }

  const summary = totalHits > items.length
    ? `\n\n_Visar ${items.length} av ${totalHits} frågor._`
    : '';

  return { markdown: markdownTable(headers, rows) + summary, count: items.length, raw: items };
}

/** Format LOV (Valfrihetssystem) results. */
export function formatLOVResults(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response.results)
    ? response.results
    : Array.isArray(response.hits)
      ? response.hits
      : Array.isArray(data) ? data : [];
  const totalHits = (response.numberOfHits as number) || (response.totalHits as number) || items.length;

  if (items.length === 0) return { markdown: '_Inga LOV-annonser hittades._', count: 0, raw: [] };

  const headers = ['Titel', 'Kommun', 'Region', 'Kategori', 'Status', 'Datum'];
  const rows: string[][] = [];

  for (const item of items) {
    const hit = item as Record<string, unknown>;
    rows.push([
      truncate(hit.title as string, 50),
      String(hit.municipality || '—'),
      String(hit.region || '—'),
      String(hit.category || '—'),
      String(hit.status || '—'),
      formatDate(hit.publishDate as string),
    ]);
  }

  const summary = totalHits > items.length
    ? `\n\n_Visar ${items.length} av ${totalHits} LOV-annonser._`
    : '';

  return { markdown: markdownTable(headers, rows) + summary, count: items.length, raw: items };
}

/** Format criteria search results. */
export function formatCriteriaResults(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response.results)
    ? response.results
    : Array.isArray(response.hits)
      ? response.hits
      : Array.isArray(data) ? data : [];
  const totalHits = (response.numberOfHits as number) || (response.totalHits as number) || items.length;

  if (items.length === 0) return { markdown: '_Inga kriterier hittades._', count: 0, raw: [] };

  const headers = ['Titel', 'Typ', 'Kategori', 'Nivå', 'URL'];
  const rows: string[][] = [];

  for (const item of items) {
    const hit = item as Record<string, unknown>;
    rows.push([
      truncate(hit.title as string, 50),
      String(hit.type || '—'),
      String(hit.category || '—'),
      String(hit.level || '—'),
      String(hit.url || '—'),
    ]);
  }

  const summary = totalHits > items.length
    ? `\n\n_Visar ${items.length} av ${totalHits} kriterier._`
    : '';

  return { markdown: markdownTable(headers, rows) + summary, count: items.length, raw: items };
}

/** Format criteria categories/filter response. */
export function formatCriteriaCategories(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const categories = Array.isArray(response.categories) ? response.categories : Array.isArray(data) ? data : [];
  const types = Array.isArray(response.types) ? response.types : [];

  if (categories.length === 0 && types.length === 0) {
    return { markdown: '_Inga kategorier hittades._', count: 0, raw: [] };
  }

  let markdown = '';

  if (categories.length > 0) {
    const headers = ['ID', 'Kategori', 'Antal kriterier'];
    const rows: string[][] = [];

    for (const cat of categories) {
      const c = cat as Record<string, unknown>;
      rows.push([
        String(c.id || '—'),
        String(c.name || '—'),
        c.count != null ? String(c.count) : '—',
      ]);
    }

    markdown += '## Kategorier\n\n' + markdownTable(headers, rows);
  }

  if (types.length > 0) {
    markdown += (markdown ? '\n\n' : '') + '## Kriterietyper\n\n' + types.map((t) => `- ${t}`).join('\n');
  }

  return { markdown, count: categories.length, raw: categories };
}

/** Format TED (EU procurement) search results. */
export function formatTEDResults(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response.notices) ? response.notices : Array.isArray(data) ? data : [];
  const totalCount = (response.totalNoticeCount as number) || items.length;

  if (items.length === 0) return { markdown: '_Inga TED-annonser hittades._', count: 0, raw: [] };

  const headers = ['Titel', 'Beskrivning', 'Organisation', 'Referens'];
  const rows: string[][] = [];

  for (const item of items) {
    const notice = item as Record<string, unknown>;
    rows.push([
      truncate(notice['BT-21-Procedure'] as string, 60),
      truncate(notice['BT-22-Procedure'] as string, 80),
      truncate(notice['BT-500-Organization-Company'] as string, 40),
      String(notice['ND-Root'] || '—'),
    ]);
  }

  const summary = totalCount > items.length
    ? `\n\n_Visar ${items.length} av ${totalCount} TED-annonser._`
    : '';

  return { markdown: markdownTable(headers, rows) + summary, count: items.length, raw: items };
}

export { formatDate, truncate, markdownTable };
