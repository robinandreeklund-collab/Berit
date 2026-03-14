/**
 * Zod schemas for Riksbank API responses and tool inputs.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// SWEA API response schemas
// ---------------------------------------------------------------------------

export const ObservationSchema = z.object({
  date: z.string(),
  value: z.number().nullable(),
}).passthrough();

export const SeriesSchema = z.object({
  seriesId: z.string(),
  seriesName: z.string().optional(),
  groupId: z.string().optional(),
  source: z.string().optional(),
  unit: z.string().optional(),
}).passthrough();

export const GroupSchema = z.object({
  groupId: z.string(),
  groupName: z.string().optional(),
  parentGroupId: z.string().optional(),
}).passthrough();

export const LatestObservationSchema = z.object({
  seriesId: z.string(),
  seriesName: z.string().optional(),
  date: z.string(),
  value: z.number().nullable(),
  unit: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// SWESTR API response schemas
// ---------------------------------------------------------------------------

export const SwestrObservationSchema = z.object({
  rate: z.number(),
  date: z.string(),
  pctl12_5: z.number().optional(),
  pctl87_5: z.number().optional(),
  volume: z.number().optional(),
  numberOfTransactions: z.number().optional(),
  numberOfAgents: z.number().optional(),
  publicationTime: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Forecasts API response schemas
// ---------------------------------------------------------------------------

export const ForecastValueSchema = z.object({
  date: z.string(),
  forecast: z.number().nullable().optional(),
  outcome: z.number().nullable().optional(),
}).passthrough();

export const ForecastSchema = z.object({
  indicator: z.string().optional(),
  indicatorName: z.string().optional(),
  values: z.array(ForecastValueSchema).optional(),
}).passthrough();

export const IndicatorSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Tool input schemas
// ---------------------------------------------------------------------------

export const RateFilterSchema = z.object({
  serieId: z.string().optional().describe('Serie-ID (t.ex. "SECBREPOEFF" för styrränta)'),
  fromDate: z.string().optional().describe('Startdatum (YYYY-MM-DD)'),
  toDate: z.string().optional().describe('Slutdatum (YYYY-MM-DD)'),
});

export const GroupFilterSchema = z.object({
  groupId: z.string().optional().describe('Grupp-ID (t.ex. "3" för STIBOR, "130" för valutor)'),
});

export const CurrencyFilterSchema = z.object({
  valuta: z.string().optional().describe('Valutakod (t.ex. "EUR", "USD", "NOK")'),
  fromDate: z.string().optional().describe('Startdatum (YYYY-MM-DD)'),
  toDate: z.string().optional().describe('Slutdatum (YYYY-MM-DD)'),
});

export const CrossRateFilterSchema = z.object({
  valuta1: z.string().describe('Första valutakod (t.ex. "EUR")'),
  valuta2: z.string().describe('Andra valutakod (t.ex. "USD")'),
  datum: z.string().optional().describe('Datum (YYYY-MM-DD, standard: idag)'),
});

export const SwestrFilterSchema = z.object({
  fromDate: z.string().optional().describe('Startdatum (YYYY-MM-DD)'),
  toDate: z.string().optional().describe('Slutdatum (YYYY-MM-DD)'),
});

export const ForecastFilterSchema = z.object({
  indikator: z.string().optional().describe('Indikator-ID (t.ex. "CPI", "CPIF", "GDP")'),
});

// ---------------------------------------------------------------------------
// Constants — important series IDs
// ---------------------------------------------------------------------------

export const SERIES_IDS: Record<string, string> = {
  SECBREPOEFF: 'Styrränta (reporänta)',
  SECBDEPOEFF: 'Inlåningsränta',
  SECBLENDEFF: 'Utlåningsränta',
  SECBREFEFF: 'Referensränta',
  SEKEURPMI: 'EUR/SEK',
  SEKUSDPMI: 'USD/SEK',
  SEKGBPPMI: 'GBP/SEK',
  SEKNOKPMI: 'NOK/SEK',
  SEKDKKPMI: 'DKK/SEK',
  SEKCHFPMI: 'CHF/SEK',
  SEKJPYPMI: 'JPY/SEK',
};

export const GROUP_IDS: Record<string, string> = {
  '2': 'Riksbankens styrräntor',
  '3': 'STIBOR',
  '130': 'Valutor mot SEK',
  '131': 'Korskurser',
};

/** Map common currency codes to SWEA series IDs. */
export const CURRENCY_SERIES: Record<string, string> = {
  EUR: 'SEKEURPMI',
  USD: 'SEKUSDPMI',
  GBP: 'SEKGBPPMI',
  NOK: 'SEKNOKPMI',
  DKK: 'SEKDKKPMI',
  CHF: 'SEKCHFPMI',
  JPY: 'SEKJPYPMI',
};
