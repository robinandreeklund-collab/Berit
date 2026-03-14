/**
 * Format Elpris API responses into readable Markdown tables.
 */

import { PRICE_ZONES } from './types.js';

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  return dateStr;
}

function formatNumber(value: number | null | undefined, decimals = 4): string {
  if (value == null) return '—';
  return value.toFixed(decimals);
}

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
// Format helpers
// ---------------------------------------------------------------------------

function formatTimeRange(timeStart: string): string {
  try {
    const d = new Date(timeStart);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return timeStart;
  }
}

// ---------------------------------------------------------------------------
// Category-specific formatters
// ---------------------------------------------------------------------------

/** Format hourly prices for a single zone. */
export function formatHourlyPrices(
  data: unknown,
  zone: string,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga priser tillgängliga._', count: 0, raw: [] };

  const zoneName = PRICE_ZONES[zone] || zone;
  const headers = ['Tid', 'SEK/kWh', 'EUR/kWh'];
  const rows: string[][] = [];

  for (const p of items) {
    rows.push([
      formatTimeRange(p.time_start),
      formatNumber(p.SEK_per_kWh, 4),
      formatNumber(p.EUR_per_kWh, 4),
    ]);
  }

  // Calculate average
  const avgSek = items.reduce((sum: number, p: Record<string, unknown>) => sum + (p.SEK_per_kWh as number || 0), 0) / items.length;
  const avgEur = items.reduce((sum: number, p: Record<string, unknown>) => sum + (p.EUR_per_kWh as number || 0), 0) / items.length;
  rows.push(['**Snitt**', `**${formatNumber(avgSek, 4)}**`, `**${formatNumber(avgEur, 4)}**`]);

  const header = `**Zon: ${zone} — ${zoneName}**\n\n`;
  return { markdown: header + markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format daily average prices for historical data. */
export function formatDailyAverages(
  dailyData: Array<{ date: string; zone: string; avgSek: number; avgEur: number; minSek: number; maxSek: number; count: number }>,
): { markdown: string; count: number; raw: unknown[] } {
  if (dailyData.length === 0) return { markdown: '_Inga historiska priser._', count: 0, raw: [] };

  const headers = ['Datum', 'Snitt SEK/kWh', 'Min SEK/kWh', 'Max SEK/kWh', 'Antal prispunkter'];
  const rows: string[][] = [];

  for (const day of dailyData) {
    rows.push([
      day.date,
      formatNumber(day.avgSek, 4),
      formatNumber(day.minSek, 4),
      formatNumber(day.maxSek, 4),
      String(day.count),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: dailyData.length, raw: dailyData };
}

/** Format zone comparison. */
export function formatZoneComparison(
  zoneData: Array<{ zone: string; zoneName: string; avgSek: number; minSek: number; maxSek: number; count: number }>,
): { markdown: string; count: number; raw: unknown[] } {
  if (zoneData.length === 0) return { markdown: '_Ingen jämförelsedata._', count: 0, raw: [] };

  const headers = ['Zon', 'Område', 'Snitt SEK/kWh', 'Min SEK/kWh', 'Max SEK/kWh'];
  const rows: string[][] = [];

  for (const z of zoneData) {
    rows.push([
      z.zone,
      z.zoneName,
      formatNumber(z.avgSek, 4),
      formatNumber(z.minSek, 4),
      formatNumber(z.maxSek, 4),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: zoneData.length, raw: zoneData };
}

export { formatDate, formatNumber, markdownTable };
