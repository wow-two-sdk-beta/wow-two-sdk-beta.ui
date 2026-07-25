import { describe, expect, it } from 'vitest';
import { Temporal } from 'temporal-polyfill';

import {
  applySort,
  compareValues,
  sortComparator,
  sortDirectionFor,
  sortIndexFor,
  toggleSort,
  SortDirection,
  type SortDescriptor,
} from '@src/foundation/selection';

// Node project — pure comparison. Two rules carry the weight and are asserted from several angles:
// nullish sorts last in BOTH directions, and text ordering comes from the SDK's shared `Intl.Collator`
// (proved by a numeric-aware case and by two locales disagreeing about the same pair).

interface Person {
  name: string;
  age: number | null;
  dept: string;
}

const PEOPLE: readonly Person[] = [
  { name: 'Carol', age: 30, dept: 'eng' },
  { name: 'alice', age: 25, dept: 'ops' },
  { name: 'Bob', age: null, dept: 'eng' },
];

/** Names in result order — the shape every ordering assertion wants. */
function names(rows: ReadonlyArray<Person>): string[] {
  return rows.map((row) => row.name);
}

/** Builds a one-field ascending ordering. */
function asc(field: string): SortDescriptor[] {
  return [{ field, direction: SortDirection.Asc }];
}

/** Builds a one-field descending ordering. */
function desc(field: string): SortDescriptor[] {
  return [{ field, direction: SortDirection.Desc }];
}

describe('toggleSort — the asc → desc → none cycle', () => {
  it('starts an unsorted field at asc', () => {
    expect(toggleSort([], 'name')).toEqual([{ field: 'name', direction: 'asc' }]);
  });

  it('advances asc to desc', () => {
    expect(toggleSort(asc('name'), 'name')).toEqual([{ field: 'name', direction: 'desc' }]);
  });

  it('advances desc back to none', () => {
    expect(toggleSort(desc('name'), 'name')).toEqual([]);
  });

  it('completes the full cycle in three clicks', () => {
    const first = toggleSort<string>([], 'name');
    const second = toggleSort(first, 'name');
    const third = toggleSort(second, 'name');
    expect(sortDirectionFor(first, 'name')).toBe('asc');
    expect(sortDirectionFor(second, 'name')).toBe('desc');
    expect(third).toEqual([]);
  });

  it('replaces the sorted field in single-field mode', () => {
    expect(toggleSort(desc('name'), 'age')).toEqual([{ field: 'age', direction: 'asc' }]);
  });

  it('does not mutate the descriptor list handed to it', () => {
    const descriptors = asc('name');
    toggleSort(descriptors, 'name');
    toggleSort(descriptors, 'age');
    expect(descriptors).toEqual([{ field: 'name', direction: 'asc' }]);
  });
});

