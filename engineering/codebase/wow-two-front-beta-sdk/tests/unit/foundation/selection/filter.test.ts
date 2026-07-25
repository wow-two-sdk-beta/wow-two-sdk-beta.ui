import { describe, expect, it } from 'vitest';
import { Temporal } from 'temporal-polyfill';

import {
  applyFilters,
  filterPredicate,
  matchesFilter,
  FilterOperator,
  type FilterDescriptor,
} from '@src/foundation/selection';

// Node project — pure predicates. The operator set is closed, so every operator gets a case, plus the two
// behaviours a caller would otherwise have to read the source for: text ops fold case by default, and an
// absent field value matches nothing except a nullish `equals`.

interface Product {
  name: string;
  price: number;
  stock: number | null;
  tag: string;
}

const PRODUCTS: readonly Product[] = [
  { name: 'Widget', price: 10, stock: 5, tag: 'tools' },
  { name: 'gadget', price: 25, stock: null, tag: 'Tools' },
  { name: 'Gizmo', price: 50, stock: 0, tag: 'toys' },
];

/** Names in result order — the shape every filter assertion wants. */
function names(rows: ReadonlyArray<Product>): string[] {
  return rows.map((row) => row.name);
}

/** Applies one clause to the product fixture. */
function only(filter: FilterDescriptor): string[] {
  return names(applyFilters(PRODUCTS, [filter]));
}

describe('equals', () => {
  it('matches an exact string, folding case by default', () => {
    expect(only({ field: 'name', op: FilterOperator.Equals, value: 'widget' })).toEqual(['Widget']);
  });

  it('respects isCaseSensitive', () => {
    expect(
      only({ field: 'name', op: FilterOperator.Equals, value: 'widget', isCaseSensitive: true }),
    ).toEqual([]);
    expect(
      only({ field: 'name', op: FilterOperator.Equals, value: 'Widget', isCaseSensitive: true }),
    ).toEqual(['Widget']);
  });

  it('matches numbers by value', () => {
    expect(only({ field: 'price', op: FilterOperator.Equals, value: 25 })).toEqual(['gadget']);
  });

  it('does not coerce across types', () => {
    expect(only({ field: 'price', op: FilterOperator.Equals, value: '25' })).toEqual([]);
  });

  it('matches an absent field value against a nullish filter value', () => {
    expect(only({ field: 'stock', op: FilterOperator.Equals, value: null })).toEqual(['gadget']);
  });

  it('does not match zero against a nullish filter value', () => {
    const zeroStock = applyFilters(PRODUCTS, [
      { field: 'stock', op: FilterOperator.Equals, value: 0 },
    ]);
    expect(names(zeroStock)).toEqual(['Gizmo']);
  });

  it('compares date-likes by value, not identity', () => {
    const rows = [{ on: Temporal.PlainDate.from('2026-01-01') }];
    const matched = applyFilters(rows, [
      { field: 'on', op: FilterOperator.Equals, value: Temporal.PlainDate.from('2026-01-01') },
    ]);
    expect(matched).toHaveLength(1);
  });
});

describe('contains', () => {
  it('matches a substring, folding case by default', () => {
    expect(only({ field: 'name', op: FilterOperator.Contains, value: 'ADGE' })).toEqual(['gadget']);
  });

  it('respects isCaseSensitive', () => {
    expect(
      only({ field: 'name', op: FilterOperator.Contains, value: 'ADGE', isCaseSensitive: true }),
    ).toEqual([]);
  });

  it('matches every row for an empty needle', () => {
    expect(only({ field: 'name', op: FilterOperator.Contains, value: '' })).toEqual([
      'Widget',
      'gadget',
      'Gizmo',
    ]);
  });

  it('reads a non-string field through its text form', () => {
    expect(only({ field: 'price', op: FilterOperator.Contains, value: '5' })).toEqual([
      'gadget',
      'Gizmo',
    ]);
  });

  it('rejects an absent field value even against an empty needle every other row matches', () => {
    expect(only({ field: 'stock', op: FilterOperator.Contains, value: '' })).toEqual([
      'Widget',
      'Gizmo',
    ]);
  });
});

describe('startsWith', () => {
  it('matches a prefix, folding case by default', () => {
    expect(only({ field: 'name', op: FilterOperator.StartsWith, value: 'g' })).toEqual([
      'gadget',
      'Gizmo',
    ]);
  });

  it('does not match a mid-string occurrence', () => {
    expect(only({ field: 'name', op: FilterOperator.StartsWith, value: 'izmo' })).toEqual([]);
  });

  it('respects isCaseSensitive', () => {
    expect(
      only({ field: 'name', op: FilterOperator.StartsWith, value: 'g', isCaseSensitive: true }),
    ).toEqual(['gadget']);
  });
});

describe('gt / lt', () => {
  it('is strictly greater', () => {
    expect(only({ field: 'price', op: FilterOperator.GreaterThan, value: 25 })).toEqual(['Gizmo']);
  });

  it('is strictly less', () => {
    expect(only({ field: 'price', op: FilterOperator.LessThan, value: 25 })).toEqual(['Widget']);
  });

  it('orders strings through the collator', () => {
    expect(only({ field: 'name', op: FilterOperator.LessThan, value: 'Gizmo' })).toEqual([
      'gadget',
    ]);
  });

  it('rejects an absent field value in both directions', () => {
    expect(only({ field: 'stock', op: FilterOperator.GreaterThan, value: -1 })).toEqual([
      'Widget',
      'Gizmo',
    ]);
    expect(only({ field: 'stock', op: FilterOperator.LessThan, value: 999 })).toEqual([
      'Widget',
      'Gizmo',
    ]);
  });
});

