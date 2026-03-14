import { describe, it, expect } from 'vitest';
import {
  formatDokumentLista,
  formatPersonLista,
  formatAnförandeLista,
  formatVoteringLista,
  formatDokument,
  formatG0vDokument,
  formatKalender,
  formatUtskott,
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

describe('formatDokumentLista', () => {
  it('formats document list', () => {
    const data = {
      dokumentlista: {
        '@antal': '2',
        dokument: [
          { dok_id: 'GZ10123', doktyp: 'mot', rm: '2024/25', titel: 'Motion om klimat', datum: '2024-10-01' },
          { dok_id: 'GZ10124', doktyp: 'prop', rm: '2024/25', titel: 'Budgetpropositionen', datum: '2024-09-20' },
        ],
      },
    };
    const result = formatDokumentLista(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('GZ10123');
    expect(result.markdown).toContain('Motion');
  });

  it('handles empty document list', () => {
    const data = { dokumentlista: { dokument: [] } };
    const result = formatDokumentLista(data);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga dokument');
  });
});

describe('formatPersonLista', () => {
  it('formats person list', () => {
    const data = {
      personlista: {
        person: [
          { intressent_id: '123', tilltalsnamn: 'Anna', efternamn: 'Svensson', parti: 'S', valkrets: 'Stockholm', status: 'Tjänstgörande' },
        ],
      },
    };
    const result = formatPersonLista(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Anna');
    expect(result.markdown).toContain('Socialdemokraterna');
  });

  it('handles empty person list', () => {
    const data = { personlista: { person: [] } };
    const result = formatPersonLista(data);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga ledamöter');
  });
});

describe('formatAnförandeLista', () => {
  it('formats speech list', () => {
    const data = {
      anforandelista: {
        anforande: [
          { datum: '2024-10-01', talare: 'Anna Svensson', parti: 'S', avsnittsrubrik: 'Klimatpolitik', dok_id: 'GZ10123' },
        ],
      },
    };
    const result = formatAnförandeLista(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Anna Svensson');
    expect(result.markdown).toContain('Klimatpolitik');
  });
});

describe('formatVoteringLista', () => {
  it('formats voting list', () => {
    const data = {
      voteringlista: {
        votering: [
          { datum: '2024-10-01', rm: '2024/25', beteckning: 'FiU10', punkt: '1', namn: 'Anna Svensson', parti: 'S', rost: 'Ja' },
        ],
      },
    };
    const result = formatVoteringLista(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('FiU10');
    expect(result.markdown).toContain('Ja');
  });
});

describe('formatDokument', () => {
  it('formats single document', () => {
    const data = {
      dokumentstatus: {
        dokument: {
          dok_id: 'GZ10123',
          doktyp: 'mot',
          rm: '2024/25',
          titel: 'Motion om klimat',
          datum: '2024-10-01',
          organ: 'MJU',
        },
      },
    };
    const result = formatDokument(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Motion om klimat');
    expect(result.markdown).toContain('GZ10123');
  });

  it('handles null data', () => {
    const result = formatDokument(null);
    expect(result.count).toBe(0);
  });
});

describe('formatG0vDokument', () => {
  it('formats government documents', () => {
    const data = [
      { title: 'Pressmeddelande', published: '2024-10-01', type: 'pressmeddelande', department: 'Finansdepartementet', url: 'https://example.com' },
    ];
    const result = formatG0vDokument(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Pressmeddelande');
    expect(result.markdown).toContain('Finansdepartementet');
  });

  it('handles empty array', () => {
    const result = formatG0vDokument([]);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga regeringsdokument');
  });
});

describe('formatUtskott', () => {
  it('formats committee list', () => {
    const result = formatUtskott();
    expect(result.count).toBe(15);
    expect(result.markdown).toContain('Finansutskottet');
    expect(result.markdown).toContain('FiU');
  });
});
