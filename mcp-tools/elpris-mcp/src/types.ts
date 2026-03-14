/**
 * Zod schemas for Elpris API responses and tool inputs.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// API response schemas
// ---------------------------------------------------------------------------

export const PricePointSchema = z.object({
  SEK_per_kWh: z.number(),
  EUR_per_kWh: z.number(),
  EXR: z.number(),
  time_start: z.string(),
  time_end: z.string(),
}).passthrough();

export type PricePoint = z.infer<typeof PricePointSchema>;

// ---------------------------------------------------------------------------
// Tool input schemas
// ---------------------------------------------------------------------------

export const ZoneFilterSchema = z.object({
  zon: z.string().optional().describe('Priszon: SE1 (Luleå), SE2 (Sundsvall), SE3 (Stockholm), SE4 (Malmö)'),
});

export const HistorikFilterSchema = z.object({
  zon: z.string().describe('Priszon: SE1, SE2, SE3 eller SE4'),
  fromDate: z.string().describe('Startdatum (YYYY-MM-DD). Från 2022-11-01.'),
  toDate: z.string().describe('Slutdatum (YYYY-MM-DD). Max 31 dagar från startdatum.'),
});

export const JamforelseFilterSchema = z.object({
  datum: z.string().optional().describe('Datum att jämföra (YYYY-MM-DD). Standard: idag.'),
});

// ---------------------------------------------------------------------------
// Constants — price zones
// ---------------------------------------------------------------------------

export const PRICE_ZONES: Record<string, string> = {
  SE1: 'Luleå (norra Sverige)',
  SE2: 'Sundsvall (mellersta Sverige)',
  SE3: 'Stockholm (södra Mellansverige)',
  SE4: 'Malmö (södra Sverige)',
};
