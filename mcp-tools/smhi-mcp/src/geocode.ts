/**
 * Geocoding for Swedish locations.
 *
 * Resolves place names (e.g. "Tibro", "Göteborg") to WGS84 coordinates.
 * 1. Fast lookup in WELL_KNOWN_LOCATIONS
 * 2. Fallback to Nominatim (OpenStreetMap) with countrycodes=se
 */

import { WELL_KNOWN_LOCATIONS } from './types.js';

export interface GeoResult {
  lat: number;
  lon: number;
  name: string;
  source: 'cache' | 'nominatim';
}

/** Normalize a Swedish place name for lookup: lowercase, strip diacritics. */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é/g, 'e')
    .replace(/ü/g, 'u');
}

/**
 * Resolve a Swedish place name to lat/lon.
 * Returns null if the location cannot be resolved.
 */
export async function geocode(location: string): Promise<GeoResult | null> {
  if (!location || !location.trim()) return null;

  const key = normalize(location);

  // 1. Check well-known locations
  for (const [k, v] of Object.entries(WELL_KNOWN_LOCATIONS)) {
    if (k === key || normalize(v.name) === key) {
      return { lat: v.lat, lon: v.lon, name: v.name, source: 'cache' };
    }
  }

  // 2. Fallback to Nominatim
  try {
    const query = encodeURIComponent(`${location.trim()}, Sverige`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=se`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SMHI-MCP-Server/1.0 (https://github.com/robinandreeklund-collab/Berit)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!results || results.length === 0) return null;

    const result = results[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    // Validate coordinates are within Sweden
    if (lat < 55.0 || lat > 70.0 || lon < 10.0 || lon > 25.0) {
      return null;
    }

    // Extract short name from display_name (first part before comma)
    const displayName = result.display_name.split(',')[0].trim();

    return { lat, lon, name: displayName, source: 'nominatim' };
  } catch {
    return null;
  }
}

/**
 * Resolve coordinates from tool arguments.
 * Accepts either { latitude, longitude } or { location } (place name string).
 * Returns resolved lat/lon and display name, or an error message.
 */
export async function resolveCoordinates(
  params: Record<string, unknown>,
): Promise<{ lat: number; lon: number; resolvedName?: string } | { error: string }> {
  const lat = params.latitude as number | undefined;
  const lon = params.longitude as number | undefined;
  const location = params.location as string | undefined;

  // If lat/lon provided, use them directly
  if (lat != null && lon != null) {
    return { lat, lon };
  }

  // If location string provided, geocode it
  if (location) {
    const result = await geocode(location);
    if (!result) {
      return {
        error: `Kunde inte hitta platsen "${location}". Ange koordinater (latitude/longitude) istället, eller prova ett annat platsnamn.`,
      };
    }
    return { lat: result.lat, lon: result.lon, resolvedName: result.name };
  }

  return { error: 'Ange antingen location (platsnamn) eller latitude + longitude.' };
}
