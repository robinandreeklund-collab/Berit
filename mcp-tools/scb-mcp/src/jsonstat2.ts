/**
 * JSON-stat2 → Markdown decoder
 *
 * Converts SCB PxWebAPI v2 JSON-stat2 responses into readable markdown tables
 * with proper Swedish formatting and label resolution.
 */

import { Dataset } from './types.js';

export interface DecodedTable {
  markdown: string;
  headers: string[];
  rows: Array<Record<string, string | number | null>>;
  totalRows: number;
  truncated: boolean;
  metadata: {
    source: string;
    updated: string | null;
    tableName: string;
    dimensions: Array<{ code: string; label: string; count: number }>;
  };
}

const MAX_DISPLAY_ROWS = 100;

/**
 * Format a number with Swedish-style thousand separators (non-breaking space)
 */
function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return '..';
  if (Number.isInteger(value)) {
    return value.toLocaleString('sv-SE');
  }
  // For decimals, use max 2 decimal places
  return value.toLocaleString('sv-SE', { maximumFractionDigits: 2 });
}

/**
 * Decode a JSON-stat2 dataset into a markdown table
 */
export function decodeJsonStat2ToMarkdown(
  data: Dataset,
  maxRows: number = MAX_DISPLAY_ROWS
): DecodedTable {
  const dimensions = Object.entries(data.dimension || {});
  const values = data.value || [];

  if (dimensions.length === 0 || !values || values.length === 0) {
    return {
      markdown: '*Ingen data tillgänglig*',
      headers: [],
      rows: [],
      totalRows: 0,
      truncated: false,
      metadata: {
        source: data.source || 'SCB',
        updated: data.updated || null,
        tableName: data.label || '',
        dimensions: [],
      },
    };
  }

  // Build dimension info
  const dimInfo = dimensions.map(([code, def]) => ({
    code,
    label: def.label,
    codes: Object.keys(def.category.index),
    labels: def.category.label || {},
    count: Object.keys(def.category.index).length,
  }));

  // Build headers: all dimension labels + "Värde"
  const headers = dimInfo.map(d => d.label);
  headers.push('Värde');

  // Calculate dimension sizes for index mapping
  const dimSizes = dimInfo.map(d => d.count);

  // Build rows
  const allRows: Array<Record<string, string | number | null>> = [];
  const totalDataPoints = values.length;

  for (let flatIndex = 0; flatIndex < totalDataPoints; flatIndex++) {
    const value = values[flatIndex];

    const row: Record<string, string | number | null> = {};
    let temp = flatIndex;

    for (let i = dimensions.length - 1; i >= 0; i--) {
      const dim = dimInfo[i];
      const dimSize = dimSizes[i];
      const dimIndex = temp % dimSize;
      temp = Math.floor(temp / dimSize);

      const code = dim.codes[dimIndex];
      const label = dim.labels[code] || code;
      row[dim.label] = label;
    }

    row['Värde'] = value;
    allRows.push(row);
  }

  const truncated = allRows.length > maxRows;
  const displayRows = truncated ? allRows.slice(0, maxRows) : allRows;

  // Build markdown table
  const headerLine = '| ' + headers.join(' | ') + ' |';
  const separatorLine = '| ' + headers.map(() => '---').join(' | ') + ' |';

  const dataLines = displayRows.map(row => {
    const cells = headers.map(h => {
      const val = row[h];
      if (h === 'Värde') return formatNumber(val as number | null);
      return String(val ?? '');
    });
    return '| ' + cells.join(' | ') + ' |';
  });

  let markdown = [headerLine, separatorLine, ...dataLines].join('\n');

  if (truncated) {
    markdown += `\n\n*Visar ${maxRows} av ${allRows.length} rader. Använd mer specifika filter för fullständig data.*`;
  }

  return {
    markdown,
    headers,
    rows: allRows,
    totalRows: allRows.length,
    truncated,
    metadata: {
      source: data.source || 'SCB',
      updated: data.updated || null,
      tableName: data.label || '',
      dimensions: dimInfo.map(d => ({ code: d.code, label: d.label, count: d.count })),
    },
  };
}
