/**
 * Format Trafikanalys API responses into readable Markdown tables.
 *
 * The Trafikanalys REST API returns data in its own format:
 * - Structure: { StructureItems: [{ Name, Label, Type, StructureItems }] }
 * - Data: { Header: { Column }, Rows: [{ Cell }], Name, ... }
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
// Structure item interface
// ---------------------------------------------------------------------------

interface StructureItem {
  Name?: string;
  Label?: string;
  Type?: string; // P=Product, D=Dimension, M=Measure
  Description?: string;
  StructureItems?: StructureItem[];
  Id?: number;
  UniqueId?: string;
  Option?: boolean;
}

// ---------------------------------------------------------------------------
// Category-specific formatters
// ---------------------------------------------------------------------------

/** Format product list from the structure endpoint (root level). */
export function formatProducts(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  // The structure endpoint returns { StructureItems: [...] } at root level
  // where Type=P items are products
  const obj = data as Record<string, unknown>;
  const items: StructureItem[] = Array.isArray(obj?.StructureItems)
    ? obj.StructureItems
    : Array.isArray(data)
      ? data
      : [];

  // Filter to products (Type=P)
  const products = items.filter((item) => item.Type === 'P');
  if (products.length === 0) return { markdown: '_Inga produkter._', count: 0, raw: [] };

  const headers = ['Produktkod', 'Namn', 'Beskrivning'];
  const rows: string[][] = [];

  for (const item of products) {
    rows.push([
      String(item.Name || item.UniqueId || '—'),
      String(item.Label || '—'),
      String(item.Description || '—'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: products.length, raw: products };
}

/** Format product structure (dimensions and measures). */
export function formatProductStructure(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: '_Ingen produktstruktur._', count: 0, raw: [] };
  }

  const root = data as Record<string, unknown>;
  const allItems: StructureItem[] = Array.isArray(root.StructureItems) ? root.StructureItems : [];

  if (allItems.length === 0) {
    return { markdown: '_Ingen produktstruktur._', count: 0, raw: [] };
  }

  const sections: string[] = [];

  // Find product item (Type=P)
  const product = allItems.find((i) => i.Type === 'P');
  if (product) {
    sections.push(`## ${product.Label || product.Name}`);
    if (product.Description) sections.push(String(product.Description));
  }

  // Dimensions (Type=D)
  const dimensions = allItems.filter((i) => i.Type === 'D');
  if (dimensions.length > 0) {
    sections.push('\n### Dimensioner');
    const dimHeaders = ['Kod', 'Namn', 'Antal värden', 'Exempelvärden'];
    const dimRows: string[][] = [];
    for (const dim of dimensions) {
      const subItems = dim.StructureItems || [];
      const examples = subItems.slice(0, 5).map((s) => s.Label || s.Name || '').filter(Boolean).join(', ');
      dimRows.push([
        String(dim.Name || '—'),
        String(dim.Label || '—'),
        String(subItems.length),
        examples || '—',
      ]);
    }
    sections.push(markdownTable(dimHeaders, dimRows));
  }

  // Measures (Type=M)
  const measures = allItems.filter((i) => i.Type === 'M');
  if (measures.length > 0) {
    sections.push('\n### Mått');
    const measHeaders = ['Kod', 'Namn', 'Beskrivning'];
    const measRows: string[][] = [];
    for (const m of measures) {
      measRows.push([
        String(m.Name || '—'),
        String(m.Label || '—'),
        String(m.Description || '—'),
      ]);
    }
    sections.push(markdownTable(measHeaders, measRows));
  }

  const totalCount = dimensions.length + measures.length;
  return {
    markdown: sections.join('\n') || '_Ingen produktstruktur._',
    count: totalCount,
    raw: [data],
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

  // Trafikanalys data format: { Header: { Column: [...] }, Rows: [{ Cell: [...] }] }
  const header = result.Header as Record<string, unknown> | undefined;
  const headerColumns = Array.isArray(header?.Column) ? header!.Column as Record<string, unknown>[] : [];
  const rows = Array.isArray(result.Rows) ? result.Rows as Record<string, unknown>[] : [];

  // Check for errors
  const errors = Array.isArray(result.Errors) ? result.Errors : [];
  if (errors.length > 0) {
    return {
      markdown: `_Fel från API:t: ${errors.join(', ')}_`,
      count: 0,
      raw: [data],
    };
  }

  if (rows.length > 0) {
    // Build headers from first row's cells
    const firstRow = rows[0];
    const firstCells = Array.isArray(firstRow.Cell) ? firstRow.Cell as Record<string, unknown>[] : [];
    const headers = firstCells.map((cell) => {
      if (cell.IsMeasure) return String(cell.Name || cell.Column || '—');
      return String(cell.Column || cell.Name || '—');
    });

    const tableRows: string[][] = [];
    for (const row of rows) {
      const cells = Array.isArray(row.Cell) ? row.Cell as Record<string, unknown>[] : [];
      const rowValues = cells.map((cell) => {
        if (cell.IsMeasure) {
          return formatNumber(cell.FormattedValue as string || cell.Value as string, 0);
        }
        return String(cell.FormattedValue || cell.Value || '—');
      });
      tableRows.push(rowValues);
    }

    const productName = result.Name || result.OriginalName;
    const prefix = productName ? `**${productName}**\n\n` : '';
    return {
      markdown: prefix + markdownTable(headers, tableRows),
      count: rows.length,
      raw: rows,
    };
  }

  // If columns exist but no rows
  if (headerColumns.length > 0 && rows.length === 0) {
    const productName = result.Name || result.OriginalName;
    return {
      markdown: `**${productName || 'Dataset'}** — _Inga rader. Ange dimensionsfilter (t.ex. ar:senaste)._`,
      count: 0,
      raw: [data],
    };
  }

  // Handle plain array response
  if (Array.isArray(data)) {
    if (data.length === 0) return { markdown: '_Inga data._', count: 0, raw: [] };

    const first = data[0] as Record<string, unknown>;
    const arrHeaders = Object.keys(first);
    const arrRows: string[][] = data.map((item) => {
      const obj = item as Record<string, unknown>;
      return arrHeaders.map((h) => formatNumber(obj[h] as number | string | null));
    });
    return { markdown: markdownTable(arrHeaders, arrRows), count: data.length, raw: data };
  }

  // Fallback: dump as formatted JSON
  const json = JSON.stringify(data, null, 2);
  return { markdown: `\`\`\`json\n${json}\n\`\`\``, count: 1, raw: [data] };
}

export { formatNumber, markdownTable };
