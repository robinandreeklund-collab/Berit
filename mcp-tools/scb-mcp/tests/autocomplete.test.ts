import { describe, it, expect } from 'vitest';
import { autoCompleteSelection, estimateCellCount } from '../src/autocomplete.js';
import type { Dataset } from '../src/types.js';

function makeMetadata(): Dataset {
  return {
    version: '2.0' as const,
    class: 'dataset' as const,
    id: ['Region', 'Kon', 'Tid', 'ContentsCode'],
    label: 'Test table',
    size: [3, 3, 10, 2],
    dimension: {
      Region: {
        label: 'Region',
        category: {
          index: { '00': 0, '0180': 1, '1480': 2 },
          label: { '00': 'Riket', '0180': 'Stockholm', '1480': 'Göteborg' },
        },
        extension: { elimination: true, eliminationValueCode: '00' },
      },
      Kon: {
        label: 'Kön',
        category: {
          index: { '1': 0, '2': 1, '1+2': 2 },
          label: { '1': 'Män', '2': 'Kvinnor', '1+2': 'Totalt' },
        },
        extension: { elimination: true, eliminationValueCode: '1+2' },
      },
      Tid: {
        label: 'Tid',
        category: {
          index: { '2015': 0, '2016': 1, '2017': 2, '2018': 3, '2019': 4, '2020': 5, '2021': 6, '2022': 7, '2023': 8, '2024': 9 },
          label: { '2015': '2015', '2016': '2016', '2017': '2017', '2018': '2018', '2019': '2019', '2020': '2020', '2021': '2021', '2022': '2022', '2023': '2023', '2024': '2024' },
        },
      },
      ContentsCode: {
        label: 'Innehåll',
        category: {
          index: { BE0101A9: 0, BE0101A0: 1 },
          label: { BE0101A9: 'Folkmängd', BE0101A0: 'Folkökning' },
        },
      },
    },
    value: null,
  };
}

