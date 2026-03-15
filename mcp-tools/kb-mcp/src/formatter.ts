/**
 * Format KB API responses into readable Markdown tables.
 */

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Format a date string for display. */
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  return dateStr;
}

/** Truncate text to a maximum length. */
function truncate(text: string | undefined | null, maxLength = 80): string {
  if (!text) return '—';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/** Normalize a value that might be a string or array to a display string. */
function normalizeArray(value: unknown): string {
  if (!value) return '—';
  if (Array.isArray(value)) return value.join('; ');
  return String(value);
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
// Libris formatters
// ---------------------------------------------------------------------------

/** Format Libris Xsearch results (books, journals). */
export function formatLibrisResults(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const xsearch = (response?.xsearch || response) as Record<string, unknown>;
  const items = Array.isArray(xsearch?.list) ? xsearch.list : [];
  const totalRecords = (xsearch?.records as number) || items.length;

  if (items.length === 0) return { markdown: '_Inga resultat i Libris._', count: 0, raw: [] };

  const headers = ['Titel', 'Författare', 'År', 'Förlag', 'ISBN', 'Typ'];
  const rows: string[][] = [];

  for (const item of items) {
    const rec = item as Record<string, unknown>;
    rows.push([
      truncate(rec.title as string, 60),
      truncate(normalizeArray(rec.creator), 40),
      formatDate(rec.date as string),
      truncate(rec.publisher as string, 30),
      truncate(normalizeArray(rec.isbn), 20),
      String(rec.type || '—'),
    ]);
  }

  const summary = totalRecords > items.length
    ? `\n\n_Visar ${items.length} av ${totalRecords} träffar._`
    : '';

  return { markdown: markdownTable(headers, rows) + summary, count: items.length, raw: items };
}

/** Format Libris XL / Find results (JSON-LD). */
export function formatLibrisFindResults(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response?.items) ? response.items : [];
  const totalItems = (response?.totalItems as number) || items.length;

  if (items.length === 0) return { markdown: '_Inga resultat i Libris._', count: 0, raw: [] };

  const headers = ['Titel', 'Författare', 'År', 'Typ', 'ID'];
  const rows: string[][] = [];

  for (const item of items) {
    const rec = item as Record<string, unknown>;

    // Extract title from hasTitle array
    let title = '—';
    const hasTitleArr = rec.hasTitle as Array<Record<string, unknown>> | undefined;
    if (hasTitleArr && hasTitleArr.length > 0) {
      const mainTitle = hasTitleArr[0].mainTitle as string;
      const subtitle = hasTitleArr[0].subtitle as string;
      title = mainTitle || '—';
      if (subtitle) title += `: ${subtitle}`;
    }

    // Extract author from contribution array
    let author = '—';
    const contributions = rec.contribution as Array<Record<string, unknown>> | undefined;
    if (contributions && contributions.length > 0) {
      const names = contributions
        .map((c) => (c.agent as Record<string, unknown>)?.name as string)
        .filter(Boolean);
      author = names.join('; ') || '—';
    }

    // Extract year from publication array
    let year = '—';
    const publications = rec.publication as Array<Record<string, unknown>> | undefined;
    if (publications && publications.length > 0) {
      year = (publications[0].date as string) || '—';
    }

    // Type
    const typeVal = rec['@type'];
    const typeStr = Array.isArray(typeVal) ? typeVal.join(', ') : String(typeVal || '—');

    rows.push([
      truncate(title, 60),
      truncate(author, 40),
      year,
      truncate(typeStr, 20),
      truncate(rec['@id'] as string, 30),
    ]);
  }

  const summary = totalItems > items.length
    ? `\n\n_Visar ${items.length} av ${totalItems} träffar._`
    : '';

  return { markdown: markdownTable(headers, rows) + summary, count: items.length, raw: items };
}

/** Format Libris holdings (which libraries have a book). */
export function formatLibrisHoldings(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;

  // Holdings can be in @graph or directly
  let holdings: unknown[] = [];
  const graph = response?.['@graph'] as unknown[];
  if (Array.isArray(graph)) {
    holdings = graph.filter((item) => {
      const i = item as Record<string, unknown>;
      return i['@type'] === 'Item' || i['@type'] === 'Holding';
    });
  }

  // If no holdings in @graph, try the response itself
  if (holdings.length === 0 && Array.isArray(response?.items)) {
    holdings = response.items as unknown[];
  }

  if (holdings.length === 0) return { markdown: '_Inga beståndsuppgifter hittade._', count: 0, raw: [] };

  const headers = ['Bibliotek', 'Sigel', 'Hyllplacering'];
  const rows: string[][] = [];

  for (const holding of holdings) {
    const h = holding as Record<string, unknown>;
    const heldBy = h.heldBy as Record<string, unknown> | undefined;
    const name = (heldBy?.name as string) || '—';
    const sigel = (heldBy?.sigel as string) || (heldBy?.['@id'] as string) || '—';

    let shelfMark = '—';
    const components = h.hasComponent as Array<Record<string, unknown>> | undefined;
    if (components && components.length > 0) {
      const sm = components[0].shelfMark as Record<string, unknown> | undefined;
      shelfMark = (sm?.label as string) || '—';
    }

    rows.push([truncate(name, 40), sigel, shelfMark]);
  }

  return { markdown: markdownTable(headers, rows), count: holdings.length, raw: holdings };
}

// ---------------------------------------------------------------------------
// K-samsök formatters
// ---------------------------------------------------------------------------

/** Format K-samsök search results. */
export function formatKsamsokResults(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const records = Array.isArray(response?.records) ? response.records : [];
  const totalHits = (response?.totalHits as number) || records.length;

  if (records.length === 0) return { markdown: '_Inga kulturarvsobjekt hittade._', count: 0, raw: [] };

  const headers = ['Namn', 'Typ', 'Institution', 'Plats', 'Tid'];
  const rows: string[][] = [];

  for (const record of records) {
    const rec = record as Record<string, unknown>;
    const place = [rec.municipality, rec.county].filter(Boolean).join(', ') || '—';
    rows.push([
      truncate((rec.itemLabel || rec.itemName) as string, 50),
      String(rec.type || '—'),
      truncate(rec.institution as string, 30),
      truncate(place, 30),
      formatDate(rec.timeLabel as string),
    ]);
  }

  const summary = totalHits > records.length
    ? `\n\n_Visar ${records.length} av ${totalHits} träffar._`
    : '';

  return { markdown: markdownTable(headers, rows) + summary, count: records.length, raw: records };
}

/** Format a single K-samsök object detail view. */
export function formatKsamsokObject(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: '_Inget kulturarvsobjekt hittades._', count: 0, raw: [] };
  }

  const response = data as Record<string, unknown>;
  const record = (response?.record || response) as Record<string, unknown>;

  // Also handle case where records array has one item
  const records = response?.records as unknown[];
  const obj = (records && records.length > 0 ? records[0] : record) as Record<string, unknown>;

  if (!obj || Object.keys(obj).length === 0) {
    return { markdown: '_Inget kulturarvsobjekt hittades._', count: 0, raw: [] };
  }

  const lines: string[] = [];
  lines.push(`## ${obj.itemLabel || obj.itemName || 'Kulturarvsobjekt'}`);
  lines.push('');

  const fields: Array<[string, string]> = [
    ['Typ', String(obj.type || '—')],
    ['Institution', String(obj.institution || '—')],
    ['Kommun', String(obj.municipality || '—')],
    ['Län', String(obj.county || '—')],
    ['Land', String(obj.country || '—')],
    ['Tidsperiod', String(obj.timeLabel || '—')],
    ['Koordinater', String(obj.coordinates || '—')],
  ];

  for (const [label, value] of fields) {
    if (value !== '—') {
      lines.push(`**${label}:** ${value}`);
    }
  }

  if (obj.itemDescription) {
    lines.push('');
    lines.push(`**Beskrivning:** ${obj.itemDescription}`);
  }

  if (obj.thumbnailUrl) {
    lines.push('');
    lines.push(`**Bild:** ${obj.thumbnailUrl}`);
  }

  if (obj.presentationUrl) {
    lines.push(`**Länk:** ${obj.presentationUrl}`);
  }

  if (obj.recordId) {
    lines.push(`**Objekt-ID:** ${obj.recordId}`);
  }

  return { markdown: lines.join('\n'), count: 1, raw: [obj] };
}

// ---------------------------------------------------------------------------
// Swepub formatter
// ---------------------------------------------------------------------------

/** Format Swepub search results (research publications). */
export function formatSwepubResults(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const xsearch = (response?.xsearch || response) as Record<string, unknown>;
  const items = Array.isArray(xsearch?.list) ? xsearch.list : [];
  const totalRecords = (xsearch?.records as number) || items.length;

  if (items.length === 0) return { markdown: '_Inga forskningspublikationer hittade._', count: 0, raw: [] };

  const headers = ['Titel', 'Författare', 'År', 'Typ', 'Källa'];
  const rows: string[][] = [];

  for (const item of items) {
    const rec = item as Record<string, unknown>;
    rows.push([
      truncate(rec.title as string, 60),
      truncate(normalizeArray(rec.creator), 40),
      formatDate(rec.date as string),
      String(rec.type || '—'),
      truncate((rec.source || rec.publisher) as string, 30),
    ]);
  }

  const summary = totalRecords > items.length
    ? `\n\n_Visar ${items.length} av ${totalRecords} träffar._`
    : '';

  return { markdown: markdownTable(headers, rows) + summary, count: items.length, raw: items };
}

export { formatDate, truncate, normalizeArray, markdownTable };
