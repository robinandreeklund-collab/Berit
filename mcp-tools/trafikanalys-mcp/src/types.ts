/**
 * Zod schemas for Trafikanalys API responses and tool inputs.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Structure API response schemas
// ---------------------------------------------------------------------------

export const ProductSchema = z.object({
  code: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
}).passthrough();

export const DimensionValueSchema = z.object({
  code: z.string(),
  name: z.string().optional(),
}).passthrough();

export const DimensionSchema = z.object({
  code: z.string(),
  name: z.string().optional(),
  values: z.array(DimensionValueSchema).optional(),
}).passthrough();

export const MeasureSchema = z.object({
  code: z.string(),
  name: z.string().optional(),
}).passthrough();

export const ProductStructureSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  dimensions: z.array(DimensionSchema).optional(),
  measures: z.array(MeasureSchema).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Data API response schemas
// ---------------------------------------------------------------------------

export const DataCellSchema = z.object({
  value: z.union([z.number(), z.string()]).nullable(),
}).passthrough();

export const DataRowSchema = z.object({
  key: z.array(z.string()).optional(),
  values: z.array(DataCellSchema).optional(),
}).passthrough();

export const DataResultSchema = z.object({
  columns: z.array(z.string()).optional(),
  data: z.array(DataRowSchema).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Tool input schemas
// ---------------------------------------------------------------------------

export const ProductFilterSchema = z.object({
  lang: z.string().optional().describe('Språk: "sv" (standard) eller "en"'),
});

export const ProductStructureFilterSchema = z.object({
  product: z.string().describe('Produktkod (t.ex. "t10016" för bilar)'),
  lang: z.string().optional().describe('Språk: "sv" (standard) eller "en"'),
});

export const DataQueryFilterSchema = z.object({
  query: z.string().describe('Frågesträng i formatet PRODUKT|MÅTT|DIMENSION:värde1,värde2|DIMENSION2:värde'),
  lang: z.string().optional().describe('Språk: "sv" (standard) eller "en"'),
});

export const CarsFilterSchema = z.object({
  ar: z.string().optional().describe('År (t.ex. "2024" eller "2023,2024")'),
  drivm: z.string().optional().describe('Drivmedel (t.ex. "bensin", "diesel", "el")'),
  agarkat: z.string().optional().describe('Ägarkategori'),
  lang: z.string().optional().describe('Språk: "sv" (standard) eller "en"'),
});

export const NewRegistrationsFilterSchema = z.object({
  ar: z.string().optional().describe('År (t.ex. "2024" eller "2023,2024")'),
  drivm: z.string().optional().describe('Drivmedel'),
  lang: z.string().optional().describe('Språk: "sv" (standard) eller "en"'),
});

export const VehicleKmFilterSchema = z.object({
  ar: z.string().optional().describe('År (t.ex. "2024")'),
  lang: z.string().optional().describe('Språk: "sv" (standard) eller "en"'),
});

export const RailFilterSchema = z.object({
  ar: z.string().optional().describe('År (t.ex. "2024")'),
  lang: z.string().optional().describe('Språk: "sv" (standard) eller "en"'),
});

export const AirFilterSchema = z.object({
  ar: z.string().optional().describe('År (t.ex. "2024")'),
  lang: z.string().optional().describe('Språk: "sv" (standard) eller "en"'),
});

// ---------------------------------------------------------------------------
// Constants — important product codes
// ---------------------------------------------------------------------------

export const PRODUCT_CODES: Record<string, string> = {
  t10016: 'Personbilar',
  t10013: 'Lastbilar',
  t10011: 'Bussar',
  t10014: 'Motorcyklar',
  t0401: 'Fordonskilometer',
  t0802: 'Sjöfart',
  t0808: 'Fartygsflottan',
  t0501: 'Flygtrafik',
  t0603: 'Järnvägstransporter',
  t0604: 'Järnvägspunktlighet',
  t1201: 'Färdtjänst',
  t1202: 'Kommersiella linjer',
};

export const MEASURE_IDS: Record<string, string> = {
  itrfslut: 'I trafik (slutbestånd)',
  nyregunder: 'Nyregistreringar under perioden',
  fordonkm: 'Fordonskilometer',
};

export const DIMENSION_IDS: Record<string, string> = {
  ar: 'År',
  drivm: 'Drivmedel',
  agarkat: 'Ägarkategori',
  kon: 'Kön',
};
