/**
 * Format Kolada API responses into readable Markdown tables.
 */

import { COMMON_MUNICIPALITIES } from './types.js';

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

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

/** Resolve municipality ID to name if known. */
function municipalityName(id: string): string {
  return COMMON_MUNICIPALITIES[id] || id;
}

/** Map gender code to Swedish label. */
function genderLabel(code: string | undefined): string {
  if (!code) return '\u2014';
  switch (code) {
    case 'T': return 'Totalt';
    case 'M': return 'M\u00e4n';
    case 'K': return 'Kvinnor';
    default: return code;
  }
}

// ---------------------------------------------------------------------------
// Category-specific formatters
// ---------------------------------------------------------------------------

/** Format KPI search results. */
export function formatKpiLista(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response.values) ? response.values : (Array.isArray(data) ? data : []);
  if (items.length === 0) return { markdown: '_Inga nyckeltal hittades._', count: 0, raw: [] };

  const headers = ['ID', 'Namn', 'Verksamhetsomr\u00e5de'];
  const rows: string[][] = [];

  for (const item of items) {
    const v = item as Record<string, unknown>;
    rows.push([
      String(v.id || '\u2014'),
      String(v.title || '\u2014'),
      String(v.operating_area || '\u2014'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format municipality search results. */
export function formatKommunLista(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response.values) ? response.values : (Array.isArray(data) ? data : []);
  if (items.length === 0) return { markdown: '_Inga kommuner hittades._', count: 0, raw: [] };

  const headers = ['ID', 'Namn', 'Typ'];
  const rows: string[][] = [];

  for (const item of items) {
    const v = item as Record<string, unknown>;
    const typeCode = String(v.type || '');
    const typeLabel = typeCode === 'K' ? 'Kommun' : typeCode === 'L' ? 'L\u00e4n' : typeCode;
    rows.push([
      String(v.id || '\u2014'),
      String(v.title || '\u2014'),
      typeLabel || '\u2014',
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format organizational unit search results. */
export function formatEnhetLista(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response.values) ? response.values : (Array.isArray(data) ? data : []);
  if (items.length === 0) return { markdown: '_Inga enheter hittades._', count: 0, raw: [] };

  const headers = ['ID', 'Namn', 'Kommun'];
  const rows: string[][] = [];

  for (const item of items) {
    const v = item as Record<string, unknown>;
    const kommunId = String(v.municipality || '');
    rows.push([
      String(v.id || '\u2014'),
      String(v.title || '\u2014'),
      municipalityName(kommunId),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format KPI values with municipality names. */
export function formatKpiData(
  data: unknown,
  kpiLabel?: string,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response.values) ? response.values : (Array.isArray(data) ? data : []);
  if (items.length === 0) return { markdown: '_Inga data hittades._', count: 0, raw: [] };

  // Filter to gender=T (Totalt) by default, unless mixed
  const totalItems = items.filter((item) => {
    const v = item as Record<string, unknown>;
    return v.gender === 'T' || !v.gender;
  });
  const displayItems = totalItems.length > 0 ? totalItems : items;

  const headers = kpiLabel
    ? ['Kommun', 'Period', kpiLabel, 'K\u00f6n']
    : ['Kommun', 'Period', 'V\u00e4rde', 'K\u00f6n'];
  const rows: string[][] = [];

  for (const item of displayItems) {
    const v = item as Record<string, unknown>;
    const kommunId = String(v.municipality || v.ou || '\u2014');
    rows.push([
      municipalityName(kommunId),
      String(v.period || '\u2014'),
      formatNumber(v.value as number),
      genderLabel(v.gender as string),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: displayItems.length, raw: displayItems };
}

/** Format KPI metadata. */
export function formatKpiDetalj(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response.values) ? response.values : (Array.isArray(data) ? data : []);
  if (items.length === 0) return { markdown: '_Nyckeltal hittades inte._', count: 0, raw: [] };

  const kpi = items[0] as Record<string, unknown>;
  const lines: string[] = [
    `## ${kpi.title || kpi.id}`,
    '',
    `| F\u00e4lt | V\u00e4rde |`,
    `| --- | --- |`,
    `| **ID** | ${kpi.id || '\u2014'} |`,
    `| **Namn** | ${kpi.title || '\u2014'} |`,
    `| **Beskrivning** | ${kpi.description || '\u2014'} |`,
    `| **Verksamhetsomr\u00e5de** | ${kpi.operating_area || '\u2014'} |`,
    `| **Ansvarig** | ${kpi.auspices || '\u2014'} |`,
    `| **Perspektiv** | ${kpi.perspective || '\u2014'} |`,
    `| **K\u00f6nsuppdelat** | ${kpi.is_divided_by_gender ? 'Ja' : 'Nej'} |`,
    `| **Kommuntyp** | ${kpi.municipality_type || '\u2014'} |`,
    `| **Har enhetsdata** | ${kpi.has_ou_data ? 'Ja' : 'Nej'} |`,
    `| **Publiceringsdatum** | ${kpi.publication_date || '\u2014'} |`,
  ];

  return { markdown: lines.join('\n'), count: 1, raw: [kpi] };
}

/** Format municipality groups. */
export function formatKommunGrupper(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response.values) ? response.values : (Array.isArray(data) ? data : []);
  if (items.length === 0) return { markdown: '_Inga kommungrupper hittades._', count: 0, raw: [] };

  const headers = ['ID', 'Namn', 'Antal medlemmar'];
  const rows: string[][] = [];

  for (const item of items) {
    const v = item as Record<string, unknown>;
    const members = Array.isArray(v.members) ? v.members : [];
    rows.push([
      String(v.id || '\u2014'),
      String(v.title || '\u2014'),
      String(members.length),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format trend data over years. */
export function formatTrend(
  data: unknown,
  kpiLabel?: string,
): { markdown: string; count: number; raw: unknown[] } {
  const response = data as Record<string, unknown>;
  const items = Array.isArray(response.values) ? response.values : (Array.isArray(data) ? data : []);
  if (items.length === 0) return { markdown: '_Inga trenddata hittades._', count: 0, raw: [] };

  // Filter to gender=T and sort by period
  const totalItems = items
    .filter((item) => {
      const v = item as Record<string, unknown>;
      return v.gender === 'T' || !v.gender;
    })
    .sort((a, b) => {
      const pa = String((a as Record<string, unknown>).period || '');
      const pb = String((b as Record<string, unknown>).period || '');
      return pa.localeCompare(pb);
    });
  const displayItems = totalItems.length > 0 ? totalItems : items;

  const headers = kpiLabel
    ? ['\u00c5r', kpiLabel, 'F\u00f6r\u00e4ndring']
    : ['\u00c5r', 'V\u00e4rde', 'F\u00f6r\u00e4ndring'];
  const rows: string[][] = [];

  let prevValue: number | null = null;
  for (const item of displayItems) {
    const v = item as Record<string, unknown>;
    const value = v.value as number | null;
    let change = '\u2014';
    if (prevValue != null && value != null) {
      const diff = value - prevValue;
      const sign = diff >= 0 ? '+' : '';
      change = `${sign}${formatNumber(diff)}`;
    }
    rows.push([
      String(v.period || '\u2014'),
      formatNumber(value),
      change,
    ]);
    prevValue = value;
  }

  return { markdown: markdownTable(headers, rows), count: displayItems.length, raw: displayItems };
}

export { formatNumber, markdownTable };
