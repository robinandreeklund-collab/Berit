import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS, getToolById, getToolsByCategory } from '../src/tools.js';

describe('TOOL_DEFINITIONS', () => {
  it('has exactly 10 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(10);
  });

  it('all tools have required fields', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.category).toBeTruthy();
      expect(tool.api).toBe('kolada');
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

  it('sok_nyckeltal requires query', () => {
    const tool = getToolById('kolada_sok_nyckeltal');
    expect(tool!.inputSchema.required).toEqual(['query']);
  });

  it('sok_kommun requires query', () => {
    const tool = getToolById('kolada_sok_kommun');
    expect(tool!.inputSchema.required).toEqual(['query']);
  });

  it('data_kommun requires kpi_id and kommun_id', () => {
    const tool = getToolById('kolada_data_kommun');
    expect(tool!.inputSchema.required).toEqual(['kpi_id', 'kommun_id']);
  });

  it('data_alla_kommuner requires kpi_id and year', () => {
    const tool = getToolById('kolada_data_alla_kommuner');
    expect(tool!.inputSchema.required).toEqual(['kpi_id', 'year']);
  });

  it('jamfor_kommuner requires kpi_id and kommun_ids', () => {
    const tool = getToolById('kolada_jamfor_kommuner');
    expect(tool!.inputSchema.required).toEqual(['kpi_id', 'kommun_ids']);
  });

  it('trend requires kpi_id and kommun_id', () => {
    const tool = getToolById('kolada_trend');
    expect(tool!.inputSchema.required).toEqual(['kpi_id', 'kommun_id']);
  });

  it('kommungrupper has no required params', () => {
    const tool = getToolById('kolada_kommungrupper');
    expect(tool!.inputSchema.required).toBeUndefined();
  });

  it('all tool IDs are unique', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all tool IDs start with kolada_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^kolada_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['sok']).toHaveLength(3);
    expect(categories['data']).toHaveLength(4);
    expect(categories['jamforelse']).toHaveLength(2);
    expect(categories['referens']).toHaveLength(1);
  });

  it('uses valid API type', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.api).toBe('kolada');
    }
  });
});

describe('getToolById', () => {
  it('finds tools by ID', () => {
    const tool = getToolById('kolada_sok_nyckeltal');
    expect(tool).toBeDefined();
    expect(tool!.category).toBe('sok');
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });

  it('finds all data tools', () => {
    const dataTools = [
      'kolada_data_kommun',
      'kolada_data_alla_kommuner',
      'kolada_data_enhet',
      'kolada_nyckeltal_detalj',
    ];
    for (const id of dataTools) {
      expect(getToolById(id)).toBeDefined();
    }
  });
});

describe('getToolsByCategory', () => {
  it('returns all 4 categories', () => {
    const categories = getToolsByCategory();
    expect(Object.keys(categories)).toHaveLength(4);
    expect(Object.keys(categories).sort()).toEqual([
      'data',
      'jamforelse',
      'referens',
      'sok',
    ]);
  });
});
