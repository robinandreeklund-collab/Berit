import { describe, it, expect } from 'vitest';
import { formatResponse, formatTime, truncate, markdownTable } from '../src/formatter.js';

describe('formatTime', () => {
  it('formats ISO datetime strings', () => {
    const result = formatTime('2026-03-14T10:30:00.000+01:00');
    expect(result).toContain('2026');
    // Time may differ by timezone; just check it contains a colon-separated time
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it('returns dash for undefined', () => {
    expect(formatTime(undefined)).toBe('—');
  });

  it('returns dash for null', () => {
    expect(formatTime(null)).toBe('—');
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    const long = 'a'.repeat(200);
    const result = truncate(long, 50);
    expect(result.length).toBeLessThanOrEqual(51); // 50 + ellipsis
    expect(result).toContain('…');
  });

  it('leaves short strings unchanged', () => {
    expect(truncate('hello', 50)).toBe('hello');
  });

  it('returns dash for undefined', () => {
    expect(truncate(undefined)).toBe('—');
  });
});

describe('markdownTable', () => {
  it('builds a table with headers and rows', () => {
    const result = markdownTable(
      ['A', 'B'],
      [['1', '2'], ['3', '4']],
    );
    expect(result).toContain('| A | B |');
    expect(result).toContain('| --- | --- |');
    expect(result).toContain('| 1 | 2 |');
    expect(result).toContain('| 3 | 4 |');
  });

  it('returns message for empty rows', () => {
    const result = markdownTable(['A'], []);
    expect(result).toContain('Inga resultat');
  });
});

describe('formatResponse', () => {
  it('formats Situation responses', () => {
    const response = {
      RESPONSE: {
        RESULT: [
          {
            Situation: [
              {
                Id: 'sit1',
                Deviation: [
                  {
                    LocationDescriptor: 'E4 Stockholm',
                    Message: 'Vägarbete pågår',
                    MessageCode: 'RoadWork',
                    SeverityCode: 3,
                    StartTime: '2026-03-14T08:00:00',
                    EndTime: '2026-03-14T18:00:00',
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const { markdown, count } = formatResponse(response, 'Situation', 'test');
    expect(count).toBe(1);
    expect(markdown).toContain('E4 Stockholm');
    expect(markdown).toContain('Vägarbete pågår');
  });

  it('formats TrainAnnouncement responses', () => {
    const response = {
      RESPONSE: {
        RESULT: [
          {
            TrainAnnouncement: [
              {
                AdvertisedTrainIdent: '501',
                AdvertisedLocationName: 'Stockholm C',
                ActivityType: 'Avgang',
                AdvertisedTimeAtLocation: '2026-03-14T10:00:00',
                TrackAtLocation: '15',
                Canceled: false,
                ToLocation: [{ LocationName: 'Göteborg C' }],
                Deviation: [],
              },
            ],
          },
        ],
      },
    };

    const { markdown, count } = formatResponse(response, 'TrainAnnouncement', 'test');
    expect(count).toBe(1);
    expect(markdown).toContain('501');
    expect(markdown).toContain('Stockholm C');
    expect(markdown).toContain('Göteborg C');
    expect(markdown).toContain('I tid');
  });

  it('marks canceled trains', () => {
    const response = {
      RESPONSE: {
        RESULT: [
          {
            TrainAnnouncement: [
              {
                AdvertisedTrainIdent: '502',
                AdvertisedLocationName: 'Malmö C',
                ActivityType: 'Avgang',
                Canceled: true,
                ToLocation: [],
                Deviation: [],
              },
            ],
          },
        ],
      },
    };

    const { markdown } = formatResponse(response, 'TrainAnnouncement', 'test');
    expect(markdown).toContain('INSTÄLLT');
  });

  it('formats WeatherMeasurepoint responses', () => {
    const response = {
      RESPONSE: {
        RESULT: [
          {
            WeatherMeasurepoint: [
              {
                Name: 'E4 Hudiksvall',
                Observation: {
                  Air: { Temperature: -5.2, RelativeHumidity: 89 },
                  Wind: [{ Force: 4.5, ForceMax: 8.1 }],
                  Surface: [{ Temperature: -7.1, Ice: true, Snow: false }],
                },
              },
            ],
          },
        ],
      },
    };

    const { markdown, count } = formatResponse(response, 'WeatherMeasurepoint', 'test');
    expect(count).toBe(1);
    expect(markdown).toContain('E4 Hudiksvall');
    expect(markdown).toContain('-5.2');
    expect(markdown).toContain('-7.1');
    expect(markdown).toContain('4.5');
    expect(markdown).toContain('Ja'); // Ice
  });

  it('handles empty RESULT array', () => {
    const response = { RESPONSE: { RESULT: [] } };
    const { markdown, count } = formatResponse(response, 'Situation', 'test');
    expect(count).toBe(0);
    expect(markdown).toContain('Inget svar');
  });

  it('handles empty data array', () => {
    const response = { RESPONSE: { RESULT: [{ Situation: [] }] } };
    const { markdown, count } = formatResponse(response, 'Situation', 'test');
    expect(count).toBe(0);
    expect(markdown).toContain('Inga resultat');
  });
});