describe('toggleSort — multi-field', () => {
  it('appends a new field after the existing ones', () => {
    expect(toggleSort(asc('dept'), 'name', { isMulti: true })).toEqual([
      { field: 'dept', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ]);
  });

  it('cycles a field in place, keeping precedence', () => {
    const two: SortDescriptor[] = [
      { field: 'dept', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ];
    expect(toggleSort(two, 'dept', { isMulti: true })).toEqual([
      { field: 'dept', direction: 'desc' },
      { field: 'name', direction: 'asc' },
    ]);
  });

  it('removes a field on the third click and leaves the others ordered', () => {
    const two: SortDescriptor[] = [
      { field: 'dept', direction: 'desc' },
      { field: 'name', direction: 'asc' },
    ];
    expect(toggleSort(two, 'dept', { isMulti: true })).toEqual([
      { field: 'name', direction: 'asc' },
    ]);
  });
});

describe('sortDirectionFor / sortIndexFor', () => {
  const two: SortDescriptor[] = [
    { field: 'dept', direction: 'asc' },
    { field: 'name', direction: 'desc' },
  ];

  it('reports the direction of a sorted field', () => {
    expect(sortDirectionFor(two, 'name')).toBe('desc');
  });

  it('reports null for an unsorted field', () => {
    expect(sortDirectionFor(two, 'age')).toBeNull();
  });

  it('reports 0-based precedence', () => {
    expect(sortIndexFor(two, 'dept')).toBe(0);
    expect(sortIndexFor(two, 'name')).toBe(1);
  });

  it('reports -1 for an unsorted field', () => {
    expect(sortIndexFor(two, 'age')).toBe(-1);
  });
});

describe('applySort — basics', () => {
  it('returns the input array itself when there is nothing to order', () => {
    expect(applySort(PEOPLE, [])).toBe(PEOPLE);
  });

  it('does not mutate the input', () => {
    const before = names(PEOPLE);
    applySort(PEOPLE, asc('name'));
    expect(names(PEOPLE)).toEqual(before);
  });

  it('reads a plain property when no accessor is registered', () => {
    expect(names(applySort(PEOPLE, asc('dept')))).toEqual(['Carol', 'Bob', 'alice']);
  });

  it('uses a registered accessor over the property', () => {
    const byNameLength = applySort(PEOPLE, asc('size'), {
      size: (person: Person) => person.name.length,
    });
    expect(names(byNameLength)).toEqual(['Bob', 'Carol', 'alice']);
  });

  it('is stable — equal rows keep their incoming order', () => {
    const sorted = applySort(PEOPLE, asc('dept'));
    expect(names(sorted).slice(0, 2)).toEqual(['Carol', 'Bob']);
  });
});

describe('applySort — nullish sorts last in BOTH directions', () => {
  it('puts a null value last ascending', () => {
    expect(names(applySort(PEOPLE, asc('age')))).toEqual(['alice', 'Carol', 'Bob']);
  });

  it('puts the same null value last descending', () => {
    expect(names(applySort(PEOPLE, desc('age')))).toEqual(['Carol', 'alice', 'Bob']);
  });

  it('treats undefined as absent', () => {
    const rows = [{ id: 'x', v: 2 }, { id: 'y' }, { id: 'z', v: 1 }];
    expect(applySort(rows, asc('v')).map((row) => row.id)).toEqual(['z', 'x', 'y']);
    expect(applySort(rows, desc('v')).map((row) => row.id)).toEqual(['x', 'z', 'y']);
  });

  it('treats NaN as absent rather than letting it poison the comparator', () => {
    const rows = [
      { id: 'x', v: 2 },
      { id: 'y', v: Number.NaN },
      { id: 'z', v: 1 },
    ];
    expect(applySort(rows, asc('v')).map((row) => row.id)).toEqual(['z', 'x', 'y']);
    expect(applySort(rows, desc('v')).map((row) => row.id)).toEqual(['x', 'z', 'y']);
  });

  it('leaves two absent values tied, falling through to the next field', () => {
    const rows = [
      { id: 'x', v: null, tie: 2 },
      { id: 'y', v: null, tie: 1 },
    ];
    const sorted = applySort(rows, [
      { field: 'v', direction: SortDirection.Asc },
      { field: 'tie', direction: SortDirection.Asc },
    ]);
    expect(sorted.map((row) => row.id)).toEqual(['y', 'x']);
  });
});

describe('applySort — multi-field precedence', () => {
  const rows = [
    { id: 'a', dept: 'eng', salary: 100 },
    { id: 'b', dept: 'ops', salary: 300 },
    { id: 'c', dept: 'eng', salary: 200 },
    { id: 'd', dept: 'ops', salary: 100 },
  ];

  it('orders by the first field, breaking ties with the second', () => {
    const sorted = applySort(rows, [
      { field: 'dept', direction: SortDirection.Asc },
      { field: 'salary', direction: SortDirection.Desc },
    ]);
    expect(sorted.map((row) => row.id)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('changes the result when precedence is swapped', () => {
    const sorted = applySort(rows, [
      { field: 'salary', direction: SortDirection.Desc },
      { field: 'dept', direction: SortDirection.Asc },
    ]);
    expect(sorted.map((row) => row.id)).toEqual(['b', 'c', 'a', 'd']);
  });
});

describe('applySort — string ordering through the shared collator', () => {
  it('is case-insensitive-ish in the collator sense rather than raw code-unit order', () => {
    // Raw `<` would put every capital before every lowercase ('Carol' < 'alice'); the collator does not.
    expect(names(applySort(PEOPLE, asc('name')))).toEqual(['alice', 'Bob', 'Carol']);
  });

  it('is numeric-aware — "item 2" before "item 10"', () => {
    const rows = [{ v: 'item 10' }, { v: 'item 2' }, { v: 'item 1' }];
    expect(applySort(rows, asc('v')).map((row) => row.v)).toEqual([
      'item 1',
      'item 2',
      'item 10',
    ]);
  });

  it('honours the locale — German sorts "ä" with "a"', () => {
    const rows = [{ v: 'z' }, { v: 'ä' }, { v: 'a' }];
    expect(applySort(rows, asc('v'), undefined, { locale: 'de' }).map((row) => row.v)).toEqual([
      'a',
      'ä',
      'z',
    ]);
  });

  it('honours the locale — Swedish sorts "ä" after "z"', () => {
    const rows = [{ v: 'z' }, { v: 'ä' }, { v: 'a' }];
    expect(applySort(rows, asc('v'), undefined, { locale: 'sv' }).map((row) => row.v)).toEqual([
      'a',
      'z',
      'ä',
    ]);
  });
});

describe('compareValues — typed comparisons', () => {
  it('compares numbers numerically', () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
  });

  it('compares bigints', () => {
    expect(compareValues(10n, 2n)).toBeGreaterThan(0);
    expect(compareValues(2n, 2n)).toBe(0);
  });

  it('orders false before true', () => {
    expect(compareValues(false, true)).toBeLessThan(0);
  });

  it('compares native Dates by instant', () => {
    expect(compareValues(new Date('2026-01-01'), new Date('2026-06-01'))).toBeLessThan(0);
  });

  it('compares Temporal.PlainDate', () => {
    const early = Temporal.PlainDate.from('2026-01-01');
    const late = Temporal.PlainDate.from('2026-06-01');
    expect(compareValues(early, late)).toBeLessThan(0);
    expect(compareValues(late, early)).toBeGreaterThan(0);
  });

  it('compares Temporal.PlainDateTime', () => {
    expect(
      compareValues(
        Temporal.PlainDateTime.from('2026-01-01T09:00'),
        Temporal.PlainDateTime.from('2026-01-01T17:00'),
      ),
    ).toBeLessThan(0);
  });

  it('falls back to the collator for anything else', () => {
    expect(compareValues({ toString: () => 'a' }, { toString: () => 'b' })).toBeLessThan(0);
  });
});

describe('sortComparator — reusable comparator', () => {
  it('produces the same order as applySort', () => {
    const comparator = sortComparator<Person>(asc('name'));
    expect(names([...PEOPLE].sort(comparator))).toEqual(names(applySort(PEOPLE, asc('name'))));
  });

  it('sorts Temporal dates through a registered accessor with nullish last', () => {
    const rows = [
      { id: 'x', on: Temporal.PlainDate.from('2026-06-01') },
      { id: 'y', on: null },
      { id: 'z', on: Temporal.PlainDate.from('2026-01-01') },
    ];
    const sorted = [...rows].sort(sortComparator(desc('on')));
    expect(sorted.map((row) => row.id)).toEqual(['x', 'z', 'y']);
  });
});
