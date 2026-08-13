import { describe, expect, it } from 'vitest';
import { cn, compareStrings, dataAttr, Equality } from '@src/foundation/utils';

/*
 * Smoke depth, `unit` project (node): the four `foundation/utils` helpers every other layer
 * calls on every render. Nothing here is exhaustive — one assertion per defining contract,
 * enough that a port regression in the layer below everything surfaces here first.
 */

describe('cn', () => {
  it('resolves a tailwind conflict last-wins rather than concatenating', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('drops falsy class values', () => {
    expect(cn('flex', false, undefined, null, 'gap-2')).toBe('flex gap-2');
  });
});

describe('dataAttr', () => {
  /*
   * The whole point: `true` becomes the empty string so the attribute RENDERS bare
   * (`data-disabled`), and `false` becomes `undefined` so Vue omits it. Returning `'false'`
   * would leave every `[data-disabled]` selector matching an enabled control.
   */
  it('renders a present flag bare and omits an absent one', () => {
    expect(dataAttr(true)).toBe('');
    expect(dataAttr(false)).toBeUndefined();
    expect(dataAttr(undefined)).toBeUndefined();
  });
});

describe('Equality', () => {
  it('compares records one level deep', () => {
    expect(Equality.shallowEquals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(Equality.shallowEquals({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('strictEquals is reference equality, not structural', () => {
    const value = { a: 1 };
    expect(Equality.strictEquals(value, value)).toBe(true);
    expect(Equality.strictEquals({ a: 1 }, { a: 1 })).toBe(false);
  });
});

describe('compareStrings', () => {
  /* The one cached, numeric-aware collator — the reason no sibling slice ships a comparator. */
  it('orders embedded numbers numerically, not lexically', () => {
    expect(['item10', 'item2'].sort(compareStrings)).toEqual(['item2', 'item10']);
  });
});
