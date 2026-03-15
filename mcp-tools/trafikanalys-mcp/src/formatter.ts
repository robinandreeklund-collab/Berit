/**
 * Format Trafikanalys API responses into readable Markdown tables.
 */

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Format a number with Swedish locale. */
function formatNumber(value: number | string | null | undefined, decimals = 0): string {
  if (value == null) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString('sv-SE', { maximumFractionDigits: decimals });
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

/** Format product list from the structure endpoint. */
export function formatProducts(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga produkter._', count: 0, raw: [] };

  const headers = ['Produktkod', 'Namn', 'Beskrivning'];
  const rows: string[][] = [];

  for (const item of items) {
    const p = item as Record<string, unknown>;
    rows.push([
      String(p.code || p.id || '—'),
      String(p.name || p.label || '—'),
      String(p.description || '—'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format product structure (dimensions and measures). */
export function formatProductStructure(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: '_Ingen produktstruktur._', count: 0, raw: [] };
  }

  const product = data as Record<string, unknown>;
  const sections: string[] = [];

  // Product info
  if (product.name || product.code) {
    sections.push(`## ${product.name || product.code}`);
    if (product.description) sections.push(String(product.description));
  }

  // Dimensions
  const dimensions = Array.isArray(product.dimensions) ? product.dimensions : [];
  if (dimensions.length > 0) {
    sections.push('\n### Dimensioner');
    const dimHeaders = ['Kod', 'Namn', 'Antal värden'];
    const dimRows: string[][] = [];
    for (const dim of dimensions) {
      const d = dim as Record<string, unknown>;
      const values = Array.isArray(d.values) ? d.values : [];
      dimRows.push([
        String(d.code || '—'),
        String(d.name || '—'),
        String(values.length),
      ]);
    }
    sections.push(markdownTable(dimHeaders, dimRows));
  }

  // Measures
  const measures = Array.isArray(product.measures) ? product.measures : [];
  if (measures.length > 0) {
    sections.push('\n### Mått');
    const measHeaders = ['Kod', 'Namn'];
    const measRows: string[][] = [];
    for (const m of measures) {
      const meas = m as Record<string, unknown>;
      measRows.push([
        String(meas.code || '—'),
        String(meas.name || '—'),
      ]);
    }
    sections.push(markdownTable(measHeaders, measRows));
  }

  const totalCount = dimensions.length + measures.length;
  return {
    markdown: sections.join('\n') || '_Ingen produktstruktur._',
    count: totalCount,
    raw: [product],
  };
}

/** Format data results from the data endpoint. */
export function formatDataResults(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: '_Inga data._', count: 0, raw: [] };
  }

  const result = data as Record<string, unknown>;

  // Handle array of data rows with columns
  const columns = Array.isArray(result.columns) ? result.columns.map(String) : [];
  const dataRows = Array.isArray(result.data) ? result.data : [];

  if (columns.length > 0 && dataRows.length > 0) {
    const rows: string[][] = [];
    for (const row of dataRows) {
      const r = row as Record<string, unknown>;
      const key = Array.isArray(r.key) ? r.key.map(String) : [];
      const values = Array.isArray(r.values)
        ? r.values.map((v: unknown) => {
            const cell = v as Record<string, unknown>;
            return formatNumber(cell.value as number | string | null);
          })
        : [];
      rows.push([...key, ...values]);
    }
    return { markdown: markdownTable(columns, rows), count: dataRows.length, raw: dataRows };
  }

  // Handle plain array response
  if (Array.isArray(data)) {
    if (data.length === 0) return { markdown: '_Inga data._', count: 0, raw: [] };

    // Try to infer columns from first row
    const first = data[0] as Record<string, unknown>;
    const headers = Object.keys(first);
    const rows: string[][] = data.map((item) => {
      const obj = item as Record<string, unknown>;
      return headers.map((h) => formatNumber(obj[h] as number | string | null));
    });
    return { markdown: markdownTable(headers, rows), count: data.length, raw: data };
  }

  // Fallback: dump as formatted JSON
  const json = JSON.stringify(data, null, 2);
  return { markdown: `\`\`\`json\n${json}\n\`\`\``, count: 1, raw: [data] };
}

export { formatNumber, markdownTable };
