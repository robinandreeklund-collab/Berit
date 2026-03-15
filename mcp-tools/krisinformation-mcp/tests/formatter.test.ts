import { describe, it, expect } from 'vitest';
import { formatNews, formatVmas } from '../src/formatter.js';

describe('formatNews', () => {
  it('returns empty message for no data', () => {
    const result = formatNews([]);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga krisnyheter');
  });

  it('returns empty message for null data', () => {
    const result = formatNews(null);
    expect(result.count).toBe(0);
  });

  it('formats news articles', () => {
    const data = [
      {
        Headline: 'Översvämning i Karlstad',
        Published: '2026-03-15T10:00:00Z',
        SourceName: 'MSB',
        Preamble: 'Kraftigt regn har orsakat översvämningar.',
      },
    ];
    const result = formatNews(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Översvämning');
    expect(result.markdown).toContain('MSB');
  });
});

describe('formatVmas', () => {
  it('returns empty message for no data', () => {
    const result = formatVmas([]);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga aktiva VMA');
  });

  it('formats VMA alerts', () => {
    const data = [
      {
        Headline: 'VMA: Brand i industriområde',
        Severity: 'Severe',
        Published: '2026-03-15T10:00:00Z',
        PushMessage: 'Stäng fönster och ventilation.',
        Area: [{ Description: 'Stockholms län' }],
      },
    ];
    const result = formatVmas(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Brand');
    expect(result.markdown).toContain('Severe');
    expect(result.markdown).toContain('Stockholms län');
  });
});
