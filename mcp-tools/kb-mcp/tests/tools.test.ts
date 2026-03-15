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

  it('libris_search requires query', () => {
    const tool = getToolById('kb_libris_search');
    expect(tool!.inputSchema.required).toEqual(['query']);
  });

  it('libris_search_author requires author', () => {
    const tool = getToolById('kb_libris_search_author');
    expect(tool!.inputSchema.required).toEqual(['author']);
  });

  it('libris_search_title requires title', () => {
    const tool = getToolById('kb_libris_search_title');
    expect(tool!.inputSchema.required).toEqual(['title']);
  });

  it('libris_search_isbn requires isbn', () => {
    const tool = getToolById('kb_libris_search_isbn');
    expect(tool!.inputSchema.required).toEqual(['isbn']);
  });

  it('libris_holdings requires recordId', () => {
    const tool = getToolById('kb_libris_holdings');
    expect(tool!.inputSchema.required).toEqual(['recordId']);
  });

  it('ksamsok_search requires query', () => {
    const tool = getToolById('kb_ksamsok_search');
    expect(tool!.inputSchema.required).toEqual(['query']);
  });

  it('ksamsok_get_object requires objectId', () => {
    const tool = getToolById('kb_ksamsok_get_object');
    expect(tool!.inputSchema.required).toEqual(['objectId']);
  });

  it('swepub_search requires query', () => {
    const tool = getToolById('kb_swepub_search');
    expect(tool!.inputSchema.required).toEqual(['query']);
  });

  it('all tool IDs are unique', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all tool IDs start with kb_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^kb_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['libris']).toHaveLength(6);
    expect(categories['ksamsok']).toHaveLength(3);
    expect(categories['swepub']).toHaveLength(1);
  });

  it('uses valid API types', () => {
    const validApis = new Set(['libris', 'ksamsok', 'swepub']);
    for (const tool of TOOL_DEFINITIONS) {
      expect(validApis.has(tool.api)).toBe(true);
    }
  });
});

describe('getToolById', () => {
  it('finds tools by ID', () => {
    const tool = getToolById('kb_libris_search');
    expect(tool).toBeDefined();
    expect(tool!.api).toBe('libris');
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });

  it('finds all ksamsok tools', () => {
    const ksamsokTools = [
      'kb_ksamsok_search',
      'kb_ksamsok_search_location',
      'kb_ksamsok_get_object',
    ];
    for (const id of ksamsokTools) {
      expect(getToolById(id)).toBeDefined();
    }
  });
});

describe('getToolsByCategory', () => {
  it('returns all 3 categories', () => {
    const categories = getToolsByCategory();
    expect(Object.keys(categories)).toHaveLength(3);
    expect(Object.keys(categories).sort()).toEqual([
      'ksamsok',
      'libris',
      'swepub',
    ]);
  });
});
