/**
 * Constants and Zod schemas for Riksdag/Regering API responses.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Constants — document types
// ---------------------------------------------------------------------------

export const DOKTYP: Record<string, string> = {
  mot: 'Motion',
  prop: 'Proposition',
  bet: 'Betänkande',
  ip: 'Interpellation',
  fr: 'Skriftlig fråga',
  sou: 'Statens offentliga utredningar',
  ds: 'Departementsserien',
  dir: 'Kommittédirektiv',
  rskr: 'Riksdagsskrivelse',
  prot: 'Protokoll',
};

// ---------------------------------------------------------------------------
// Constants — parties
// ---------------------------------------------------------------------------

export const PARTIER: Record<string, string> = {
  S: 'Socialdemokraterna',
  M: 'Moderaterna',
  SD: 'Sverigedemokraterna',
  C: 'Centerpartiet',
  V: 'Vänsterpartiet',
  KD: 'Kristdemokraterna',
  L: 'Liberalerna',
  MP: 'Miljöpartiet',
};

// ---------------------------------------------------------------------------
// Constants — committees (utskott)
// ---------------------------------------------------------------------------

export const UTSKOTT: Record<string, string> = {
  AU: 'Arbetsmarknadsutskottet',
  CU: 'Civilutskottet',
  FiU: 'Finansutskottet',
  FöU: 'Försvarsutskottet',
  JuU: 'Justitieutskottet',
  KU: 'Konstitutionsutskottet',
  KrU: 'Kulturutskottet',
  MJU: 'Miljö- och jordbruksutskottet',
  NU: 'Näringsutskottet',
  SkU: 'Skatteutskottet',
  SfU: 'Socialförsäkringsutskottet',
  SoU: 'Socialutskottet',
  TU: 'Trafikutskottet',
  UbU: 'Utbildningsutskottet',
  UU: 'Utrikesutskottet',
};

// ---------------------------------------------------------------------------
// Constants — government document types (g0v.se)
// ---------------------------------------------------------------------------

export const REGERING_DOKTYP: Record<string, string> = {
  pressmeddelanden: 'Pressmeddelanden',
  propositioner: 'Propositioner',
  sou: 'Statens offentliga utredningar',
  ds: 'Departementsserien',
  dir: 'Kommittédirektiv',
  remisser: 'Remisser',
};

// ---------------------------------------------------------------------------
// Zod schemas — Riksdagen API responses
// ---------------------------------------------------------------------------

export const DokumentSchema = z.object({
  dok_id: z.string(),
  rm: z.string().optional(),
  beteckning: z.string().optional(),
  typ: z.string().optional(),
  subtyp: z.string().optional(),
  doktyp: z.string().optional(),
  titel: z.string().optional(),
  undertitel: z.string().optional(),
  organ: z.string().optional(),
  datum: z.string().optional(),
  publicerad: z.string().optional(),
  summary: z.string().optional(),
  dokument_url_text: z.string().optional(),
  dokument_url_html: z.string().optional(),
}).passthrough();

export const PersonSchema = z.object({
  intressent_id: z.string(),
  förnamn: z.string().optional(),
  efternamn: z.string().optional(),
  parti: z.string().optional(),
  valkrets: z.string().optional(),
  status: z.string().optional(),
  bild_url_192: z.string().optional(),
  tilltalsnamn: z.string().optional(),
}).passthrough();

export const AnförandeSchema = z.object({
  dok_id: z.string().optional(),
  dok_titel: z.string().optional(),
  talare: z.string().optional(),
  parti: z.string().optional(),
  anförandetext: z.string().optional(),
  datum: z.string().optional(),
  avsnittsrubrik: z.string().optional(),
  rm: z.string().optional(),
}).passthrough();

export const VoteringSchema = z.object({
  votering_id: z.string().optional(),
  rm: z.string().optional(),
  beteckning: z.string().optional(),
  punkt: z.string().optional(),
  namn: z.string().optional(),
  parti: z.string().optional(),
  rost: z.string().optional(),
  datum: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Zod schemas — g0v.se responses
// ---------------------------------------------------------------------------

export const G0vDokumentSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  published: z.string().optional(),
  url: z.string().optional(),
  department: z.string().optional(),
  type: z.string().optional(),
  summary: z.string().optional(),
}).passthrough();
