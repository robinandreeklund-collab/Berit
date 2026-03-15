import { describe, it, expect } from 'vitest';
import {
  formatDataflows,
  formatDataStructure,
  formatSDMXData,
  formatCategories,
  formatCategoriesDetailed,
  formatPopularDatasets,
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

describe('formatDataflows', () => {
  it('formats a list of dataflows', () => {
    const data = [
      { id: 'QNA', name: 'Quarterly National Accounts', description: 'GDP data', category: 'Economy' },
      { id: 'MEI', name: 'Main Economic Indicators', description: 'Key indicators', category: 'Economy' },
    ];
    const result = formatDataflows(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('QNA');
    expect(result.markdown).toContain('MEI');
    expect(result.markdown).toContain('Economy');
  });

  it('handles empty array', () => {
    const result = formatDataflows([]);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga dataset');
  });
});

describe('formatDataStructure', () => {
  it('formats a data structure with known dataflow info', () => {
    const data = {
      structure: {
        dimensions: {
          series: [
            { id: 'REF_AREA', name: 'Reference area', keyPosition: 0, values: [{ id: 'SWE', name: 'Sweden' }] },
            { id: 'MEASURE', name: 'Measure', keyPosition: 1, values: [{ id: 'GDP', name: 'Gross domestic product' }] },
          ],
          observation: [
            { id: 'TIME_PERIOD', name: 'Time period', values: [{ id: '2024-Q1' }] },
          ],
        },
      },
    };
    const result = formatDataStructure(data, 'QNA');
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('QNA');
    expect(result.markdown).toContain('Dimensioner');
    expect(result.markdown).toContain('REF_AREA');
    expect(result.markdown).toContain('Kvartalsvisa nationalräkenskaper');
  });

  it('handles null data', () => {
    const result = formatDataStructure(null, 'UNKNOWN');
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Ingen metadata');
  });
});

describe('formatSDMXData', () => {
  it('formats SDMX-JSON data with series', () => {
    const data = {
      dataSets: [{
        series: {
          '0:0': {
            observations: {
              '0': [100.5],
              '1': [101.2],
            },
          },
        },
      }],
      structure: {
        dimensions: {
          series: [
            { id: 'REF_AREA', name: 'Land', values: [{ id: 'SWE', name: 'Sverige' }] },
            { id: 'MEASURE', name: 'Mått', values: [{ id: 'GDP', name: 'BNP' }] },
          ],
          observation: [
            { id: 'TIME_PERIOD', name: 'Period', values: [{ id: '2023', name: '2023' }, { id: '2024', name: '2024' }] },
          ],
        },
      },
    };
    const result = formatSDMXData(data, 'QNA');
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Sverige');
    expect(result.markdown).toContain('BNP');
    expect(result.markdown).toContain('100.50');
    expect(result.markdown).toContain('2023');
  });

  it('handles empty dataSets', () => {
    const data = { dataSets: [], structure: {} };
    const result = formatSDMXData(data, 'QNA');
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Ingen data');
  });

  it('handles null data', () => {
    const result = formatSDMXData(null, 'UNKNOWN');
    expect(result.count).toBe(0);
  });
});

describe('formatCategories', () => {
  it('returns all 17 categories', () => {
    const result = formatCategories();
    expect(result.count).toBe(17);
    expect(result.markdown).toContain('Economy');
    expect(result.markdown).toContain('Health');
    expect(result.markdown).toContain('Education');
    expect(result.markdown).toContain('Ekonomi');
    expect(result.markdown).toContain('Hälsa');
  });
});

describe('formatCategoriesDetailed', () => {
  it('returns detailed info for all 17 categories', () => {
    const result = formatCategoriesDetailed();
    expect(result.count).toBe(17);
    expect(result.markdown).toContain('Ekonomi');
    expect(result.markdown).toContain('Economy');
    expect(result.markdown).toContain('Dataset:');
  });
});

describe('formatPopularDatasets', () => {
  it('returns curated list with dataset info', () => {
    const result = formatPopularDatasets();
    expect(result.count).toBeGreaterThan(0);
    expect(result.markdown).toContain('QNA');
    expect(result.markdown).toContain('MEI');
    expect(result.markdown).toContain('HEALTH_STAT');
    expect(result.markdown).toContain('Exempelfilter');
  });
});
