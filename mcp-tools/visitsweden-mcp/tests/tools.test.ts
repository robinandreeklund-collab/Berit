import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS, getToolById, getToolsByCategory } from '../src/tools.js';

describe('TOOL_DEFINITIONS', () => {
  it('has exactly 4 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(4);
  });

  it('all tools have required fields', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.category).toBeTruthy();
      expect(tool.api).toBe('visitsweden');
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

  it('visitsweden_search requires query', () => {
    const tool = getToolById('visitsweden_search');
    expect(tool!.inputSchema.required).toEqual(['query']);
  });

  it('visitsweden_get_details requires entryId', () => {
    const tool = getToolById('visitsweden_get_details');
    expect(tool!.inputSchema.required).toEqual(['entryId']);
  });

  it('visitsweden_search_events requires query', () => {
    const tool = getToolById('visitsweden_search_events');
    expect(tool!.inputSchema.required).toEqual(['query']);
  });

  it('visitsweden_nearby requires place', () => {
    const tool = getToolById('visitsweden_nearby');
    expect(tool!.inputSchema.required).toEqual(['place']);
  });

  it('all tool IDs are unique', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all tool IDs start with visitsweden_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^visitsweden_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['sok']).toHaveLength(1);
    expect(categories['detaljer']).toHaveLength(1);
    expect(categories['evenemang']).toHaveLength(1);
    expect(categories['nara']).toHaveLength(1);
  });
});

describe('getToolById', () => {
  it('finds tools by ID', () => {
    const tool = getToolById('visitsweden_search');
    expect(tool).toBeDefined();
    expect(tool!.category).toBe('sok');
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });

  it('finds all tools', () => {
    const toolIds = [
      'visitsweden_search',
      'visitsweden_get_details',
      'visitsweden_search_events',
      'visitsweden_nearby',
    ];
    for (const id of toolIds) {
      expect(getToolById(id)).toBeDefined();
    }
  });
});

describe('getToolsByCategory', () => {
  it('returns all 4 categories', () => {
    const categories = getToolsByCategory();
    expect(Object.keys(categories)).toHaveLength(4);
    expect(Object.keys(categories).sort()).toEqual([
      'detaljer',
      'evenemang',
      'nara',
      'sok',
    ]);
  });
});
