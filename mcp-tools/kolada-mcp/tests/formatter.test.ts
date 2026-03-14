import { describe, it, expect } from 'vitest';
import {
  formatKpiLista,
  formatKommunLista,
  formatEnhetLista,
  formatKpiData,
  formatKpiDetalj,
  formatKommunGrupper,
  formatTrend,
  markdownTable,
} from '../src/formatter.js';

describe('markdownTable', () => {
  it('generates a valid markdown table', () => {
    const result = markdownTable(['A', 'B'], [['1', '2'], ['3', '4']]);
    expect(result).toContain('| A | B |');
    expect(result).toContain('| 1 | 2 |');
  });

  it('returns message for empty data', () => {
    const result = markdownTable(['A'], []);
    expect(result).toBe('_Inga resultat._');
  });
});

describe('formatKpiLista', () => {
  it('formats KPI search results', () => {
    const data = {
      values: [
        { id: 'N00945', title: 'Invånare totalt', operating_area: 'Befolkning' },
        { id: 'N00941', title: 'Befolkningsökning/-minskning', operating_area: 'Befolkning' },
      ],
    };
    const result = formatKpiLista(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('N00945');
    expect(result.markdown).toContain('Invånare totalt');
  });

  it('handles empty results', () => {
    const result = formatKpiLista({ values: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga nyckeltal');
  });
});

describe('formatKommunLista', () => {
  it('formats municipality search results', () => {
    const data = {
      values: [
        { id: '0180', title: 'Stockholm', type: 'K' },
      ],
    };
    const result = formatKommunLista(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('0180');
    expect(result.markdown).toContain('Stockholm');
    expect(result.markdown).toContain('Kommun');
  });

  it('handles empty results', () => {
    const result = formatKommunLista({ values: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga kommuner');
  });
});

describe('formatEnhetLista', () => {
  it('formats organizational unit search results', () => {
    const data = {
      values: [
        { id: 'V15E108000301', title: 'Björkskolan', municipality: '0180' },
      ],
    };
    const result = formatEnhetLista(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Björkskolan');
    expect(result.markdown).toContain('Stockholm');
  });
});

describe('formatKpiData', () => {
  it('formats KPI values', () => {
    const data = {
      values: [
        { kpi: 'N00945', municipality: '0180', period: '2023', gender: 'T', value: 987654 },
      ],
    };
    const result = formatKpiData(data, 'Invånare totalt');
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Invånare totalt');
    expect(result.markdown).toContain('2023');
    expect(result.markdown).toContain('Stockholm');
  });

  it('handles empty data', () => {
    const result = formatKpiData({ values: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga data');
  });
});

describe('formatKpiDetalj', () => {
  it('formats KPI metadata', () => {
    const data = {
      values: [
        {
          id: 'N00945',
          title: 'Invånare totalt',
          description: 'Folkmängd, antal invånare',
          operating_area: 'Befolkning',
          auspices: 'SCB',
          is_divided_by_gender: 1,
          has_ou_data: 0,
        },
      ],
    };
    const result = formatKpiDetalj(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('N00945');
    expect(result.markdown).toContain('Invånare totalt');
    expect(result.markdown).toContain('SCB');
    expect(result.markdown).toContain('Ja');
  });

  it('handles empty data', () => {
    const result = formatKpiDetalj({ values: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Nyckeltal hittades inte');
  });
});

describe('formatKommunGrupper', () => {
  it('formats municipality groups', () => {
    const data = {
      values: [
        { id: 'G1', title: 'Storstäder', members: [{ id: '0180' }, { id: '1280' }, { id: '1480' }] },
      ],
    };
    const result = formatKommunGrupper(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Storstäder');
    expect(result.markdown).toContain('3');
  });

  it('handles empty data', () => {
    const result = formatKommunGrupper({ values: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga kommungrupper');
  });
});

describe('formatTrend', () => {
  it('formats trend data with changes', () => {
    const data = {
      values: [
        { kpi: 'N00945', municipality: '0180', period: '2021', gender: 'T', value: 975000 },
        { kpi: 'N00945', municipality: '0180', period: '2022', gender: 'T', value: 980000 },
        { kpi: 'N00945', municipality: '0180', period: '2023', gender: 'T', value: 987654 },
      ],
    };
    const result = formatTrend(data, 'Invånare totalt');
    expect(result.count).toBe(3);
    expect(result.markdown).toContain('2021');
    expect(result.markdown).toContain('2022');
    expect(result.markdown).toContain('2023');
    expect(result.markdown).toContain('+');
  });

  it('handles empty data', () => {
    const result = formatTrend({ values: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga trenddata');
  });
});
