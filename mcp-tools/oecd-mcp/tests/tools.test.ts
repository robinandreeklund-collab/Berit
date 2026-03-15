import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS, getToolById, getToolsByCategory } from '../src/tools.js';

describe('TOOL_DEFINITIONS', () => {
  it('has exactly 9 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(9);
  });

  it('all tools have required fields', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.category).toBeTruthy();
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

  it('search_dataflows requires keyword', () => {
    const tool = getToolById('oecd_search_dataflows');
    expect(tool!.inputSchema.required).toEqual(['keyword']);
  });

  it('query_data requires dataflow_id', () => {
    const tool = getToolById('oecd_query_data');
    expect(tool!.inputSchema.required).toEqual(['dataflow_id']);
  });

  it('get_data_structure requires dataflow_id', () => {
    const tool = getToolById('oecd_get_data_structure');
    expect(tool!.inputSchema.required).toEqual(['dataflow_id']);
  });

  it('list_dataflows has category enum', () => {
    const tool = getToolById('oecd_list_dataflows');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.category.enum).toBeDefined();
    expect((props.category.enum as string[])).toContain('Economy');
    expect((props.category.enum as string[])).toContain('Health');
    expect((props.category.enum as string[])).toContain('Education');
  });

  it('search_indicators requires keyword', () => {
    const tool = getToolById('oecd_search_indicators');
    expect(tool!.inputSchema.required).toEqual(['keyword']);
  });

  it('query_data has last_n_observations with default', () => {
    const tool = getToolById('oecd_query_data');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.last_n_observations).toBeDefined();
    expect(props.last_n_observations.type).toBe('number');
    expect(props.last_n_observations.default).toBe(100);
  });

  it('all tool IDs are unique', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all tool IDs start with oecd_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^oecd_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['search']).toHaveLength(3);
    expect(categories['metadata']).toHaveLength(2);
    expect(categories['categories']).toHaveLength(2);
    expect(categories['popular']).toHaveLength(1);
    expect(categories['data']).toHaveLength(1);
  });
});

describe('getToolById', () => {
  it('finds tools by ID', () => {
    const tool = getToolById('oecd_query_data');
    expect(tool).toBeDefined();
    expect(tool!.category).toBe('data');
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });

  it('finds all 9 tools by ID', () => {
    const toolIds = [
      'oecd_search_dataflows',
      'oecd_list_dataflows',
      'oecd_search_indicators',
      'oecd_get_data_structure',
      'oecd_get_dataflow_url',
      'oecd_get_categories',
      'oecd_list_categories_detailed',
      'oecd_get_popular_datasets',
      'oecd_query_data',
    ];
    for (const id of toolIds) {
      expect(getToolById(id)).toBeDefined();
    }
  });
});

describe('getToolsByCategory', () => {
  it('returns all 5 categories', () => {
    const categories = getToolsByCategory();
    expect(Object.keys(categories)).toHaveLength(5);
    expect(Object.keys(categories).sort()).toEqual([
      'categories',
      'data',
      'metadata',
      'popular',
      'search',
    ]);
  });
});
