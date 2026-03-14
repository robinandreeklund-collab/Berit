/**
 * Zod schemas for Kolada API responses and tool inputs.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Kolada API response schemas
// ---------------------------------------------------------------------------

export const KpiValueSchema = z.object({
  kpi: z.string(),
  municipality: z.string().optional(),
  ou: z.string().optional(),
  period: z.string(),
  gender: z.string().optional(),
  status: z.string().optional(),
  value: z.number().nullable(),
  count: z.number().optional(),
}).passthrough();

export const KpiSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  operating_area: z.string().optional(),
  prel_publication_date: z.string().optional(),
  publication_date: z.string().optional(),
  ou_publication_date: z.string().optional(),
  auspices: z.string().optional(),
  perspective: z.string().optional(),
  is_divided_by_gender: z.number().optional(),
  municipality_type: z.string().optional(),
  has_ou_data: z.number().optional(),
}).passthrough();

export const MunicipalitySchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string().optional(),
}).passthrough();

export const MunicipalityGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  members: z.array(z.object({
    id: z.string(),
    title: z.string().optional(),
  })).optional(),
}).passthrough();

export const OrganizationalUnitSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  municipality: z.string().optional(),
}).passthrough();

export const KoladaResponseSchema = z.object({
  values: z.array(z.unknown()),
  count: z.number().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Tool input schemas
// ---------------------------------------------------------------------------

export const SokNyckeltalSchema = z.object({
  query: z.string().describe('Sökterm för nyckeltalsnamn (t.ex. "befolkning", "skola", "äldreomsorg")'),
  limit: z.number().optional().describe('Max antal resultat (standard: 20)'),
});

export const SokKommunSchema = z.object({
  query: z.string().describe('Kommunnamn att söka efter (t.ex. "Stockholm", "Malmö")'),
  limit: z.number().optional().describe('Max antal resultat (standard: 20)'),
});

export const SokEnhetSchema = z.object({
  query: z.string().describe('Enhetsnamn att söka efter (t.ex. "Björkskolan", "vårdcentral")'),
  kommun: z.string().optional().describe('Kommun-ID för att filtrera enheter (t.ex. "0180" för Stockholm)'),
  limit: z.number().optional().describe('Max antal resultat (standard: 20)'),
});

export const DataKommunSchema = z.object({
  kpi_id: z.string().describe('Nyckeltal-ID (t.ex. "N00945" för invånarantal)'),
  kommun_id: z.string().describe('Kommun-ID (t.ex. "0180" för Stockholm)'),
  from_year: z.string().optional().describe('Startår (t.ex. "2020")'),
  to_year: z.string().optional().describe('Slutår (t.ex. "2024")'),
});

export const DataAllaKommunerSchema = z.object({
  kpi_id: z.string().describe('Nyckeltal-ID (t.ex. "N00945")'),
  year: z.string().describe('År att hämta data för (t.ex. "2023")'),
});

export const DataEnhetSchema = z.object({
  kpi_id: z.string().describe('Nyckeltal-ID (t.ex. "U09400")'),
  year: z.string().describe('År att hämta data för (t.ex. "2023")'),
});

export const NyckeltalDetaljSchema = z.object({
  kpi_id: z.string().describe('Nyckeltal-ID (t.ex. "N00945")'),
});

export const JamforKommunerSchema = z.object({
  kpi_id: z.string().describe('Nyckeltal-ID att jämföra (t.ex. "N00945")'),
  kommun_ids: z.string().describe('Kommun-ID:n, kommaseparerade (t.ex. "0180,1280,1480")'),
  year: z.string().optional().describe('År (standard: senaste tillgängliga)'),
});

export const TrendSchema = z.object({
  kpi_id: z.string().describe('Nyckeltal-ID (t.ex. "N00945")'),
  kommun_id: z.string().describe('Kommun-ID (t.ex. "0180")'),
  years: z.number().optional().describe('Antal år bakåt (standard: 5)'),
});

// ---------------------------------------------------------------------------
// Constants — popular KPIs
// ---------------------------------------------------------------------------

export const POPULAR_KPIS: Record<string, string> = {
  N00945: 'Invånare totalt',
  N01951: 'Nettokostnadsavvikelse, kr/inv',
  U09400: 'Elever i åk 9 som uppnått kunskapskraven i alla ämnen',
  N07900: 'Resultat av medborgarundersökning',
  N00941: 'Befolkningsökning/-minskning',
  N00914: 'Invånare 0-17 år',
  N00928: 'Invånare 65+ år',
  N15033: 'Kommunalskatt, kr/skattekrona',
  U40501: 'Brukarbedömning hemtjänst',
  N15818: 'Kostnad per elev i grundskola, kr',
};

/** Common municipality IDs for quick reference. */
export const COMMON_MUNICIPALITIES: Record<string, string> = {
  '0180': 'Stockholm',
  '1280': 'Malmö',
  '1480': 'Göteborg',
  '0380': 'Uppsala',
  '1281': 'Lund',
  '0580': 'Linköping',
  '1880': 'Örebro',
  '2580': 'Luleå',
  '1980': 'Västerås',
  '0680': 'Jönköping',
};

/** KPI categories for reference. */
export const KPI_CATEGORIES: Record<string, string> = {
  N: 'Övergripande nyckeltal',
  U: 'Utbildning',
  V: 'Vård och omsorg',
  S: 'Socialtjänst',
  K: 'Kultur och fritid',
  M: 'Miljö',
};
