import { describe, it, expect } from 'vitest';
import {
  formatLibrisResults,
  formatLibrisFindResults,
  formatLibrisHoldings,
  formatKsamsokResults,
  formatKsamsokObject,
  formatSwepubResults,
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

describe('formatLibrisResults', () => {
  it('formats Libris xsearch results', () => {
    const data = {
      xsearch: {
        from: 1,
        to: 2,
        records: 42,
        list: [
          { title: 'Pippi Långstrump', creator: 'Astrid Lindgren', date: '1945', publisher: 'Rabén & Sjögren', isbn: '9789129066746', type: 'book' },
          { title: 'Ronja Rövardotter', creator: 'Astrid Lindgren', date: '1981', publisher: 'Rabén & Sjögren', isbn: '9789129066753', type: 'book' },
        ],
      },
    };
    const result = formatLibrisResults(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Pippi Långstrump');
    expect(result.markdown).toContain('Astrid Lindgren');
    expect(result.markdown).toContain('1945');
    expect(result.markdown).toContain('42 träffar');
  });

  it('handles empty results', () => {
    const data = { xsearch: { records: 0, list: [] } };
    const result = formatLibrisResults(data);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga resultat');
  });

  it('handles multiple authors as array', () => {
    const data = {
      xsearch: {
        list: [
          { title: 'Samarbete', creator: ['Författare A', 'Författare B'], date: '2020' },
        ],
      },
    };
    const result = formatLibrisResults(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Författare A; Författare B');
  });
});

describe('formatLibrisFindResults', () => {
  it('formats Libris XL / Find results', () => {
    const data = {
      totalItems: 100,
      items: [
        {
          '@id': '/bib/12345',
          '@type': 'Text',
          hasTitle: [{ mainTitle: 'Testbok', subtitle: 'En subtitle' }],
          contribution: [{ agent: { name: 'Test Författare' } }],
          publication: [{ date: '2023' }],
        },
      ],
    };
    const result = formatLibrisFindResults(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Testbok');
    expect(result.markdown).toContain('En subtitle');
    expect(result.markdown).toContain('Test Författare');
    expect(result.markdown).toContain('2023');
  });

  it('handles empty results', () => {
    const data = { totalItems: 0, items: [] };
    const result = formatLibrisFindResults(data);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga resultat');
  });
});

describe('formatLibrisHoldings', () => {
  it('formats holdings data from @graph', () => {
    const data = {
      '@graph': [
        {
          '@type': 'Item',
          heldBy: { name: 'Kungliga biblioteket', sigel: 'S' },
          hasComponent: [{ shelfMark: { label: 'Hc' } }],
        },
        {
          '@type': 'Item',
          heldBy: { name: 'Uppsala universitetsbibliotek', sigel: 'U' },
          hasComponent: [{ shelfMark: { label: 'Sv' } }],
        },
      ],
    };
    const result = formatLibrisHoldings(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Kungliga biblioteket');
    expect(result.markdown).toContain('Uppsala universitetsbibliotek');
  });

  it('handles empty holdings', () => {
    const data = { '@graph': [] };
    const result = formatLibrisHoldings(data);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga beståndsuppgifter');
  });
});

describe('formatKsamsokResults', () => {
  it('formats K-samsök search results', () => {
    const data = {
      totalHits: 500,
      records: [
        {
          itemLabel: 'Vikingasvärd',
          type: 'föremål',
          institution: 'Historiska museet',
          municipality: 'Stockholm',
          county: 'Stockholm',
          timeLabel: 'Vikingatid',
        },
      ],
    };
    const result = formatKsamsokResults(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Vikingasvärd');
    expect(result.markdown).toContain('Historiska museet');
    expect(result.markdown).toContain('Vikingatid');
  });

  it('handles empty results', () => {
    const data = { totalHits: 0, records: [] };
    const result = formatKsamsokResults(data);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga kulturarvsobjekt');
  });
});

describe('formatKsamsokObject', () => {
  it('formats a single K-samsök object', () => {
    const data = {
      records: [
        {
          itemLabel: 'Runsten U 1000',
          type: 'fornlämning',
          institution: 'Riksantikvarieämbetet',
          municipality: 'Uppsala',
          county: 'Uppsala',
          country: 'Sverige',
          timeLabel: 'Vikingatid',
          itemDescription: 'En runsten med inskription.',
          recordId: 'raa/fmi/10028600550001',
        },
      ],
    };
    const result = formatKsamsokObject(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Runsten U 1000');
    expect(result.markdown).toContain('Riksantikvarieämbetet');
    expect(result.markdown).toContain('Uppsala');
    expect(result.markdown).toContain('En runsten med inskription');
  });

  it('handles null data', () => {
    const result = formatKsamsokObject(null);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inget kulturarvsobjekt');
  });
});

describe('formatSwepubResults', () => {
  it('formats Swepub search results', () => {
    const data = {
      xsearch: {
        records: 150,
        list: [
          {
            title: 'Machine Learning in Sweden',
            creator: ['Anna Svensson', 'Erik Johansson'],
            date: '2024',
            type: 'article',
            publisher: 'KTH Royal Institute of Technology',
          },
        ],
      },
    };
    const result = formatSwepubResults(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Machine Learning in Sweden');
    expect(result.markdown).toContain('Anna Svensson; Erik Johansson');
    expect(result.markdown).toContain('2024');
  });

  it('handles empty results', () => {
    const data = { xsearch: { records: 0, list: [] } };
    const result = formatSwepubResults(data);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga forskningspublikationer');
  });
});
