/**
 * Zod schemas for Upphandlingsdata API responses and tool inputs.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// UHM Website search response schemas
// ---------------------------------------------------------------------------

export const SearchHitSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  date: z.string().optional(),
}).passthrough();

export const SearchResponseSchema = z.object({
  hits: z.array(SearchHitSchema).optional(),
  totalHits: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Question Portal response schemas
// ---------------------------------------------------------------------------

export const QuestionHitSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  date: z.string().optional(),
}).passthrough();

export const QuestionResponseSchema = z.object({
  hits: z.array(QuestionHitSchema).optional(),
  totalHits: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// LOV (Valfrihetssystem) response schemas
// ---------------------------------------------------------------------------

export const LOVHitSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  region: z.string().optional(),
  municipality: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  publishDate: z.string().optional(),
}).passthrough();

export const LOVResponseSchema = z.object({
  hits: z.array(LOVHitSchema).optional(),
  totalHits: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Criteria response schemas
// ---------------------------------------------------------------------------

export const CriteriaHitSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  level: z.string().optional(),
}).passthrough();

export const CriteriaResponseSchema = z.object({
  hits: z.array(CriteriaHitSchema).optional(),
  totalHits: z.number().optional(),
}).passthrough();

export const CriteriaCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  count: z.number().optional(),
}).passthrough();

export const CriteriaFilterResponseSchema = z.object({
  categories: z.array(CriteriaCategorySchema).optional(),
  types: z.array(z.string()).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// TED (EU procurement) response schemas
// ---------------------------------------------------------------------------

export const TEDNoticeSchema = z.object({
  'BT-21-Procedure': z.string().optional(),
  'BT-22-Procedure': z.string().optional(),
  'BT-500-Organization-Company': z.string().optional(),
  'ND-Root': z.string().optional(),
}).passthrough();

export const TEDResponseSchema = z.object({
  notices: z.array(TEDNoticeSchema).optional(),
  totalNoticeCount: z.number().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Tool input schemas
// ---------------------------------------------------------------------------

export const SearchFilterSchema = z.object({
  query: z.string().describe('Sökterm'),
  pageSize: z.number().optional().describe('Antal resultat per sida (standard: 10)'),
  page: z.number().optional().describe('Sidnummer (standard: 1)'),
});

export const LOVFilterSchema = z.object({
  query: z.string().optional().describe('Sökterm (valfritt)'),
  pageSize: z.number().optional().describe('Antal resultat per sida (standard: 10)'),
  page: z.number().optional().describe('Sidnummer (standard: 1)'),
  region: z.string().optional().describe('Filtrera på region/län'),
});

export const CriteriaFilterSchema = z.object({
  query: z.string().optional().describe('Sökterm för kriterier'),
  pageSize: z.number().optional().describe('Antal resultat (standard: 10)'),
  type: z.string().optional().describe('Typ av kriterium'),
});

export const TEDFilterSchema = z.object({
  query: z.string().describe('Sökfråga för TED-annonser'),
  limit: z.number().optional().describe('Max antal resultat (standard: 10)'),
  scope: z.string().optional().describe('Sökscope: "latest" eller "active" (standard: "latest")'),
});

// ---------------------------------------------------------------------------
// Constants — criteria types
// ---------------------------------------------------------------------------

export const CRITERIA_TYPES: Record<string, string> = {
  'krav': 'Obligatoriska krav',
  'kriterier': 'Tilldelningskriterier',
  'villkor': 'Särskilda kontraktsvillkor',
  'uppfoljning': 'Uppföljning',
};

export const LOV_REGIONS: string[] = [
  'Blekinge',
  'Dalarna',
  'Gotland',
  'Gävleborg',
  'Halland',
  'Jämtland',
  'Jönköping',
  'Kalmar',
  'Kronoberg',
  'Norrbotten',
  'Skåne',
  'Stockholm',
  'Södermanland',
  'Uppsala',
  'Värmland',
  'Västerbotten',
  'Västernorrland',
  'Västmanland',
  'Västra Götaland',
  'Örebro',
  'Östergötland',
];
