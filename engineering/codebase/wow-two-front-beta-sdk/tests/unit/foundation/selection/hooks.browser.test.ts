import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useFilters,
  useSelection,
  useSort,
  FilterOperator,
  SelectionStatus,
  type FilterDescriptor,
  type SortDescriptor,
  type UseFiltersOptions,
  type UseSelectionOptions,
  type UseSortOptions,
} from '@src/foundation/selection';

// Browser project — these need React state, so they run in real chromium. The pure models are covered in the
// node suites; what is asserted here is only the seam: who owns the value, when `onChange` fires, and the
// anchor surviving a controlled parent (the property that keeps shift-click working when the hook stores
// no keys of its own).

afterEach(cleanup);

const ROWS = ['a', 'b', 'c', 'd', 'e'];

/** Renders `useSelection` with props that can be re-supplied to simulate a controlling parent. */
function renderSelection(initial: UseSelectionOptions<string> = {}) {
  return renderHook((props: UseSelectionOptions<string>) => useSelection(props), {
    initialProps: initial,
  });
}

/** Renders `useSort` with re-suppliable props. */
function renderSort(initial: UseSortOptions = {}) {
  return renderHook((props: UseSortOptions) => useSort(props), { initialProps: initial });
}

/** Renders `useFilters` with re-suppliable props. */
function renderFilters(initial: UseFiltersOptions = {}) {
  return renderHook((props: UseFiltersOptions) => useFilters(props), { initialProps: initial });
}

describe('useSelection — uncontrolled', () => {
  it('starts empty', () => {
    const { result } = renderSelection();
    expect(result.current.keys).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it('seeds from defaultSelectedKeys', () => {
    const { result } = renderSelection({ defaultSelectedKeys: ['a', 'b'] });
    expect(result.current.keys).toEqual(['a', 'b']);
  });

  it('owns the state across toggles', () => {
    const { result } = renderSelection();
    act(() => result.current.toggle('a'));
    expect(result.current.keys).toEqual(['a']);
    act(() => result.current.toggle('b'));
    expect(result.current.keys).toEqual(['a', 'b']);
    act(() => result.current.toggle('a'));
    expect(result.current.keys).toEqual(['b']);
  });

  it('fires onSelectionChange with the next keys while still owning state', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderSelection({ onSelectionChange });
    act(() => result.current.select('a'));
    expect(onSelectionChange).toHaveBeenCalledWith(['a']);
    expect(result.current.keys).toEqual(['a']);
  });

  it('clears', () => {
    const { result } = renderSelection({ defaultSelectedKeys: ['a', 'b'] });
    act(() => result.current.clear());
    expect(result.current.keys).toEqual([]);
  });

  it('tracks the anchor across renders so extend selects a range', () => {
    const { result } = renderSelection();
    act(() => result.current.select('b'));
    act(() => result.current.extend('d', ROWS));
    expect(result.current.keys).toEqual(['b', 'c', 'd']);
  });

  it('reports the header tri-state over a filtered key set', () => {
    const { result } = renderSelection();
    expect(result.current.status(ROWS)).toBe(SelectionStatus.None);
    act(() => result.current.select('a'));
    expect(result.current.status(ROWS)).toBe(SelectionStatus.Some);
    act(() => result.current.toggleAll(ROWS));
    expect(result.current.status(ROWS)).toBe(SelectionStatus.All);
    act(() => result.current.toggleAll(ROWS));
    expect(result.current.status(ROWS)).toBe(SelectionStatus.None);
  });
});

describe('useSelection — controlled', () => {
  it('renders the controlled keys and does not self-update', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderSelection({ selectedKeys: ['a'], onSelectionChange });

    act(() => result.current.select('b'));

    expect(onSelectionChange).toHaveBeenCalledWith(['a', 'b']);
    expect(result.current.keys).toEqual(['a']);
  });

  it('reflects the next value the parent supplies on re-render', () => {
    const { result, rerender } = renderSelection({ selectedKeys: ['a'] });
    rerender({ selectedKeys: ['a', 'b'] });
    expect(result.current.keys).toEqual(['a', 'b']);
    expect(result.current.count).toBe(2);
  });

  it('keeps tracking the anchor while controlled, so shift-click still ranges', () => {
    const onSelectionChange = vi.fn();
    const { result, rerender } = renderSelection({ selectedKeys: [], onSelectionChange });

    act(() => result.current.select('b'));
    rerender({ selectedKeys: ['b'], onSelectionChange });
    act(() => result.current.extend('d', ROWS));

    expect(onSelectionChange).toHaveBeenLastCalledWith(['b', 'c', 'd']);
  });
});

