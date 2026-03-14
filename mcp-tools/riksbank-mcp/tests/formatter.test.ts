import { describe, it, expect } from 'vitest';
import {
  formatObservations,
  formatGroupObservations,
  formatCrossRate,
  formatSwestr,
  formatForecasts,
  formatIndicators,
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

describe('formatObservations', () => {
  it('formats observation array', () => {
    const data = [
      { date: '2024-01-15', value: 4.0 },
      { date: '2024-06-15', value: 3.75 },
    ];
    const result = formatObservations(data, 'Styrränta');
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Styrränta');
    expect(result.markdown).toContain('2024-01-15');
  });

  it('handles empty array', () => {
    const result = formatObservations([]);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga observationer');
  });
});

describe('formatGroupObservations', () => {
  it('formats group observations with series info', () => {
    const data = [
      { seriesId: 'SEKEURPMI', seriesName: 'EUR/SEK', date: '2024-01-15', value: 11.25, unit: 'SEK' },
    ];
    const result = formatGroupObservations(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('SEKEURPMI');
    expect(result.markdown).toContain('EUR/SEK');
  });
});

describe('formatCrossRate', () => {
  it('formats cross rate data', () => {
    const data = { seriesId1: 'SEKEURPMI', seriesId2: 'SEKUSDPMI', date: '2024-01-15', value: 1.085 };
    const result = formatCrossRate(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('SEKEURPMI');
  });

  it('handles null data', () => {
    const result = formatCrossRate(null);
    expect(result.count).toBe(0);
  });
});

describe('formatSwestr', () => {
  it('formats SWESTR observation', () => {
    const data = {
      date: '2024-01-15',
      rate: 3.91,
      pctl12_5: 3.85,
      pctl87_5: 3.95,
      volume: 42000,
      numberOfTransactions: 35,
      numberOfAgents: 12,
    };
    const result = formatSwestr(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('3.9100');
  });
});

describe('formatForecasts', () => {
  it('formats forecast data', () => {
    const data = [
      { date: '2024-Q1', forecast: 2.1, outcome: 2.3 },
      { date: '2024-Q2', forecast: 1.9, outcome: null },
    ];
    const result = formatForecasts(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Prognos');
    expect(result.markdown).toContain('Utfall');
  });
});

describe('formatIndicators', () => {
  it('formats indicator list', () => {
    const data = [
      { id: 'CPI', name: 'Konsumentprisindex', description: 'KPI' },
      { id: 'GDP', name: 'BNP', description: 'Bruttonationalprodukt' },
    ];
    const result = formatIndicators(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('CPI');
    expect(result.markdown).toContain('GDP');
  });
});
