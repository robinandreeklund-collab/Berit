/**
 * Zod schemas for KB API responses and tool inputs.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Libris Xsearch response schemas
// ---------------------------------------------------------------------------

export const LibrisXsearchRecordSchema = z.object({
  identifier: z.string().optional(),
  title: z.string().optional(),
  creator: z.union([z.string(), z.array(z.string())]).optional(),
  date: z.string().optional(),
  publisher: z.string().optional(),
  type: z.string().optional(),
  isbn: z.union([z.string(), z.array(z.string())]).optional(),
  language: z.string().optional(),
  description: z.string().optional(),
  subject: z.union([z.string(), z.array(z.string())]).optional(),
}).passthrough();

export const LibrisXsearchResponseSchema = z.object({
  xsearch: z.object({
    from: z.number().optional(),
    to: z.number().optional(),
    records: z.number().optional(),
    list: z.array(LibrisXsearchRecordSchema).optional(),
  }).passthrough(),
}).passthrough();

// ---------------------------------------------------------------------------
// Libris XL / Find response schemas (JSON-LD)
// ---------------------------------------------------------------------------

export const LibrisXLItemSchema = z.object({
  '@id': z.string().optional(),
  '@type': z.union([z.string(), z.array(z.string())]).optional(),
  hasTitle: z.array(z.object({
    mainTitle: z.string().optional(),
    subtitle: z.string().optional(),
  }).passthrough()).optional(),
  identifiedBy: z.array(z.object({
    '@type': z.string().optional(),
    value: z.string().optional(),
  }).passthrough()).optional(),
  contribution: z.array(z.object({
    agent: z.object({
      '@type': z.string().optional(),
      name: z.string().optional(),
    }).passthrough().optional(),
    role: z.array(z.object({
      '@id': z.string().optional(),
    }).passthrough()).optional(),
  }).passthrough()).optional(),
  publication: z.array(z.object({
    date: z.string().optional(),
    agent: z.object({
      name: z.string().optional(),
    }).passthrough().optional(),
  }).passthrough()).optional(),
}).passthrough();

export const LibrisXLResponseSchema = z.object({
  '@context': z.string().optional(),
  '@id': z.string().optional(),
  '@type': z.string().optional(),
  totalItems: z.number().optional(),
  itemOffset: z.number().optional(),
  itemsPerPage: z.number().optional(),
  items: z.array(LibrisXLItemSchema).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Libris Holdings response schema
// ---------------------------------------------------------------------------

export const LibrisHoldingSchema = z.object({
  '@id': z.string().optional(),
  '@type': z.string().optional(),
  heldBy: z.object({
    '@id': z.string().optional(),
    name: z.string().optional(),
    sigel: z.string().optional(),
  }).passthrough().optional(),
  hasComponent: z.array(z.object({
    shelfMark: z.object({
      label: z.string().optional(),
    }).passthrough().optional(),
  }).passthrough()).optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// K-samsök response schemas
// ---------------------------------------------------------------------------

export const KsamsokRecordSchema = z.object({
  recordId: z.string().optional(),
  type: z.string().optional(),
  itemLabel: z.string().optional(),
  itemDescription: z.string().optional(),
  itemName: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  presentationUrl: z.string().optional(),
  institution: z.string().optional(),
  municipality: z.string().optional(),
  county: z.string().optional(),
  country: z.string().optional(),
  timeLabel: z.string().optional(),
  coordinates: z.string().optional(),
}).passthrough();

export const KsamsokSearchResponseSchema = z.object({
  totalHits: z.number().optional(),
  records: z.array(KsamsokRecordSchema).optional(),
}).passthrough();

export const KsamsokObjectResponseSchema = z.object({
  record: KsamsokRecordSchema.optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Swepub response schema (via Libris Xsearch with type=swepub)
// ---------------------------------------------------------------------------

export const SwepubRecordSchema = z.object({
  identifier: z.string().optional(),
  title: z.string().optional(),
  creator: z.union([z.string(), z.array(z.string())]).optional(),
  date: z.string().optional(),
  publisher: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  subject: z.union([z.string(), z.array(z.string())]).optional(),
  source: z.string().optional(),
}).passthrough();

// ---------------------------------------------------------------------------
// Tool input schemas
// ---------------------------------------------------------------------------

export const LibrisSearchInputSchema = z.object({
  query: z.string().describe('Fritextsökning i Libris (böcker, tidskrifter, e-resurser)'),
  limit: z.number().optional().describe('Max antal resultat (1-200, standard: 10)'),
});

export const LibrisAuthorInputSchema = z.object({
  author: z.string().describe('Författarnamn att söka efter'),
  limit: z.number().optional().describe('Max antal resultat (1-200, standard: 10)'),
});

export const LibrisTitleInputSchema = z.object({
  title: z.string().describe('Boktitel att söka efter'),
  limit: z.number().optional().describe('Max antal resultat (1-200, standard: 10)'),
});

export const LibrisIsbnInputSchema = z.object({
  isbn: z.string().describe('ISBN-nummer (10 eller 13 siffror)'),
});

export const LibrisFindInputSchema = z.object({
  query: z.string().describe('Avancerad söksträng med operatorer (AND, OR, NOT, field:value)'),
  limit: z.number().optional().describe('Max antal resultat (1-200, standard: 10)'),
});

export const LibrisHoldingsInputSchema = z.object({
  recordId: z.string().describe('Libris post-ID (t.ex. "bib/12345" eller fullständig URI)'),
});

export const KsamsokSearchInputSchema = z.object({
  query: z.string().describe('CQL-söksträng för K-samsök (t.ex. "viking" eller "itemType=foto")'),
  limit: z.number().optional().describe('Max antal resultat (1-500, standard: 10)'),
});

export const KsamsokLocationInputSchema = z.object({
  county: z.string().optional().describe('Länsnamn (t.ex. "Stockholm", "Västra Götaland")'),
  municipality: z.string().optional().describe('Kommunnamn (t.ex. "Göteborg", "Uppsala")'),
  query: z.string().optional().describe('Ytterligare sökord att kombinera med plats'),
  limit: z.number().optional().describe('Max antal resultat (1-500, standard: 10)'),
});

export const KsamsokObjectInputSchema = z.object({
  objectId: z.string().describe('K-samsök objekt-URI (t.ex. "raa/fmi/10028600550001")'),
});

export const SwepubSearchInputSchema = z.object({
  query: z.string().describe('Söksträng för svenska forskningspublikationer'),
  limit: z.number().optional().describe('Max antal resultat (1-200, standard: 10)'),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Libris Xsearch base URL */
