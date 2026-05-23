const cache = require('../cache');

beforeEach(() => {
  cache.clear();
});

describe('CacheService', () => {
  describe('set/get', () => {
    it('should set a value and get it back', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for a non-existent key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite an existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });
  });

  describe('delete', () => {
    it('should delete a value and get returns undefined', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      cache.delete('key1');
      expect(cache.get('key1')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });
  });

  describe('generateCacheKey consistency', () => {
    it('should return the same key for the same parameters', () => {
      const requestData = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'hello' }],
        max_tokens: 100,
        temperature: 0.7,
      };
      const key1 = cache.generateCacheKey(requestData);
      const key2 = cache.generateCacheKey(requestData);
      expect(key1).toBe(key2);
    });

    it('should return different keys for different parameters', () => {
      const requestData1 = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'hello' }],
        max_tokens: 100,
        temperature: 0.7,
      };
      const requestData2 = {
        model: 'gpt-3.5',
        messages: [{ role: 'user', content: 'hello' }],
        max_tokens: 100,
        temperature: 0.7,
      };
      const key1 = cache.generateCacheKey(requestData1);
      const key2 = cache.generateCacheKey(requestData2);
      expect(key1).not.toBe(key2);
    });

    it('should return different keys when messages differ', () => {
      const requestData1 = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'hello' }],
        max_tokens: 100,
        temperature: 0.7,
      };
      const requestData2 = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'world' }],
        max_tokens: 100,
        temperature: 0.7,
      };
      const key1 = cache.generateCacheKey(requestData1);
      const key2 = cache.generateCacheKey(requestData2);
      expect(key1).not.toBe(key2);
    });
  });

  describe('TTL expiration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return undefined after TTL expires', () => {
      cache.set('ttlKey', 'ttlValue', 0.1);
      expect(cache.get('ttlKey')).toBe('ttlValue');
      jest.advanceTimersByTime(150);
      expect(cache.get('ttlKey')).toBeUndefined();
    });

    it('should still return value before TTL expires', () => {
      cache.set('ttlKey', 'ttlValue', 0.1);
      jest.advanceTimersByTime(50);
      expect(cache.get('ttlKey')).toBe('ttlValue');
    });
  });
});
