import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS, getToolById, getToolsByCategory } from '../src/tools.js';

describe('TOOL_DEFINITIONS', () => {
  it('has exactly 7 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(7);
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
    }
  });

  it('all tools with properties have descriptive inputSchema properties', () => {
    for (const tool of TOOL_DEFINITIONS) {
      const props = tool.inputSchema.properties as Record<string, Record<string, unknown>> | undefined;
      if (props && Object.keys(props).length > 0) {
        for (const [, prop] of Object.entries(props)) {
          expect(prop.type).toBeTruthy();
          expect(prop.description).toBeTruthy();
        }
      }
    }
  });

  it('search_website requires query', () => {
    const tool = getToolById('uhm_search_website');
    expect(tool!.inputSchema.required).toEqual(['query']);
  });

  it('search_questions requires query', () => {
    const tool = getToolById('uhm_search_questions');
    expect(tool!.inputSchema.required).toEqual(['query']);
  });

  it('search_ted requires query', () => {
    const tool = getToolById('uhm_search_ted');
    expect(tool!.inputSchema.required).toEqual(['query']);
  });

  it('search_lov has region enum', () => {
    const tool = getToolById('uhm_search_lov');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.region.enum).toBeDefined();
    expect((props.region.enum as string[])).toContain('Stockholm');
    expect((props.region.enum as string[])).toContain('Skåne');
  });

  it('search_criteria has type enum', () => {
    const tool = getToolById('uhm_search_criteria');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.type.enum).toBeDefined();
    expect((props.type.enum as string[])).toContain('krav');
    expect((props.type.enum as string[])).toContain('villkor');
  });

  it('search_ted has scope enum', () => {
    const tool = getToolById('uhm_search_ted');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.scope.enum).toBeDefined();
    expect((props.scope.enum as string[])).toContain('latest');
    expect((props.scope.enum as string[])).toContain('active');
  });

  it('all tool IDs are unique', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all tool IDs start with uhm_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^uhm_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['oversikt']).toHaveLength(1);
    expect(categories['sok']).toHaveLength(2);
    expect(categories['lov']).toHaveLength(1);
    expect(categories['kriterier']).toHaveLength(2);
    expect(categories['ted']).toHaveLength(1);
  });

  it('uses valid API types', () => {
    const validApis = new Set(['uhm', 'ted']);
    for (const tool of TOOL_DEFINITIONS) {
      expect(validApis.has(tool.api)).toBe(true);
    }
  });
});

describe('getToolById', () => {
  it('finds tools by ID', () => {
    const tool = getToolById('uhm_overview');
    expect(tool).toBeDefined();
    expect(tool!.api).toBe('uhm');
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });

  it('finds all tools', () => {
    const toolIds = [
      'uhm_overview',
      'uhm_search_website',
      'uhm_search_questions',
      'uhm_search_lov',
      'uhm_search_criteria',
      'uhm_get_criteria_categories',
      'uhm_search_ted',
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
      'kriterier',
      'lov',
      'oversikt',
      'sok',
      'ted',
    ]);
  });
});
