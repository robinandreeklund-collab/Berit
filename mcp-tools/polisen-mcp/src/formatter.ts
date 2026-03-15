/**
 * Format Polisen API responses into readable Markdown.
 */

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

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

function truncate(text: string | undefined | null, maxLen = 120): string {
  if (!text) return '—';
  const clean = text.replace(/\n/g, ' ').trim();
  return clean.length > maxLen ? clean.slice(0, maxLen - 3) + '...' : clean;
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    // Polisen format: "2026-03-15 10:00:14 +01:00" or "2026-03-15 8:53:06 +01:00"
    // Convert to ISO 8601: replace first space with T, then handle timezone
    const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}:\d{2})\s+([+-]\d{2}:\d{2})$/);
    if (match) {
      const d = new Date(`${match[1]}T${match[2]}${match[3]}`);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('sv-SE') + ' ' + d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
      }
    }
    // Fallback: try direct parse
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('sv-SE') + ' ' + d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Events formatter
// ---------------------------------------------------------------------------

export function formatEvents(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga polishändelser hittades._', count: 0, raw: [] };

  const headers = ['#', 'Datum', 'Typ', 'Plats', 'Sammanfattning'];
  const rows: string[][] = [];

  for (let i = 0; i < items.length; i++) {
    const event = items[i] as Record<string, unknown>;
    const date = formatDate(event.datetime as string);
    const type = (event.type as string) || '—';
    const location = (event.location as Record<string, unknown>)?.name as string || '—';
    const summary = truncate(event.summary as string, 80);

    rows.push([String(i + 1), date, type, location, summary]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

export { markdownTable, truncate, formatDate };