describe('autoCompleteSelection', () => {
  it('should fill missing variables using elimination defaults', () => {
    const result = autoCompleteSelection(makeMetadata(), {
      Tid: ['2024'],
    });

    expect(result.selection.Region).toEqual(['00']);
    expect(result.selection.Kon).toEqual(['1+2']);
    expect(result.selection.Tid).toEqual(['2024']);
    expect(result.selection.ContentsCode).toEqual(['BE0101A9', 'BE0101A0']);
    expect(result.addedVariables).toHaveLength(3);
    // Region uses elimination default, Kon uses smart gender total detection
    const regionAdded = result.addedVariables.find(v => v.code === 'Region');
    expect(regionAdded?.reason).toContain('elimination');
    const konAdded = result.addedVariables.find(v => v.code === 'Kon');
    expect(konAdded?.reason).toContain('kön');
  });

  it('should not modify already provided variables', () => {
    const result = autoCompleteSelection(makeMetadata(), {
      Region: ['0180', '1480'],
      Kon: ['1', '2'],
      Tid: ['2024'],
      ContentsCode: ['BE0101A9'],
    });

    expect(result.addedVariables).toHaveLength(0);
    expect(result.selection.Region).toEqual(['0180', '1480']);
  });

  it('should handle empty selection', () => {
    const result = autoCompleteSelection(makeMetadata(), {});

    expect(Object.keys(result.selection)).toHaveLength(4);
    expect(result.addedVariables).toHaveLength(4);
  });

  it('should handle case-insensitive variable names', () => {
    const result = autoCompleteSelection(makeMetadata(), {
      region: ['0180'],
      tid: ['2024'],
    });

    // Should map "region" → "Region" and "tid" → "Tid"
    expect(result.selection.Region).toEqual(['0180']);
    expect(result.selection.Tid).toEqual(['2024']);
    expect(result.selection.region).toBeUndefined();
  });

  it('should prefer "tot" for age variable instead of eliminationValueCode "0"', () => {
    const metadata = makeMetadata();
    // Add Alder dimension with elimination code "0" (0 years old — NOT total!)
    metadata.id = ['Region', 'Alder', 'Kon', 'Tid', 'ContentsCode'];
    metadata.size = [3, 5, 3, 10, 2];
    metadata.dimension['Alder'] = {
      label: 'Ålder',
      category: {
        index: { '0': 0, '10': 1, '20': 2, '65': 3, 'tot': 4 },
        label: { '0': '0 år', '10': '10 år', '20': '20 år', '65': '65 år', 'tot': 'Totalt' },
      },
      extension: { elimination: true, eliminationValueCode: '0' },
    };

    const result = autoCompleteSelection(metadata, {
      Region: ['1480'],
      Tid: ['2024'],
    });

    // Should pick "tot" (totalt) NOT "0" (0 år)
    expect(result.selection.Alder).toEqual(['tot']);
    const alderAdded = result.addedVariables.find(v => v.code === 'Alder');
    expect(alderAdded?.reason).toContain('ålder');
  });

  it('should prefer "1+2" for gender variable via smart detection', () => {
    const result = autoCompleteSelection(makeMetadata(), {
      Region: ['1480'],
      Tid: ['2024'],
    });

    // Should pick "1+2" (Totalt) for Kön
    expect(result.selection.Kon).toEqual(['1+2']);
    const konAdded = result.addedVariables.find(v => v.code === 'Kon');
    expect(konAdded?.reason).toContain('kön');
  });

  it('should use TOP(1) for Tid if missing and no elimination', () => {
    const metadata = makeMetadata();
    // Remove elimination from Tid (it doesn't have one by default)
    const result = autoCompleteSelection(metadata, { Region: ['00'] });

    expect(result.selection.Tid).toEqual(['TOP(1)']);
    expect(result.addedVariables.find(v => v.code === 'Tid')?.reason).toContain('senaste');
  });

  it('should SKIP variables with elimination=true but no eliminationValueCode and no smart total', () => {
    // Simulate TAB638's Civilstand: elimination=true, no eliminationValueCode, no total code
    const metadata = makeMetadata();
    metadata.id = ['Region', 'Civilstand', 'Kon', 'Tid', 'ContentsCode'];
    metadata.size = [3, 4, 3, 10, 2];
    metadata.dimension['Civilstand'] = {
      label: 'civilstånd',
      category: {
        index: { 'OG': 0, 'G': 1, 'SK': 2, 'ÄNKL': 3 },
        label: { 'OG': 'ogifta', 'G': 'gifta', 'SK': 'skilda', 'ÄNKL': 'änkor/änklingar' },
      },
      extension: { elimination: true },
    };

    const result = autoCompleteSelection(metadata, {
      Region: ['1480'],
      Tid: ['2024'],
    });

    // Civilstand should NOT be included in selection — let API aggregate
    expect(result.selection.Civilstand).toBeUndefined();
    const civilstandAdded = result.addedVariables.find(v => v.code === 'Civilstand');
    expect(civilstandAdded?.reason).toContain('utelämnad');
    expect(civilstandAdded?.values).toEqual([]);
  });

  it('should SKIP Kon with elimination=true when no total code exists', () => {
    // Simulate TAB638's Kon: only "1" (män) and "2" (kvinnor), no "1+2"
    const metadata = makeMetadata();
    metadata.dimension['Kon'] = {
      label: 'kön',
      category: {
        index: { '1': 0, '2': 1 },
        label: { '1': 'män', '2': 'kvinnor' },
      },
      extension: { elimination: true },
    };

    const result = autoCompleteSelection(metadata, {
      Region: ['1480'],
      Tid: ['2024'],
    });

    // Kon should NOT be included — no total code, elimination=true
    expect(result.selection.Kon).toBeUndefined();
    const konAdded = result.addedVariables.find(v => v.code === 'Kon');
    expect(konAdded?.reason).toContain('utelämnad');
  });
});

describe('estimateCellCount', () => {
  it('should estimate cells for specific values', () => {
    const count = estimateCellCount(makeMetadata(), {
      Region: ['0180'],
      Kon: ['1+2'],
      Tid: ['2024'],
      ContentsCode: ['BE0101A9'],
    });

    expect(count).toBe(1); // 1×1×1×1
  });

  it('should estimate cells with wildcard', () => {
    const count = estimateCellCount(makeMetadata(), {
      Region: ['*'],
      Kon: ['1+2'],
      Tid: ['TOP(5)'],
      ContentsCode: ['BE0101A9'],
    });

    expect(count).toBe(15); // 3×1×5×1
  });

  it('should estimate cells for multiple values', () => {
    const count = estimateCellCount(makeMetadata(), {
      Region: ['0180', '1480'],
      Kon: ['1', '2'],
      Tid: ['2023', '2024'],
      ContentsCode: ['BE0101A9'],
    });

    expect(count).toBe(8); // 2×2×2×1
  });
});
