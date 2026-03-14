/**
 * Format SMHI API responses into readable Markdown tables.
 */

import { FORECAST_PARAMETERS, WEATHER_SYMBOLS, MESAN_PARAMETERS, FIRE_RISK_PARAMETERS } from './types.js';

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Format a number with fixed decimals. */
function formatNumber(value: number | null | undefined, decimals = 1): string {
  if (value == null || isNaN(value)) return '—';
  return value.toFixed(decimals);
}

/** Format a Unix timestamp (ms) to ISO date string. */
function formatUnixDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 16).replace('T', ' ');
}

/** Format an ISO date string for display. */
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  return dateStr.replace('T', ' ').replace('Z', '');
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
// Forecast formatters
// ---------------------------------------------------------------------------

/** Format weather forecast (metfcst PMP3g) response. */
export function formatWeatherForecast(
  data: unknown,
): { markdown: string; count: number; raw: unknown } {
  const forecast = data as Record<string, unknown>;
  if (!forecast || !forecast.timeSeries) {
    return { markdown: '_Ingen prognosdata._', count: 0, raw: data };
  }

  const timeSeries = forecast.timeSeries as Array<Record<string, unknown>>;
  const approvedTime = formatDate(forecast.approvedTime as string);
  const geo = forecast.geometry as Record<string, unknown>;
  const coords = (geo?.coordinates as number[][])?.[0] || [];

  // Extract key parameters for the first 24 entries (roughly 24h for hourly data)
  const limit = Math.min(timeSeries.length, 24);
  const headers = ['Tid', 'Temp °C', 'Vind m/s', 'Byvind', 'Nederb mm/h', 'Moln %', 'Väder'];
  const rows: string[][] = [];

  for (let i = 0; i < limit; i++) {
    const ts = timeSeries[i];
    const validTime = formatDate(ts.validTime as string);
    const params = ts.parameters as Array<Record<string, unknown>>;

    const getParam = (name: string): number | null => {
      const p = params.find((p) => p.name === name);
      return p ? (p.values as number[])[0] : null;
    };

    const wsymb = getParam('Wsymb2');
    const weatherText = wsymb != null ? (WEATHER_SYMBOLS[wsymb] || String(wsymb)) : '—';

    rows.push([
      validTime.slice(5), // MM-DD HH:MM
      formatNumber(getParam('t')),
      formatNumber(getParam('ws')),
      formatNumber(getParam('gust')),
      formatNumber(getParam('pmean'), 2),
      formatNumber(getParam('tcc_mean'), 0),
      weatherText,
    ]);
  }

  const header =
    `**Väderprognos** — Godkänd: ${approvedTime}\n` +
    `Koordinater: ${coords[1]?.toFixed(4) || '?'}°N, ${coords[0]?.toFixed(4) || '?'}°E\n` +
    `Visar ${limit} av ${timeSeries.length} tidssteg\n\n`;

  return {
    markdown: header + markdownTable(headers, rows),
    count: timeSeries.length,
    raw: data,
  };
}

/** Format snow forecast response. */
export function formatSnowForecast(
  data: unknown,
): { markdown: string; count: number; raw: unknown } {
  const forecast = data as Record<string, unknown>;
  if (!forecast || !forecast.timeSeries) {
    return { markdown: '_Ingen snöprognosdata._', count: 0, raw: data };
  }

  const timeSeries = forecast.timeSeries as Array<Record<string, unknown>>;
  const approvedTime = formatDate(forecast.approvedTime as string);
  const limit = Math.min(timeSeries.length, 24);
  const headers = ['Tid', 'Parameter', 'Värde', 'Enhet'];
  const rows: string[][] = [];

  for (let i = 0; i < limit; i++) {
    const ts = timeSeries[i];
    const validTime = formatDate(ts.validTime as string);
    const params = ts.parameters as Array<Record<string, unknown>>;

    for (const p of params) {
      rows.push([
        validTime.slice(5),
        String(p.name || '—'),
        formatNumber((p.values as number[])?.[0]),
        String(p.unit || '—'),
      ]);
    }
  }

  const header = `**Snöprognos** — Godkänd: ${approvedTime}\nVisar ${limit} av ${timeSeries.length} tidssteg\n\n`;
  return { markdown: header + markdownTable(headers, rows), count: timeSeries.length, raw: data };
}

