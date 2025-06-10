import { deepMerge } from '@/lib/utils';

describe('deepMerge', () => {
  it('should merge two simple objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('should merge nested objects', () => {
    const target = { a: 1, b: { x: 10, y: 20 } };
    const source = { b: { y: 30, z: 40 }, c: 3 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: { x: 10, y: 30, z: 40 }, c: 3 });
  });

  it('should handle array replacement', () => {
    const target = { a: 1, b: [1, 2] };
    const source = { b: [3, 4], c: 3 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: [3, 4], c: 3 });
  });

  it('should handle array replacement when target does not have the array', () => {
    const target = { a: 1 };
    const source = { b: [3, 4], c: 3 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: [3, 4], c: 3 });
  });

  it('should handle array replacement when source array is empty', () => {
    const target = { a: 1, b: [1, 2] };
    const source = { b: [] };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: [] });
  });

  it('should merge with an empty target object', () => {
    const target = {};
    const source = { a: 1, b: { x: 10 } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: { x: 10 } });
  });

  it('should merge with an empty source object', () => {
    const target = { a: 1, b: { x: 10 } };
    const source = {};
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: { x: 10 } });
  });

  it('should merge objects with different types of values', () => {
    const target = { a: 1, b: 'hello', d: true, e: null };
    const source = { b: 'world', c: 123, d: false, f: { nested: 'test' } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: 'world', c: 123, d: false, e: null, f: { nested: 'test' } });
  });

  it('should not modify the original target object', () => {
    const target = { a: 1, b: { x: 10, y: 20 } };
    const source = { b: { y: 30, z: 40 }, c: 3 };
    deepMerge(target, source);
    expect(target).toEqual({ a: 1, b: { x: 10, y: 20 } });
  });

  it('should not modify the original source object', () => {
    const target = { a: 1, b: { x: 10, y: 20 } };
    const source = { b: { y: 30, z: 40 }, c: 3 };
    deepMerge(target, source);
    expect(source).toEqual({ b: { y: 30, z: 40 }, c: 3 });
  });

  it('should handle merging when source property is explicitly undefined', () => {
    const target = { a: 1, b: 2 };
    const source = { b: undefined, c: 3 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: undefined, c: 3 });
  });

  it('should handle merging when target property is null and source is an object', () => {
    const target = { a: 1, b: null };
    const source = { b: { x: 10 } };
    // In the current implementation, if target[key] is not an object, source[key] overwrites it.
    // If isObject(target[key]) is false, it will be overwritten. Null is not an object.
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: { x: 10 } });
  });

  it('should merge when source is a partial type of target', () => {
    interface ComplexObject {
      id: number;
      name?: string;
      details: {
        version: number;
        tags?: string[];
      };
      config?: {
        enabled: boolean;
        value?: number | null;
      } | null;
    }

    const target: ComplexObject = {
      id: 1,
      name: 'Target',
      details: { version: 1, tags: ['initial'] },
      config: { enabled: true, value: 100 }
    };

    const source: Partial<ComplexObject> = {
      name: 'Source',
      details: { version: 2 }, // Partial update for details
      config: null // Nullify config
    };

    const result = deepMerge(target, source);
    expect(result).toEqual({
      id: 1,
      name: 'Source', // Overwritten
      details: { version: 2, tags: ['initial'] }, // Merged
      config: null // Overwritten with null
    });
  });
});
