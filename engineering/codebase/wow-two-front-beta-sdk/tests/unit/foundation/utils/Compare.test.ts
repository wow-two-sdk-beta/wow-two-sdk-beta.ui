import { describe, expect, it } from 'vitest';
import { compareStrings, createCollator } from '@src/foundation/utils/Compare';

describe('compareStrings', () => {
  it('is numeric-aware — "item 2" sorts before "item 10"', () => {
    expect(compareStrings('item 2', 'item 10')).toBeLessThan(0);
    expect(['item 10', 'item 2', 'item 1'].sort(compareStrings)).toEqual(['item 1', 'item 2', 'item 10']);
  });

  it('orders equal strings as 0', () => {
    expect(compareStrings('a', 'a')).toBe(0);
  });
});

describe('createCollator', () => {
  it('caches by locale + options', () => {
    expect(createCollator('en')).toBe(createCollator('en'));
    expect(createCollator('en')).not.toBe(createCollator('de'));
  });

  it('honors option overrides — sensitivity:base is case-insensitive', () => {
    const ci = createCollator(undefined, { sensitivity: 'base' });
    expect(ci.compare('A', 'a')).toBe(0);
  });
});
