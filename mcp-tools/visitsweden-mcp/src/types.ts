/**
 * Zod schemas and types for the Visit Sweden MCP server.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// API response schemas
// ---------------------------------------------------------------------------

export const EntryMetadataSchema = z.object({
  entryId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  uri: z.string().optional(),
}).passthrough();

export type EntryMetadata = z.infer<typeof EntryMetadataSchema>;

// ---------------------------------------------------------------------------
// Constants — entity types
// ---------------------------------------------------------------------------

export const ENTITY_TYPES: Record<string, string> = {
  Event: 'Evenemang',
  LodgingBusiness: 'Boende (hotell, vandrarhem, camping)',
  Place: 'Plats / Attraktion',
  FoodEstablishment: 'Restaurang / Café',
};

// ---------------------------------------------------------------------------
// Constants — Swedish regions
// ---------------------------------------------------------------------------

export const REGIONS: Record<string, string> = {
  blekinge: 'Blekinge',
  dalarna: 'Dalarna',
  gotland: 'Gotland',
  gavleborg: 'Gävleborg',
  halland: 'Halland',
  jamtland: 'Jämtland Härjedalen',
  jonkoping: 'Jönköping',
  kalmar: 'Kalmar',
  kronoberg: 'Kronoberg',
  norrbotten: 'Norrbotten',
  skane: 'Skåne',
  stockholm: 'Stockholm',
  sodermanland: 'Södermanland',
  uppland: 'Uppland',
  varmland: 'Värmland',
  vasterbotten: 'Västerbotten',
  vasternorrland: 'Västernorrland',
  vastmanland: 'Västmanland',
  vastra_gotaland: 'Västra Götaland',
  orebro: 'Örebro',
  ostergotland: 'Östergötland',
};
