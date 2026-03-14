/**
 * Zod schemas for Naturvardsverket API responses and constants.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Constants — Swedish county codes (lan)
// ---------------------------------------------------------------------------

export const LAN_CODES: Record<string, string> = {
  AB: 'Stockholms lan',
  C: 'Uppsala lan',
  D: 'Sodermanlands lan',
  E: 'Ostergotlands lan',
  F: 'Jonkopings lan',
  G: 'Kronobergs lan',
  H: 'Kalmar lan',
  I: 'Gotlands lan',
  K: 'Blekinge lan',
  M: 'Skane lan',
  N: 'Hallands lan',
  O: 'Vastra Gotalands lan',
  S: 'Varmlands lan',
  T: 'Orebro lan',
  U: 'Vastmanlands lan',
  W: 'Dalarnas lan',
  X: 'Gavleborgs lan',
  Y: 'Vasternorrlands lan',
  Z: 'Jamtlands lan',
  AC: 'Vasterbottens lan',
  BD: 'Norrbottens lan',
};

// ---------------------------------------------------------------------------
// Constants — Common municipality codes (kommun)
// ---------------------------------------------------------------------------

export const KOMMUN_CODES: Record<string, string> = {
  '0180': 'Stockholm',
  '1480': 'Goteborg',
  '1280': 'Malmo',
  '0380': 'Uppsala',
  '0580': 'Linkoping',
  '0680': 'Jonkoping',
  '0880': 'Kalmar',
  '0980': 'Gotland',
  '1080': 'Karlskrona',
  '1380': 'Halmstad',
  '1580': 'Boras',
  '1680': 'Trollhattan',
  '1780': 'Karlstad',
  '1880': 'Orebro',
  '1980': 'Vasteras',
  '2080': 'Falun',
  '2180': 'Gavle',
  '2280': 'Sundsvall',
  '2380': 'Ostersund',
  '2480': 'Umea',
  '2580': 'Lulea',
  '0184': 'Solna',
  '0186': 'Lidingo',
  '0187': 'Vaxholm',
  '0120': 'Varmdö',
  '0123': 'Jarfalla',
  '0126': 'Huddinge',
  '0127': 'Botkyrka',
  '0128': 'Salem',
  '0136': 'Haninge',
  '0138': 'Tyreso',
  '0160': 'Taby',
  '0162': 'Danderyd',
  '0163': 'Sollentuna',
  '0181': 'Sodertalje',
  '0182': 'Nacka',
  '0183': 'Sundbyberg',
  '0191': 'Sigtuna',
  '0192': 'Norrtalje',
};

// ---------------------------------------------------------------------------
// Constants — Species groups (Natura 2000)
// ---------------------------------------------------------------------------

export const SPECIES_GROUPS: Record<string, string> = {
  B: 'Faglar',
  M: 'Daggdjur',
  R: 'Reptiler',
  A: 'Amfibier',
  F: 'Fiskar',
  I: 'Evertebrater',
  P: 'Vaxter',
};

// ---------------------------------------------------------------------------
// NVV API response schemas — National protected areas
// ---------------------------------------------------------------------------

export const NvvAreaSchema = z.object({
  nvrId: z.number().optional(),
  namn: z.string().optional(),
  skyddstyp: z.string().optional(),
  beslutsdatum: z.string().optional(),
  areal: z.number().optional(),
  lan: z.string().optional(),
  kommun: z.string().optional(),
}).passthrough();

export const NvvSyfteSchema = z.object({
  syfteId: z.number().optional(),
  syftestext: z.string().optional(),
}).passthrough();

export const NvvNmdKlassSchema = z.object({
  nmdKlassId: z.number().optional(),
  nmdKlassNamn: z.string().optional(),
  areal: z.number().optional(),
  andel: z.number().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// NVV API response schemas — Natura 2000
// ---------------------------------------------------------------------------

export const N2000AreaSchema = z.object({
  kod: z.string().optional(),
  namn: z.string().optional(),
  areal: z.number().optional(),
  lan: z.string().optional(),
  kommun: z.string().optional(),
}).passthrough();

export const N2000ArtSchema = z.object({
  vetenskapligtNamn: z.string().optional(),
  svensktNamn: z.string().optional(),
  grupp: z.string().optional(),
  bilaga: z.string().optional(),
}).passthrough();

export const N2000NaturtypSchema = z.object({
  naturtypskod: z.string().optional(),
  naturtypNamn: z.string().optional(),
  areal: z.number().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// NVV API response schemas — Ramsar
// ---------------------------------------------------------------------------

export const RamsarAreaSchema = z.object({
  id: z.number().optional(),
  namn: z.string().optional(),
  areal: z.number().optional(),
  lan: z.string().optional(),
  kommun: z.string().optional(),
  beslutsdatum: z.string().optional(),
}).passthrough();
