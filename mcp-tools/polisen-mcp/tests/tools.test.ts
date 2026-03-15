import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS, getToolById, getToolsByCategory } from '../src/tools.js';

describe('TOOL_DEFINITIONS', () => {
  it('has exactly 1 tool', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(1);
  });

  it('all tools have required fields', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.category).toBeTruthy();
      expect(tool.api).toBe('polisen');
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

  it('polisen_events has no required params', () => {
    const tool = getToolById('polisen_events');
    expect(tool!.inputSchema.required).toBeUndefined();
  });

  it('all tool IDs start with polisen_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^polisen_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['handelser']).toHaveLength(1);
  });
});

describe('getToolById', () => {
  it('finds polisen_events', () => {
    expect(getToolById('polisen_events')).toBeDefined();
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });
});

describe('getToolsByCategory', () => {
  it('returns 1 category', () => {
    const categories = getToolsByCategory();
    expect(Object.keys(categories)).toHaveLength(1);
    expect(Object.keys(categories)).toEqual(['handelser']);
  });
});
