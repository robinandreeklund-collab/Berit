/**
 * Types and constants for Polisen MCP server.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// API response schema
// ---------------------------------------------------------------------------

export const PoliceEventSchema = z.object({
  id: z.number(),
  datetime: z.string(),
  name: z.string(),
  summary: z.string(),
  url: z.string(),
  type: z.string(),
  location: z.object({
    name: z.string(),
    gps: z.string(),
  }),
}).passthrough();

export type PoliceEvent = z.infer<typeof PoliceEventSchema>;

// ---------------------------------------------------------------------------
// Constants — common event types
// ---------------------------------------------------------------------------

export const EVENT_TYPES: Record<string, string> = {
  'Misshandel': 'Misshandel',
  'Stöld': 'Stöld',
  'Inbrott': 'Inbrott',
  'Trafikolycka': 'Trafikolycka',
  'Brand': 'Brand',
  'Rån': 'Rån',
  'Skottlossning': 'Skottlossning',
  'Narkotikabrott': 'Narkotikabrott',
  'Bedrägeri': 'Bedrägeri',
  'Olaga hot': 'Olaga hot',
  'Motorfordon, anträffat stulet': 'Stulet fordon',
  'Rattfylleri': 'Rattfylleri',
  'Mord/dråp': 'Mord/dråp',
  'Djur': 'Djur',
  'Ordningslagen': 'Ordningslagen',
  'Arbetsplatsolycka': 'Arbetsplatsolycka',
};

// ---------------------------------------------------------------------------
// Constants — Swedish counties (location names used by Polisen API)
// ---------------------------------------------------------------------------

export const COUNTIES: string[] = [
  'Stockholms län',
  'Uppsala län',
  'Södermanlands län',
  'Östergötlands län',
  'Jönköpings län',
  'Kronobergs län',
  'Kalmar län',
  'Gotlands län',
  'Blekinge län',
  'Skåne län',
  'Hallands län',
  'Västra Götalands län',
  'Värmlands län',
  'Örebro län',
  'Västmanlands län',
  'Dalarnas län',
  'Gävleborgs län',
  'Västernorrlands län',
  'Jämtlands län',
  'Västerbottens län',
  'Norrbottens län',
];
