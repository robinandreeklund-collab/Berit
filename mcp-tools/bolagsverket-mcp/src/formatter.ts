/**
 * Format Bolagsverket API responses into readable Markdown tables.
 */

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  return dateStr;
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

function boolStr(val: boolean | undefined | null): string {
  if (val == null) return '—';
  return val ? 'Ja' : 'Nej';
}

// ---------------------------------------------------------------------------
// Category-specific formatters
// ---------------------------------------------------------------------------

/** Format organisation overview. */
export function formatOrganisation(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: '_Ingen organisation hittad._', count: 0, raw: [] };
  }

  const org = data as Record<string, unknown>;
  const lines: string[] = [];

  lines.push(`## ${org.foretagsnamn || 'Okänt företag'}`);
  lines.push('');

  const headers = ['Fält', 'Värde'];
  const rows: string[][] = [];

  rows.push(['Organisationsnummer', String(org.organisationsnummer || '—')]);
  rows.push(['Företagsnamn', String(org.foretagsnamn || '—')]);
  rows.push(['Juridisk form', String(org.juridiskForm || '—')]);
  rows.push(['Status', String(org.status || '—')]);
  if (org.verksamhetsbeskrivning) rows.push(['Verksamhet', String(org.verksamhetsbeskrivning)]);
  if (org.registreringsdatum) rows.push(['Registreringsdatum', formatDate(org.registreringsdatum as string)]);

  const sniKoder = org.sniKoder as string[] | undefined;
  if (sniKoder && sniKoder.length > 0) {
    rows.push(['SNI-koder', sniKoder.join(', ')]);
  }

  lines.push(markdownTable(headers, rows));

  return { markdown: lines.join('\n'), count: 1, raw: [org] };
}

/** Format detailed grunddata. */
export function formatGrunddata(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: '_Ingen grunddata hittad._', count: 0, raw: [] };
  }

  const org = data as Record<string, unknown>;
  const lines: string[] = [];

  lines.push(`## Grunddata — ${org.foretagsnamn || 'Okänt företag'}`);
  lines.push('');

  const headers = ['Fält', 'Värde'];
  const rows: string[][] = [];

  rows.push(['Organisationsnummer', String(org.organisationsnummer || '—')]);

  const adress = org.adress as Record<string, unknown> | undefined;
  if (adress) {
    const addrStr = [adress.gatuadress, adress.postnummer, adress.postort].filter(Boolean).join(', ');
    rows.push(['Postadress', addrStr || '—']);
  }

  const besok = org.besoksadress as Record<string, unknown> | undefined;
  if (besok) {
    const besokStr = [besok.gatuadress, besok.postnummer, besok.postort].filter(Boolean).join(', ');
    rows.push(['Besöksadress', besokStr || '—']);
  }

  if (org.aktiekapital != null) rows.push(['Aktiekapital', `${org.aktiekapital} SEK`]);
  if (org.firmateckning) rows.push(['Firmateckning', String(org.firmateckning)]);
  if (org.teckningsratt) rows.push(['Teckningsrätt', String(org.teckningsratt)]);
  if (org.verksamhetsbeskrivning) rows.push(['Verksamhet', String(org.verksamhetsbeskrivning)]);

  lines.push(markdownTable(headers, rows));

  return { markdown: lines.join('\n'), count: 1, raw: [org] };
}

/** Format funktionärer/styrelse. */
export function formatFunktionarer(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: '_Ingen information om funktionärer._', count: 0, raw: [] };
  }

  const org = data as Record<string, unknown>;
  const funktionarer = org.funktionarer as Array<Record<string, unknown>> | undefined;

  if (!funktionarer || funktionarer.length === 0) {
    return { markdown: '_Inga funktionärer registrerade._', count: 0, raw: [] };
  }

  const lines: string[] = [];
  lines.push(`## Styrelse & Funktionärer — ${org.foretagsnamn || 'Okänt företag'}`);
  lines.push('');

  const headers = ['Namn', 'Befattning', 'Roll', 'Tillträde'];
  const rows: string[][] = [];

  for (const f of funktionarer) {
    rows.push([
      String(f.namn || '—'),
      String(f.befattning || '—'),
      String(f.roll || '—'),
      formatDate(f.tilltradesdatum as string),
    ]);
  }

  lines.push(markdownTable(headers, rows));

  return { markdown: lines.join('\n'), count: funktionarer.length, raw: funktionarer };
}

/** Format registreringsstatus. */
export function formatRegistrering(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: '_Ingen registreringsinformation._', count: 0, raw: [] };
  }

  const org = data as Record<string, unknown>;
  const lines: string[] = [];

  lines.push(`## Registreringsstatus — ${org.foretagsnamn || 'Okänt företag'}`);
  lines.push('');

  const headers = ['Registrering', 'Status'];
  const rows: string[][] = [
    ['F-skattsedel', boolStr(org.fskatt as boolean | undefined)],
    ['Momsregistrerad', boolStr(org.momsRegistrerad as boolean | undefined)],
    ['Arbetsgivare', boolStr(org.arbetsgivare as boolean | undefined)],
  ];

  lines.push(markdownTable(headers, rows));

  return { markdown: lines.join('\n'), count: 1, raw: [org] };
}

/** Format document list. */
export function formatDokumentlista(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return { markdown: '_Inga dokument hittade._', count: 0, raw: [] };

  const headers = ['Dokument-ID', 'Typ', 'Datum', 'Beskrivning', 'Räkenskapsår'];
  const rows: string[][] = [];

  for (const doc of items) {
    const d = doc as Record<string, unknown>;
    rows.push([
      String(d.dokumentId || '—'),
      String(d.dokumenttyp || '—'),
      formatDate(d.datum as string),
      String(d.beskrivning || '—'),
      String(d.rakenskapsar || '—'),
    ]);
  }

  return { markdown: markdownTable(headers, rows), count: items.length, raw: items };
}

/** Format single document info. */
export function formatDokument(
  data: unknown,
): { markdown: string; count: number; raw: unknown[] } {
  if (!data || typeof data !== 'object') {
    return { markdown: '_Dokument hittades inte._', count: 0, raw: [] };
  }

  const doc = data as Record<string, unknown>;
  const headers = ['Fält', 'Värde'];
  const rows: string[][] = [];

  if (doc.dokumentId) rows.push(['Dokument-ID', String(doc.dokumentId)]);
  if (doc.dokumenttyp) rows.push(['Typ', String(doc.dokumenttyp)]);
  if (doc.datum) rows.push(['Datum', formatDate(doc.datum as string)]);
  if (doc.beskrivning) rows.push(['Beskrivning', String(doc.beskrivning)]);
  if (doc.rakenskapsar) rows.push(['Räkenskapsår', String(doc.rakenskapsar)]);

  return { markdown: markdownTable(headers, rows), count: 1, raw: [doc] };
}

export { formatDate, markdownTable };
