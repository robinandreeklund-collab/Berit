import { describe, it, expect } from 'vitest';
import { buildQueryXml, escapeXml, MemoryCache } from '../src/api-client.js';

describe('escapeXml', () => {
  it('escapes special XML characters', () => {
    expect(escapeXml('a&b')).toBe('a&amp;b');
    expect(escapeXml('<tag>')).toBe('&lt;tag&gt;');
    expect(escapeXml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeXml("it's")).toBe('it&apos;s');
  });

  it('handles empty string', () => {
    expect(escapeXml('')).toBe('');
  });

  it('handles string without special chars', () => {
    expect(escapeXml('hello world')).toBe('hello world');
  });
});

describe('buildQueryXml', () => {
  it('builds basic query XML', () => {
    const xml = buildQueryXml('test-key', {
      objecttype: 'Situation',
      schemaVersion: '1.6',
      limit: 10,
    });

    expect(xml).toContain('<LOGIN authenticationkey="test-key"');
    expect(xml).toContain('objecttype="Situation"');
    expect(xml).toContain('schemaversion="1.6"');
    expect(xml).toContain('limit="10"');
    expect(xml).toContain('<REQUEST>');
    expect(xml).toContain('</QUERY>');
    expect(xml).toContain('</REQUEST>');
  });

  it('includes namespace when provided', () => {
    const xml = buildQueryXml('key', {
      objecttype: 'Situation',
      namespace: 'road.trafficinfo',
    });

    expect(xml).toContain('namespace="road.trafficinfo"');
  });

  it('omits namespace when not provided', () => {
    const xml = buildQueryXml('key', {
      objecttype: 'TrainAnnouncement',
    });

    expect(xml).not.toContain('namespace=');
  });

  it('includes filter when provided', () => {
    const xml = buildQueryXml('key', {
      objecttype: 'Situation',
      filter: {
        operator: 'LIKE',
        name: 'Deviation.LocationDescriptor',
        value: '.*Stockholm.*',
      },
    });

    expect(xml).toContain('<FILTER>');
    expect(xml).toContain('<LIKE');
    expect(xml).toContain('name="Deviation.LocationDescriptor"');
    expect(xml).toContain('value=".*Stockholm.*"');
    expect(xml).toContain('</FILTER>');
  });

  it('omits filter when null', () => {
    const xml = buildQueryXml('key', {
      objecttype: 'Situation',
      filter: null,
    });

    expect(xml).not.toContain('<FILTER>');
  });

  it('includes INCLUDE elements', () => {
    const xml = buildQueryXml('key', {
      objecttype: 'TrainAnnouncement',
      include: ['AdvertisedTrainIdent', 'LocationSignature'],
    });

    expect(xml).toContain('<INCLUDE>AdvertisedTrainIdent</INCLUDE>');
    expect(xml).toContain('<INCLUDE>LocationSignature</INCLUDE>');
  });

  it('does not include SORTING (not supported by Trafikverket API v2)', () => {
    const xml = buildQueryXml('key', {
      objecttype: 'TrainAnnouncement',
    });

    expect(xml).not.toContain('<SORTING>');
    expect(xml).not.toContain('<ORDER');
  });

  it('escapes API key with special characters', () => {
    const xml = buildQueryXml('key&<>"\'', {
      objecttype: 'Situation',
    });

    expect(xml).toContain('authenticationkey="key&amp;&lt;&gt;&quot;&apos;"');
  });

  it('defaults limit to 10', () => {
    const xml = buildQueryXml('key', {
      objecttype: 'Situation',
    });

    expect(xml).toContain('limit="10"');
  });
});

describe('MemoryCache', () => {
  it('stores and retrieves values', () => {
    const cache = new MemoryCache();
    cache.set('key1', { data: 'test' }, 60_000);
    expect(cache.get('key1')).toEqual({ data: 'test' });
  });

  it('returns null for missing keys', () => {
    const cache = new MemoryCache();
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('returns null for expired entries', () => {
    const cache = new MemoryCache();
    cache.set('key1', { data: 'test' }, -1); // Already expired
    expect(cache.get('key1')).toBeNull();
  });

  it('clears all entries', () => {
    const cache = new MemoryCache();
    cache.set('key1', 'a', 60_000);
    cache.set('key2', 'b', 60_000);
    cache.clear();
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });
});
