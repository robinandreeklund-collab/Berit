import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS, getToolById, getToolsByCategory } from '../src/tools.js';

describe('TOOL_DEFINITIONS', () => {
  it('has exactly 22 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(22);
  });

  it('all tools have required fields', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.category).toBeTruthy();
      expect(tool.objecttype).toBeTruthy();
      expect(tool.schemaVersion).toBeTruthy();
      expect(tool.filterField).toBeTruthy();
      expect(tool.filterType).toBeTruthy();
    }
  });

  it('all tool IDs are unique', () => {
    const ids = TOOL_DEFINITIONS.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all tool IDs start with trafikverket_', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.id).toMatch(/^trafikverket_/);
    }
  });

  it('has correct category distribution', () => {
    const categories = getToolsByCategory();
    expect(categories['trafikinfo']).toHaveLength(4);
    expect(categories['tag']).toHaveLength(4);
    expect(categories['vag']).toHaveLength(4);
    expect(categories['vader']).toHaveLength(4);
    expect(categories['kameror']).toHaveLength(3);
    expect(categories['prognos']).toHaveLength(3);
  });

  it('uses valid objecttypes', () => {
    const validTypes = new Set([
      'Situation',
      'TrainAnnouncement',
      'TrainStation',
      'RoadCondition',
      'WeatherMeasurepoint',
      'TrafficFlow',
      'Camera',
    ]);
    for (const tool of TOOL_DEFINITIONS) {
      expect(validTypes.has(tool.objecttype)).toBe(true);
    }
  });

  it('uses valid filter types', () => {
    const validFilterTypes = new Set([
      'location',
      'station',
      'weather',
      'camera',
      'camera_id',
      'county',
    ]);
    for (const tool of TOOL_DEFINITIONS) {
      expect(validFilterTypes.has(tool.filterType)).toBe(true);
    }
  });
});

describe('getToolById', () => {
  it('finds tools by ID', () => {
    const tool = getToolById('trafikverket_trafikinfo_storningar');
    expect(tool).toBeDefined();
    expect(tool!.objecttype).toBe('Situation');
  });

  it('returns undefined for unknown IDs', () => {
    expect(getToolById('nonexistent')).toBeUndefined();
  });

  it('finds all train tools', () => {
    const trainTools = [
      'trafikverket_tag_forseningar',
      'trafikverket_tag_tidtabell',
      'trafikverket_tag_stationer',
      'trafikverket_tag_installda',
    ];
    for (const id of trainTools) {
      expect(getToolById(id)).toBeDefined();
    }
  });
});

describe('getToolsByCategory', () => {
  it('returns all 6 categories', () => {
    const categories = getToolsByCategory();
    expect(Object.keys(categories)).toHaveLength(6);
    expect(Object.keys(categories).sort()).toEqual([
      'kameror',
      'prognos',
      'tag',
      'trafikinfo',
      'vader',
      'vag',
    ]);
  });
});
