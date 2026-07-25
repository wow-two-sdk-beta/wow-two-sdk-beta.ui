import { describe, expect, it } from 'vitest';

import {
  arrayShallowEqual,
  buildTree,
  chunk,
  deepEqual,
  difference,
  entriesToRecord,
  findInTree,
  flattenTree,
  groupBy,
  insertAt,
  intersection,
  invertRecord,
  keyBy,
  mapTree,
  mapValues,
  move,
  omitKeys,
  partition,
  pickKeys,
  range,
  recordToEntries,
  removeAt,
  replaceAt,
  shallowEqual,
  symmetricDifference,
  toggleItem,
  union,
  unique,
  unzip,
  zip,
} from '@src/foundation/collections';

// Node project — pure functions, no DOM. Two things are tested everywhere rather than spot-checked, because
// both are contracts a caller relies on silently: the input is never mutated (asserted against a snapshot
// taken before the call, not by eyeballing the output), and an empty input is a valid input.
//
// The rest of the file concentrates on the cases where these break in practice: `move`'s index arithmetic in
// both directions, `deepEqual` on the container types and on structures that loop, and `buildTree` fed the
// two malformed shapes a server actually sends (a missing parent, and a parent chain that cycles).

/** A row shape reused by the keyed/tree suites. */
interface Row {
  readonly id: string;
  readonly parentId: string | null;
}

/** Reads a node tree back as `id` strings so assertions stay readable. */
function idsOf(rows: ReadonlyArray<{ readonly id: string }>): string[] {
  return rows.map((row) => row.id);
}

// ---------------------------------------------------------------------------------------------------
// Arrays
// ---------------------------------------------------------------------------------------------------

describe('unique', () => {
  it('keeps the first occurrence and the input order', () => {
    expect(unique([3, 1, 3, 2, 1])).toEqual([3, 1, 2]);
  });

  it('de-duplicates NaN (Set/SameValueZero semantics)', () => {
    expect(unique([Number.NaN, Number.NaN])).toEqual([Number.NaN]);
  });

  it('de-duplicates by an extracted key, keeping the first item instance', () => {
    const first = { id: 'a', version: 1 };
    const second = { id: 'a', version: 2 };
    const result = unique([first, second], (row) => row.id);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(first);
  });

  it('does not mutate the input', () => {
    const items = [1, 1, 2];
    unique(items);
    expect(items).toEqual([1, 1, 2]);
  });
});

describe('groupBy', () => {
  it('preserves first-seen key order and within-group order', () => {
    const items = ['delta', 'echo', 'alpha', 'bravo', 'ash'];
    const groups = groupBy(items, (word) => word[0] ?? '');
    // 'd' was seen first, then 'e', then 'a', then 'b' — NOT alphabetical, NOT insertion-sorted.
    expect([...groups.keys()]).toEqual(['d', 'e', 'a', 'b']);
    expect(groups.get('a')).toEqual(['alpha', 'ash']);
  });

  it('keeps non-string keys at their real type', () => {
    const groups = groupBy([1, 2, 3, 4], (value) => value % 2 === 0);
    expect(groups.get(true)).toEqual([2, 4]);
    expect(groups.get(false)).toEqual([1, 3]);
  });

  it('does not reorder integer-like keys the way a plain object would', () => {
    const groups = groupBy(['b', '2', 'a', '1'], (value) => value);
    expect([...groups.keys()]).toEqual(['b', '2', 'a', '1']);
  });

  it('does not mutate the input', () => {
    const items = ['a', 'b'];
    groupBy(items, (value) => value);
    expect(items).toEqual(['a', 'b']);
  });
});

describe('partition', () => {
  it('splits in one pass, preserving order in both halves', () => {
    const [even, odd] = partition([1, 2, 3, 4, 5], (value) => value % 2 === 0);
    expect(even).toEqual([2, 4]);
    expect(odd).toEqual([1, 3, 5]);
  });

  it('passes the index to the predicate', () => {
    const [firstTwo, rest] = partition(['a', 'b', 'c'], (_, index) => index < 2);
    expect(firstTwo).toEqual(['a', 'b']);
    expect(rest).toEqual(['c']);
  });

  it('does not mutate the input', () => {
    const items = [1, 2, 3];
    partition(items, (value) => value > 1);
    expect(items).toEqual([1, 2, 3]);
  });
});

describe('chunk', () => {
  it('slices into groups with a short final group', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns one group when the size exceeds the length', () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
  });

  it('throws on a non-positive or fractional size rather than looping forever', () => {
    expect(() => chunk([1, 2], 0)).toThrow(RangeError);
    expect(() => chunk([1, 2], -1)).toThrow(RangeError);
    expect(() => chunk([1, 2], 1.5)).toThrow(RangeError);
  });

  it('does not mutate the input', () => {
    const items = [1, 2, 3];
    chunk(items, 2);
    expect(items).toEqual([1, 2, 3]);
  });
});

