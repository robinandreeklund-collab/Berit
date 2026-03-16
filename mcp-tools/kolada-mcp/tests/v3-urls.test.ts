import { describe, it, expect } from 'vitest';
import { TOOL_DEFINITIONS } from '../src/tools.js';

describe('Kolada v3 API URL format', () => {
  it('data-fetching endpoints use v3 path format with /data/kpi/ or /oudata/kpi/', () => {
    // kolada_nyckeltal_detalj is metadata (/kpi/{id}), not a data-fetching endpoint
    const dataFetchTools = TOOL_DEFINITIONS.filter(
      (t) => (t.category === 'data' || t.category === 'jamforelse') && t.id !== 'kolada_nyckeltal_detalj',
    );
    for (const tool of dataFetchTools) {
      expect(
        tool.endpoint.startsWith('/data/kpi/') || tool.endpoint.startsWith('/oudata/kpi/'),
        `${tool.id} endpoint "${tool.endpoint}" should use v3 format (/data/kpi/ or /oudata/kpi/)`,
      ).toBe(true);
    }
  });

  it('data endpoints do NOT use old v2 /data/municipality/ format', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(
        tool.endpoint.startsWith('/data/municipality/'),
        `${tool.id} should not use old v2 format /data/municipality/`,
      ).toBe(false);
    }
  });

  it('data endpoints do NOT use old v2 /data/permunicipality/ format', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.endpoint).not.toContain('permunicipality');
    }
  });

  it('data endpoints do NOT use old v2 /data/perou/ format', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.endpoint).not.toContain('/data/perou/');
    }
  });

  it('kolada_data_kommun uses year in path', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.id === 'kolada_data_kommun');
    expect(tool!.endpoint).toContain('/year/');
  });

  it('kolada_data_alla_kommuner uses /data/kpi/{kpi}/year/{year}', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.id === 'kolada_data_alla_kommuner');
    expect(tool!.endpoint).toBe('/data/kpi/{kpi_id}/year/{year}');
  });

  it('kolada_data_enhet uses /oudata/kpi/ format', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.id === 'kolada_data_enhet');
    expect(tool!.endpoint).toBe('/oudata/kpi/{kpi_id}/year/{year}');
  });

  it('kolada_jamfor_kommuner uses v3 format with year', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.id === 'kolada_jamfor_kommuner');
    expect(tool!.endpoint).toBe('/data/kpi/{kpi_id}/municipality/{kommun_ids}/year/{year}');
  });

  it('kolada_trend uses v3 format with year', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.id === 'kolada_trend');
    expect(tool!.endpoint).toContain('/data/kpi/');
    expect(tool!.endpoint).toContain('/year/');
  });

  it('metadata endpoints still use simple paths', () => {
    const searchTool = TOOL_DEFINITIONS.find((t) => t.id === 'kolada_sok_nyckeltal');
    expect(searchTool!.endpoint).toBe('/kpi?title={query}');

    const kommunTool = TOOL_DEFINITIONS.find((t) => t.id === 'kolada_sok_kommun');
    expect(kommunTool!.endpoint).toBe('/municipality?title={query}');
  });
});
