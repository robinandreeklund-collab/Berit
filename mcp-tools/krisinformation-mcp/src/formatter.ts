/**
 * Format Krisinformation API responses into readable Markdown.
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
    const d = new Date(dateStr);
    return d.toLocaleDateString('sv-SE') + ' ' + d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// News articles formatter
// ---------------------------------------------------------------------------

export function formatNews(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga krisnyheter hittades._', count: 0, raw: [] };

  const headers = ['#', 'Rubrik', 'Datum', 'Källa', 'Sammanfattning'];
  const rows: string[][] = [];

  for (let i = 0; i < items.length; i++) {
    const article = items[i] as Record<string, unknown>;
    const headline = (article.Headline as string) || '—';
    const date = formatDate(article.Published as string || article.Updated as string);
    const source = (article.SourceName as string) || '—';
    const preamble = truncate(article.Preamble as string, 80);

    rows.push([String(i + 1), headline, date, source, preamble]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

// ---------------------------------------------------------------------------
// VMA alerts formatter
// ---------------------------------------------------------------------------

export function formatVmas(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga aktiva VMA-varningar._', count: 0, raw: [] };

  const lines: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const vma = items[i] as Record<string, unknown>;
    const headline = (vma.Headline as string) || 'VMA';
    const severity = (vma.Severity as string) || '—';
    const date = formatDate(vma.Published as string || vma.Updated as string);
    const message = (vma.PushMessage as string) || (vma.Preamble as string) || '—';
    const areas = Array.isArray(vma.Area)
      ? vma.Area.map((a: Record<string, unknown>) => a.Description || '').filter(Boolean).join(', ')
      : '—';

    lines.push(
      `### ${i + 1}. ${headline}`,
      '',
      `**Allvarlighetsgrad:** ${severity}`,
      `**Datum:** ${date}`,
      `**Berörda områden:** ${areas}`,
      `**Meddelande:** ${message}`,
      '',
    );
  }

  return { markdown: lines.join('\n'), count: items.length, raw: items };
}

export { markdownTable, truncate, formatDate };
