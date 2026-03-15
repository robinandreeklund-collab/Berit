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

  it('trafa_get_product_structure requires product', () => {
    const tool = getToolById('trafa_get_product_structure');
    expect(tool!.inputSchema.required).toEqual(['product']);
  });

  it('trafa_query_data requires query', () => {
    const tool = getToolById('trafa_query_data');
    expect(tool!.inputSchema.required).toEqual(['query']);
  });

  it('product structure has product enum', () => {
    const tool = getToolById('trafa_get_product_structure');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.product.enum).toBeDefined();
    expect((props.product.enum as string[])).toContain('t10016');
    expect((props.product.enum as string[])).toContain('t0501');
  });

  it('all tool IDs are unique', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all tool IDs start with trafa_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^trafa_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['struktur']).toHaveLength(2);
    expect(categories['data']).toHaveLength(1);
    expect(categories['fordon']).toHaveLength(2);
    expect(categories['transport']).toHaveLength(3);
  });

  it('uses valid API types', () => {
    const validApis = new Set(['structure', 'data']);
    for (const tool of TOOL_DEFINITIONS) {
      expect(validApis.has(tool.api)).toBe(true);
    }
  });

  it('lang property has sv/en enum on all tools', () => {
    for (const tool of TOOL_DEFINITIONS) {
      const props = tool.inputSchema.properties as Record<string, Record<string, unknown>>;
      expect(props.lang).toBeDefined();
      expect(props.lang.enum).toEqual(['sv', 'en']);
    }
  });
});

describe('getToolById', () => {
  it('finds tools by ID', () => {
    const tool = getToolById('trafa_list_products');
    expect(tool).toBeDefined();
    expect(tool!.api).toBe('structure');
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });

  it('finds all transport tools', () => {
    const transportTools = [
      'trafa_vehicle_km',
      'trafa_rail_transport',
      'trafa_air_traffic',
    ];
    for (const id of transportTools) {
      expect(getToolById(id)).toBeDefined();
    }
  });

  it('finds all fordon tools', () => {
    const fordonTools = [
      'trafa_cars_in_traffic',
      'trafa_new_registrations',
    ];
    for (const id of fordonTools) {
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
      'fordon',
      'struktur',
      'transport',
    ]);
  });
});
