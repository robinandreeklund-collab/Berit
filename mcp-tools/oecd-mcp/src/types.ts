/**
 * Zod schemas for OECD SDMX API responses and tool inputs.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// SDMX-JSON response schemas
// ---------------------------------------------------------------------------

export const SDMXObservationSchema = z.object({
  dimensions: z.record(z.unknown()).optional(),
  observations: z.record(z.array(z.unknown())).optional(),
}).passthrough();

export const SDMXDataSetSchema = z.object({
  action: z.string().optional(),
  series: z.record(z.unknown()).optional(),
  observations: z.record(z.array(z.unknown())).optional(),
}).passthrough();

export const SDMXDataResponseSchema = z.object({
  header: z.object({
    id: z.string().optional(),
    prepared: z.string().optional(),
    sender: z.object({ id: z.string() }).optional(),
  }).passthrough().optional(),
  dataSets: z.array(SDMXDataSetSchema).optional(),
  structure: z.object({
    dimensions: z.object({
      series: z.array(z.unknown()).optional(),
      observation: z.array(z.unknown()).optional(),
    }).optional(),
    attributes: z.object({
      series: z.array(z.unknown()).optional(),
      observation: z.array(z.unknown()).optional(),
    }).optional(),
  }).passthrough().optional(),
}).passthrough();

export const DataflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string().optional(),
  agencyID: z.string().optional(),
}).passthrough();

export const DataStructureSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  dimensions: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    position: z.number().optional(),
    values: z.array(z.object({
      id: z.string(),
      name: z.string().optional(),
    })).optional(),
  }).passthrough()).optional(),
}).passthrough();

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Tool input schemas
// ---------------------------------------------------------------------------

export const SearchDataflowsInputSchema = z.object({
  keyword: z.string().describe('Sökord för att hitta dataset (t.ex. "GDP", "health", "education")'),
});

export const ListDataflowsInputSchema = z.object({
  category: z.string().optional().describe('Kategori-ID att filtrera på (t.ex. "Economy", "Health")'),
});

export const DataStructureInputSchema = z.object({
  dataflow_id: z.string().describe('Dataflow-ID (t.ex. "QNA", "MEI", "HEALTH_STAT")'),
});

export const QueryDataInputSchema = z.object({
  dataflow_id: z.string().describe('Dataflow-ID (t.ex. "QNA", "MEI")'),
  filter: z.string().optional().describe('Filtersträngar med punktseparerade dimensioner. + för multipla värden, tom för wildcard. Exempel: "SWE+NOR.GDP..A"'),
  start_period: z.string().optional().describe('Startperiod (t.ex. "2020", "2020-Q1", "2020-01")'),
  end_period: z.string().optional().describe('Slutperiod (t.ex. "2024", "2024-Q4", "2024-12")'),
  last_n_observations: z.number().optional().describe('Antal senaste observationer per serie (standard: 100, max: 1000)'),
});

export const SearchIndicatorsInputSchema = z.object({
  keyword: z.string().describe('Sökord för att hitta indikatorer (t.ex. "unemployment", "inflation", "CO2")'),
  category: z.string().optional().describe('Begränsa sökning till en kategori'),
});

export const DataflowUrlInputSchema = z.object({
  dataflow_id: z.string().describe('Dataflow-ID (t.ex. "QNA")'),
  filter: z.string().optional().describe('Valfri filtersträng'),
});

// ---------------------------------------------------------------------------
// Constants — OECD data categories (17)
// ---------------------------------------------------------------------------

export interface OECDCategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  exampleDataflows: string[];
}

export const OECD_CATEGORIES: OECDCategory[] = [
  { id: 'Economy', name: 'Ekonomi', nameEn: 'Economy', description: 'BNP, nationalräkenskaper, konjunkturindikatorer', exampleDataflows: ['QNA', 'MEI', 'SNA_TABLE1'] },
  { id: 'Health', name: 'Hälsa', nameEn: 'Health', description: 'Hälsostatistik, sjukvårdsutgifter, livslängd', exampleDataflows: ['HEALTH_STAT', 'HEALTH_PROC', 'SHA'] },
  { id: 'Education', name: 'Utbildning', nameEn: 'Education', description: 'Utbildningsstatistik, PISA, finansiering', exampleDataflows: ['EAG_FIN', 'EAG_NEAC', 'PISA'] },
  { id: 'Employment', name: 'Sysselsättning', nameEn: 'Employment', description: 'Arbetsmarknad, arbetslöshet, löner', exampleDataflows: ['LFS_SEXAGE_I_R', 'AV_AN_WAGE', 'STLABOUR'] },
  { id: 'Trade', name: 'Handel', nameEn: 'Trade', description: 'Internationell handel, varor, tjänster', exampleDataflows: ['MEI_TRD', 'BTDIXE_I4', 'TIVA'] },
  { id: 'Finance', name: 'Finans', nameEn: 'Finance', description: 'Finansiella marknader, investeringar, FDI', exampleDataflows: ['FDI', 'MEI_FIN', 'SNA_TABLE720'] },
  { id: 'Government', name: 'Offentlig sektor', nameEn: 'Government', description: 'Offentliga finanser, skuld, skatter', exampleDataflows: ['GOV_DEBT', 'REV', 'NAAG'] },
  { id: 'Environment', name: 'Miljö', nameEn: 'Environment', description: 'Miljöstatistik, utsläpp, avfall', exampleDataflows: ['GREEN_GROWTH', 'AIR_GHG', 'WASTE'] },
  { id: 'Agriculture', name: 'Jordbruk', nameEn: 'Agriculture', description: 'Jordbruksstatistik, livsmedel, produktion', exampleDataflows: ['HIGH_AGLINK_2024', 'FISH_AQUA', 'MON2024'] },
  { id: 'SocialProtection', name: 'Social trygghet', nameEn: 'Social Protection', description: 'Socialutgifter, pensioner, bidrag', exampleDataflows: ['SOCX_AGG', 'SOCX_DET', 'PAG'] },
  { id: 'Development', name: 'Utveckling', nameEn: 'Development', description: 'Bistånd, utvecklingssamarbete, ODA', exampleDataflows: ['TABLE1', 'TABLE2A', 'DACDefl'] },
  { id: 'Innovation', name: 'Innovation', nameEn: 'Innovation', description: 'FoU, patent, teknik, digitalisering', exampleDataflows: ['MSTI_PUB', 'PAT_DEV', 'ICT_HH2'] },
  { id: 'Regional', name: 'Regional', nameEn: 'Regional', description: 'Regional statistik, städer, ojämlikhet', exampleDataflows: ['REGION_DEMOGR', 'REGION_ECONOM', 'CITIES'] },
  { id: 'Housing', name: 'Bostad', nameEn: 'Housing', description: 'Bostadspriser, byggande, hushåll', exampleDataflows: ['HPI', 'HOUSE_PRICES', 'SHC'] },
  { id: 'NaturalResources', name: 'Naturresurser', nameEn: 'Natural Resources', description: 'Energi, vatten, råvaror', exampleDataflows: ['IEA_WORLD_EN_OUTLOOK', 'GREEN_GROWTH', 'WATER'] },
  { id: 'Climate', name: 'Klimat', nameEn: 'Climate', description: 'Klimatförändring, koldioxid, anpassning', exampleDataflows: ['AIR_GHG', 'GREEN_GROWTH', 'ENV_ENVPOLICY'] },
  { id: 'Transport', name: 'Transport', nameEn: 'Transport', description: 'Transportstatistik, infrastruktur, säkerhet', exampleDataflows: ['ITF_GOODS_TRANSPORT', 'ITF_PASSENGER_TRANSPORT', 'ITF_INDICATORS'] },
];

/** Map of category ID → OECDCategory for quick lookup. */
export const CATEGORY_MAP: Record<string, OECDCategory> = Object.fromEntries(
  OECD_CATEGORIES.map((c) => [c.id, c]),
);