/** Format MESAN analysis response. */
export function formatMesanAnalysis(
  data: unknown,
): { markdown: string; count: number; raw: unknown } {
  const analysis = data as Record<string, unknown>;
  if (!analysis || !analysis.timeSeries) {
    return { markdown: '_Ingen analysdata._', count: 0, raw: data };
  }

  const timeSeries = analysis.timeSeries as Array<Record<string, unknown>>;
  const approvedTime = formatDate(analysis.approvedTime as string);
  const geo = analysis.geometry as Record<string, unknown>;
  const coords = (geo?.coordinates as number[][])?.[0] || [];

  // Show the latest time step with all parameters
  const latest = timeSeries[timeSeries.length - 1];
  const validTime = formatDate(latest?.validTime as string);
  const params = (latest?.parameters as Array<Record<string, unknown>>) || [];

  const headers = ['Parameter', 'Beskrivning', 'Värde', 'Enhet'];
  const rows: string[][] = [];

  for (const p of params) {
    const name = String(p.name || '—');
    const desc = MESAN_PARAMETERS[name] || FORECAST_PARAMETERS[name] || name;
    rows.push([
      name,
      desc,
      formatNumber((p.values as number[])?.[0], 2),
      String(p.unit || '—'),
    ]);
  }

  const header =
    `**MESAN Väderanalys** — Godkänd: ${approvedTime}\n` +
    `Koordinater: ${coords[1]?.toFixed(4) || '?'}°N, ${coords[0]?.toFixed(4) || '?'}°E\n` +
    `Gäller: ${validTime}\n\n`;

  return { markdown: header + markdownTable(headers, rows), count: params.length, raw: data };
}

// ---------------------------------------------------------------------------
// Observation formatters
// ---------------------------------------------------------------------------

/** Format meteorological observation data. */
export function formatMetobs(
  data: unknown,
): { markdown: string; count: number; raw: unknown } {
  const obs = data as Record<string, unknown>;
  if (!obs) {
    return { markdown: '_Ingen observationsdata._', count: 0, raw: data };
  }

  const station = obs.station as Record<string, unknown>;
  const parameter = obs.parameter as Record<string, unknown>;
  const period = obs.period as Record<string, unknown>;
  const values = (obs.value as Array<Record<string, unknown>>) || [];

  const stationName = station?.name || '—';
  const paramName = parameter?.name || '—';
  const paramUnit = parameter?.unit || '—';

  const limit = Math.min(values.length, 48);
  const headers = ['Tid', `${paramName} (${paramUnit})`, 'Kvalitet'];
  const rows: string[][] = [];

  for (let i = values.length - limit; i < values.length; i++) {
    const v = values[i];
    rows.push([
      formatUnixDate(v.date as number),
      String(v.value || '—'),
      String(v.quality || '—'),
    ]);
  }

  const header =
    `**Väderobservationer** — Station: ${stationName}\n` +
    `Parameter: ${paramName} (${paramUnit})\n` +
    `Period: ${period?.key || '—'}\n` +
    `Visar ${limit} av ${values.length} mätningar\n\n`;

  return { markdown: header + markdownTable(headers, rows), count: values.length, raw: data };
}

/** Format station list response. */
export function formatStationList(
  data: unknown,
): { markdown: string; count: number; raw: unknown } {
  const response = data as Record<string, unknown>;
  if (!response) {
    return { markdown: '_Inga stationer._', count: 0, raw: data };
  }

  const stations = (response.station as Array<Record<string, unknown>>) || [];
  const paramName = (response as Record<string, unknown>).title || '—';

  // Filter active stations and limit
  const activeStations = stations.filter((s) => s.active !== false);
  const limit = Math.min(activeStations.length, 50);

  const headers = ['ID', 'Namn', 'Lat', 'Lon', 'Höjd (m)', 'Aktiv'];
  const rows: string[][] = [];

  for (let i = 0; i < limit; i++) {
    const s = activeStations[i];
    rows.push([
      String(s.key || s.id || '—'),
      String(s.name || '—'),
      formatNumber(s.latitude as number, 4),
      formatNumber(s.longitude as number, 4),
      s.height != null ? String(s.height) : '—',
      s.active !== false ? 'Ja' : 'Nej',
    ]);
  }

  const header =
    `**Mätstationer** — ${paramName}\n` +
    `Visar ${limit} av ${activeStations.length} aktiva stationer (${stations.length} totalt)\n\n`;

  return { markdown: header + markdownTable(headers, rows), count: activeStations.length, raw: data };
}

