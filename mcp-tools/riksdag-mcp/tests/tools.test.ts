import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS, getToolById, getToolsByCategory } from '../src/tools.js';

describe('TOOL_DEFINITIONS', () => {
  it('has exactly 15 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(15);
  });

  it('all tools have required fields', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.category).toBeTruthy();
      expect(tool.api).toBeTruthy();
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

  it('hamta_dokument requires dok_id', () => {
    const tool = getToolById('riksdag_hamta_dokument');
    expect(tool!.inputSchema.required).toEqual(['dok_id']);
  });

  it('hamta_ledamot requires intressent_id', () => {
    const tool = getToolById('riksdag_hamta_ledamot');
    expect(tool!.inputSchema.required).toEqual(['intressent_id']);
  });

  it('kombinerad_sok requires query', () => {
    const tool = getToolById('riksdag_kombinerad_sok');
    expect(tool!.inputSchema.required).toEqual(['query']);
  });

  it('sok_dokument has doktyp enum', () => {
    const tool = getToolById('riksdag_sok_dokument');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.doktyp.enum).toBeDefined();
    expect((props.doktyp.enum as string[])).toContain('mot');
    expect((props.doktyp.enum as string[])).toContain('prop');
  });

  it('sok_ledamoter has parti enum', () => {
    const tool = getToolById('riksdag_sok_ledamoter');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.parti.enum).toBeDefined();
    expect((props.parti.enum as string[])).toContain('S');
    expect((props.parti.enum as string[])).toContain('M');
    expect((props.parti.enum as string[])).toContain('SD');
  });

  it('all tool IDs are unique', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all tool IDs start with riksdag_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^riksdag_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['sok']).toHaveLength(4);
    expect(categories['hamta']).toHaveLength(5);
    expect(categories['regering']).toHaveLength(3);
    expect(categories['kalender']).toHaveLength(3);
  });

  it('uses valid API types', () => {
    const validApis = new Set(['riksdagen', 'g0v', 'combined', 'static']);
    for (const tool of TOOL_DEFINITIONS) {
      expect(validApis.has(tool.api)).toBe(true);
    }
  });
});

describe('getToolById', () => {
  it('finds tools by ID', () => {
    const tool = getToolById('riksdag_sok_dokument');
    expect(tool).toBeDefined();
    expect(tool!.api).toBe('riksdagen');
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });

  it('finds all regering tools', () => {
    const regeringTools = [
      'riksdag_regering_sok',
      'riksdag_regering_dokument',
      'riksdag_regering_departement',
    ];
    for (const id of regeringTools) {
      expect(getToolById(id)).toBeDefined();
    }
  });
});

describe('getToolsByCategory', () => {
  it('returns all 4 categories', () => {
    const categories = getToolsByCategory();
    expect(Object.keys(categories)).toHaveLength(4);
    expect(Object.keys(categories).sort()).toEqual([
      'hamta',
      'kalender',
      'regering',
      'sok',
    ]);
  });
});