describe('move', () => {
  it('moves an item FORWARD to the slot the cursor is over', () => {
    // Remove index 0 → [b, c, d], re-insert at 2 → [b, c, a, d].
    expect(move(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item BACKWARD', () => {
    // Remove index 3 → [a, b, c], re-insert at 1 → [a, d, b, c].
    expect(move(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('moves to the last slot', () => {
    expect(move(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves to the first slot', () => {
    expect(move(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('is its own inverse for a neighbour swap', () => {
    expect(move(move(['a', 'b', 'c'], 0, 1), 1, 0)).toEqual(['a', 'b', 'c']);
  });

  it('clamps an over-drag past either end instead of dropping the item', () => {
    expect(move(['a', 'b', 'c'], 0, 99)).toEqual(['b', 'c', 'a']);
    expect(move(['a', 'b', 'c'], 2, -99)).toEqual(['c', 'a', 'b']);
    expect(move(['a', 'b', 'c'], 99, 0)).toEqual(['c', 'a', 'b']);
  });

  it('returns a fresh copy for a no-op move', () => {
    const items = ['a', 'b', 'c'];
    const result = move(items, 1, 1);
    expect(result).toEqual(items);
    expect(result).not.toBe(items);
  });

  it('does not mutate the input', () => {
    const items = ['a', 'b', 'c', 'd'];
    const result = move(items, 0, 3);
    expect(items).toEqual(['a', 'b', 'c', 'd']);
    expect(result).not.toBe(items);
  });
});

describe('insertAt', () => {
  it('inserts at an index', () => {
    expect(insertAt(['a', 'c'], 1, 'b')).toEqual(['a', 'b', 'c']);
  });

  it('appends at length and prepends on a negative index', () => {
    expect(insertAt(['a'], 1, 'b')).toEqual(['a', 'b']);
    expect(insertAt(['a'], 99, 'b')).toEqual(['a', 'b']);
    expect(insertAt(['a'], -5, 'b')).toEqual(['b', 'a']);
  });

  it('does not mutate the input', () => {
    const items = ['a', 'c'];
    const result = insertAt(items, 1, 'b');
    expect(items).toEqual(['a', 'c']);
    expect(result).not.toBe(items);
  });
});

describe('removeAt', () => {
  it('removes the item at an index', () => {
    expect(removeAt(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
  });

  it('removes nothing for an out-of-range index but still copies', () => {
    const items = ['a', 'b'];
    expect(removeAt(items, 99)).toEqual(['a', 'b']);
    expect(removeAt(items, -1)).toEqual(['a', 'b']);
    expect(removeAt(items, 99)).not.toBe(items);
  });

  it('does not mutate the input', () => {
    const items = ['a', 'b', 'c'];
    const result = removeAt(items, 0);
    expect(items).toEqual(['a', 'b', 'c']);
    expect(result).not.toBe(items);
  });
});

describe('replaceAt', () => {
  it('replaces the item at an index', () => {
    expect(replaceAt(['a', 'b', 'c'], 1, 'B')).toEqual(['a', 'B', 'c']);
  });

  it('never grows the array or punches a hole for an out-of-range index', () => {
    expect(replaceAt(['a'], 5, 'z')).toEqual(['a']);
    expect(replaceAt(['a'], -1, 'z')).toEqual(['a']);
  });

  it('does not mutate the input', () => {
    const items = ['a', 'b'];
    const result = replaceAt(items, 0, 'A');
    expect(items).toEqual(['a', 'b']);
    expect(result).not.toBe(items);
  });
});

describe('toggleItem', () => {
  it('appends when absent and removes when present, without an equality fn', () => {
    expect(toggleItem(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
    expect(toggleItem(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('uses reference equality by default, so an equal-but-distinct object is ADDED', () => {
    const existing = { id: 1 };
    const result = toggleItem([existing], { id: 1 });
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(existing);
  });

  it('removes the match when given an equality fn', () => {
    const result = toggleItem([{ id: 1 }, { id: 2 }], { id: 1 }, (a, b) => a.id === b.id);
    expect(result.map((row) => row.id)).toEqual([2]);
  });

  it('removes EVERY match, so a list holding duplicates toggles all of them off', () => {
    expect(toggleItem(['a', 'a', 'b'], 'a')).toEqual(['b']);
  });

  it('treats NaN as present (Object.is, not ===)', () => {
    expect(toggleItem([Number.NaN, 1], Number.NaN)).toEqual([1]);
  });

  it('does not mutate the input in either direction', () => {
    const items = ['a', 'b'];
    const added = toggleItem(items, 'c');
    const removed = toggleItem(items, 'a');
    expect(items).toEqual(['a', 'b']);
    expect(added).not.toBe(items);
    expect(removed).not.toBe(items);
  });
});

describe('zip / unzip', () => {
  it('pairs positionally', () => {
    expect(zip([1, 2], ['a', 'b'])).toEqual([
      [1, 'a'],
      [2, 'b'],
    ]);
  });

  it('stops at the shorter list rather than padding with undefined', () => {
    expect(zip([1, 2, 3], ['a'])).toEqual([[1, 'a']]);
    expect(zip([1], ['a', 'b', 'c'])).toEqual([[1, 'a']]);
  });

  it('round-trips through unzip', () => {
    const first = [1, 2, 3];
    const second = ['a', 'b', 'c'];
    const [backFirst, backSecond] = unzip(zip(first, second));
    expect(backFirst).toEqual(first);
    expect(backSecond).toEqual(second);
  });

  it('does not mutate its inputs', () => {
    const first = [1, 2];
    const second = ['a', 'b'];
    zip(first, second);
    unzip([
      [1, 'a'],
      [2, 'b'],
    ]);
    expect(first).toEqual([1, 2]);
    expect(second).toEqual(['a', 'b']);
  });
});

describe('range', () => {
  it('excludes the end bound', () => {
    expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
    expect(range(2, 5)).toEqual([2, 3, 4]);
    expect(range(0, 5)).toHaveLength(5);
  });

  it('counts down on a negative step', () => {
    expect(range(5, 0, -1)).toEqual([5, 4, 3, 2, 1]);
  });

  it('honours a step larger than one', () => {
    expect(range(0, 10, 3)).toEqual([0, 3, 6, 9]);
  });

  it('returns empty when the step points away from the end', () => {
    expect(range(0, 5, -1)).toEqual([]);
    expect(range(5, 0, 1)).toEqual([]);
    expect(range(3, 3)).toEqual([]);
  });

  it('throws rather than looping forever on a zero step or a non-finite bound', () => {
    expect(() => range(0, 5, 0)).toThrow(RangeError);
    expect(() => range(0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => range(Number.NaN, 5)).toThrow(RangeError);
    expect(() => range(0, 5, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------------------------------
// Set relations
// ---------------------------------------------------------------------------------------------------

describe('union', () => {
  it('takes all of the first list, then what is new in the second', () => {
    expect(union([1, 2], [2, 3])).toEqual([1, 2, 3]);
  });

  it('de-duplicates within a single input', () => {
    expect(union([1, 1, 2], [])).toEqual([1, 2]);
  });

  it('keeps the LEFT item when two share a key', () => {
    const left = { id: 'a', from: 'left' };
    const right = { id: 'a', from: 'right' };
    const result = union([left], [right], (row) => row.id);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(left);
  });

  it('does not mutate its inputs', () => {
    const first = [1, 2];
    const second = [2, 3];
    union(first, second);
    expect(first).toEqual([1, 2]);
    expect(second).toEqual([2, 3]);
  });
});

describe('intersection', () => {
  it('keeps only shared keys, in the first list order', () => {
    expect(intersection([3, 1, 2], [2, 3])).toEqual([3, 2]);
  });

  it('matches by key function across distinct object instances', () => {
    const result = intersection(
      [{ id: 'a' }, { id: 'b' }],
      [{ id: 'b' }],
      (row) => row.id,
    );
    expect(result.map((row) => row.id)).toEqual(['b']);
  });

  it('de-duplicates the result', () => {
    expect(intersection([1, 1, 2], [1])).toEqual([1]);
  });

  it('does not mutate its inputs', () => {
    const first = [1, 2];
    const second = [2];
    intersection(first, second);
    expect(first).toEqual([1, 2]);
    expect(second).toEqual([2]);
  });
});

describe('difference', () => {
  it('subtracts the second list from the first', () => {
    expect(difference([1, 2, 3], [2])).toEqual([1, 3]);
  });

  it('is asymmetric', () => {
    expect(difference([1, 2], [2, 3])).toEqual([1]);
    expect(difference([2, 3], [1, 2])).toEqual([3]);
  });

  it('matches by key function', () => {
    const result = difference([{ id: 'a' }, { id: 'b' }], [{ id: 'a' }], (row) => row.id);
    expect(result.map((row) => row.id)).toEqual(['b']);
  });

  it('does not mutate its inputs', () => {
    const first = [1, 2];
    const second = [2];
    difference(first, second);
    expect(first).toEqual([1, 2]);
    expect(second).toEqual([2]);
  });
});

describe('symmetricDifference', () => {
  it('reports first-only entries then second-only entries', () => {
    expect(symmetricDifference([1, 2, 3], [3, 4])).toEqual([1, 2, 4]);
  });

  it('is empty for equal sets', () => {
    expect(symmetricDifference([1, 2], [2, 1])).toEqual([]);
  });

  it('matches by key function', () => {
    const result = symmetricDifference(
      [{ id: 'a' }, { id: 'b' }],
      [{ id: 'b' }, { id: 'c' }],
      (row) => row.id,
    );
    expect(result.map((row) => row.id)).toEqual(['a', 'c']);
  });

  it('does not mutate its inputs', () => {
    const first = [1, 2];
    const second = [2, 3];
    symmetricDifference(first, second);
    expect(first).toEqual([1, 2]);
    expect(second).toEqual([2, 3]);
  });
});

// ---------------------------------------------------------------------------------------------------
// Keyed collections
// ---------------------------------------------------------------------------------------------------

describe('keyBy', () => {
  it('indexes by an extracted key in first-seen order', () => {
    const rows = [
      { id: 'b', n: 1 },
      { id: 'a', n: 2 },
    ];
    const index = keyBy(rows, (row) => row.id);
    expect([...index.keys()]).toEqual(['b', 'a']);
    expect(index.get('a')).toBe(rows[1]);
  });

  it('lets the LAST item win on a duplicate key', () => {
    const rows = [
      { id: 'a', version: 1 },
      { id: 'a', version: 2 },
    ];
    expect(keyBy(rows, (row) => row.id).get('a')).toBe(rows[1]);
  });

  it('does not mutate the input', () => {
    const rows = [{ id: 'a' }];
    keyBy(rows, (row) => row.id);
    expect(rows).toHaveLength(1);
  });
});

describe('mapValues', () => {
  it('transforms a Map, keeping keys and their order', () => {
    const source = new Map([
      ['b', 1],
      ['a', 2],
    ]);
    const result = mapValues(source, (value) => value * 10);
    expect([...result.entries()]).toEqual([
      ['b', 10],
      ['a', 20],
    ]);
    expect([...source.entries()]).toEqual([
      ['b', 1],
      ['a', 2],
    ]);
  });

  it('transforms a record, keeping keys', () => {
    const source = { a: 1, b: 2 };
    expect(mapValues(source, (value) => value * 2)).toEqual({ a: 2, b: 4 });
    expect(source).toEqual({ a: 1, b: 2 });
  });

  it('passes the key to the mapper in both forms', () => {
    expect(mapValues({ a: 1 }, (value, key) => `${key}:${value}`)).toEqual({ a: 'a:1' });
    expect(mapValues(new Map([['a', 1]]), (value, key) => `${key}:${value}`).get('a')).toBe('a:1');
  });

  it('composes with groupBy', () => {
    const groups = groupBy(['aa', 'ab', 'bc'], (word) => word[0] ?? '');
    expect([...mapValues(groups, (rows) => rows.length).entries()]).toEqual([
      ['a', 2],
      ['b', 1],
    ]);
  });
});

describe('pickKeys', () => {
  it('copies only the named keys', () => {
    expect(pickKeys({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('SKIPS a key the source does not own rather than writing undefined', () => {
    const partial: { a?: number; b?: number } = { a: 1 };
    const picked = pickKeys(partial, ['a', 'b']);
    expect(Object.prototype.hasOwnProperty.call(picked, 'b')).toBe(false);
    expect(Object.keys(picked)).toEqual(['a']);
  });

  it('does not mutate the source', () => {
    const source = { a: 1, b: 2 };
    const picked = pickKeys(source, ['a']);
    expect(source).toEqual({ a: 1, b: 2 });
    expect(picked).not.toBe(source);
  });
});

describe('omitKeys', () => {
  it('copies everything except the named keys', () => {
    expect(omitKeys({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 });
  });

  it('does not mutate the source', () => {
    const source = { a: 1, b: 2 };
    const result = omitKeys(source, ['b']);
    expect(source).toEqual({ a: 1, b: 2 });
    expect(result).not.toBe(source);
  });
});

describe('entriesToRecord / recordToEntries', () => {
  it('collects entries into a record', () => {
    expect(
      entriesToRecord([
        ['a', 1],
        ['b', 2],
      ]),
    ).toEqual({ a: 1, b: 2 });
  });

  it('accepts any iterable, including a Map', () => {
    expect(entriesToRecord(new Map([['a', 1]]))).toEqual({ a: 1 });
  });

  it('lets the last pair win on a duplicate key', () => {
    expect(
      entriesToRecord([
        ['a', 1],
        ['a', 2],
      ]),
    ).toEqual({ a: 2 });
  });

  it('lists a record as entries', () => {
    expect(recordToEntries({ a: 1, b: 2 })).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  it('round-trips', () => {
    const source = { a: 1, b: 2 };
    expect(entriesToRecord(recordToEntries(source))).toEqual(source);
    expect(source).toEqual({ a: 1, b: 2 });
  });
});

describe('invertRecord', () => {
  it('swaps keys and values', () => {
    expect(invertRecord({ a: 'x', b: 'y' })).toEqual({ x: 'a', y: 'b' });
  });

  it('lets the LAST key win when two keys share a value', () => {
    expect(invertRecord({ a: 'x', b: 'x' })).toEqual({ x: 'b' });
  });

  it('does not mutate the source', () => {
    const source = { a: 'x' };
    invertRecord(source);
    expect(source).toEqual({ a: 'x' });
  });
});

// ---------------------------------------------------------------------------------------------------
// Structural equality
// ---------------------------------------------------------------------------------------------------

describe('arrayShallowEqual', () => {
  it('compares element references', () => {
    expect(arrayShallowEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(arrayShallowEqual([1, 2], [1, 3])).toBe(false);
  });

  it('rejects a length difference', () => {
    expect(arrayShallowEqual([1], [1, 2])).toBe(false);
  });

  it('treats NaN as equal to NaN', () => {
    expect(arrayShallowEqual([Number.NaN], [Number.NaN])).toBe(true);
  });

  it('does NOT look inside elements', () => {
    expect(arrayShallowEqual([{ a: 1 }], [{ a: 1 }])).toBe(false);
    const shared = { a: 1 };
    expect(arrayShallowEqual([shared], [shared])).toBe(true);
  });
});

describe('shallowEqual', () => {
  it('compares objects one level deep', () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('rejects a key-count difference', () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('does NOT recurse into nested objects', () => {
    expect(shallowEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false);
  });

  it('dispatches arrays to the array comparison', () => {
    expect(shallowEqual([1, 2], [1, 2])).toBe(true);
    expect(shallowEqual([1, 2], [2, 1])).toBe(false);
  });

  it('rejects a mismatched array/object pair', () => {
    expect(shallowEqual([1], { 0: 1 })).toBe(false);
  });

  it('handles primitives and null', () => {
    expect(shallowEqual(1, 1)).toBe(true);
    expect(shallowEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(shallowEqual(null, null)).toBe(true);
    expect(shallowEqual(null, {})).toBe(false);
    expect(shallowEqual(undefined, null)).toBe(false);
    expect(shallowEqual('a', 'b')).toBe(false);
  });
});

describe('deepEqual', () => {
  it('compares nested plain objects and arrays', () => {
    expect(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } })).toBe(true);
    expect(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 3] } })).toBe(false);
  });

  it('rejects an array/object mismatch and a length difference', () => {
    expect(deepEqual([1, 2], { 0: 1, 1: 2 })).toBe(false);
    expect(deepEqual([1], [1, 2])).toBe(false);
  });

  it('treats NaN as equal to NaN, nested too', () => {
    expect(deepEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(deepEqual({ v: Number.NaN }, { v: Number.NaN })).toBe(true);
    expect(deepEqual([Number.NaN], [Number.NaN])).toBe(true);
  });

  it('compares Date by timestamp', () => {
    expect(deepEqual(new Date(1_700_000_000_000), new Date(1_700_000_000_000))).toBe(true);
    expect(deepEqual(new Date(0), new Date(1))).toBe(false);
    expect(deepEqual(new Date(Number.NaN), new Date(Number.NaN))).toBe(true);
    expect(deepEqual(new Date(0), 0)).toBe(false);
  });

  it('compares RegExp by source and flags', () => {
    expect(deepEqual(/ab+/gi, /ab+/gi)).toBe(true);
    expect(deepEqual(/ab+/g, /ab+/i)).toBe(false);
  });

  it('compares Map by entries, ignoring insertion order', () => {
    expect(
      deepEqual(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
        new Map([
          ['b', 2],
          ['a', 1],
        ]),
      ),
    ).toBe(true);
    expect(deepEqual(new Map([['a', 1]]), new Map([['a', 2]]))).toBe(false);
    expect(deepEqual(new Map([['a', 1]]), new Map())).toBe(false);
  });

  it('compares Map values structurally', () => {
    expect(deepEqual(new Map([['a', { n: 1 }]]), new Map([['a', { n: 1 }]]))).toBe(true);
  });

  it('compares Map with OBJECT keys structurally', () => {
    expect(deepEqual(new Map([[{ id: 1 }, 'x']]), new Map([[{ id: 1 }, 'x']]))).toBe(true);
    expect(deepEqual(new Map([[{ id: 1 }, 'x']]), new Map([[{ id: 2 }, 'x']]))).toBe(false);
    expect(deepEqual(new Map([[{ id: 1 }, 'x']]), new Map([[{ id: 1 }, 'y']]))).toBe(false);
  });

  it('compares Set by members, ignoring order', () => {
    expect(deepEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
    expect(deepEqual(new Set([1, 2]), new Set([1, 3]))).toBe(false);
    expect(deepEqual(new Set([1]), new Set([1, 2]))).toBe(false);
  });

  it('compares Set members structurally, including failed probes before a match', () => {
    // Neither member hits by identity, and the first candidate probed for {n:1} is {n:2} — a failure that
    // must not poison the later successful match.
    expect(deepEqual(new Set([{ n: 1 }, { n: 2 }]), new Set([{ n: 2 }, { n: 1 }]))).toBe(true);
    expect(deepEqual(new Set([{ n: 1 }]), new Set([{ n: 9 }]))).toBe(false);
  });

  it('rejects mismatched container types', () => {
    expect(deepEqual(new Map(), new Set())).toBe(false);
    expect(deepEqual(new Set([1]), [1])).toBe(false);
    expect(deepEqual(new Map([['a', 1]]), { a: 1 })).toBe(false);
  });

  it('compares typed arrays byte-wise, and rejects a different constructor', () => {
    expect(deepEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
    expect(deepEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
    expect(deepEqual(new Uint8Array([1, 2]), new Uint8Array([1]))).toBe(false);
    expect(deepEqual(new Uint8Array([1, 2]), new Int8Array([1, 2]))).toBe(false);
    expect(deepEqual(new Float64Array([1.5]), new Float64Array([1.5]))).toBe(true);
  });

  it('compares ArrayBuffer by bytes', () => {
    expect(deepEqual(new Uint8Array([1, 2]).buffer, new Uint8Array([1, 2]).buffer)).toBe(true);
    expect(deepEqual(new Uint8Array([1, 2]).buffer, new Uint8Array([1, 3]).buffer)).toBe(false);
  });

  it('TERMINATES on a self-referential structure and reports equal', () => {
    const left: Record<string, unknown> = { name: 'node' };
    left.self = left;
    const right: Record<string, unknown> = { name: 'node' };
    right.self = right;
    expect(deepEqual(left, right)).toBe(true);
  }, 2000);

  it('TERMINATES on a self-referential structure and still sees a real difference', () => {
    const left: Record<string, unknown> = { name: 'left' };
    left.self = left;
    const right: Record<string, unknown> = { name: 'right' };
    right.self = right;
    expect(deepEqual(left, right)).toBe(false);
  }, 2000);

  it('TERMINATES on mutually circular arrays', () => {
    const leftInner: unknown[] = [];
    const leftOuter: unknown[] = [leftInner];
    leftInner.push(leftOuter);
    const rightInner: unknown[] = [];
    const rightOuter: unknown[] = [rightInner];
    rightInner.push(rightOuter);
    expect(deepEqual(leftOuter, rightOuter)).toBe(true);
  }, 2000);

  it('TERMINATES on a circular Map and a circular Set', () => {
    const leftMap = new Map<string, unknown>();
    leftMap.set('self', leftMap);
    const rightMap = new Map<string, unknown>();
    rightMap.set('self', rightMap);
    expect(deepEqual(leftMap, rightMap)).toBe(true);

    const leftSet = new Set<unknown>();
    leftSet.add(leftSet);
    const rightSet = new Set<unknown>();
    rightSet.add(rightSet);
    expect(deepEqual(leftSet, rightSet)).toBe(true);
  }, 2000);

  it('TERMINATES when the two cycles have different unrolled shapes but equal expansions', () => {
    const left: Record<string, unknown> = { name: 'n' };
    left.self = left;
    const rightTail: Record<string, unknown> = { name: 'n' };
    const right: Record<string, unknown> = { name: 'n', self: rightTail };
    rightTail.self = right;
    expect(deepEqual(left, right)).toBe(true);
  }, 2000);

  it('handles primitives without recursing', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(0, '0')).toBe(false);
    expect(deepEqual({ a: 1 }, null)).toBe(false);
  });

  it('does not mutate its inputs', () => {
    const left = { a: [1, 2], b: new Map([['k', 1]]) };
    const right = { a: [1, 2], b: new Map([['k', 1]]) };
    deepEqual(left, right);
    expect(left.a).toEqual([1, 2]);
    expect([...left.b.entries()]).toEqual([['k', 1]]);
    expect([...right.b.entries()]).toEqual([['k', 1]]);
  });
});

// ---------------------------------------------------------------------------------------------------
// Trees
// ---------------------------------------------------------------------------------------------------

describe('buildTree', () => {
  const accessors = {
    id: (row: Row) => row.id,
    parentId: (row: Row) => row.parentId,
  };

  it('nests a well-formed flat list, preserving input order at every level', () => {
    const rows: Row[] = [
      { id: 'a', parentId: null },
      { id: 'a2', parentId: 'a' },
      { id: 'b', parentId: null },
      { id: 'a1', parentId: 'a' },
      { id: 'a1x', parentId: 'a1' },
    ];
    const roots = buildTree(rows, accessors);
    expect(idsOf(roots.map((node) => node.item))).toEqual(['a', 'b']);
    expect(idsOf((roots[0]?.children ?? []).map((node) => node.item))).toEqual(['a2', 'a1']);
    expect(roots[0]?.children[1]?.children[0]?.item.id).toBe('a1x');
  });

  it('reuses the source item references rather than copying rows', () => {
    const rows: Row[] = [{ id: 'a', parentId: null }];
    expect(buildTree(rows, accessors)[0]?.item).toBe(rows[0]);
  });

  it('PROMOTES AN ORPHAN to a root when its parent is missing from the list', () => {
    const rows: Row[] = [
      { id: 'a', parentId: null },
      { id: 'lost', parentId: 'deleted-elsewhere' },
      { id: 'lostChild', parentId: 'lost' },
    ];
    const roots = buildTree(rows, accessors);
    expect(idsOf(roots.map((node) => node.item))).toEqual(['a', 'lost']);
    // The orphan is visible, and its own subtree still hangs off it — nothing is dropped.
    expect(roots[1]?.children[0]?.item.id).toBe('lostChild');
    expect(flattenTree(roots)).toHaveLength(3);
  });

  it('TERMINATES on a cyclic parent chain: every row ON the cycle becomes a root', () => {
    // a → b → c → a, plus d hanging off a.
    const rows: Row[] = [
      { id: 'a', parentId: 'b' },
      { id: 'b', parentId: 'c' },
      { id: 'c', parentId: 'a' },
      { id: 'd', parentId: 'a' },
    ];
    const roots = buildTree(rows, accessors);
    expect(idsOf(roots.map((node) => node.item))).toEqual(['a', 'b', 'c']);
    // `d` is only BELOW the cycle, so it keeps its parent and nests under the now-root `a`.
    expect(idsOf((roots[0]?.children ?? []).map((node) => node.item))).toEqual(['d']);
    expect(roots[1]?.children).toEqual([]);
    expect(roots[2]?.children).toEqual([]);
    // Nothing dropped, nothing duplicated.
    expect(idsOf(flattenTree(roots).map((node) => node.item)).sort()).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  }, 2000);

  it('TERMINATES on a row that is its own parent', () => {
    const rows: Row[] = [
      { id: 'x', parentId: 'x' },
      { id: 'y', parentId: 'x' },
    ];
    const roots = buildTree(rows, accessors);
    expect(idsOf(roots.map((node) => node.item))).toEqual(['x']);
    expect(idsOf((roots[0]?.children ?? []).map((node) => node.item))).toEqual(['y']);
  }, 2000);

  it('TERMINATES on a two-row cycle', () => {
    const rows: Row[] = [
      { id: 'p', parentId: 'q' },
      { id: 'q', parentId: 'p' },
    ];
    const roots = buildTree(rows, accessors);
    expect(idsOf(roots.map((node) => node.item))).toEqual(['p', 'q']);
  }, 2000);

  it('TERMINATES on duplicate ids without re-expanding the same child list', () => {
    const rows: Row[] = [
      { id: 'dup', parentId: null },
      { id: 'dup', parentId: 'dup' },
    ];
    const roots = buildTree(rows, accessors);
    expect(roots).toHaveLength(1);
    expect(flattenTree(roots).length).toBeLessThanOrEqual(2);
  }, 2000);

  it('does not mutate the input list or its rows', () => {
    const rows: Row[] = [
      { id: 'a', parentId: null },
      { id: 'b', parentId: 'a' },
    ];
    buildTree(rows, accessors);
    expect(rows).toEqual([
      { id: 'a', parentId: null },
      { id: 'b', parentId: 'a' },
    ]);
    expect(Object.prototype.hasOwnProperty.call(rows[0] ?? {}, 'children')).toBe(false);
  });
});

describe('flattenTree', () => {
  it('walks depth-first, pre-order', () => {
    const rows: Row[] = [
      { id: 'a', parentId: null },
      { id: 'a1', parentId: 'a' },
      { id: 'a1x', parentId: 'a1' },
      { id: 'a2', parentId: 'a' },
      { id: 'b', parentId: null },
    ];
    const roots = buildTree(rows, { id: (row) => row.id, parentId: (row) => row.parentId });
    expect(idsOf(flattenTree(roots).map((node) => node.item))).toEqual([
      'a',
      'a1',
      'a1x',
      'a2',
      'b',
    ]);
  });

  it('accepts a custom children key', () => {
    interface Menu {
      readonly label: string;
      readonly items?: readonly Menu[];
    }
    const menu: Menu[] = [{ label: 'file', items: [{ label: 'open' }] }, { label: 'edit' }];
    expect(flattenTree(menu, 'items').map((node) => node.label)).toEqual([
      'file',
      'open',
      'edit',
    ]);
  });

  it('treats a missing or non-array children value as a leaf', () => {
    const nodes = [{ label: 'a' }, { label: 'b', children: null }];
    expect(flattenTree(nodes)).toHaveLength(2);
  });

  it('TERMINATES on a self-referential node, emitting it once', () => {
    interface Loop {
      readonly label: string;
      readonly children: Loop[];
    }
    const node: Loop = { label: 'root', children: [] };
    node.children.push(node);
    expect(flattenTree([node]).map((entry) => entry.label)).toEqual(['root']);
  }, 2000);

  it('does not mutate the input', () => {
    const nodes = [{ label: 'a', children: [{ label: 'b', children: [] }] }];
    flattenTree(nodes);
    expect(nodes[0]?.children).toHaveLength(1);
  });
});

describe('findInTree', () => {
  const rows: Row[] = [
    { id: 'a', parentId: null },
    { id: 'a1', parentId: 'a' },
    { id: 'a1x', parentId: 'a1' },
    { id: 'b', parentId: null },
  ];
  const roots = buildTree(rows, { id: (row) => row.id, parentId: (row) => row.parentId });

  it('finds the first pre-order match', () => {
    expect(findInTree(roots, (node) => node.item.id === 'a1x')?.item.id).toBe('a1x');
    expect(findInTree(roots, (node) => node.item.id === 'b')?.item.id).toBe('b');
  });

  it('reports the 0-based depth', () => {
    const depths = new Map<string, number>();
    findInTree(roots, (node, depth) => {
      depths.set(node.item.id, depth);
      return false;
    });
    expect(depths.get('a')).toBe(0);
    expect(depths.get('a1')).toBe(1);
    expect(depths.get('a1x')).toBe(2);
  });

  it('returns undefined when nothing matches', () => {
    expect(findInTree(roots, () => false)).toBeUndefined();
  });

  it('TERMINATES on a self-referential node', () => {
    interface Loop {
      readonly label: string;
      readonly children: Loop[];
    }
    const node: Loop = { label: 'root', children: [] };
    node.children.push(node);
    expect(findInTree([node], (entry) => entry.label === 'missing')).toBeUndefined();
  }, 2000);
});

describe('mapTree', () => {
  const rows: Row[] = [
    { id: 'a', parentId: null },
    { id: 'a1', parentId: 'a' },
    { id: 'b', parentId: null },
  ];
  const roots = buildTree(rows, { id: (row) => row.id, parentId: (row) => row.parentId });

  it('transforms every item, keeping the shape', () => {
    const mapped = mapTree(roots, (row) => row.id.toUpperCase());
    expect(mapped.map((node) => node.item)).toEqual(['A', 'B']);
    expect(mapped[0]?.children[0]?.item).toBe('A1');
  });

  it('reports the 0-based depth', () => {
    const mapped = mapTree(roots, (row, depth) => `${row.id}@${depth}`);
    expect(mapped[0]?.item).toBe('a@0');
    expect(mapped[0]?.children[0]?.item).toBe('a1@1');
  });

  it('does not mutate the source tree', () => {
    mapTree(roots, (row) => row.id.toUpperCase());
    expect(roots[0]?.item.id).toBe('a');
    expect(roots[0]?.children).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------------------------------
// Empty inputs — every export, once
// ---------------------------------------------------------------------------------------------------

describe('empty inputs', () => {
  it('array helpers return empty results without throwing', () => {
    expect(unique([])).toEqual([]);
    expect([...groupBy([], (value) => value).keys()]).toEqual([]);
    expect(partition([], () => true)).toEqual([[], []]);
    expect(chunk([], 3)).toEqual([]);
    expect(move([], 0, 1)).toEqual([]);
    expect(insertAt([], 0, 'a')).toEqual(['a']);
    expect(removeAt([], 0)).toEqual([]);
    expect(replaceAt([], 0, 'a')).toEqual([]);
    expect(toggleItem([], 'a')).toEqual(['a']);
    expect(zip([], [])).toEqual([]);
    expect(unzip([])).toEqual([[], []]);
    expect(range(0, 0)).toEqual([]);
  });

  it('set relations return empty results without throwing', () => {
    expect(union([], [])).toEqual([]);
    expect(intersection([], [])).toEqual([]);
    expect(difference([], [])).toEqual([]);
    expect(symmetricDifference([], [])).toEqual([]);
    expect(union<number>([], [1])).toEqual([1]);
    expect(intersection([1], [])).toEqual([]);
    expect(difference([1], [])).toEqual([1]);
    expect(symmetricDifference<number>([], [1])).toEqual([1]);
  });

  it('keyed helpers return empty results without throwing', () => {
    expect(keyBy([], (value) => value).size).toBe(0);
    expect(mapValues(new Map<string, number>(), (value) => value).size).toBe(0);
    expect(mapValues<string, number, number>({}, (value) => value)).toEqual({});
    expect(pickKeys({}, [])).toEqual({});
    expect(omitKeys({}, [])).toEqual({});
    expect(entriesToRecord<string, number>([])).toEqual({});
    expect(recordToEntries<string, number>({})).toEqual([]);
    expect(invertRecord<string, string>({})).toEqual({});
  });

  it('comparisons handle empty containers', () => {
    expect(arrayShallowEqual([], [])).toBe(true);
    expect(shallowEqual({}, {})).toBe(true);
    expect(shallowEqual([], [])).toBe(true);
    expect(deepEqual({}, {})).toBe(true);
    expect(deepEqual([], [])).toBe(true);
    expect(deepEqual(new Map(), new Map())).toBe(true);
    expect(deepEqual(new Set(), new Set())).toBe(true);
  });

  it('tree helpers handle an empty forest', () => {
    expect(buildTree<Row, string>([], { id: (row) => row.id, parentId: (row) => row.parentId })).toEqual(
      [],
    );
    expect(flattenTree([])).toEqual([]);
    expect(findInTree([], () => true)).toBeUndefined();
    expect(mapTree([], (item: string) => item)).toEqual([]);
  });
});
