/**
 * Format Riksbank API responses into readable Markdown tables.
 */

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Format a date string for display. */
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  return dateStr;
}

/** Format a number with Swedish locale. */
function formatNumber(value: number | null | undefined, decimals = 4): string {
  if (value == null) return '—';
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

/** Format SWEA observations (interest rates, exchange rates). */
export function formatObservations(
  data: unknown,
  seriesLabel?: string,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga observationer._', count: 0, raw: [] };

  const headers = seriesLabel
    ? ['Datum', seriesLabel]
    : ['Datum', 'Värde'];
  const rows: string[][] = [];

  for (const obs of items) {
    rows.push([
      formatDate(obs.date),
      formatNumber(obs.value, 4),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format latest observations by group (multiple series). */
export function formatGroupObservations(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga observationer._', count: 0, raw: [] };

  const headers = ['Serie', 'Namn', 'Datum', 'Värde', 'Enhet'];
  const rows: string[][] = [];

  for (const obs of items) {
    rows.push([
      String(obs.seriesId || '—'),
      String(obs.seriesName || '—'),
      formatDate(obs.date),
      formatNumber(obs.value, 4),
      String(obs.unit || '—'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format a cross-rate response. */
export function formatCrossRate(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: '_Ingen korskurs._', count: 0, raw: [] };
  }

  const item = data as Record<string, unknown>;
  const headers = ['Serie 1', 'Serie 2', 'Datum', 'Korskurs'];
  const rows = [[
    String(item.seriesId1 || item.series1 || '—'),
    String(item.seriesId2 || item.series2 || '—'),
    formatDate(item.date as string),
    formatNumber(item.value as number ?? item.crossRate as number, 6),
  ]];

  return { markdown: markdownTable(headers, rows), count: 1, raw: [item] };
}

/** Format SWESTR observations. */
export function formatSwestr(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [data];
  const valid = items.filter((item) => item && typeof item === 'object');
  if (valid.length === 0) return { markdown: '_Ingen SWESTR-data._', count: 0, raw: [] };

  const headers = ['Datum', 'Ränta %', 'Pctl 12.5', 'Pctl 87.5', 'Volym MSEK', 'Transaktioner', 'Agenter'];
  const rows: string[][] = [];

  for (const obs of valid) {
    const o = obs as Record<string, unknown>;
    rows.push([
      formatDate(o.date as string),
      formatNumber(o.rate as number, 4),
      formatNumber(o.pctl12_5 as number, 4),
      formatNumber(o.pctl87_5 as number, 4),
      o.volume != null ? String(o.volume) : '—',
      o.numberOfTransactions != null ? String(o.numberOfTransactions) : '—',
      o.numberOfAgents != null ? String(o.numberOfAgents) : '—',
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: valid.length, raw: valid };
}

/** Format forecast data (prognos vs utfall). */
export function formatForecasts(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga prognoser._', count: 0, raw: [] };

  const headers = ['Datum', 'Prognos', 'Utfall'];
  const rows: string[][] = [];

  for (const item of items) {
    const v = item as Record<string, unknown>;
    rows.push([
      formatDate(v.date as string),
      formatNumber(v.forecast as number, 2),
      formatNumber(v.outcome as number, 2),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format indicator list. */
export function formatIndicators(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga indikatorer._', count: 0, raw: [] };

  const headers = ['ID', 'Namn', 'Beskrivning'];
  const rows: string[][] = [];

  for (const item of items) {
    const v = item as Record<string, unknown>;
    rows.push([
      String(v.id || '—'),
      String(v.name || '—'),
      String(v.description || '—'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format a helpful message when the forecasts API is unavailable. */
export function formatForecastsUnavailable(
  category: string,
  indicator: string,
): { markdown: string; count: number; raw: unknown[] } {
  const markdown =
    `⚠️ **Riksbankens prognos-API (forecasts/v1) är för närvarande otillgängligt.**\n\n` +
    `Begärd kategori: **${category}** (indikator: ${indicator})\n\n` +
    `Riksbankens Forecasts API returnerar 404 på alla endpoints sedan en tid tillbaka. ` +
    `SWEA (räntor/valutor) och SWESTR fungerar fortfarande.\n\n` +
    `**Alternativ:**\n` +
    `- Använd \`riksbank_ranta_styrranta\` för aktuell styrränta\n` +
    `- Använd \`riksbank_ranta_marknadsrantor\` för marknadsräntor\n` +
    `- Besök [riksbank.se/prognoser](https://www.riksbank.se/sv/statistik/makroindikatorer/prognoser-och-utfall/) för manuell data`;

  return { markdown, count: 0, raw: [] };
}

export { formatDate, formatNumber, markdownTable };
