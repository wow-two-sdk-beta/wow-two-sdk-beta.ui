import { describe, expect, it, vi } from 'vitest';

import { Equality } from './Equality';

describe('Equality.strictEquals', () => {
  const ref = { id: 1 };

  const cases: ReadonlyArray<[desc: string, a: unknown, b: unknown, expected: boolean]> = [
    ['equal primitives', 1, 1, true],
    ['unequal primitives', 1, 2, false],
    ['equal strings', 'x', 'x', true],
    ['NaN vs NaN is equal (Object.is)', Number.NaN, Number.NaN, true],
    ['+0 vs -0 is not equal (Object.is)', 0, -0, false],
    ['same object reference', ref, ref, true],
    ['structurally equal objects are not equal', { id: 1 }, { id: 1 }, false],
    ['null vs null', null, null, true],
    ['null vs undefined', null, undefined, false],
  ];

  it.each(cases)('%s', (_desc, a, b, expected) => {
    expect(Equality.strictEquals(a, b)).toBe(expected);
  });
});

describe('Equality.referenceEquals', () => {
  const ref = { id: 1 };

  const cases: ReadonlyArray<[desc: string, a: unknown, b: unknown, expected: boolean]> = [
    ['equal primitives', 1, 1, true],
    ['unequal primitives', 1, 2, false],
    ['NaN vs NaN is NOT equal (plain ===)', Number.NaN, Number.NaN, false],
    ['+0 vs -0 IS equal (plain ===)', 0, -0, true],
    ['same object reference', ref, ref, true],
    ['structurally equal objects are not equal', { id: 1 }, { id: 1 }, false],
  ];

  it.each(cases)('%s', (_desc, a, b, expected) => {
    expect(Equality.referenceEquals(a, b)).toBe(expected);
  });
});

describe('Equality.byKey', () => {
  interface Item {
    id: number;
    name: string;
  }

  const byId = Equality.byKey<Item, number>((item) => item.id);

  it('equal when the extracted keys match, ignoring other fields', () => {
    expect(byId({ id: 1, name: 'a' }, { id: 1, name: 'b' })).toBe(true);
  });

  it('unequal when the extracted keys differ', () => {
    expect(byId({ id: 1, name: 'a' }, { id: 2, name: 'a' })).toBe(false);
  });

  it('compares keys with Object.is — NaN keys are equal', () => {
    const byValue = Equality.byKey<{ value: number }>((item) => item.value);
    expect(byValue({ value: Number.NaN }, { value: Number.NaN })).toBe(true);
  });

  it('compares keys with Object.is — +0 and -0 keys are not equal', () => {
    const byValue = Equality.byKey<{ value: number }>((item) => item.value);
    expect(byValue({ value: 0 }, { value: -0 })).toBe(false);
  });

  it('calls the extractor once per operand', () => {
    const extract = vi.fn((item: Item) => item.id);
    Equality.byKey(extract)({ id: 1, name: 'a' }, { id: 1, name: 'b' });
    expect(extract).toHaveBeenCalledTimes(2);
  });
});

describe('Equality.shallowEquals', () => {
  const nested = { deep: true };

  const cases: ReadonlyArray<
    [desc: string, a: Record<string, unknown>, b: Record<string, unknown>, expected: boolean]
  > = [
    ['empty objects', {}, {}, true],
    ['equal flat keys/values', { a: 1, b: 'x' }, { a: 1, b: 'x' }, true],
    ['key order is irrelevant', { a: 1, b: 2 }, { b: 2, a: 1 }, true],
    ['differing value', { a: 1 }, { a: 2 }, false],
    ['extra key in b', { a: 1 }, { a: 1, b: 2 }, false],
    ['extra key in a', { a: 1, b: 2 }, { a: 1 }, false],
    ['same key count but different key names', { a: undefined }, { b: undefined }, false],
    ['NaN values are equal (Object.is)', { a: Number.NaN }, { a: Number.NaN }, true],
    ['+0 vs -0 values are not equal (Object.is)', { a: 0 }, { a: -0 }, false],
    ['same nested reference', { n: nested }, { n: nested }, true],
    [
      'structurally equal nested objects are not equal (shallow, not deep)',
      { n: { deep: true } },
      { n: { deep: true } },
      false,
    ],
  ];

  it.each(cases)('%s', (_desc, a, b, expected) => {
    expect(Equality.shallowEquals(a, b)).toBe(expected);
  });

  it('same reference short-circuits to true', () => {
    const obj = { a: 1 };
    expect(Equality.shallowEquals(obj, obj)).toBe(true);
  });

  it('one null operand is false; both null are equal (Object.is short-circuit)', () => {
    const nil = null as unknown as Record<string, unknown>;
    expect(Equality.shallowEquals(nil, { a: 1 })).toBe(false);
    expect(Equality.shallowEquals({ a: 1 }, nil)).toBe(false);
    expect(Equality.shallowEquals(nil, nil)).toBe(true);
  });
});
