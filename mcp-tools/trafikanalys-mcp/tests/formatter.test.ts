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
  it('formats product list from StructureItems', () => {
    const data = {
      StructureItems: [
        { Name: 't10016', Label: 'Personbilar', Type: 'P', Description: 'Fordonsstatistik', UniqueId: 'T10016' },
        { Name: 't0501', Label: 'Flygtrafik', Type: 'P', Description: 'Flygstatistik', UniqueId: 'T0501' },
        { Name: 'ar', Label: 'År', Type: 'D' }, // Dimension, should be filtered out
      ],
    };
    const result = formatProducts(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('t10016');
    expect(result.markdown).toContain('Personbilar');
    expect(result.markdown).toContain('t0501');
  });

  it('handles empty StructureItems', () => {
    const result = formatProducts({ StructureItems: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga produkter');
  });

  it('handles null data', () => {
    const result = formatProducts(null);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga produkter');
  });
});

describe('formatProductStructure', () => {
  it('formats product structure with dimensions and measures', () => {
    const data = {
      StructureItems: [
        { Name: 't10016', Label: 'Personbilar', Type: 'P' },
        {
          Name: 'ar', Label: 'År', Type: 'D',
          StructureItems: [
            { Name: 'senaste', Label: 'Senaste' },
            { Name: '2024', Label: '2024' },
          ],
        },
        {
          Name: 'drivm', Label: 'Drivmedel', Type: 'D',
          StructureItems: [
            { Name: 'bensin', Label: 'Bensin' },
            { Name: 'diesel', Label: 'Diesel' },
            { Name: 'el', Label: 'El' },
          ],
        },
        { Name: 'itrfslut', Label: 'I trafik', Type: 'M', Description: 'Antal i slutet av perioden' },
        { Name: 'nyregunder', Label: 'Nyregistreringar', Type: 'M', Description: 'Under perioden' },
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
  it('formats data with Rows and Cells (Trafikanalys format)', () => {
    const data = {
      Header: { Column: [{ Name: 'itrfslut', Value: 'Antal i trafik' }] },
      Rows: [
        {
          Cell: [
            { Name: '2024', Column: 'ar', Value: '2024', FormattedValue: '2024', IsMeasure: false },
            { Name: 'Bensin', Column: 'drivm', Value: 'Bensin', FormattedValue: 'Bensin', IsMeasure: false },
            { Name: '3500000', Column: 'itrfslut', Value: '3500000', FormattedValue: '3500000', IsMeasure: true },
          ],
        },
        {
          Cell: [
            { Name: '2024', Column: 'ar', Value: '2024', FormattedValue: '2024', IsMeasure: false },
            { Name: 'Diesel', Column: 'drivm', Value: 'Diesel', FormattedValue: 'Diesel', IsMeasure: false },
            { Name: '1200000', Column: 'itrfslut', Value: '1200000', FormattedValue: '1200000', IsMeasure: true },
          ],
        },
      ],
      Errors: null,
      Name: 'Personbilar',
    };
    const result = formatDataResults(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('2024');
    expect(result.markdown).toContain('Bensin');
    expect(result.markdown).toContain('Personbilar');
  });

  it('formats Errors from API', () => {
    const data = {
      Header: { Column: [] },
      Rows: [],
      Errors: ['Entiten hittades inte i strukturen.'],
    };
    const result = formatDataResults(data);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Fel från API');
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

  it('handles empty object with no rows', () => {
    const result = formatDataResults({
      Header: { Column: [{ Name: 'test' }] },
      Rows: [],
      Errors: null,
      Name: 'TestProduct',
    });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga rader');
  });
});
