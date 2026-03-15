import { describe, it, expect } from 'vitest';
import {
  formatSearchResults,
  formatQuestionResults,
  formatLOVResults,
  formatCriteriaResults,
  formatCriteriaCategories,
  formatTEDResults,
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

describe('formatSearchResults', () => {
  it('formats search result array', () => {
    const data = {
      hits: [
        { title: 'Vägledning LOU', url: '/vagledning', description: 'En guide om LOU', type: 'guide' },
        { title: 'Direktupphandling', url: '/direkt', description: 'Om direktupphandling', type: 'artikel' },
      ],
      totalHits: 2,
    };
    const result = formatSearchResults(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Vägledning LOU');
    expect(result.markdown).toContain('Direktupphandling');
  });

  it('handles empty hits', () => {
    const result = formatSearchResults({ hits: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga sökresultat');
  });

  it('shows pagination info when totalHits > displayed', () => {
    const data = {
      hits: [{ title: 'Test', url: '/test', description: 'Test', type: 'page' }],
      totalHits: 50,
    };
    const result = formatSearchResults(data);
    expect(result.markdown).toContain('Visar 1 av 50');
  });
});

describe('formatQuestionResults', () => {
  it('formats question results', () => {
    const data = {
      hits: [
        { title: 'Kan man avbryta?', url: '/fraga1', description: 'Om avbrytande', category: 'LOU' },
      ],
      totalHits: 1,
    };
    const result = formatQuestionResults(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Kan man avbryta?');
    expect(result.markdown).toContain('LOU');
  });

  it('handles empty questions', () => {
    const result = formatQuestionResults({ hits: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga frågor');
  });
});

describe('formatLOVResults', () => {
  it('formats LOV results with all fields', () => {
    const data = {
      hits: [
        {
          title: 'Hemtjänst',
          municipality: 'Stockholm',
          region: 'Stockholm',
          category: 'Äldreomsorg',
          status: 'Aktiv',
          publishDate: '2024-01-15',
        },
      ],
      totalHits: 1,
    };
    const result = formatLOVResults(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Hemtjänst');
    expect(result.markdown).toContain('Stockholm');
    expect(result.markdown).toContain('Äldreomsorg');
  });

  it('handles empty LOV results', () => {
    const result = formatLOVResults({ hits: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga LOV-annonser');
  });
});

describe('formatCriteriaResults', () => {
  it('formats criteria results', () => {
    const data = {
      hits: [
        { title: 'Miljökrav fordon', type: 'krav', category: 'Fordon', level: 'Bas', url: '/krav1' },
      ],
      totalHits: 1,
    };
    const result = formatCriteriaResults(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Miljökrav fordon');
    expect(result.markdown).toContain('krav');
    expect(result.markdown).toContain('Bas');
  });

  it('handles empty criteria', () => {
    const result = formatCriteriaResults({ hits: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga kriterier');
  });
});

describe('formatCriteriaCategories', () => {
  it('formats categories and types', () => {
    const data = {
      categories: [
        { id: 'fordon', name: 'Fordon och transport', count: 12 },
        { id: 'mat', name: 'Livsmedel', count: 8 },
      ],
      types: ['krav', 'kriterier', 'villkor'],
    };
    const result = formatCriteriaCategories(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Fordon och transport');
    expect(result.markdown).toContain('Livsmedel');
    expect(result.markdown).toContain('krav');
  });

  it('handles empty categories', () => {
    const result = formatCriteriaCategories({ categories: [], types: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga kategorier');
  });
});

describe('formatTEDResults', () => {
  it('formats TED notice results', () => {
    const data = {
      notices: [
        {
          'BT-21-Procedure': 'IT-tjänster för myndighet',
          'BT-22-Procedure': 'Konsulttjänster inom IT',
          'BT-500-Organization-Company': 'Trafikverket',
          'ND-Root': 'TED-2024-123456',
        },
      ],
      totalNoticeCount: 1,
    };
    const result = formatTEDResults(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('IT-tjänster');
    expect(result.markdown).toContain('Trafikverket');
    expect(result.markdown).toContain('TED-2024-123456');
  });

  it('handles empty TED results', () => {
    const result = formatTEDResults({ notices: [] });
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga TED-annonser');
  });

  it('shows pagination for large result sets', () => {
    const data = {
      notices: [
        {
          'BT-21-Procedure': 'Test',
          'BT-22-Procedure': 'Test',
          'BT-500-Organization-Company': 'Test',
          'ND-Root': 'REF-1',
        },
      ],
      totalNoticeCount: 500,
    };
    const result = formatTEDResults(data);
    expect(result.markdown).toContain('Visar 1 av 500');
  });
});
