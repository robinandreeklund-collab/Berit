/**
 * Zod schemas for SMHI API responses and tool inputs.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Meteorological Forecast (metfcst) response schemas
// ---------------------------------------------------------------------------

export const ForecastParameterSchema = z.object({
  name: z.string(),
  levelType: z.string(),
  level: z.number(),
  unit: z.string(),
  values: z.array(z.number()),
}).passthrough();

export const ForecastTimeSeriesSchema = z.object({
  validTime: z.string(),
  parameters: z.array(ForecastParameterSchema),
}).passthrough();

export const ForecastResponseSchema = z.object({
  approvedTime: z.string(),
  referenceTime: z.string(),
  geometry: z.object({
    type: z.string(),
    coordinates: z.array(z.array(z.number())),
  }).passthrough(),
  timeSeries: z.array(ForecastTimeSeriesSchema),
}).passthrough();

// ---------------------------------------------------------------------------
// Meteorological Observations (metobs) response schemas
// ---------------------------------------------------------------------------

export const MetobsStationSchema = z.object({
  key: z.string(),
  name: z.string(),
  owner: z.string().optional(),
  ownerCategory: z.string().optional(),
  height: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  active: z.boolean().optional(),
}).passthrough();

export const MetobsValueSchema = z.object({
  date: z.number(),
  value: z.string(),
  quality: z.string().optional(),
}).passthrough();

export const MetobsDataSchema = z.object({
  station: z.object({
    key: z.string(),
    name: z.string(),
  }).passthrough().optional(),
  parameter: z.object({
    key: z.string().optional(),
    name: z.string().optional(),
    unit: z.string().optional(),
  }).passthrough().optional(),
  period: z.object({
    key: z.string().optional(),
    from: z.number().optional(),
    to: z.number().optional(),
  }).passthrough().optional(),
  value: z.array(MetobsValueSchema).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Hydrological Observations (hydroobs) response schemas
// ---------------------------------------------------------------------------

export const HydroobsValueSchema = z.object({
  date: z.number(),
  value: z.string(),
  quality: z.string().optional(),
}).passthrough();

export const HydroobsDataSchema = z.object({
  station: z.object({
    key: z.string(),
    name: z.string(),
  }).passthrough().optional(),
  parameter: z.object({
    key: z.string().optional(),
    name: z.string().optional(),
    unit: z.string().optional(),
  }).passthrough().optional(),
  value: z.array(HydroobsValueSchema).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Oceanographic Observations (ocobs) response schemas
// ---------------------------------------------------------------------------

export const OcobsValueSchema = z.object({
  date: z.number(),
  value: z.string(),
  quality: z.string().optional(),
}).passthrough();

export const OcobsDataSchema = z.object({
  station: z.object({
    key: z.string(),
    name: z.string(),
  }).passthrough().optional(),
  parameter: z.object({
    key: z.string().optional(),
    name: z.string().optional(),
    unit: z.string().optional(),
  }).passthrough().optional(),
  value: z.array(OcobsValueSchema).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Tool input schemas
// ---------------------------------------------------------------------------

export const PointFilterSchema = z.object({
  latitude: z.number().min(55.0).max(70.0).describe('Latitud (WGS84), t.ex. 59.3293 för Stockholm'),
  longitude: z.number().min(10.0).max(25.0).describe('Longitud (WGS84), t.ex. 18.0686 för Stockholm'),
});

export const MetobsFilterSchema = z.object({
  parameter: z.number().describe('Parameter-ID (t.ex. 1=temperatur, 5=nederbörd)'),
  station: z.number().describe('Stations-ID (t.ex. 97200=Bromma)'),
  period: z.string().optional().describe('Tidsperiod: latest-hour, latest-day, latest-months, corrected-archive'),
});

export const StationListFilterSchema = z.object({
  parameter: z.number().describe('Parameter-ID att lista stationer för (t.ex. 1=temperatur)'),
});

export const HydroobsFilterSchema = z.object({
  parameter: z.number().describe('Parameter-ID (1=vattenföring/dygn, 2=vattenföring/15min, 3=vattenstånd, 4=vattentemp)'),
  station: z.number().describe('Stations-ID för hydrologisk mätstation'),
  period: z.string().optional().describe('Tidsperiod: latest-hour, latest-day, latest-months, corrected-archive'),
});

export const OcobsFilterSchema = z.object({
  parameter: z.number().describe('Parameter-ID (1=våghöjd, 5=havstemperatur, 6=vattenstånd)'),
  station: z.number().describe('Stations-ID för oceanografisk mätstation'),
  period: z.string().optional().describe('Tidsperiod: latest-hour, latest-day, latest-months'),
});

// ---------------------------------------------------------------------------
// Constants — SMHI forecast parameters
// ---------------------------------------------------------------------------

export const FORECAST_PARAMETERS: Record<string, string> = {
  t: 'Temperatur (°C)',
  wd: 'Vindriktning (°)',
  ws: 'Vindhastighet (m/s)',
  gust: 'Byvind (m/s)',
  r: 'Relativ luftfuktighet (%)',
  msl: 'Lufttryck, havsytan (hPa)',
  vis: 'Sikt (km)',
  tstm: 'Åskprobabilitet (%)',
  tcc_mean: 'Total molnmängd (%)',
  lcc_mean: 'Låg molnmängd (%)',
  mcc_mean: 'Medel molnmängd (%)',
  hcc_mean: 'Hög molnmängd (%)',
  pmean: 'Medelnederbörd (mm/h)',
  pmin: 'Min nederbörd (mm/h)',
  pmax: 'Max nederbörd (mm/h)',
  pmedian: 'Median nederbörd (mm/h)',
  pcat: 'Nederbördstyp (kod)',
  Wsymb2: 'Vädersymbol (kod 1-27)',
  spp: 'Snöprobabilitet (%)',
};

export const METOBS_PARAMETERS: Record<number, string> = {
  1: 'Lufttemperatur (momentan, 1 gång/tim)',
  2: 'Lufttemperatur (medel, 1 gång/dygn)',
  3: 'Vindriktning (medel 10 min, 1 gång/tim)',
  4: 'Vindhastighet (medel 10 min, 1 gång/tim)',
  5: 'Nederbördsmängd (summa 1 dygn)',
  6: 'Relativ luftfuktighet (momentan, 1 gång/tim)',
  7: 'Nederbördsmängd (summa 1 timme)',
  8: 'Snödjup (momentan, 1 gång/dygn)',
  9: 'Lufttryck havsytan (momentan, 1 gång/tim)',
  10: 'Solskenstid (summa 1 timme)',
  11: 'Global irradians (medel 1 timme)',
  12: 'Sikt (momentan, 1 gång/tim)',
  13: 'Rådande väder (momentan)',
  14: 'Nederbördsmängd (summa 15 min)',
  16: 'Total molnmängd (momentan, 1 gång/tim)',
  19: 'Lufttemperatur (min, 1 gång/dygn)',
  20: 'Lufttemperatur (max, 1 gång/dygn)',
  21: 'Byvind (max, 1 gång/tim)',
  22: 'Lufttemperatur (medel, 1 gång/månad)',
  23: 'Nederbördsmängd (summa, 1 gång/månad)',
  25: 'Max medelvindhastighet (3 tim, 1 gång/tim)',
  39: 'Daggpunktstemperatur (momentan, 1 gång/tim)',
  40: 'Markens tillstånd (momentan, 1 gång/dygn)',
};

export const HYDROOBS_PARAMETERS: Record<number, string> = {
  1: 'Vattenföring (dygn, m³/s)',
  2: 'Vattenföring (15 min, m³/s)',
  3: 'Vattenstånd (cm)',
  4: 'Vattendragstemperatur (°C)',
};

export const OCOBS_PARAMETERS: Record<number, string> = {
  1: 'Signifikant våghöjd (m)',
  2: 'Strömriktning (°)',
  3: 'Strömhastighet (cm/s)',
  4: 'Salthalt (PSU)',
  5: 'Havstemperatur (°C)',
  6: 'Havsvattenstånd (cm)',
  7: 'Vågriktning, medel (°)',
  9: 'Vågperiod, peak (s)',
  10: 'Vågperiod, medel (s)',
  11: 'Maximal våghöjd (m)',
  12: 'Havsvattenstånd, RW tim (cm)',
  15: 'Syrehalt (ml/l)',
};

export const FIRE_RISK_PARAMETERS: Record<string, string> = {
  fwi: 'Forest Fire Weather Index',
  isi: 'Initial Fire Spread Index',
  bui: 'Fire Buildup Index',
  ffmc: 'Fine Fuel Moisture Code',
  dmc: 'Duff Moisture Code',
  dc: 'Drought Code',
  forestdry: 'Index för skogstorka',
  grassfire: 'Index för gräsbrand',
  t: 'Temperatur (°C)',
  ws: 'Vindhastighet (m/s)',
  r: 'Relativ luftfuktighet (%)',
  prec24h: 'Nederbörd 24h (mm)',
};

export const MESAN_PARAMETERS: Record<string, string> = {
  t: 'Temperatur (°C)',
  gust: 'Byvind (m/s)',
  r: 'Relativ luftfuktighet (%)',
  msl: 'Lufttryck havsytan (hPa)',
  Tiw: 'Våttemperatur (°C)',
  tcc: 'Total molnmängd (oktas)',
  vis: 'Sikt (km)',
  wd: 'Vindriktning (°)',
  ws: 'Vindhastighet (m/s)',
  pmean: 'Medelnederbörd (kg/m²/h)',
  pmedian: 'Median nederbörd (kg/m²/h)',
  prec1h: '1h nederbörd (mm)',
  prec3h: '3h nederbörd (mm)',
  frsn1h: '1h nysnö (cm)',
  frsn24h: '24h nysnö (cm)',
  Wsymb2: 'Vädersymbol (kod 1-27)',
  spp: 'Andel fruset (%)',
};

/** Well-known weather station IDs for convenience. */
export const WELL_KNOWN_STATIONS: Record<string, { id: number; name: string }> = {
  stockholm: { id: 98210, name: 'Stockholm' },
  bromma: { id: 97200, name: 'Bromma' },
  goteborg: { id: 71420, name: 'Göteborg' },
  malmo: { id: 52350, name: 'Malmö' },
  lund: { id: 53430, name: 'Lund' },
  kiruna: { id: 180940, name: 'Kiruna' },
  lulea: { id: 162860, name: 'Luleå' },
  umea: { id: 140480, name: 'Umeå' },
  ostersund: { id: 127040, name: 'Östersund' },
  visby: { id: 78400, name: 'Visby' },
  karlstad: { id: 93140, name: 'Karlstad' },
  linkoping: { id: 85250, name: 'Linköping' },
  norrkoping: { id: 86340, name: 'Norrköping' },
};

