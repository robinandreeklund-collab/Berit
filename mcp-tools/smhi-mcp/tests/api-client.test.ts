import { describe, it, expect } from 'vitest';
import { MemoryCache } from '../src/api-client.js';

describe('MemoryCache', () => {
  it('stores and retrieves values', () => {
    const cache = new MemoryCache();
    cache.set('key1', { value: 42 }, 10_000);
    expect(cache.get('key1')).toEqual({ value: 42 });
  });

  it('returns null for missing keys', () => {
    const cache = new MemoryCache();
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('expires entries after TTL', async () => {
    const cache = new MemoryCache();
    cache.set('key1', 'data', 50); // 50ms TTL
    expect(cache.get('key1')).toBe('data');

    await new Promise((r) => setTimeout(r, 100));
    expect(cache.get('key1')).toBeNull();
  });

  it('clears all entries', () => {
    const cache = new MemoryCache();
    cache.set('a', 1, 10_000);
    cache.set('b', 2, 10_000);
    cache.clear();
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
  });

  it('handles different TTLs per key', () => {
    const cache = new MemoryCache();
    cache.set('short', 'data', 10);
    cache.set('long', 'data', 60_000);

    // Both should be available immediately
    expect(cache.get('short')).toBe('data');
    expect(cache.get('long')).toBe('data');
  });

  it('overwrites existing keys', () => {
    const cache = new MemoryCache();
    cache.set('key', 'first', 10_000);
    cache.set('key', 'second', 10_000);
    expect(cache.get('key')).toBe('second');
  });
});
