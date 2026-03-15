import { describe, it, expect } from 'vitest';
import { formatEvents } from '../src/formatter.js';

describe('formatEvents', () => {
  it('returns empty message for no data', () => {
    const result = formatEvents([]);
    expect(result.count).toBe(0);
    expect(result.markdown).toContain('Inga polishändelser');
  });

  it('returns empty message for null data', () => {
    const result = formatEvents(null);
    expect(result.count).toBe(0);
  });

  it('formats police events', () => {
    const data = [
      {
        id: 123,
        datetime: '2026-03-15 10:00:14 +01:00',
        name: '15 mars 10.00, Misshandel, Stockholm',
        summary: 'En person misshandlad på Kungsgatan.',
        url: '/aktuellt/handelser/2026/mars/15/...',
        type: 'Misshandel',
        location: {
          name: 'Stockholms län',
          gps: '59.332438,18.064150',
        },
      },
      {
        id: 456,
        datetime: '2026-03-15 08:30:00 +01:00',
        name: '15 mars 08.30, Trafikolycka, Malmö',
        summary: 'Singelolycka på E6.',
        url: '/aktuellt/handelser/2026/mars/15/...',
        type: 'Trafikolycka',
        location: {
          name: 'Skåne län',
          gps: '55.604981,13.003822',
        },
      },
    ];
    const result = formatEvents(data);
    expect(result.count).toBe(2);
    expect(result.markdown).toContain('Misshandel');
    expect(result.markdown).toContain('Trafikolycka');
    expect(result.markdown).toContain('Stockholms län');
    expect(result.markdown).toContain('Skåne län');
  });
});