/** Well-known coordinates for Swedish cities. */
export const WELL_KNOWN_LOCATIONS: Record<string, { lat: number; lon: number; name: string }> = {
  stockholm: { lat: 59.3293, lon: 18.0686, name: 'Stockholm' },
  goteborg: { lat: 57.7089, lon: 11.9746, name: 'Göteborg' },
  malmo: { lat: 55.6050, lon: 13.0038, name: 'Malmö' },
  kiruna: { lat: 67.8558, lon: 20.2253, name: 'Kiruna' },
  lulea: { lat: 65.5848, lon: 22.1547, name: 'Luleå' },
  umea: { lat: 63.8258, lon: 20.2630, name: 'Umeå' },
  ostersund: { lat: 63.1792, lon: 14.6357, name: 'Östersund' },
  visby: { lat: 57.6348, lon: 18.2948, name: 'Visby' },
  karlstad: { lat: 59.3793, lon: 13.5036, name: 'Karlstad' },
  linkoping: { lat: 58.4108, lon: 15.6214, name: 'Linköping' },
};

/** Weather symbol descriptions (Wsymb2 codes). */
export const WEATHER_SYMBOLS: Record<number, string> = {
  1: 'Klart',
  2: 'Nästan klart',
  3: 'Halvklart',
  4: 'Molnigt',
  5: 'Mycket moln',
  6: 'Mulet',
  7: 'Dimma',
  8: 'Lätt regnskur',
  9: 'Måttlig regnskur',
  10: 'Kraftig regnskur',
  11: 'Åskväder',
  12: 'Lätt snöblandat regn',
  13: 'Måttligt snöblandat regn',
  14: 'Kraftigt snöblandat regn',
  15: 'Lätt snöfall',
  16: 'Måttligt snöfall',
  17: 'Kraftigt snöfall',
  18: 'Lätt regn',
  19: 'Måttligt regn',
  20: 'Kraftigt regn',
  21: 'Åska',
  22: 'Lätt snöblandat regn',
  23: 'Måttligt snöblandat regn',
  24: 'Kraftigt snöblandat regn',
  25: 'Lätt snöfall',
  26: 'Måttligt snöfall',
  27: 'Kraftigt snöfall',
};

/** Observation periods available. */
export const OBSERVATION_PERIODS = ['latest-hour', 'latest-day', 'latest-months', 'corrected-archive'] as const;