describe('useSelection — modes', () => {
  it('replaces rather than accumulates in single mode', () => {
    const { result } = renderSelection({ mode: 'single' });
    act(() => result.current.select('a'));
    act(() => result.current.select('b'));
    expect(result.current.keys).toEqual(['b']);
  });

  it('normalises a controlled multi-key value down to one key in single mode', () => {
    const { result } = renderSelection({ mode: 'single', selectedKeys: ['a', 'b'] });
    expect(result.current.keys).toEqual(['a']);
  });

  it('is inert in none mode and fires no change', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderSelection({ mode: 'none', onSelectionChange });
    act(() => result.current.toggle('a'));
    act(() => result.current.selectAll(ROWS));
    expect(result.current.keys).toEqual([]);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('fires no change for a no-op in multiple mode', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderSelection({ defaultSelectedKeys: ['a'], onSelectionChange });
    act(() => result.current.deselect('z'));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});

describe('useSort — uncontrolled', () => {
  it('starts unsorted', () => {
    const { result } = renderSort();
    expect(result.current.descriptors).toEqual([]);
    expect(result.current.directionFor('name')).toBeNull();
  });

  it('walks the asc → desc → none cycle', () => {
    const { result } = renderSort();
    act(() => result.current.toggle('name'));
    expect(result.current.directionFor('name')).toBe('asc');
    act(() => result.current.toggle('name'));
    expect(result.current.directionFor('name')).toBe('desc');
    act(() => result.current.toggle('name'));
    expect(result.current.descriptors).toEqual([]);
  });

  it('seeds from defaultSort and replaces the field in single-field mode', () => {
    const defaultSort: SortDescriptor[] = [{ field: 'name', direction: 'asc' }];
    const { result } = renderSort({ defaultSort });
    act(() => result.current.toggle('age'));
    expect(result.current.descriptors).toEqual([{ field: 'age', direction: 'asc' }]);
  });

  it('appends fields in multi mode and reports precedence', () => {
    const { result } = renderSort({ isMulti: true });
    act(() => result.current.toggle('dept'));
    act(() => result.current.toggle('name'));
    expect(result.current.indexFor('dept')).toBe(0);
    expect(result.current.indexFor('name')).toBe(1);
  });

  it('clears', () => {
    const { result } = renderSort({ defaultSort: [{ field: 'name', direction: 'asc' }] });
    act(() => result.current.clear());
    expect(result.current.descriptors).toEqual([]);
  });
});

describe('useSort — controlled', () => {
  it('reports the next ordering without self-updating', () => {
    const onSortChange = vi.fn();
    const sort: SortDescriptor[] = [{ field: 'name', direction: 'asc' }];
    const { result } = renderSort({ sort, onSortChange });

    act(() => result.current.toggle('name'));

    expect(onSortChange).toHaveBeenCalledWith([{ field: 'name', direction: 'desc' }]);
    expect(result.current.descriptors).toEqual([{ field: 'name', direction: 'asc' }]);
  });

  it('reflects the parent value on re-render', () => {
    const { result, rerender } = renderSort({ sort: [] });
    rerender({ sort: [{ field: 'age', direction: 'desc' }] });
    expect(result.current.directionFor('age')).toBe('desc');
  });
});

describe('useFilters', () => {
  it('upserts by field rather than stacking clauses', () => {
    const { result } = renderFilters();
    act(() =>
      result.current.setFilter({ field: 'name', op: FilterOperator.Contains, value: 'wid' }),
    );
    act(() =>
      result.current.setFilter({ field: 'name', op: FilterOperator.Contains, value: 'gad' }),
    );
    expect(result.current.filters).toEqual([{ field: 'name', op: 'contains', value: 'gad' }]);
  });

  it('keeps a clause position when upserting', () => {
    const defaultFilters: FilterDescriptor[] = [
      { field: 'a', op: FilterOperator.Equals, value: 1 },
      { field: 'b', op: FilterOperator.Equals, value: 2 },
    ];
    const { result } = renderFilters({ defaultFilters });
    act(() => result.current.setFilter({ field: 'a', op: FilterOperator.Equals, value: 9 }));
    expect(result.current.filters.map((filter) => filter.field)).toEqual(['a', 'b']);
    expect(result.current.filterFor('a')?.value).toBe(9);
  });

  it('removes and clears', () => {
    const defaultFilters: FilterDescriptor[] = [
      { field: 'a', op: FilterOperator.Equals, value: 1 },
      { field: 'b', op: FilterOperator.Equals, value: 2 },
    ];
    const { result } = renderFilters({ defaultFilters });
    act(() => result.current.removeFilter('a'));
    expect(result.current.filters.map((filter) => filter.field)).toEqual(['b']);
    act(() => result.current.clear());
    expect(result.current.filters).toEqual([]);
  });

  it('reports the next clause list without self-updating when controlled', () => {
    const onFiltersChange = vi.fn();
    const { result } = renderFilters({ filters: [], onFiltersChange });

    act(() => result.current.setFilter({ field: 'name', op: FilterOperator.Equals, value: 'x' }));

    expect(onFiltersChange).toHaveBeenCalledWith([{ field: 'name', op: 'equals', value: 'x' }]);
    expect(result.current.filters).toEqual([]);
  });
});
