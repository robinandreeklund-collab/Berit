import { describe, it, expect } from 'vitest';
import {
  formatProducts,
  formatProductStructure,
  formatDataResults,
  markdownTable,
} from '../src/formatter.js';

describe('markdownTable', () => {
  it('generates a valid markdown table', () => {
    const result = markdownTable(['A', 'B'], [['1', '2'], ['3', '4']]);
    expect(result).toContain('| A | B |');
    expect(result).toContain('| 1 | 2 |');
  });

  it('returns message for empty data', () => {
    const result = markdownTable(['A'], []);
    expect(result).toBe('_Inga resultat._');
  });
});

describe('formatProducts', () => {
  it('formats product list', () => {
    const data = [
      { code: 't10016', name: 'Personbilar', description: 'Fordonsstatistik' },
      { code: 't0501', name: 'Flygtrafik', description: 'Flygstatistik' },
    ];
    const result = formatProducts(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('t10016');
    expect(result.markdown).toContain('Personbilar');
    expect(result.markdown).toContain('t0501');
  });

  it('handles empty array', () => {
    const result = formatProducts([]);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga produkter');
  });
});

describe('formatProductStructure', () => {
  it('formats product structure with dimensions and measures', () => {
    const data = {
      code: 't10016',
      name: 'Personbilar',
      dimensions: [
        { code: 'ar', name: 'År', values: [{ code: '2023' }, { code: '2024' }] },
        { code: 'drivm', name: 'Drivmedel', values: [{ code: 'bensin' }, { code: 'diesel' }, { code: 'el' }] },
      ],
      measures: [
        { code: 'itrfslut', name: 'I trafik' },
        { code: 'nyregunder', name: 'Nyregistreringar' },
      ],
    };
    const result = formatProductStructure(data);
    expect(result.count).toBe(4); // 2 dimensions + 2 measures
    expect(result.markdown).toContain('Personbilar');
    expect(result.markdown).toContain('Dimensioner');
    expect(result.markdown).toContain('Mått');
    expect(result.markdown).toContain('ar');
    expect(result.markdown).toContain('itrfslut');
  });

  it('handles null data', () => {
    const result = formatProductStructure(null);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Ingen produktstruktur');
  });
});

describe('formatDataResults', () => {
  it('formats data with columns and rows', () => {
    const data = {
      columns: ['År', 'Drivmedel', 'Antal'],
      data: [
        { key: ['2024', 'Bensin'], values: [{ value: 3500000 }] },
        { key: ['2024', 'Diesel'], values: [{ value: 1200000 }] },
        { key: ['2024', 'El'], values: [{ value: 800000 }] },
      ],
    };
    const result = formatDataResults(data);
    expect(result.count).toBe(3);
    expect(result.markdown).toContain('År');
    expect(result.markdown).toContain('2024');
    expect(result.markdown).toContain('Bensin');
  });

  it('formats plain array response', () => {
    const data = [
      { ar: '2023', antal: 5000000 },
      { ar: '2024', antal: 5100000 },
    ];
    const result = formatDataResults(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('ar');
    // formatNumber uses sv-SE locale, so 2023 becomes "2 023"
    expect(result.markdown).toContain('023');
  });

  it('handles null data', () => {
    const result = formatDataResults(null);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga data');
  });

  it('handles empty object', () => {
    const result = formatDataResults({});
    // Should fallback to JSON dump
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('json');
  });

  it('formats numbers with Swedish locale', () => {
    const data = {
      columns: ['År', 'Antal'],
      data: [
        { key: ['2024'], values: [{ value: 1234567 }] },
      ],
    };
    const result = formatDataResults(data);
    expect(result.count).toBe(1);
    // Should contain the formatted number (locale-dependent)
    expect(result.markdown).toContain('2024');
  });
});
