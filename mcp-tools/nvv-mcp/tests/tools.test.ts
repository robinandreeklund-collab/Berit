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

  it('detalj_nationellt requires id', () => {
    const tool = getToolById('nvv_detalj_nationellt');
    expect(tool!.inputSchema.required).toEqual(['id']);
  });

  it('detalj_natura2000 requires kod', () => {
    const tool = getToolById('nvv_detalj_natura2000');
    expect(tool!.inputSchema.required).toEqual(['kod']);
  });

  it('detalj_ramsar requires id', () => {
    const tool = getToolById('nvv_detalj_ramsar');
    expect(tool!.inputSchema.required).toEqual(['id']);
  });

  it('sok tools have lan enum', () => {
    const tool = getToolById('nvv_sok_nationella');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.lan.enum).toBeDefined();
    expect((props.lan.enum as string[])).toContain('AB');
    expect((props.lan.enum as string[])).toContain('M');
  });

  it('arter tool has grupp enum', () => {
    const tool = getToolById('nvv_arter');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.grupp.enum).toBeDefined();
    expect((props.grupp.enum as string[])).toContain('B');
    expect((props.grupp.enum as string[])).toContain('M');
  });

  it('uppslag requires namn', () => {
    const tool = getToolById('nvv_uppslag');
    expect(tool!.inputSchema.required).toEqual(['namn']);
  });

  it('all tool IDs are unique', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all tool IDs start with nvv_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^nvv_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['uppslag']).toHaveLength(1);
    expect(categories['sok']).toHaveLength(2);
    expect(categories['detalj']).toHaveLength(3);
    expect(categories['oversikt']).toHaveLength(2);
  });

  it('uses valid API types', () => {
    const validApis = new Set(['national', 'n2000', 'ramsar', 'local']);
    for (const tool of TOOL_DEFINITIONS) {
      expect(validApis.has(tool.api)).toBe(true);
    }
  });
});

describe('getToolById', () => {
  it('finds tools by ID', () => {
    const tool = getToolById('nvv_sok_nationella');
    expect(tool).toBeDefined();
    expect(tool!.api).toBe('national');
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });

  it('finds all detalj tools', () => {
    const detaljTools = [
      'nvv_detalj_nationellt',
      'nvv_detalj_natura2000',
      'nvv_detalj_ramsar',
    ];
    for (const id of detaljTools) {
      expect(getToolById(id)).toBeDefined();
    }
  });
});

describe('getToolsByCategory', () => {
  it('returns all 4 categories', () => {
    const categories = getToolsByCategory();
    expect(Object.keys(categories)).toHaveLength(4);
    expect(Object.keys(categories).sort()).toEqual([
      'detalj',
      'oversikt',
      'sok',
      'uppslag',
    ]);
  });
});
