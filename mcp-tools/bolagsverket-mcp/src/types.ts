/**
 * Zod schemas for Bolagsverket API responses and tool inputs.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// API response schemas
// ---------------------------------------------------------------------------

export const AddressSchema = z.object({
  gatuadress: z.string().optional(),
  postnummer: z.string().optional(),
  postort: z.string().optional(),
  land: z.string().optional(),
}).passthrough();

export const PersonSchema = z.object({
  namn: z.string().optional(),
  befattning: z.string().optional(),
  roll: z.string().optional(),
  tilltradesdatum: z.string().optional(),
}).passthrough();

export const OrganisationSchema = z.object({
  organisationsnummer: z.string().optional(),
  foretagsnamn: z.string().optional(),
  juridiskForm: z.string().optional(),
  status: z.string().optional(),
  verksamhetsbeskrivning: z.string().optional(),
  sniKoder: z.array(z.string()).optional(),
  registreringsdatum: z.string().optional(),
  adress: AddressSchema.optional(),
  besoksadress: AddressSchema.optional(),
  aktiekapital: z.number().optional(),
  teckningsratt: z.string().optional(),
  firmateckning: z.string().optional(),
  fskatt: z.boolean().optional(),
  momsRegistrerad: z.boolean().optional(),
  arbetsgivare: z.boolean().optional(),
  funktionarer: z.array(PersonSchema).optional(),
}).passthrough();

export const DokumentSchema = z.object({
  dokumentId: z.string().optional(),
  dokumenttyp: z.string().optional(),
  datum: z.string().optional(),
  beskrivning: z.string().optional(),
  rakenskapsar: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Tool input schemas
// ---------------------------------------------------------------------------

export const OrgNrFilterSchema = z.object({
  organisationsnummer: z.string().describe('Organisationsnummer (10 siffror, t.ex. "5566778899" eller "556677-8899")'),
});

export const DokumentFilterSchema = z.object({
  organisationsnummer: z.string().describe('Organisationsnummer (10 siffror)'),
});

export const DokumentIdFilterSchema = z.object({
  dokumentId: z.string().describe('Dokument-ID från dokumentlistan'),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const JURIDISKA_FORMER: Record<string, string> = {
  AB: 'Aktiebolag',
  HB: 'Handelsbolag',
  KB: 'Kommanditbolag',
  EF: 'Enskild firma',
  EK: 'Ekonomisk förening',
  FL: 'Filial',
  ST: 'Stiftelse',
  ID: 'Ideell förening',
};
