/**
 * Format OECD SDMX API responses into readable Markdown tables.
 */

import { OECD_CATEGORIES, KNOWN_DATAFLOWS, DATAFLOW_MAP } from './types.js';
import type { OECDCategory, KnownDataflow } from './types.js';

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Format a number with appropriate decimals. */
function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value == null) return '—';
  return value.toFixed(decimals);
}

/** Build a Markdown table from headers and rows. */
export function markdownTable(headers: string[], rows: string[][]): string {
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
// Dataflows formatter
// ---------------------------------------------------------------------------

/** Format a list of dataflows into a markdown table. */
export function formatDataflows(
  dataflows: Array<{ id: string; name?: string; description?: string; category?: string }>,
): { markdown: string; count: number } {
  if (dataflows.length === 0) return { markdown: '_Inga dataset hittades._', count: 0 };

  const headers = ['ID', 'Namn', 'Beskrivning', 'Kategori'];
  const rows: string[][] = dataflows.map((df) => [
    df.id,
    df.name || '—',
    (df.description || '—').slice(0, 80),
    df.category || '—',
  ]);

  return { markdown: markdownTable(headers, rows), count: dataflows.length };
}

// ---------------------------------------------------------------------------
// Data Structure formatter
// ---------------------------------------------------------------------------

/** Format a data structure definition (DSD) into markdown. */
export function formatDataStructure(
  data: unknown,
  dataflowId: string,
): { markdown: string; count: number } {
  if (!data || typeof data !== 'object') {
    return { markdown: `_Ingen metadata hittades för ${dataflowId}._`, count: 0 };
  }

  const response = data as Record<string, unknown>;
  const lines: string[] = [];

  lines.push(`## Dataset: ${dataflowId}`);
  lines.push('');

  // Try to extract structure from SDMX-JSON response
  const structure = response.structure as Record<string, unknown> | undefined;
  const dataStructures = response.data as Record<string, unknown> | undefined;

  if (structure) {
    // Parse from data response structure
    const dims = structure.dimensions as Record<string, unknown> | undefined;
    if (dims) {
      const seriesDims = (dims.series || dims.observation) as Array<Record<string, unknown>> | undefined;
      if (seriesDims && Array.isArray(seriesDims)) {
        lines.push('### Dimensioner');
        lines.push('');

        const headers = ['#', 'ID', 'Namn', 'Antal värden', 'Exempelvärden'];
        const rows: string[][] = [];

        for (const dim of seriesDims) {
          const values = dim.values as Array<Record<string, unknown>> | undefined;
          const exampleValues = values
            ? values.slice(0, 5).map((v) => `${v.id}${v.name ? ` (${v.name})` : ''}`).join(', ')
            : '—';
          rows.push([
            String(dim.keyPosition ?? dim.position ?? '—'),
            String(dim.id || '—'),
            String(dim.name || '—'),
            values ? String(values.length) : '—',
            exampleValues + (values && values.length > 5 ? `, ... (+${values.length - 5})` : ''),
          ]);
        }

        lines.push(markdownTable(headers, rows));
      }
    }
  } else if (dataStructures) {
    // Parse from dataStructures response
    lines.push('_Metadata hämtad. Använd dimensionsinformationen för att bygga filter._');
  }

  // Add known dataflow info if available
  const known = DATAFLOW_MAP[dataflowId];
  if (known) {
    lines.push('');
    lines.push('### Känd information');
    lines.push(`- **Namn:** ${known.name} (${known.nameEn})`);
    lines.push(`- **Beskrivning:** ${known.description}`);
    lines.push(`- **Kategori:** ${known.category}`);
    if (known.commonFilters.length > 0) {
      lines.push(`- **Exempelfilter:** ${known.commonFilters.map((f) => `\`${f}\``).join(', ')}`);
    }
  }

  lines.push('');
  lines.push('### Filterformat');
  lines.push('Dimensioner separeras med punkt (.). Exempel:');
  lines.push('- `SWE..` — Sverige, alla övriga dimensioner');
  lines.push('- `SWE+NOR.GDP..A` — Sverige + Norge, GDP, alla, Årlig');
  lines.push('- Tom dimension = wildcard (alla värden)');
  lines.push('- `+` separerar multipla värden inom en dimension');

  return { markdown: lines.join('\n'), count: 1 };
}

// ---------------------------------------------------------------------------
// SDMX Data formatter (THE KEY FORMATTER)
// ---------------------------------------------------------------------------

/**
 * Parse an SDMX-JSON data response into a markdown table.
 *
 * SDMX-JSON v2.0 structure:
 * - dataSets[0].series[seriesKey].observations[obsKey] = [value, ...]
 * - structure.dimensions.series = dimension definitions
 * - structure.dimensions.observation = time dimension
 */
export function formatSDMXData(
  data: unknown,
  dataflowId: string,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: `_Ingen data hittades för ${dataflowId}._`, count: 0, raw: [] };
  }

  const response = data as Record<string, unknown>;
  const dataSets = response.dataSets as Array<Record<string, unknown>> | undefined;
  const structure = response.structure as Record<string, unknown> | undefined;

  if (!dataSets || dataSets.length === 0 || !structure) {
    return { markdown: `_Ingen data i svaret för ${dataflowId}._`, count: 0, raw: [] };
  }

  // Extract dimension metadata
  const dims = structure.dimensions as Record<string, unknown> | undefined;
  const seriesDims = (dims?.series || []) as Array<Record<string, unknown>>;
  const obsDims = (dims?.observation || []) as Array<Record<string, unknown>>;

  // Build dimension value lookup
  const seriesDimValues: Array<Array<{ id: string; name: string }>> = seriesDims.map((dim) => {
    const values = (dim.values || []) as Array<Record<string, unknown>>;
    return values.map((v) => ({ id: String(v.id || ''), name: String(v.name || v.id || '') }));
  });

  const obsDimValues: Array<Array<{ id: string; name: string }>> = obsDims.map((dim) => {
    const values = (dim.values || []) as Array<Record<string, unknown>>;
    return values.map((v) => ({ id: String(v.id || ''), name: String(v.name || v.id || '') }));
  });

  // Build table rows
  const dimHeaders = seriesDims.map((d) => String(d.name || d.id || ''));
  const timeHeader = obsDims.length > 0 ? String(obsDims[0].name || obsDims[0].id || 'Period') : 'Period';
  const headers = [...dimHeaders, timeHeader, 'Värde'];
  const rows: string[][] = [];
  const rawRows: unknown[] = [];

  const series = dataSets[0].series as Record<string, Record<string, unknown>> | undefined;
  const observations = dataSets[0].observations as Record<string, unknown[]> | undefined;

  if (series) {
    // Series-level data
    for (const [seriesKey, seriesData] of Object.entries(series)) {
      const dimIndices = seriesKey.split(':').map(Number);
      const dimLabels = dimIndices.map((idx, pos) => {
        const vals = seriesDimValues[pos];
        return vals && vals[idx] ? vals[idx].name : String(idx);
      });

      const obs = seriesData.observations as Record<string, unknown[]> | undefined;
      if (obs) {
        for (const [obsKey, obsValues] of Object.entries(obs)) {
          const obsIdx = Number(obsKey);
          const timePeriod = obsDimValues[0] && obsDimValues[0][obsIdx]
            ? obsDimValues[0][obsIdx].id
            : String(obsIdx);
          const value = obsValues[0];

          rows.push([
            ...dimLabels,
            timePeriod,
            value != null ? formatNumber(Number(value)) : '—',
          ]);

          rawRows.push({
            dimensions: Object.fromEntries(
              seriesDims.map((d, i) => [String(d.id), dimIndices[i] !== undefined && seriesDimValues[i]?.[dimIndices[i]] ? seriesDimValues[i][dimIndices[i]].id : dimIndices[i]]),
            ),
            period: timePeriod,
            value: value != null ? Number(value) : null,
          });
        }
      }
    }
  } else if (observations) {
    // Flat observation-level data
    for (const [obsKey, obsValues] of Object.entries(observations)) {
      const indices = obsKey.split(':').map(Number);
      const labels = indices.map((idx, pos) => {
        if (pos < seriesDimValues.length) {
          return seriesDimValues[pos]?.[idx]?.name || String(idx);
        }
        const obsPos = pos - seriesDimValues.length;
        return obsDimValues[obsPos]?.[idx]?.id || String(idx);
      });

      const value = obsValues[0];
      rows.push([
        ...labels,
        value != null ? formatNumber(Number(value)) : '—',
      ]);
    }
  }

  // Limit rows to prevent huge responses
  const MAX_ROWS = 200;
  const truncated = rows.length > MAX_ROWS;
  const displayRows = truncated ? rows.slice(0, MAX_ROWS) : rows;

  let markdown = markdownTable(headers, displayRows);
  if (truncated) {
    markdown += `\n\n_Visar ${MAX_ROWS} av ${rows.length} rader. Använd mer specifika filter för att begränsa resultatet._`;
  }

  return { markdown, count: rows.length, raw: rawRows.slice(0, MAX_ROWS) };
}

// ---------------------------------------------------------------------------
// Categories formatter
// ---------------------------------------------------------------------------

/** Format the 17 OECD categories into a markdown table. */
export function formatCategories(): { markdown: string; count: number } {
  const headers = ['ID', 'Kategori (SV)', 'Category (EN)', 'Beskrivning'];
  const rows: string[][] = OECD_CATEGORIES.map((c) => [
    c.id,
    c.name,
    c.nameEn,
    c.description,
  ]);

  return { markdown: markdownTable(headers, rows), count: OECD_CATEGORIES.length };
}

/** Format detailed categories with example dataflows. */
export function formatCategoriesDetailed(): { markdown: string; count: number } {
  const lines: string[] = ['# OECD Datakategorier — Detaljerad', ''];

  for (const cat of OECD_CATEGORIES) {
    lines.push(`## ${cat.name} (${cat.nameEn})`);
    lines.push(`**ID:** ${cat.id}`);
    lines.push(`**Beskrivning:** ${cat.description}`);
    lines.push('');

    // Find known dataflows in this category
    const catDataflows = KNOWN_DATAFLOWS.filter((d) => d.category === cat.id);
    if (catDataflows.length > 0) {
      lines.push('**Dataset:**');
      for (const df of catDataflows) {
        lines.push(`- \`${df.id}\` — ${df.name}`);
      }
    } else {
      lines.push(`**Exempeldataset:** ${cat.exampleDataflows.map((d) => `\`${d}\``).join(', ')}`);
    }
    lines.push('');
  }

  return { markdown: lines.join('\n'), count: OECD_CATEGORIES.length };
}

// ---------------------------------------------------------------------------
// Popular datasets formatter
// ---------------------------------------------------------------------------

/** Format the curated list of popular datasets. */
export function formatPopularDatasets(): { markdown: string; count: number } {
  const lines: string[] = ['# Populära OECD-dataset', ''];

  const headers = ['ID', 'Namn', 'Beskrivning', 'Kategori', 'Exempelfilter'];
  const rows: string[][] = KNOWN_DATAFLOWS.map((d) => [
    d.id,
    d.name,
    d.description.slice(0, 60),
    d.category,
    d.commonFilters[0] ? `\`${d.commonFilters[0]}\`` : '—',
  ]);

  lines.push(markdownTable(headers, rows));
  lines.push('');
  lines.push('**Tips:** Kör `oecd_get_data_structure` med ett dataset-ID för att se alla dimensioner och filterformat.');

  return { markdown: lines.join('\n'), count: KNOWN_DATAFLOWS.length };
}

export { formatNumber };
