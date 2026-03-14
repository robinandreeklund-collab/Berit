import { describe, it, expect } from 'vitest';
import {
  formatWeatherForecast,
  formatSnowForecast,
  formatMesanAnalysis,
  formatMetobs,
  formatStationList,
  formatHydroobs,
  formatOcobs,
  formatFireRiskForecast,
  formatFireRiskAnalysis,
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

describe('formatWeatherForecast', () => {
  it('formats forecast with timeSeries', () => {
    const data = {
      approvedTime: '2025-01-15T06:00:00Z',
      referenceTime: '2025-01-15T06:00:00Z',
      geometry: { type: 'Point', coordinates: [[18.0686, 59.3293]] },
      timeSeries: [
        {
          validTime: '2025-01-15T07:00:00Z',
          parameters: [
            { name: 't', levelType: 'hl', level: 2, unit: 'Cel', values: [-3.5] },
            { name: 'ws', levelType: 'hl', level: 10, unit: 'm/s', values: [4.2] },
            { name: 'gust', levelType: 'hl', level: 10, unit: 'm/s', values: [7.1] },
            { name: 'pmean', levelType: 'hl', level: 0, unit: 'mm/h', values: [0.0] },
            { name: 'tcc_mean', levelType: 'hl', level: 0, unit: 'percent', values: [75] },
            { name: 'Wsymb2', levelType: 'hl', level: 0, unit: 'category', values: [4] },
          ],
        },
      ],
    };
    const result = formatWeatherForecast(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Väderprognos');
    expect(result.markdown).toContain('-3.5');
    expect(result.markdown).toContain('Molnigt');
  });

  it('handles missing timeSeries', () => {
    const result = formatWeatherForecast({});
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Ingen prognosdata');
  });

  it('handles null data', () => {
    const result = formatWeatherForecast(null);
    expect(result.count).toBe(0);
  });
});

describe('formatSnowForecast', () => {
  it('handles missing timeSeries', () => {
    const result = formatSnowForecast({});
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Ingen snöprognosdata');
  });

  it('formats snow1g flat data object format', () => {
    const data = {
      createdTime: '2025-01-15T06:00:00Z',
      approvedTime: '2025-01-15T06:00:00Z',
      referenceTime: '2025-01-15T06:00:00Z',
      geometry: { type: 'Point', coordinates: [[18.0686, 59.3293]] },
      timeSeries: [
        {
          time: '2025-01-15T07:00:00Z',
          data: {
            air_temperature: -5.2,
            wind_speed: 3.1,
            precipitation_amount_mean: 0.5,
            cloud_area_fraction: 6,
            symbol_code: 15,
          },
        },
        {
          time: '2025-01-15T08:00:00Z',
          data: {
            air_temperature: -6.1,
            wind_speed: 2.8,
            precipitation_amount_mean: 1.2,
            cloud_area_fraction: 8,
            symbol_code: 16,
          },
        },
      ],
    };
    const result = formatSnowForecast(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Snöprognos');
    expect(result.markdown).toContain('-5.2');
    expect(result.markdown).toContain('-6.1');
    expect(result.markdown).toContain('Lätt snöfall');
    expect(result.markdown).toContain('Måttligt snöfall');
  });

  it('handles parameters array format as fallback', () => {
    const data = {
      approvedTime: '2025-01-15T06:00:00Z',
      timeSeries: [
        {
          validTime: '2025-01-15T07:00:00Z',
          parameters: [
            { name: 't', values: [-3.0] },
            { name: 'ws', values: [2.5] },
            { name: 'pmean', values: [0.1] },
            { name: 'tcc_mean', values: [5] },
            { name: 'Wsymb2', values: [15] },
          ],
        },
      ],
    };
    const result = formatSnowForecast(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('-3.0');
    expect(result.markdown).toContain('Lätt snöfall');
  });
});

describe('formatMesanAnalysis', () => {
  it('formats MESAN data with parameters', () => {
    const data = {
      approvedTime: '2025-01-15T12:00:00Z',
      geometry: { type: 'Point', coordinates: [[18.0686, 59.3293]] },
      timeSeries: [
        {
          validTime: '2025-01-15T12:00:00Z',
          parameters: [
            { name: 't', levelType: 'hl', level: 2, unit: 'Cel', values: [-2.0] },
            { name: 'ws', levelType: 'hl', level: 10, unit: 'm/s', values: [3.5] },
          ],
        },
      ],
    };
    const result = formatMesanAnalysis(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('MESAN');
    expect(result.markdown).toContain('-2.00');
  });

  it('handles missing timeSeries', () => {
    const result = formatMesanAnalysis({});
    expect(result.count).toBe(0);
  });
});

describe('formatMetobs', () => {
  it('formats observation data', () => {
    const data = {
      station: { key: '97200', name: 'Bromma' },
      parameter: { key: '1', name: 'Lufttemperatur', unit: '°C' },
      period: { key: 'latest-day' },
      value: [
        { date: 1705312800000, value: '-3.2', quality: 'G' },
        { date: 1705316400000, value: '-2.8', quality: 'G' },
      ],
    };
    const result = formatMetobs(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Bromma');
    expect(result.markdown).toContain('Lufttemperatur');
    expect(result.markdown).toContain('-3.2');
  });

  it('handles null data', () => {
    const result = formatMetobs(null);
    expect(result.count).toBe(0);
  });
});

describe('formatStationList', () => {
  it('formats station list', () => {
    const data = {
      title: 'Lufttemperatur',
      station: [
        { key: '97200', name: 'Bromma', latitude: 59.35, longitude: 17.95, height: 11, active: true },
        { key: '98210', name: 'Stockholm', latitude: 59.35, longitude: 18.06, height: 44, active: true },
      ],
    };
    const result = formatStationList(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Bromma');
    expect(result.markdown).toContain('97200');
  });

  it('handles null data', () => {
    const result = formatStationList(null);
    expect(result.count).toBe(0);
  });
});

describe('formatHydroobs', () => {
  it('formats hydrological data', () => {
    const data = {
      station: { key: '1', name: 'Teststation' },
      parameter: { key: '3', name: 'Vattenstånd', unit: 'cm' },
      value: [
        { date: 1705312800000, value: '123', quality: 'G' },
      ],
    };
    const result = formatHydroobs(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Hydrologiska');
    expect(result.markdown).toContain('Vattenstånd');
  });
});

describe('formatOcobs', () => {
  it('formats oceanographic data', () => {
    const data = {
      station: { key: '1', name: 'Havsstation' },
      parameter: { key: '5', name: 'Havstemperatur', unit: '°C' },
      value: [
        { date: 1705312800000, value: '4.2', quality: 'G' },
      ],
    };
    const result = formatOcobs(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Oceanografiska');
    expect(result.markdown).toContain('Havstemperatur');
  });
});

describe('formatFireRiskForecast', () => {
  it('formats fire risk forecast data', () => {
    const data = {
      approvedTime: '2025-06-15T06:00:00Z',
      geometry: { type: 'Point', coordinates: [[18.0686, 59.3293]] },
      timeSeries: [
        {
          validTime: '2025-06-15T12:00:00Z',
          parameters: [
            { name: 'fwi', unit: '', values: [12.5] },
            { name: 'isi', unit: '', values: [3.2] },
            { name: 'bui', unit: '', values: [45.1] },
            { name: 'ffmc', unit: '', values: [82.3] },
            { name: 'forestdry', unit: '', values: [3.0] },
            { name: 'grassfire', unit: '', values: [1.5] },
          ],
        },
      ],
    };
    const result = formatFireRiskForecast(data);
    expect(result.count).toBe(1);
    expect(result.markdown).toContain('Brandriskprognos');
    expect(result.markdown).toContain('12.5');
  });

  it('handles missing timeSeries', () => {
    const result = formatFireRiskForecast({});
    expect(result.count).toBe(0);
  });
});

describe('formatFireRiskAnalysis', () => {
  it('handles missing timeSeries', () => {
    const result = formatFireRiskAnalysis({});
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Ingen brandriskanalysdata');
  });
});
