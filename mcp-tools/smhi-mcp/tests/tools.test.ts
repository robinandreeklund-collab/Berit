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

  it('point-based tools accept location parameter', () => {
    const pointTools = [
      'smhi_vaderprognoser_metfcst',
      'smhi_vaderprognoser_snow',
      'smhi_vaderanalyser_mesan',
      'smhi_brandrisk_fwif',
      'smhi_brandrisk_fwia',
    ];
    for (const id of pointTools) {
      const tool = getToolById(id);
      expect(tool).toBeDefined();
      const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
      expect(props.location).toBeDefined();
      expect(props.location.type).toBe('string');
      expect(props.latitude).toBeDefined();
      expect(props.longitude).toBeDefined();
    }
  });

  it('observation tools require parameter and station', () => {
    const obsTools = [
      'smhi_vaderobservationer_metobs',
      'smhi_hydrologi_hydroobs',
      'smhi_oceanografi_ocobs',
    ];
    for (const id of obsTools) {
      const tool = getToolById(id);
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('parameter');
      expect(tool!.inputSchema.required).toContain('station');
    }
  });

  it('station list tool requires only parameter', () => {
    const tool = getToolById('smhi_vaderobservationer_stationer');
    expect(tool).toBeDefined();
    expect(tool!.inputSchema.required).toEqual(['parameter']);
  });

  it('observation tools have period enum', () => {
    const tool = getToolById('smhi_vaderobservationer_metobs');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.period.enum).toBeDefined();
    expect((props.period.enum as string[])).toContain('latest-hour');
    expect((props.period.enum as string[])).toContain('latest-day');
  });

  it('point-based tools have latitude bounds', () => {
    const tool = getToolById('smhi_vaderprognoser_metfcst');
    const props = tool!.inputSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.latitude.minimum).toBe(55.0);
    expect(props.latitude.maximum).toBe(70.0);
    expect(props.longitude.minimum).toBe(10.0);
    expect(props.longitude.maximum).toBe(25.0);
  });

  it('all tool IDs are unique', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all tool IDs start with smhi_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^smhi_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['vaderprognoser']).toHaveLength(2);
    expect(categories['vaderanalyser']).toHaveLength(1);
    expect(categories['vaderobservationer']).toHaveLength(2);
    expect(categories['hydrologi']).toHaveLength(1);
    expect(categories['oceanografi']).toHaveLength(1);
    expect(categories['brandrisk']).toHaveLength(2);
  });

  it('pthbv tool does not exist (API deprecated)', () => {
    expect(getToolById('smhi_hydrologi_pthbv')).toBeUndefined();
  });

  it('brandrisk tools mention seasonality', () => {
    const fwif = getToolById('smhi_brandrisk_fwif');
    const fwia = getToolById('smhi_brandrisk_fwia');
    expect(fwif!.description).toContain('maj–oktober');
    expect(fwia!.description).toContain('maj–oktober');
  });
});

describe('getToolById', () => {
  it('finds tools by ID', () => {
    const tool = getToolById('smhi_vaderprognoser_metfcst');
    expect(tool).toBeDefined();
    expect(tool!.api).toBe('metfcst/pmp3g');
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });

  it('finds all 9 tools', () => {
    const allIds = TOOL_DEFINITIONS.map((t) => t.id);
    for (const id of allIds) {
      expect(getToolById(id)).toBeDefined();
    }
  });
});

describe('getToolsByCategory', () => {
  it('returns all 6 categories', () => {
    const categories = getToolsByCategory();
    expect(Object.keys(categories)).toHaveLength(6);
    expect(Object.keys(categories).sort()).toEqual([
      'brandrisk',
      'hydrologi',
      'oceanografi',
      'vaderanalyser',
      'vaderobservationer',
      'vaderprognoser',
    ]);
  });
});