describe('between', () => {
  it('is inclusive on the low bound', () => {
    expect(only({ field: 'price', op: FilterOperator.Between, value: [10, 20] })).toEqual([
      'Widget',
    ]);
  });

  it('is inclusive on the high bound', () => {
    expect(only({ field: 'price', op: FilterOperator.Between, value: [25, 50] })).toEqual([
      'gadget',
      'Gizmo',
    ]);
  });

  it('normalises reversed bounds', () => {
    expect(only({ field: 'price', op: FilterOperator.Between, value: [50, 25] })).toEqual([
      'gadget',
      'Gizmo',
    ]);
  });

  it('rejects an absent field value', () => {
    expect(only({ field: 'stock', op: FilterOperator.Between, value: [0, 100] })).toEqual([
      'Widget',
      'Gizmo',
    ]);
  });

  it('rejects an absent bound', () => {
    expect(only({ field: 'price', op: FilterOperator.Between, value: [null, 100] })).toEqual([]);
  });
});

describe('in', () => {
  it('matches membership', () => {
    expect(only({ field: 'price', op: FilterOperator.In, value: [10, 50] })).toEqual([
      'Widget',
      'Gizmo',
    ]);
  });

  it('folds case for string candidates', () => {
    expect(only({ field: 'tag', op: FilterOperator.In, value: ['TOOLS'] })).toEqual([
      'Widget',
      'gadget',
    ]);
  });

  it('respects isCaseSensitive', () => {
    expect(
      only({ field: 'tag', op: FilterOperator.In, value: ['Tools'], isCaseSensitive: true }),
    ).toEqual(['gadget']);
  });

  it('matches an absent field value against a nullish candidate', () => {
    expect(only({ field: 'stock', op: FilterOperator.In, value: [null] })).toEqual(['gadget']);
  });

  it('matches nothing for an empty candidate list', () => {
    expect(only({ field: 'tag', op: FilterOperator.In, value: [] })).toEqual([]);
  });
});

describe('applyFilters — composition', () => {
  it('AND-s multiple clauses', () => {
    const matched = applyFilters(PRODUCTS, [
      { field: 'tag', op: FilterOperator.Equals, value: 'tools' },
      { field: 'price', op: FilterOperator.GreaterThan, value: 15 },
    ]);
    expect(names(matched)).toEqual(['gadget']);
  });

  it('narrows rather than unions two clauses on one field', () => {
    const matched = applyFilters(PRODUCTS, [
      { field: 'price', op: FilterOperator.GreaterThan, value: 5 },
      { field: 'price', op: FilterOperator.LessThan, value: 30 },
    ]);
    expect(names(matched)).toEqual(['Widget', 'gadget']);
  });

  it('returns the input array itself when there is nothing to filter', () => {
    expect(applyFilters(PRODUCTS, [])).toBe(PRODUCTS);
  });

  it('does not mutate the input', () => {
    const before = names(PRODUCTS);
    applyFilters(PRODUCTS, [{ field: 'price', op: FilterOperator.LessThan, value: 0 }]);
    expect(names(PRODUCTS)).toEqual(before);
  });

  it('preserves the incoming order of the matches', () => {
    const matched = applyFilters(PRODUCTS, [
      { field: 'price', op: FilterOperator.GreaterThan, value: 0 },
    ]);
    expect(names(matched)).toEqual(['Widget', 'gadget', 'Gizmo']);
  });
});

describe('matchesFilter — single item', () => {
  const widget: Product = { name: 'Widget', price: 10, stock: 5, tag: 'tools' };

  it('reports a match', () => {
    expect(matchesFilter(widget, { field: 'name', op: FilterOperator.Contains, value: 'wid' })).toBe(
      true,
    );
  });

  it('reports a miss', () => {
    expect(matchesFilter(widget, { field: 'price', op: FilterOperator.GreaterThan, value: 99 })).toBe(
      false,
    );
  });

  it('reads through a registered accessor rather than the property', () => {
    const filter: FilterDescriptor = { field: 'label', op: FilterOperator.Equals, value: 'WIDGET' };
    expect(matchesFilter(widget, filter, { label: (row: Product) => row.name })).toBe(true);
  });

  it('treats an unknown field as absent', () => {
    expect(matchesFilter(widget, { field: 'nope', op: FilterOperator.Contains, value: 'x' })).toBe(
      false,
    );
  });
});

describe('filterPredicate', () => {
  it('produces the same result as applyFilters', () => {
    const filters: FilterDescriptor[] = [
      { field: 'tag', op: FilterOperator.Contains, value: 'to' },
      { field: 'price', op: FilterOperator.LessThan, value: 30 },
    ];
    const predicate = filterPredicate<Product>(filters);
    expect(names(PRODUCTS.filter(predicate))).toEqual(names(applyFilters(PRODUCTS, filters)));
  });
});