// ---------------------------------------------------------------------------
// Constants — Known important dataflows
// ---------------------------------------------------------------------------

export interface KnownDataflow {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  category: string;
  commonFilters: string[];
}

export const KNOWN_DATAFLOWS: KnownDataflow[] = [
  {
    id: 'QNA',
    name: 'Kvartalsvisa nationalräkenskaper',
    nameEn: 'Quarterly National Accounts',
    description: 'BNP, konsumtion, investeringar kvartalsvis per land',
    category: 'Economy',
    commonFilters: ['SWE.GDP.VOBARSA.Q', 'SWE+USA+DEU.GDP.VOBARSA.Q'],
  },
  {
    id: 'MEI',
    name: 'Huvudsakliga ekonomiska indikatorer',
    nameEn: 'Main Economic Indicators',
    description: 'Inflation, produktion, handel, räntor — nyckeltal för alla OECD-länder',
    category: 'Economy',
    commonFilters: ['SWE..', 'SWE+NOR+DNK..'],
  },
  {
    id: 'HEALTH_STAT',
    name: 'Hälsostatistik',
    nameEn: 'Health Statistics',
    description: 'Sjukvårdsutgifter, läkartäthet, livslängd, dödsorsaker',
    category: 'Health',
    commonFilters: ['SWE..', 'SWE+NOR+FIN..'],
  },
  {
    id: 'EAG_FIN',
    name: 'Utbildningsfinansiering',
    nameEn: 'Education at a Glance — Finance',
    description: 'Utbildningsutgifter per land, nivå och finansieringskälla',
    category: 'Education',
    commonFilters: ['SWE..', 'SWE+FIN+NOR..'],
  },
  {
    id: 'FDI',
    name: 'Utländska direktinvesteringar',
    nameEn: 'Foreign Direct Investment',
    description: 'FDI-flöden och -bestånd per land, bransch och partnerland',
    category: 'Finance',
    commonFilters: ['SWE..', 'SWE+NOR..'],
  },
  {
    id: 'GREEN_GROWTH',
    name: 'Grön tillväxt',
    nameEn: 'Green Growth Indicators',
    description: 'Miljöeffektivitet, naturresurser, grön innovation',
    category: 'Environment',
    commonFilters: ['SWE..', 'SWE+NOR+DNK+FIN..'],
  },
  {
    id: 'HPI',
    name: 'Bostadsprisindex',
    nameEn: 'House Price Indices',
    description: 'Nominella och reala bostadspriser, kvot pris/inkomst',
    category: 'Housing',
    commonFilters: ['SWE..Q', 'SWE+NOR+DNK..Q'],
  },
  {
    id: 'IDD',
    name: 'Inkomstfördelning',
    nameEn: 'Income Distribution Database',
    description: 'Gini-koefficient, fattigdom, inkomstkvintiler',
    category: 'SocialProtection',
    commonFilters: ['SWE..', 'SWE+NOR+FIN..'],
  },
  {
    id: 'AV_AN_WAGE',
    name: 'Genomsnittliga löner',
    nameEn: 'Average Annual Wages',
    description: 'Genomsnittlig årslön per land, köpkraftsparitetsjusterad',
    category: 'Employment',
    commonFilters: ['SWE.', 'SWE+USA+DEU.'],
  },
  {
    id: 'GOV_DEBT',
    name: 'Offentlig skuld',
    nameEn: 'Government Debt',
    description: 'Statsskuld som andel av BNP per land',
    category: 'Government',
    commonFilters: ['SWE..', 'SWE+NOR+DNK..'],
  },
  {
    id: 'AIR_GHG',
    name: 'Växthusgasutsläpp',
    nameEn: 'Air and GHG Emissions',
    description: 'CO2 och andra växthusgasutsläpp per land och sektor',
    category: 'Climate',
    commonFilters: ['SWE..', 'SWE+NOR+FIN..'],
  },
  {
    id: 'MSTI_PUB',
    name: 'FoU-statistik',
    nameEn: 'Main Science and Technology Indicators',
    description: 'Forsknings- och utvecklingsutgifter, forskare, patent',
    category: 'Innovation',
    commonFilters: ['SWE..', 'SWE+FIN+KOR..'],
  },
];

/** Map of dataflow ID → KnownDataflow for quick lookup. */
export const DATAFLOW_MAP: Record<string, KnownDataflow> = Object.fromEntries(
  KNOWN_DATAFLOWS.map((d) => [d.id, d]),
);
