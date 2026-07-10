import { describe, expect, it } from 'vitest';

import { deepEqual } from './DeepEqual';

describe('deepEqual', () => {
  it('compares primitives (NaN-safe)', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'b')).toBe(false);
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it('compares plain objects and arrays structurally', () => {
    expect(deepEqual({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual([{ x: 1 }], [{ x: 1 }])).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual([], {})).toBe(false);
  });

  it('compares Date by timestamp', () => {
    expect(deepEqual(new Date(1000), new Date(1000))).toBe(true);
    expect(deepEqual(new Date(1000), new Date(2000))).toBe(false);
    expect(deepEqual(new Date(1000), 1000)).toBe(false);
  });
});