/** Format hydrological observation data. */
export function formatHydroobs(
  data: unknown,
): { markdown: string; count: number; raw: unknown } {
  const obs = data as Record<string, unknown>;
  if (!obs) {
    return { markdown: '_Ingen hydrologisk data._', count: 0, raw: data };
  }

  const station = obs.station as Record<string, unknown>;
  const parameter = obs.parameter as Record<string, unknown>;
  const values = (obs.value as Array<Record<string, unknown>>) || [];

  const stationName = station?.name || '—';
  const paramName = parameter?.name || '—';
  const paramUnit = parameter?.unit || '—';

  const limit = Math.min(values.length, 48);
  const headers = ['Tid', `${paramName} (${paramUnit})`, 'Kvalitet'];
  const rows: string[][] = [];

  for (let i = values.length - limit; i < values.length; i++) {
    const v = values[i];
    rows.push([
      formatUnixDate(v.date as number),
      String(v.value || '—'),
      String(v.quality || '—'),
    ]);
  }

  const header =
    `**Hydrologiska observationer** — Station: ${stationName}\n` +
    `Parameter: ${paramName} (${paramUnit})\n` +
    `Visar ${limit} av ${values.length} mätningar\n\n`;

  return { markdown: header + markdownTable(headers, rows), count: values.length, raw: data };
}

/** Format oceanographic observation data. */
export function formatOcobs(
  data: unknown,
): { markdown: string; count: number; raw: unknown } {
  const obs = data as Record<string, unknown>;
  if (!obs) {
    return { markdown: '_Ingen oceanografisk data._', count: 0, raw: data };
  }

  const station = obs.station as Record<string, unknown>;
  const parameter = obs.parameter as Record<string, unknown>;
  const values = (obs.value as Array<Record<string, unknown>>) || [];

  const stationName = station?.name || '—';
  const paramName = parameter?.name || '—';
  const paramUnit = parameter?.unit || '—';

  const limit = Math.min(values.length, 48);
  const headers = ['Tid', `${paramName} (${paramUnit})`, 'Kvalitet'];
  const rows: string[][] = [];

  for (let i = values.length - limit; i < values.length; i++) {
    const v = values[i];
    rows.push([
      formatUnixDate(v.date as number),
      String(v.value || '—'),
      String(v.quality || '—'),
    ]);
  }

  const header =
    `**Oceanografiska observationer** — Station: ${stationName}\n` +
    `Parameter: ${paramName} (${paramUnit})\n` +
    `Visar ${limit} av ${values.length} mätningar\n\n`;

  return { markdown: header + markdownTable(headers, rows), count: values.length, raw: data };
}

/** Format hydrological prediction data. */
export function formatHydroPrediction(
  data: unknown,
): { markdown: string; count: number; raw: unknown } {
  const pred = data as Record<string, unknown>;
  if (!pred || !pred.timeSeries) {
    return { markdown: '_Ingen hydrologisk prognosdata._', count: 0, raw: data };
  }

  const timeSeries = pred.timeSeries as Array<Record<string, unknown>>;
  const approvedTime = formatDate(pred.approvedTime as string);
  const limit = Math.min(timeSeries.length, 24);

  const headers = ['Tid', 'Parameter', 'Värde', 'Enhet'];
  const rows: string[][] = [];

  for (let i = 0; i < limit; i++) {
    const ts = timeSeries[i];
    const validTime = formatDate(ts.validTime as string);
    const params = ts.parameters as Array<Record<string, unknown>>;

    for (const p of params) {
      rows.push([
        validTime.slice(5),
        String(p.name || '—'),
        formatNumber((p.values as number[])?.[0], 2),
        String(p.unit || '—'),
      ]);
    }
  }

  const header = `**Hydrologisk prognos** — Godkänd: ${approvedTime}\nVisar ${limit} av ${timeSeries.length} tidssteg\n\n`;
  return { markdown: header + markdownTable(headers, rows), count: timeSeries.length, raw: data };
}

