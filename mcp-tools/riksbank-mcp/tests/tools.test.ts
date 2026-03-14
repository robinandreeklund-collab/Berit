import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS, getToolById, getToolsByCategory } from '../src/tools.js';

describe('TOOL_DEFINITIONS', () => {
  it('has exactly 8 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(8);
  });

  it('all tools have required fields', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.category).toBeTruthy();
      expect(tool.api).toBeTruthy();
      expect(tool.endpoint).toBeTruthy();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
    }
  });

  it('all tools have descriptive inputSchema properties', () => {
    for (const tool of TOOL_DEFINITIONS) {
      const props = tool.inputSchema.properties as Record<string, Record<string, unknown>>;
      for (const [, prop] of Object.entries(props)) {
        expect(prop.type).toBeTruthy();
        expect(prop.description).toBeTruthy();
      }
    }
  });

  it('valuta_korskurser requires valuta1 and valuta2', () => {
    const tool = getToolById('riksbank_valuta_korskurser');
    expect(tool!.inputSchema.required).toEqual(['valuta1', 'valuta2']);
  });

  it('valuta tools have currency enum', () => {
    const tool = getToolById('riksbank_valuta_kurser');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.valuta.enum).toBeDefined();
    expect((props.valuta.enum as string[])).toContain('EUR');
    expect((props.valuta.enum as string[])).toContain('USD');
  });

  it('marknadsrantor has groupId enum', () => {
    const tool = getToolById('riksbank_ranta_marknadsrantor');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.groupId.enum).toBeDefined();
    expect((props.groupId.enum as string[])).toContain('3');
  });

  it('all tool IDs are unique', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all tool IDs start with riksbank_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^riksbank_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['ranta']).toHaveLength(2);
    expect(categories['valuta']).toHaveLength(2);
    expect(categories['swestr']).toHaveLength(1);
    expect(categories['prognos']).toHaveLength(3);
  });

  it('uses valid API types', () => {
    const validApis = new Set(['swea', 'swestr', 'forecasts']);
    for (const tool of TOOL_DEFINITIONS) {
      expect(validApis.has(tool.api)).toBe(true);
    }
  });
});

describe('getToolById', () => {
  it('finds tools by ID', () => {
    const tool = getToolById('riksbank_ranta_styrranta');
    expect(tool).toBeDefined();
    expect(tool!.api).toBe('swea');
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });

  it('finds all forecast tools', () => {
    const forecastTools = [
      'riksbank_prognos_inflation',
      'riksbank_prognos_bnp',
      'riksbank_prognos_ovrigt',
    ];
    for (const id of forecastTools) {
      expect(getToolById(id)).toBeDefined();
    }
  });
});

describe('getToolsByCategory', () => {
  it('returns all 4 categories', () => {
    const categories = getToolsByCategory();
    expect(Object.keys(categories)).toHaveLength(4);
    expect(Object.keys(categories).sort()).toEqual([
      'prognos',
      'ranta',
      'swestr',
      'valuta',
    ]);
  });
});
