/**
 * Format Naturvardsverket API responses into readable Markdown tables.
 */

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Format a date string for display. */
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '\u2014';
  return dateStr;
}

/** Format a number with Swedish locale. */
function formatNumber(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '\u2014';
  return value.toFixed(decimals);
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

/** Format a list of protected areas (national, Natura 2000, or Ramsar). */
export function formatOmraden(
  data: unknown,
  source: string,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: `_Inga ${source}-omraden hittades._`, count: 0, raw: [] };

  const headers = ['ID', 'Namn', 'Typ', 'Areal (ha)', 'Lan', 'Kommun'];
  const rows: string[][] = [];

  for (const item of items) {
    const o = item as Record<string, unknown>;
    rows.push([
      String(o.nvrId || o.kod || o.id || '\u2014'),
      String(o.namn || '\u2014'),
      String(o.skyddstyp || source),
      formatNumber(o.areal as number, 1),
      String(o.lan || '\u2014'),
      String(o.kommun || '\u2014'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format detailed info about a protected area. */
export function formatOmradeDetalj(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: '_Inget omrade hittat._', count: 0, raw: [] };
  }

  const item = data as Record<string, unknown>;
  const lines: string[] = [];

  lines.push(`## ${item.namn || 'Okant omrade'}`);
  lines.push('');

  const fields: [string, unknown][] = [
    ['ID', item.nvrId || item.kod || item.id],
    ['Namn', item.namn],
    ['Skyddstyp', item.skyddstyp],
    ['Areal (ha)', item.areal != null ? formatNumber(item.areal as number, 1) : null],
    ['Lan', item.lan],
    ['Kommun', item.kommun],
    ['Beslutsdatum', item.beslutsdatum],
    ['Beskrivning', item.beskrivning],
  ];

  for (const [label, value] of fields) {
    if (value != null && value !== '') {
      lines.push(`- **${label}:** ${value}`);
    }
  }

  return { markdown: lines.join('\n'), count: 1, raw: [item] };
}

/** Format a list of species (Natura 2000). */
export function formatArter(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga arter hittades._', count: 0, raw: [] };

  const headers = ['Vetenskapligt namn', 'Svenskt namn', 'Grupp', 'Bilaga'];
  const rows: string[][] = [];

  for (const item of items) {
    const o = item as Record<string, unknown>;
    rows.push([
      String(o.vetenskapligtNamn || '\u2014'),
      String(o.svensktNamn || '\u2014'),
      String(o.grupp || '\u2014'),
      String(o.bilaga || '\u2014'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format a list of habitat types (Natura 2000). */
export function formatNaturtyper(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga naturtyper hittades._', count: 0, raw: [] };

  const headers = ['Kod', 'Naturtyp', 'Areal (ha)'];
  const rows: string[][] = [];

  for (const item of items) {
    const o = item as Record<string, unknown>;
    rows.push([
      String(o.naturtypskod || '\u2014'),
      String(o.naturtypNamn || '\u2014'),
      formatNumber(o.areal as number, 1),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format purposes (syften) for a national protected area. */
export function formatSyften(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga syften hittades._', count: 0, raw: [] };

  const headers = ['ID', 'Syfte'];
  const rows: string[][] = [];

  for (const item of items) {
    const o = item as Record<string, unknown>;
    rows.push([
      String(o.syfteId || '\u2014'),
      String(o.syftestext || '\u2014'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format NMD land cover classes. */
export function formatNmdKlasser(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga marktackeklasser hittades._', count: 0, raw: [] };

  const headers = ['ID', 'Klass', 'Areal (ha)', 'Andel (%)'];
  const rows: string[][] = [];

  for (const item of items) {
    const o = item as Record<string, unknown>;
    rows.push([
      String(o.nmdKlassId || '\u2014'),
      String(o.nmdKlassNamn || '\u2014'),
      formatNumber(o.areal as number, 1),
      formatNumber(o.andel as number, 1),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format lookup results (kommun/lan). */
export function formatUppslag(
  results: Array<{ kod: string; namn: string }>,
): { markdown: string; count: number; raw: unknown[] } {
  if (results.length === 0) return { markdown: '_Inga matchningar hittades._', count: 0, raw: [] };

  const headers = ['Kod', 'Namn'];
  const rows: string[][] = results.map((r) => [r.kod, r.namn]);

  return { markdown: markdownTable(headers, rows), count: results.length, raw: results };
}

export { formatDate, formatNumber, markdownTable };