export const LIBRIS_BASE_URL = 'https://libris.kb.se';

/** K-samsök API base URL */
export const KSAMSOK_BASE_URL = 'https://kulturarvsdata.se/ksamsok/api';

/** Common Libris search fields */
export const LIBRIS_SEARCH_FIELDS: Record<string, string> = {
  TITLE: 'Sök i boktitel',
  AUTHOR: 'Sök på författare',
  ISBN: 'Sök på ISBN',
  ISSN: 'Sök på ISSN',
  SUBJECT: 'Sök i ämnesord',
  PUBLISHER: 'Sök på förlag',
};

/** Common K-samsök item types */
export const KSAMSOK_ITEM_TYPES: Record<string, string> = {
  foto: 'Fotografier',
  konstverk: 'Konstverk',
  fornlämning: 'Fornlämningar',
  byggnad: 'Byggnader',
  karta: 'Kartor',
  föremål: 'Föremål',
  dokument: 'Dokument',
};

/** Swedish counties for geographic K-samsök searches */
export const SWEDISH_COUNTIES: string[] = [
  'Blekinge', 'Dalarna', 'Gotland', 'Gävleborg', 'Halland',
  'Jämtland', 'Jönköping', 'Kalmar', 'Kronoberg', 'Norrbotten',
  'Skåne', 'Stockholm', 'Södermanland', 'Uppsala', 'Värmland',
  'Västerbotten', 'Västernorrland', 'Västmanland', 'Västra Götaland',
  'Örebro', 'Östergötland',
];
