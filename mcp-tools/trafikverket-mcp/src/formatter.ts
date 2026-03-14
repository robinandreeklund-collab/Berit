/**
 * Format Trafikverket API responses into readable Markdown tables.
 */

import type { TrafikverketResponse } from './api-client.js';

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/** Format a Swedish datetime string for display. */
function formatTime(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/** Truncate long strings. */
function truncate(s: string | undefined | null, max = 120): string {
  if (!s) return '—';
  return s.length > max ? s.slice(0, max) + '…' : s;
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

function formatSituations(items: Record<string, unknown>[]): string {
  const headers = ['Plats', 'Typ', 'Meddelande', 'Allvarlighet', 'Start', 'Slut'];
  const rows: string[][] = [];

  for (const sit of items) {
    const deviations = (sit.Deviation as Record<string, unknown>[]) || [];
    for (const dev of deviations) {
      rows.push([
        truncate(dev.LocationDescriptor as string, 40),
        truncate(dev.MessageCode as string || dev.MessageType as string, 20),
        truncate(dev.Message as string, 60),
        String(dev.SeverityCode ?? '—'),
        formatTime(dev.StartTime as string),
        formatTime(dev.EndTime as string),
      ]);
    }
  }

  return markdownTable(headers, rows);
}

function formatTrainAnnouncements(items: Record<string, unknown>[]): string {
  const headers = ['Tåg', 'Station', 'Typ', 'Planerad', 'Beräknad', 'Spår', 'Destination', 'Status'];
  const rows: string[][] = [];

  for (const ta of items) {
    const toLocations = (ta.ToLocation as Array<{ LocationName?: string }>) || [];
    const destination = toLocations.map((l) => l.LocationName || '').join(', ') || '—';
    const deviations = (ta.Deviation as Array<{ Description?: string }>) || [];
    const status = ta.Canceled
      ? 'INSTÄLLT'
      : deviations.length > 0
        ? deviations.map((d) => d.Description).join(', ')
        : 'I tid';

    rows.push([
      String(ta.AdvertisedTrainIdent || '—'),
      String(ta.AdvertisedLocationName || ta.LocationSignature || '—'),
      String(ta.ActivityType === 'Avgang' ? 'Avg' : ta.ActivityType === 'Ankomst' ? 'Ank' : ta.ActivityType || '—'),
      formatTime(ta.AdvertisedTimeAtLocation as string),
      formatTime(ta.EstimatedTimeAtLocation as string),
      String(ta.TrackAtLocation || '—'),
      truncate(destination, 30),
      truncate(status, 30),
    ]);
  }

  return markdownTable(headers, rows);
}

function formatTrainStations(items: Record<string, unknown>[]): string {
  const headers = ['Station', 'Signatur', 'Län', 'Koordinater'];
  const rows: string[][] = [];

  for (const st of items) {
    const geo = st.Geometry as { WGS84?: string } | undefined;
    rows.push([
      String(st.AdvertisedLocationName || '—'),
      String(st.LocationSignature || '—'),
      String((st.CountyNo as number[])?.join(', ') || '—'),
      truncate(geo?.WGS84 || '—', 40),
    ]);
  }

  return markdownTable(headers, rows);
}

function formatRoadConditions(items: Record<string, unknown>[]): string {
  const headers = ['Väg', 'Väglag', 'Orsak', 'Plats', 'Tid'];
  const rows: string[][] = [];

  for (const rc of items) {
    rows.push([
      String(rc.RoadNumber || '—'),
      truncate(rc.ConditionText as string, 30),
      truncate(rc.Cause as string, 30),
      truncate(rc.LocationText as string, 40),
      formatTime(rc.MeasureTime as string || rc.ModifiedTime as string),
    ]);
  }

  return markdownTable(headers, rows);
}

function formatWeatherMeasurepoints(items: Record<string, unknown>[]): string {
  const headers = ['Station', 'Luft °C', 'Väg °C', 'Vind m/s', 'Vindby m/s', 'Fuktighet %', 'Is', 'Snö'];
  const rows: string[][] = [];

  for (const wp of items) {
    const obs = wp.Observation as Record<string, unknown> | undefined;
    const air = obs?.Air as { Temperature?: number; RelativeHumidity?: number } | undefined;
    const winds = (obs?.Wind as Array<{ Force?: number; ForceMax?: number }>) || [];
    const wind = winds[0];
    const surfaces = (obs?.Surface as Array<{ Temperature?: number; Ice?: boolean; Snow?: boolean }>) || [];
    const surface = surfaces[0];

    rows.push([
      String(wp.Name || '—'),
      air?.Temperature != null ? String(air.Temperature) : '—',
      surface?.Temperature != null ? String(surface.Temperature) : '—',
      wind?.Force != null ? String(wind.Force) : '—',
      wind?.ForceMax != null ? String(wind.ForceMax) : '—',
      air?.RelativeHumidity != null ? String(air.RelativeHumidity) : '—',
      surface?.Ice != null ? (surface.Ice ? 'Ja' : 'Nej') : '—',
      surface?.Snow != null ? (surface.Snow ? 'Ja' : 'Nej') : '—',
    ]);
  }

  return markdownTable(headers, rows);
}

function formatTrafficFlow(items: Record<string, unknown>[]): string {
  const headers = ['Mätpunkt', 'Medelhastighet km/h', 'Flöde fordon/h', 'Fordonstyp', 'Tid'];
  const rows: string[][] = [];

  for (const tf of items) {
    rows.push([
      String(tf.SiteId || '—'),
      tf.AverageVehicleSpeed != null ? String(tf.AverageVehicleSpeed) : '—',
      tf.VehicleFlowRate != null ? String(tf.VehicleFlowRate) : '—',
      String(tf.VehicleType || '—'),
      formatTime(tf.MeasurementTime as string),
    ]);
  }

  return markdownTable(headers, rows);
}

function formatCameras(items: Record<string, unknown>[]): string {
  const headers = ['ID', 'Namn', 'Plats', 'Aktiv', 'Bild-URL', 'Fototid'];
  const rows: string[][] = [];

  for (const cam of items) {
    rows.push([
      String(cam.Id || '—'),
      truncate(cam.Name as string, 30),
      truncate(cam.Location as string || cam.Description as string, 30),
      cam.Active != null ? (cam.Active ? 'Ja' : 'Nej') : '—',
      cam.PhotoUrl ? `[Bild](${cam.PhotoUrl})` : '—',
      formatTime(cam.PhotoTime as string),
    ]);
  }

  return markdownTable(headers, rows);
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

/**
 * Format a Trafikverket API response into Markdown, dispatching by objecttype.
 */
export function formatResponse(
  response: TrafikverketResponse,
  objecttype: string,
  toolId: string,
): { markdown: string; count: number; raw: unknown[] } {
  const results = response.RESPONSE?.RESULT || [];
  if (results.length === 0) {
    return { markdown: '_Inget svar från API._', count: 0, raw: [] };
  }

  // The first RESULT entry contains the data keyed by objecttype
  const firstResult = results[0];
  const items = (firstResult[objecttype] as Record<string, unknown>[]) || [];

  if (items.length === 0) {
    return { markdown: '_Inga resultat hittades._', count: 0, raw: [] };
  }

  let markdown: string;

  switch (objecttype) {
    case 'Situation':
      markdown = formatSituations(items);
      break;
    case 'TrainAnnouncement':
      markdown = formatTrainAnnouncements(items);
      break;
    case 'TrainStation':
      markdown = formatTrainStations(items);
      break;
    case 'RoadCondition':
      markdown = formatRoadConditions(items);
      break;
    case 'WeatherMeasurepoint':
      markdown = formatWeatherMeasurepoints(items);
      break;
    case 'TrafficFlow':
      markdown = formatTrafficFlow(items);
      break;
    case 'Camera':
      markdown = formatCameras(items);
      break;
    default:
      // Fallback: JSON dump
      markdown = '```json\n' + JSON.stringify(items.slice(0, 5), null, 2) + '\n```';
  }

  return { markdown, count: items.length, raw: items };
}

export { formatTime, truncate, markdownTable };
