import { describe, it, expect } from 'vitest';
import { geocode, resolveCoordinates } from '../src/geocode.js';

describe('geocode', () => {
  it('resolves well-known location Stockholm', async () => {
    const result = await geocode('Stockholm');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(59.3293, 2);
    expect(result!.lon).toBeCloseTo(18.0686, 2);
    expect(result!.source).toBe('cache');
  });

  it('resolves well-known location Göteborg (case insensitive)', async () => {
    const result = await geocode('göteborg');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(57.7089, 2);
    expect(result!.source).toBe('cache');
  });

  it('resolves well-known location Malmö', async () => {
    const result = await geocode('Malmö');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(55.6050, 2);
    expect(result!.source).toBe('cache');
  });

  it('resolves well-known location Kiruna', async () => {
    const result = await geocode('kiruna');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(67.8558, 2);
    expect(result!.source).toBe('cache');
  });

  it('returns null for empty string', async () => {
    const result = await geocode('');
    expect(result).toBeNull();
  });

  it('returns null for whitespace-only string', async () => {
    const result = await geocode('   ');
    expect(result).toBeNull();
  });
});

describe('resolveCoordinates', () => {
  it('uses lat/lon when provided directly', async () => {
    const result = await resolveCoordinates({ latitude: 59.3293, longitude: 18.0686 });
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.lat).toBe(59.3293);
      expect(result.lon).toBe(18.0686);
      expect(result.resolvedName).toBeUndefined();
    }
  });

  it('resolves location string to coordinates', async () => {
    const result = await resolveCoordinates({ location: 'Stockholm' });
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.lat).toBeCloseTo(59.3293, 2);
      expect(result.lon).toBeCloseTo(18.0686, 2);
      expect(result.resolvedName).toBe('Stockholm');
    }
  });

  it('prefers lat/lon over location when both provided', async () => {
    const result = await resolveCoordinates({
      latitude: 55.0,
      longitude: 13.0,
      location: 'Stockholm',
    });
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.lat).toBe(55.0);
      expect(result.lon).toBe(13.0);
    }
  });

  it('returns error when nothing provided', async () => {
    const result = await resolveCoordinates({});
    expect('error' in result).toBe(true);
  });
});