// ---------------------------------------------------------------------------
// Fire risk formatters
// ---------------------------------------------------------------------------

/** Format fire risk forecast response. */
export function formatFireRiskForecast(
  data: unknown,
): { markdown: string; count: number; raw: unknown } {
  const forecast = data as Record<string, unknown>;
  if (!forecast || !forecast.timeSeries) {
    return { markdown: '_Ingen brandriskprognosdata._', count: 0, raw: data };
  }

  const timeSeries = forecast.timeSeries as Array<Record<string, unknown>>;
  const approvedTime = formatDate(forecast.approvedTime as string);
  const geo = forecast.geometry as Record<string, unknown>;
  const coords = (geo?.coordinates as number[][])?.[0] || [];
  const limit = Math.min(timeSeries.length, 14);

  const headers = ['Tid', 'FWI', 'ISI', 'BUI', 'FFMC', 'Skogstorka', 'Gräsbrand'];
  const rows: string[][] = [];

  for (let i = 0; i < limit; i++) {
    const ts = timeSeries[i];
    const validTime = formatDate(ts.validTime as string);
    const params = ts.parameters as Array<Record<string, unknown>>;

    const getParam = (name: string): number | null => {
      const p = params.find((p) => p.name === name);
      return p ? (p.values as number[])[0] : null;
    };

    rows.push([
      validTime.slice(0, 10),
      formatNumber(getParam('fwi')),
      formatNumber(getParam('isi')),
      formatNumber(getParam('bui')),
      formatNumber(getParam('ffmc')),
      formatNumber(getParam('forestdry')),
      formatNumber(getParam('grassfire')),
    ]);
  }

  const header =
    `**Brandriskprognos (FWI)** — Godkänd: ${approvedTime}\n` +
    `Koordinater: ${coords[1]?.toFixed(4) || '?'}°N, ${coords[0]?.toFixed(4) || '?'}°E\n` +
    `Visar ${limit} av ${timeSeries.length} dagar\n\n`;

  return { markdown: header + markdownTable(headers, rows), count: timeSeries.length, raw: data };
}

/** Format fire risk analysis response. */
export function formatFireRiskAnalysis(
  data: unknown,
): { markdown: string; count: number; raw: unknown } {
  const analysis = data as Record<string, unknown>;
  if (!analysis || !analysis.timeSeries) {
    return { markdown: '_Ingen brandriskanalysdata._', count: 0, raw: data };
  }

  const timeSeries = analysis.timeSeries as Array<Record<string, unknown>>;
  const approvedTime = formatDate(analysis.approvedTime as string);
  const geo = analysis.geometry as Record<string, unknown>;
  const coords = (geo?.coordinates as number[][])?.[0] || [];

  // Show latest time step with all fire parameters
  const latest = timeSeries[timeSeries.length - 1];
  const validTime = formatDate(latest?.validTime as string);
  const params = (latest?.parameters as Array<Record<string, unknown>>) || [];

  const headers = ['Parameter', 'Beskrivning', 'Värde', 'Enhet'];
  const rows: string[][] = [];

  for (const p of params) {
    const name = String(p.name || '—');
    const desc = FIRE_RISK_PARAMETERS[name] || name;
    rows.push([
      name,
      desc,
      formatNumber((p.values as number[])?.[0], 2),
      String(p.unit || '—'),
    ]);
  }

  const header =
    `**Brandriskanalys** — Godkänd: ${approvedTime}\n` +
    `Koordinater: ${coords[1]?.toFixed(4) || '?'}°N, ${coords[0]?.toFixed(4) || '?'}°E\n` +
    `Gäller: ${validTime}\n\n`;

  return { markdown: header + markdownTable(headers, rows), count: params.length, raw: data };
}

export { formatNumber, formatDate, formatUnixDate };
