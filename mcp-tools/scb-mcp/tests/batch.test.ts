import { describe, it, expect } from 'vitest';
import { createBatchPlan, mergeDatasets } from '../src/batch.js';
import type { Dataset } from '../src/types.js';

function makeMetadata(): Dataset {
  return {
    version: '2.0' as const,
    class: 'dataset' as const,
    id: ['Region', 'Tid'],
    label: 'Test',
    size: [2, 10],
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
          index: { '2015': 0, '2016': 1, '2017': 2, '2018': 3, '2019': 4, '2020': 5, '2021': 6, '2022': 7, '2023': 8, '2024': 9 },
          label: { '2015': '2015', '2016': '2016', '2017': '2017', '2018': '2018', '2019': '2019', '2020': '2020', '2021': '2021', '2022': '2022', '2023': '2023', '2024': '2024' },
        },
      },
    },
    value: null,
  };
}

describe('createBatchPlan', () => {
  it('should return null when within limits', () => {
    const plan = createBatchPlan(
      makeMetadata(),
      { Region: ['0180', '1480'], Tid: ['2023', '2024'] },
      10000,
      4
    );

    expect(plan).toBeNull();
  });

  it('should split on Tid dimension when exceeding limit', () => {
    const selection = {
      Region: ['0180', '1480'],
      Tid: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
    };

    const plan = createBatchPlan(makeMetadata(), selection, 8, 20);

    expect(plan).not.toBeNull();
    expect(plan!.splitDimension).toBe('Tid');
    expect(plan!.totalBatches).toBeGreaterThan(1);
    // Each batch should have fewer time values
    for (const batch of plan!.batches) {
      expect(batch.selection.Tid.length).toBeLessThanOrEqual(10);
    }
  });

  it('should include reason message in Swedish', () => {
    const plan = createBatchPlan(
      makeMetadata(),
      { Region: ['0180', '1480'], Tid: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'] },
      8,
      20
    );

    expect(plan!.reason).toContain('överskrider');
    expect(plan!.reason).toContain('batchar');
  });
});

describe('mergeDatasets', () => {
  it('should merge two datasets', () => {
    const ds1: Dataset = {
      version: '2.0' as const,
      class: 'dataset' as const,
      id: ['Region', 'Tid'],
      label: 'Test',
      size: [2, 2],
      dimension: {
        Region: {
          label: 'Region',
          category: { index: { '0180': 0, '1480': 1 }, label: { '0180': 'Stockholm', '1480': 'Göteborg' } },
        },
        Tid: {
          label: 'Tid',
          category: { index: { '2023': 0, '2024': 1 }, label: { '2023': '2023', '2024': '2024' } },
        },
      },
      value: [100, 200, 300, 400],
    };

    const ds2: Dataset = {
      ...ds1,
      dimension: {
        Region: ds1.dimension!.Region,
        Tid: {
          label: 'Tid',
          category: { index: { '2021': 0, '2022': 1 }, label: { '2021': '2021', '2022': '2022' } },
        },
      },
      value: [50, 60, 70, 80],
    };

    const merged = mergeDatasets([ds1, ds2], 'Tid');

    expect(merged.value).toEqual([100, 200, 300, 400, 50, 60, 70, 80]);
    expect(Object.keys(merged.dimension!.Tid.category.index)).toHaveLength(4);
  });

  it('should return single dataset unchanged', () => {
    const ds: Dataset = {
      version: '2.0' as const,
      class: 'dataset' as const,
      id: ['Tid'],
      label: 'Test',
      size: [2],
      dimension: {
        Tid: {
          label: 'Tid',
          category: { index: { '2024': 0 }, label: { '2024': '2024' } },
        },
      },
      value: [42],
    };

    expect(mergeDatasets([ds], 'Tid')).toBe(ds);
  });

  it('should throw on empty array', () => {
    expect(() => mergeDatasets([], 'Tid')).toThrow('No datasets');
  });
});
