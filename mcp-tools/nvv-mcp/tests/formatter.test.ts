import { describe, it, expect } from 'vitest';
import {
  formatOmraden,
  formatOmradeDetalj,
  formatArter,
  formatNaturtyper,
  formatSyften,
  formatNmdKlasser,
  formatUppslag,
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

describe('formatOmraden', () => {
  it('formats area list', () => {
    const data = [
      { nvrId: 123, namn: 'Testomrade', skyddstyp: 'Naturreservat', areal: 150.5, lan: 'AB', kommun: 'Stockholm' },
      { nvrId: 456, namn: 'Annat omrade', skyddstyp: 'Nationalpark', areal: 3200.0, lan: 'BD', kommun: 'Kiruna' },
    ];
    const result = formatOmraden(data, 'Nationellt skyddat');
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Testomrade');
    expect(result.markdown).toContain('123');
  });

  it('handles empty array', () => {
    const result = formatOmraden([], 'Natura 2000');
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga Natura 2000-omraden');
  });
});

describe('formatOmradeDetalj', () => {
  it('formats area details', () => {
    const data = { nvrId: 123, namn: 'Testomrade', skyddstyp: 'Naturreservat', areal: 150.5, lan: 'AB' };
    const result = formatOmradeDetalj(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Testomrade');
    expect(result.markdown).toContain('Naturreservat');
  });

  it('handles null data', () => {
    const result = formatOmradeDetalj(null);
    expect(result.count).toBe(0);
  });
});

describe('formatArter', () => {
  it('formats species list', () => {
    const data = [
      { vetenskapligtNamn: 'Haliaeetus albicilla', svensktNamn: 'Havsorn', grupp: 'B', bilaga: 'I' },
      { vetenskapligtNamn: 'Lutra lutra', svensktNamn: 'Utter', grupp: 'M', bilaga: 'II' },
    ];
    const result = formatArter(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Havsorn');
    expect(result.markdown).toContain('Lutra lutra');
  });

  it('handles empty array', () => {
    const result = formatArter([]);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga arter');
  });
});

describe('formatNaturtyper', () => {
  it('formats habitat types', () => {
    const data = [
      { naturtypskod: '9010', naturtypNamn: 'Vastlig taiga', areal: 450.2 },
    ];
    const result = formatNaturtyper(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('9010');
    expect(result.markdown).toContain('Vastlig taiga');
  });

  it('handles empty array', () => {
    const result = formatNaturtyper([]);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga naturtyper');
  });
});

describe('formatSyften', () => {
  it('formats purposes', () => {
    const data = [
      { syfteId: 1, syftestext: 'Bevara biologisk mangfald' },
    ];
    const result = formatSyften(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Bevara biologisk mangfald');
  });
});

describe('formatNmdKlasser', () => {
  it('formats land cover classes', () => {
    const data = [
      { nmdKlassId: 1, nmdKlassNamn: 'Barrskog', areal: 200.5, andel: 45.2 },
    ];
    const result = formatNmdKlasser(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Barrskog');
    expect(result.markdown).toContain('45.2');
  });
});

describe('formatUppslag', () => {
  it('formats lookup results', () => {
    const data = [
      { kod: 'AB', namn: 'Stockholms lan' },
      { kod: 'C', namn: 'Uppsala lan' },
    ];
    const result = formatUppslag(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('AB');
    expect(result.markdown).toContain('Stockholms lan');
  });

  it('handles empty results', () => {
    const result = formatUppslag([]);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga matchningar');
  });
});
