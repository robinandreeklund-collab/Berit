/**
 * Types and constants for Krisinformation MCP server.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// API response schemas
// ---------------------------------------------------------------------------

export const NewsArticleSchema = z.object({
  Identifier: z.string().optional(),
  PushMessage: z.string().optional(),
  Updated: z.string().optional(),
  Published: z.string().optional(),
  Headline: z.string().optional(),
  Preamble: z.string().optional(),
  BodyText: z.string().optional(),
  Area: z.array(z.object({
    Type: z.string().optional(),
    Description: z.string().optional(),
    Coordinate: z.string().optional(),
  })).optional(),
  SourceName: z.string().optional(),
  Event: z.string().optional(),
}).passthrough();

export type NewsArticle = z.infer<typeof NewsArticleSchema>;

export const VmaAlertSchema = z.object({
  Identifier: z.string().optional(),
  PushMessage: z.string().optional(),
  Updated: z.string().optional(),
  Published: z.string().optional(),
  Headline: z.string().optional(),
  Preamble: z.string().optional(),
  BodyText: z.string().optional(),
  Area: z.array(z.object({
    Type: z.string().optional(),
    Description: z.string().optional(),
    Coordinate: z.string().optional(),
  })).optional(),
  SenderName: z.string().optional(),
  Severity: z.string().optional(),
}).passthrough();

export type VmaAlert = z.infer<typeof VmaAlertSchema>;

// ---------------------------------------------------------------------------
// Constants — Swedish counties
// ---------------------------------------------------------------------------

export const COUNTIES: Record<string, string> = {
  '01': 'Stockholms län',
  '03': 'Uppsala län',
  '04': 'Södermanlands län',
  '05': 'Östergötlands län',
  '06': 'Jönköpings län',
  '07': 'Kronobergs län',
  '08': 'Kalmar län',
  '09': 'Gotlands län',
  '10': 'Blekinge län',
  '12': 'Skåne län',
  '13': 'Hallands län',
  '14': 'Västra Götalands län',
  '17': 'Värmlands län',
  '18': 'Örebro län',
  '19': 'Västmanlands län',
  '20': 'Dalarnas län',
  '21': 'Gävleborgs län',
  '22': 'Västernorrlands län',
  '23': 'Jämtlands län',
  '24': 'Västerbottens län',
  '25': 'Norrbottens län',
};
