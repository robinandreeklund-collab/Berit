import { describe, it, expect } from 'vitest';
import { formatSearchResults, formatDetails, formatEvents } from '../src/formatter.js';

describe('formatSearchResults', () => {
  it('returns empty message for no data', () => {
    const result = formatSearchResults([]);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga resultat');
  });

  it('returns empty message for null data', () => {
    const result = formatSearchResults(null);
    expect(result.count).toBe(0);
  });

  it('formats array of entries', () => {
    const data = [
      { 'schema:name': 'Liseberg', '@type': 'Place', 'schema:description': 'Nöjespark i Göteborg', entryId: '123' },
      { 'schema:name': 'Hotel Opera', '@type': 'LodgingBusiness', 'schema:description': 'Hotell', entryId: '456' },
    ];
    const result = formatSearchResults(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Liseberg');
    expect(result.markdown).toContain('Hotel Opera');
  });
});

describe('formatDetails', () => {
  it('formats entry details', () => {
    const data = {
      'schema:name': 'Liseberg',
      '@type': 'Place',
      'schema:description': 'Nöjespark i Göteborg',
      'schema:address': 'Örgrytevägen 5',
    };
    const result = formatDetails(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Liseberg');
    expect(result.markdown).toContain('Nöjespark');
  });

  it('handles null data', () => {
    const result = formatDetails(null);
    expect(result.count).toBe(1);
  });
});

describe('formatEvents', () => {
  it('returns empty message for no events', () => {
    const result = formatEvents([]);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga evenemang');
  });

  it('formats event entries', () => {
    const data = [
      { 'schema:name': 'Midsommarfest', '@type': 'Event', 'schema:startDate': '2026-06-20', 'schema:location': 'Dalarna' },
    ];
    const result = formatEvents(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Midsommarfest');
  });
});
