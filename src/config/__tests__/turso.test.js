const { extractTursoValue, convertTursoRows, toTursoValue } = require('../turso');

describe('extractTursoValue', () => {
  test('integer type with value "0" returns number 0', () => {
    expect(extractTursoValue({ type: 'integer', value: '0' })).toBe(0);
  });

  test('integer type with value "1" returns number 1', () => {
    expect(extractTursoValue({ type: 'integer', value: '1' })).toBe(1);
  });

  test('float type returns Number value', () => {
    expect(extractTursoValue({ type: 'float', value: 3.14 })).toBeCloseTo(3.14);
  });

  test('null input returns null', () => {
    expect(extractTursoValue(null)).toBeNull();
  });

  test('null type returns null', () => {
    expect(extractTursoValue({ type: 'null' })).toBeNull();
  });

  test('undefined input returns null', () => {
    expect(extractTursoValue(undefined)).toBeNull();
  });

  test('blob type returns Buffer from base64', () => {
    const result = extractTursoValue({ type: 'blob', base64: 'SGVsbG8=' });
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result).toEqual(Buffer.from('SGVsbG8=', 'base64'));
  });

  test('text type returns string value', () => {
    expect(extractTursoValue({ type: 'text', value: 'hello' })).toBe('hello');
  });

  test('text type with null value returns null', () => {
    expect(extractTursoValue({ type: 'text', value: null })).toBeNull();
  });
});

describe('convertTursoRows', () => {
  test('converts cols and rows into objects', () => {
    const cols = [{ name: 'id' }, { name: 'enabled' }];
    const rows = [[{ type: 'text', value: 'abc' }, { type: 'integer', value: '1' }]];
    const result = convertTursoRows(cols, rows);
    expect(result).toEqual([{ id: 'abc', enabled: 1 }]);
  });

  test('empty rows returns empty array', () => {
    const cols = [{ name: 'id' }];
    const result = convertTursoRows(cols, []);
    expect(result).toEqual([]);
  });

  test('null cols returns empty array', () => {
    const result = convertTursoRows(null, []);
    expect(result).toEqual([]);
  });

  test('null rows returns empty array', () => {
    const result = convertTursoRows([{ name: 'id' }], null);
    expect(result).toEqual([]);
  });

  test('null cols and null rows returns empty array', () => {
    const result = convertTursoRows(null, null);
    expect(result).toEqual([]);
  });
});

describe('toTursoValue', () => {
  test('null returns { type: "null" }', () => {
    expect(toTursoValue(null)).toEqual({ type: 'null' });
  });

  test('undefined returns { type: "null" }', () => {
    expect(toTursoValue(undefined)).toEqual({ type: 'null' });
  });

  test('integer number returns { type: "integer", value: string }', () => {
    expect(toTursoValue(42)).toEqual({ type: 'integer', value: '42' });
  });

  test('negative integer returns { type: "integer", value: string }', () => {
    expect(toTursoValue(-7)).toEqual({ type: 'integer', value: '-7' });
  });

  test('zero returns { type: "integer", value: "0" }', () => {
    expect(toTursoValue(0)).toEqual({ type: 'integer', value: '0' });
  });

  test('float number returns { type: "float", value: number }', () => {
    expect(toTursoValue(3.14)).toEqual({ type: 'float', value: 3.14 });
  });

  test('string returns { type: "text", value: string }', () => {
    expect(toTursoValue('hello')).toEqual({ type: 'text', value: 'hello' });
  });

  test('Buffer returns { type: "blob", base64: ... }', () => {
    const buf = Buffer.from('Hello');
    const result = toTursoValue(buf);
    expect(result).toEqual({ type: 'blob', base64: buf.toString('base64') });
  });
});
