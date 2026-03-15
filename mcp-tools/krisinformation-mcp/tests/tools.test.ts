import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS, getToolById, getToolsByCategory } from '../src/tools.js';

describe('TOOL_DEFINITIONS', () => {
  it('has exactly 2 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(2);
  });

  it('all tools have required fields', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.category).toBeTruthy();
      expect(tool.api).toBe('krisinformation');
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

  it('krisinformation_search has no required params', () => {
    const tool = getToolById('krisinformation_search');
    expect(tool!.inputSchema.required).toBeUndefined();
  });

  it('krisinformation_active has no required params', () => {
    const tool = getToolById('krisinformation_active');
    expect(tool!.inputSchema.required).toBeUndefined();
  });

  it('all tool IDs are unique', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all tool IDs start with krisinformation_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^krisinformation_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['nyheter']).toHaveLength(1);
    expect(categories['vma']).toHaveLength(1);
  });
});

describe('getToolById', () => {
  it('finds tools by ID', () => {
    expect(getToolById('krisinformation_search')).toBeDefined();
    expect(getToolById('krisinformation_active')).toBeDefined();
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });
});

describe('getToolsByCategory', () => {
  it('returns all 2 categories', () => {
    const categories = getToolsByCategory();
    expect(Object.keys(categories)).toHaveLength(2);
    expect(Object.keys(categories).sort()).toEqual(['nyheter', 'vma']);
  });
});
