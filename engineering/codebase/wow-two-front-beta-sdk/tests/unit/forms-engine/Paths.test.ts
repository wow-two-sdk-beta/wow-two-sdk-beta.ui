import { describe, expect, it } from 'vitest';

import {
  formatPath,
  getPath,
  hasPath,
  mutateRows,
  parsePath,
  remapPathKey,
  remapPathMap,
  remapPathSet,
  setPath,
} from '@src/forms-engine/Paths';

describe('parsePath', () => {
  it('parses flat, dotted, and indexed paths', () => {
    expect(parsePath('name')).toEqual(['name']);
    expect(parsePath('style.color')).toEqual(['style', 'color']);
    expect(parsePath('rules[0].destination')).toEqual(['rules', 0, 'destination']);
    expect(parsePath('grid[1][2]')).toEqual(['grid', 1, 2]);
  });

  it('keeps non-numeric bracket content as a string segment and tolerates junk', () => {
    expect(parsePath('map[key]')).toEqual(['map', 'key']);
    expect(parsePath('')).toEqual([]);
    expect(parsePath('a..b')).toEqual(['a', 'b']);
  });
});

describe('formatPath', () => {
  it('round-trips the canonical form', () => {
    for (const path of ['name', 'style.color', 'rules[0].destination', 'grid[1][2]']) {
      expect(formatPath(parsePath(path))).toBe(path);
    }
  });
});

describe('getPath', () => {
  const target = { style: { color: 'red' }, rules: [{ destination: 'a' }] };

  it('reads nested and indexed values', () => {
    expect(getPath(target, 'style.color')).toBe('red');
    expect(getPath(target, 'rules[0].destination')).toBe('a');
  });

  it('returns undefined for missing hops', () => {
    expect(getPath(target, 'style.missing')).toBeUndefined();
    expect(getPath(target, 'rules[3].destination')).toBeUndefined();
    expect(getPath(target, 'style.color.deep')).toBeUndefined();
  });
});

describe('hasPath', () => {
  const target = { name: '', rules: [{ destination: 'a' }], meta: undefined };

  it('checks structural presence, not truthiness', () => {
    expect(hasPath(target, 'name')).toBe(true);
    expect(hasPath(target, 'meta')).toBe(true);
    expect(hasPath(target, 'rules[0].destination')).toBe(true);
  });

  it('rejects out-of-range indices and unknown keys', () => {
    expect(hasPath(target, 'rules[1].destination')).toBe(false);
    expect(hasPath(target, 'ghost')).toBe(false);
    expect(hasPath(target, '')).toBe(false);
  });
});

describe('setPath', () => {
  it('sets immutably, cloning only the spine', () => {
    const original = { style: { color: 'red' }, rules: [{ destination: 'a' }, { destination: 'b' }] };
    const next = setPath(original, 'rules[1].destination', 'c');

    expect(next.rules[1]).toEqual({ destination: 'c' });
    expect(original.rules[1]).toEqual({ destination: 'b' });
    // Untouched branches keep identity — selector-friendly.
    expect(next.style).toBe(original.style);
    expect(next.rules[0]).toBe(original.rules[0]);
  });

  it('creates intermediate containers by segment kind', () => {
    expect(setPath({} as Record<string, unknown>, 'a.b', 1)).toEqual({ a: { b: 1 } });
    expect(setPath({} as Record<string, unknown>, 'a[0].b', 1)).toEqual({ a: [{ b: 1 }] });
  });
});

describe('mutateRows', () => {
  it('applies push / insert / remove / swap / move', () => {
    const rows = ['a', 'b', 'c'];
    mutateRows(rows, { kind: 'push', value: 'd' });
    expect(rows).toEqual(['a', 'b', 'c', 'd']);
    mutateRows(rows, { kind: 'insert', index: 1, value: 'x' });
    expect(rows).toEqual(['a', 'x', 'b', 'c', 'd']);
    mutateRows(rows, { kind: 'remove', index: 1 });
    expect(rows).toEqual(['a', 'b', 'c', 'd']);
    mutateRows(rows, { kind: 'swap', indexA: 0, indexB: 3 });
    expect(rows).toEqual(['d', 'b', 'c', 'a']);
    mutateRows(rows, { kind: 'move', fromIndex: 3, toIndex: 1 });
    expect(rows).toEqual(['d', 'a', 'b', 'c']);
  });
});

describe('remapPathKey', () => {
  it('shifts row indices through insert and remove', () => {
    expect(remapPathKey('rules[2].x', 'rules', { kind: 'insert', index: 1, value: null })).toBe('rules[3].x');
    expect(remapPathKey('rules[0].x', 'rules', { kind: 'insert', index: 1, value: null })).toBe('rules[0].x');
    expect(remapPathKey('rules[2].x', 'rules', { kind: 'remove', index: 0 })).toBe('rules[1].x');
    expect(remapPathKey('rules[0].x', 'rules', { kind: 'remove', index: 0 })).toBeNull();
  });

  it('follows rows through swap and move', () => {
    expect(remapPathKey('rules[0].x', 'rules', { kind: 'swap', indexA: 0, indexB: 2 })).toBe('rules[2].x');
    expect(remapPathKey('rules[1].x', 'rules', { kind: 'swap', indexA: 0, indexB: 2 })).toBe('rules[1].x');
    expect(remapPathKey('rules[0].x', 'rules', { kind: 'move', fromIndex: 0, toIndex: 2 })).toBe('rules[2].x');
    expect(remapPathKey('rules[1].x', 'rules', { kind: 'move', fromIndex: 0, toIndex: 2 })).toBe('rules[0].x');
    expect(remapPathKey('rules[2].x', 'rules', { kind: 'move', fromIndex: 2, toIndex: 0 })).toBe('rules[0].x');
    expect(remapPathKey('rules[0].x', 'rules', { kind: 'move', fromIndex: 2, toIndex: 0 })).toBe('rules[1].x');
  });

  it('leaves keys outside the array untouched (including the array path itself)', () => {
    expect(remapPathKey('title', 'rules', { kind: 'remove', index: 0 })).toBe('title');
    expect(remapPathKey('rules', 'rules', { kind: 'remove', index: 0 })).toBe('rules');
    expect(remapPathKey('other[0].x', 'rules', { kind: 'remove', index: 0 })).toBe('other[0].x');
  });
});

describe('remapPathMap / remapPathSet', () => {
  it('remaps keys and drops removed rows', () => {
    const map = { 'rules[0].x': ['a'], 'rules[1].x': ['b'], title: ['t'] };
    expect(remapPathMap(map, 'rules', { kind: 'remove', index: 0 })).toEqual({
      'rules[0].x': ['b'],
      title: ['t'],
    });

    const set = new Set(['rules[0].x', 'rules[1].x', 'title']);
    expect([...remapPathSet(set, 'rules', { kind: 'remove', index: 1 })]).toEqual(['rules[0].x', 'title']);
  });
});
