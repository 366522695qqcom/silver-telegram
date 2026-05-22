const { selectApiKey, getApiKeyCount, getFirstApiKey, resetCounters } = require('../keyRotation');

beforeEach(() => {
  resetCounters();
});

describe('selectApiKey', () => {
  test('single key returns that key', () => {
    expect(selectApiKey('p1', 'sk-abc')).toBe('sk-abc');
  });

  test('multiple keys rotate round-robin', () => {
    const results = [];
    for (let i = 0; i < 6; i++) {
      results.push(selectApiKey('p1', 'sk-a,sk-b,sk-c'));
    }
    expect(results).toEqual(['sk-a', 'sk-b', 'sk-c', 'sk-a', 'sk-b', 'sk-c']);
  });

  test('different providers have independent counters', () => {
    expect(selectApiKey('p1', 'sk-a,sk-b')).toBe('sk-a');
    expect(selectApiKey('p1', 'sk-a,sk-b')).toBe('sk-b');
    expect(selectApiKey('p2', 'sk-x,sk-y')).toBe('sk-x');
    expect(selectApiKey('p2', 'sk-x,sk-y')).toBe('sk-y');
    expect(selectApiKey('p1', 'sk-a,sk-b')).toBe('sk-a');
  });

  test('null input returns null', () => {
    expect(selectApiKey('p1', null)).toBeNull();
  });

  test('empty string returns empty string', () => {
    expect(selectApiKey('p1', '')).toBe('');
  });

  test('keys with spaces are trimmed and rotate correctly', () => {
    const keys = 'sk-a , sk-b , sk-c';
    expect(selectApiKey('p1', keys)).toBe('sk-a');
    expect(selectApiKey('p1', keys)).toBe('sk-b');
    expect(selectApiKey('p1', keys)).toBe('sk-c');
  });

  test('trailing commas: empty strings are filtered out', () => {
    const keys = 'sk-a,sk-b,';
    expect(selectApiKey('p1', keys)).toBe('sk-a');
    expect(selectApiKey('p1', keys)).toBe('sk-b');
    expect(selectApiKey('p1', keys)).toBe('sk-a');
  });
});

describe('getApiKeyCount', () => {
  test('comma-separated keys with spaces returns correct count', () => {
    expect(getApiKeyCount('sk-a, sk-b,sk-c')).toBe(3);
  });

  test('single key returns 1', () => {
    expect(getApiKeyCount('sk-single')).toBe(1);
  });

  test('null returns 0', () => {
    expect(getApiKeyCount(null)).toBe(0);
  });

  test('empty string returns 0', () => {
    expect(getApiKeyCount('')).toBe(0);
  });
});

describe('getFirstApiKey', () => {
  test('returns first key from comma-separated list', () => {
    expect(getFirstApiKey('sk-a,sk-b,sk-c')).toBe('sk-a');
  });

  test('single key returns that key', () => {
    expect(getFirstApiKey('sk-single')).toBe('sk-single');
  });

  test('null returns null', () => {
    expect(getFirstApiKey(null)).toBeNull();
  });

  test('empty string returns empty string', () => {
    expect(getFirstApiKey('')).toBe('');
  });
});
