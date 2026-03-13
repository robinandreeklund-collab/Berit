import { describe, it, expect } from 'vitest';
import { decodeJsonStat2ToMarkdown } from '../src/jsonstat2.js';
import type { Dataset } from '../src/types.js';

function makeDataset(overrides: Partial<Dataset> = {}): Dataset {
  return {
    version: '2.0' as const,
    class: 'dataset' as const,
    id: ['Region', 'Tid', 'ContentsCode'],
    label: 'Test dataset',
    size: [2, 2, 1],
    dimension: {
      Region: {
        label: 'Region',
        category: {
          index: { '0180': 0, '1480': 1 },
          label: { '0180': 'Stockholm', '1480': 'Göteborg' },
        },
      },
      Tid: {
        label: 'Tid',
        category: {
          index: { '2023': 0, '2024': 1 },
          label: { '2023': '2023', '2024': '2024' },
        },
      },
      ContentsCode: {
        label: 'Innehåll',
        category: {
          index: { BE0101A9: 0 },
          label: { BE0101A9: 'Folkmängd' },
        },
      },
    },
    value: [975000, 985000, 590000, 600000],
    ...overrides,
  };
}

describe('decodeJsonStat2ToMarkdown', () => {
  it('should decode a simple dataset into markdown', () => {
    const result = decodeJsonStat2ToMarkdown(makeDataset());

    expect(result.totalRows).toBe(4);
    expect(result.truncated).toBe(false);
    expect(result.headers).toEqual(['Region', 'Tid', 'Innehåll', 'Värde']);
    expect(result.markdown).toContain('Stockholm');
    expect(result.markdown).toContain('Göteborg');
    expect(result.markdown).toContain('2023');
    expect(result.markdown).toContain('2024');
    // Check that it's a proper markdown table
    expect(result.markdown).toContain('| Region | Tid | Innehåll | Värde |');
    expect(result.markdown).toContain('| --- | --- | --- | --- |');
  });

  it('should handle empty dataset', () => {
    const result = decodeJsonStat2ToMarkdown(makeDataset({ value: [], dimension: {} }));

    expect(result.totalRows).toBe(0);
    expect(result.markdown).toContain('Ingen data');
  });

  it('should handle null values', () => {
    const result = decodeJsonStat2ToMarkdown(makeDataset({ value: [null, 985000, null, 600000] }));

    expect(result.totalRows).toBe(4);
    expect(result.markdown).toContain('..');
    expect(result.markdown).toContain('985');
  });

  it('should truncate at maxRows', () => {
    const result = decodeJsonStat2ToMarkdown(makeDataset(), 2);

    expect(result.truncated).toBe(true);
    expect(result.totalRows).toBe(4);
    expect(result.markdown).toContain('Visar 2 av 4 rader');
  });

  it('should include metadata', () => {
    const result = decodeJsonStat2ToMarkdown(makeDataset({
      source: 'SCB',
      updated: '2024-01-15',
    }));

    expect(result.metadata.source).toBe('SCB');
    expect(result.metadata.updated).toBe('2024-01-15');
    expect(result.metadata.tableName).toBe('Test dataset');
    expect(result.metadata.dimensions).toHaveLength(3);
    expect(result.metadata.dimensions[0].code).toBe('Region');
    expect(result.metadata.dimensions[0].count).toBe(2);
  });
});
