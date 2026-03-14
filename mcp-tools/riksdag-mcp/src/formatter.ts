/**
 * Format Riksdag/Regering API responses into readable Markdown tables.
 */

import { DOKTYP, PARTIER, UTSKOTT } from './types.js';

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Format a date string for display. */
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  return dateStr.slice(0, 10);
}

/** Truncate text to a max length. */
function truncate(text: string | undefined | null, maxLen = 80): string {
  if (!text) return '—';
  const clean = text.replace(/\n/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 3) + '...';
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

/** Format document list from Riksdagen API. */
export function formatDokumentLista(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const resp = data as Record<string, unknown>;
  const lista = resp?.dokumentlista as Record<string, unknown>;
  const items = lista?.dokument;
  const docs = Array.isArray(items) ? items : [];
  if (docs.length === 0) return { markdown: '_Inga dokument hittades._', count: 0, raw: [] };

  const headers = ['Dok-ID', 'Typ', 'RM', 'Titel', 'Datum'];
  const rows: string[][] = [];

  for (const doc of docs) {
    const d = doc as Record<string, unknown>;
    const typ = String(d.doktyp || d.typ || '—');
    rows.push([
      String(d.dok_id || '—'),
      DOKTYP[typ] || typ,
      String(d.rm || '—'),
      truncate(d.titel as string, 60),
      formatDate(d.datum as string),
    ]);
  }

  const total = lista?.['@antal'] || docs.length;
  const md = `**${total} träffar totalt** (visar ${docs.length})\n\n` + markdownTable(headers, rows);
  return { markdown: md, count: docs.length, raw: docs };
}

/** Format person list from Riksdagen API. */
export function formatPersonLista(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const resp = data as Record<string, unknown>;
  const lista = resp?.personlista as Record<string, unknown>;
  const items = lista?.person;
  const persons = Array.isArray(items) ? items : [];
  if (persons.length === 0) return { markdown: '_Inga ledamöter hittades._', count: 0, raw: [] };

  const headers = ['ID', 'Namn', 'Parti', 'Valkrets', 'Status'];
  const rows: string[][] = [];

  for (const p of persons) {
    const person = p as Record<string, unknown>;
    const namn = [person.tilltalsnamn || person.förnamn || '', person.efternamn || ''].join(' ').trim();
    const parti = String(person.parti || '—');
    rows.push([
      String(person.intressent_id || '—'),
      namn || '—',
      PARTIER[parti] || parti,
      String(person.valkrets || '—'),
      String(person.status || '—'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: persons.length, raw: persons };
}

/** Format speech list from Riksdagen API. */
export function formatAnförandeLista(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const resp = data as Record<string, unknown>;
  const lista = resp?.anforandelista as Record<string, unknown>;
  const items = lista?.anforande;
  const speeches = Array.isArray(items) ? items : [];
  if (speeches.length === 0) return { markdown: '_Inga anföranden hittades._', count: 0, raw: [] };

  const headers = ['Datum', 'Talare', 'Parti', 'Ämne', 'Dok-ID'];
  const rows: string[][] = [];

  for (const s of speeches) {
    const speech = s as Record<string, unknown>;
    const parti = String(speech.parti || '—');
    rows.push([
      formatDate(speech.datum as string),
      String(speech.talare || '—'),
      PARTIER[parti] || parti,
      truncate(speech.avsnittsrubrik as string || speech.dok_titel as string, 50),
      String(speech.dok_id || '—'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: speeches.length, raw: speeches };
}

/** Format voting list from Riksdagen API. */
export function formatVoteringLista(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const resp = data as Record<string, unknown>;
  const lista = resp?.voteringlista as Record<string, unknown>;
  const items = lista?.votering;
  const votes = Array.isArray(items) ? items : [];
  if (votes.length === 0) return { markdown: '_Inga voteringar hittades._', count: 0, raw: [] };

  const headers = ['Datum', 'RM', 'Beteckning', 'Punkt', 'Namn', 'Parti', 'Röst'];
  const rows: string[][] = [];

  for (const v of votes) {
    const vote = v as Record<string, unknown>;
    const parti = String(vote.parti || '—');
    rows.push([
      formatDate(vote.datum as string),
      String(vote.rm || '—'),
      String(vote.beteckning || '—'),
      String(vote.punkt || '—'),
      String(vote.namn || '—'),
      PARTIER[parti] || parti,
      String(vote.rost || '—'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: votes.length, raw: votes };
}

/** Format a single document from Riksdagen API. */
export function formatDokument(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: '_Dokumentet hittades inte._', count: 0, raw: [] };
  }

  const resp = data as Record<string, unknown>;
  const doc = (resp.dokumentstatus as Record<string, unknown>)?.dokument as Record<string, unknown> || resp;

  const typ = String(doc.doktyp || doc.typ || '—');
  const lines: string[] = [
    `## ${doc.titel || 'Okänt dokument'}`,
    '',
    `| Fält | Värde |`,
    `| --- | --- |`,
    `| **Dok-ID** | ${doc.dok_id || '—'} |`,
    `| **Typ** | ${DOKTYP[typ] || typ} |`,
    `| **RM** | ${doc.rm || '—'} |`,
    `| **Beteckning** | ${doc.beteckning || '—'} |`,
    `| **Organ** | ${doc.organ || '—'} |`,
    `| **Datum** | ${formatDate(doc.datum as string)} |`,
    `| **Publicerad** | ${formatDate(doc.publicerad as string)} |`,
  ];

  if (doc.undertitel) {
    lines.push('', `**Undertitel:** ${doc.undertitel}`);
  }

  if (doc.summary) {
    lines.push('', `**Sammanfattning:** ${truncate(doc.summary as string, 500)}`);
  }

  if (doc.dokument_url_html) {
    lines.push('', `**Länk:** ${doc.dokument_url_html}`);
  }

  return { markdown: lines.join('\n'), count: 1, raw: [doc] };
}

/** Format government documents from g0v.se. */
export function formatG0vDokument(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga regeringsdokument hittades._', count: 0, raw: [] };

  const headers = ['Datum', 'Typ', 'Titel', 'Departement', 'Länk'];
  const rows: string[][] = [];

  for (const item of items) {
    const d = item as Record<string, unknown>;
    rows.push([
      formatDate(d.published as string),
      String(d.type || '—'),
      truncate(d.title as string, 60),
      String(d.department || '—'),
      d.url ? `[Läs](${d.url})` : '—',
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format calendar events. */
export function formatKalender(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const resp = data as Record<string, unknown>;
  const lista = resp?.kalender as Record<string, unknown>;
  const items = lista?.händelse || lista?.handelse;
  const events = Array.isArray(items) ? items : [];
  if (events.length === 0) return { markdown: '_Inga kalenderhändelser hittades._', count: 0, raw: [] };

  const headers = ['Datum', 'Tid', 'Typ', 'Beskrivning', 'Plats'];
  const rows: string[][] = [];

  for (const e of events) {
    const event = e as Record<string, unknown>;
    rows.push([
      formatDate(event.datum as string),
      String(event.tid || '—'),
      String(event.typ || '—'),
      truncate(event.summary as string || event.beskrivning as string, 60),
      String(event.plats || '—'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: events.length, raw: events };
}

/** Format the committee list. */
export function formatUtskott(): { markdown: string; count: number; raw: unknown[] } {
  const headers = ['Förkortning', 'Namn'];
  const rows: string[][] = [];

  for (const [key, name] of Object.entries(UTSKOTT)) {
    rows.push([key, name]);
  }

  return {
    markdown: `## Riksdagens utskott\n\n` + markdownTable(headers, rows),
    count: Object.keys(UTSKOTT).length,
    raw: Object.entries(UTSKOTT).map(([id, namn]) => ({ id, namn })),
  };
}

export { formatDate, truncate, markdownTable };
