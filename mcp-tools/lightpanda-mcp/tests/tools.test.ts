/**
 * Tests for Lightpanda MCP tool definitions.
 */

import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS, getToolById, getToolsByCategory } from '../src/tools.js';

describe('TOOL_DEFINITIONS', () => {
  it('should have 12 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(12);
  });

  it('should have unique IDs', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should all start with lightpanda_ prefix', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^lightpanda_/);
    }
  });

  it('should all have required fields', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.category).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('should have proper categories', () => {
    const validCategories = ['navigation', 'content', 'interaction', 'advanced', 'output'];
    for (const tool of TOOL_DEFINITIONS) {
      expect(validCategories).toContain(tool.category);
    }
  });
});

describe('getToolById', () => {
  it('should find tool by exact ID', () => {
    const tool = getToolById('lightpanda_goto');
    expect(tool).toBeDefined();
    expect(tool!.id).toBe('lightpanda_goto');
  });

  it('should be case-insensitive', () => {
    const tool = getToolById('LIGHTPANDA_GOTO');
    expect(tool).toBeDefined();
    expect(tool!.id).toBe('lightpanda_goto');
  });

  it('should return undefined for unknown tool', () => {
    const tool = getToolById('nonexistent');
    expect(tool).toBeUndefined();
  });
});

describe('getToolsByCategory', () => {
  it('should group tools by category', () => {
    const grouped = getToolsByCategory();

    expect(grouped['navigation']).toHaveLength(2);
    expect(grouped['content']).toHaveLength(3);
    expect(grouped['interaction']).toHaveLength(3);
    expect(grouped['advanced']).toHaveLength(3);
    expect(grouped['output']).toHaveLength(1);
    expect(2 + 3 + 3 + 3 + 1).toBe(12);
  });

  it('should include all tools', () => {
    const grouped = getToolsByCategory();
    const totalTools = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
    expect(totalTools).toBe(TOOL_DEFINITIONS.length);
  });
});
