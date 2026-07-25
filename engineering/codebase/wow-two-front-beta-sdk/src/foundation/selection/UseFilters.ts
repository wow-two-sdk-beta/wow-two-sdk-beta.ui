// The React seam over the pure filter model — clause-list state, controlled or uncontrolled.
//
// `setFilter` upserts BY FIELD, which is the filter-bar shape: one control per column, changing it replaces
// that column's clause in place rather than stacking a second one. The model itself allows several clauses on
// one field (a `gt` and an `lt` AND-ed into a range), and that stays reachable through `setFilters` — the
// upsert is a convenience over the common case, not a restriction of the model.
//
// As with `useSort`, no `filterItems(items)` convenience: the pure `applyFilters(items, controls.filters)`
// belongs in the consumer's own `useMemo`, keyed on `[items, controls.filters]`. A function handed back from
// here could not be a stable dependency.

import { useCallback, useMemo } from 'react';

import { useControlled } from '../hooks/useControlled';
import type { FilterDescriptor } from './Filter';

/** The stable empty seed — a module constant so an uncontrolled hook never re-seeds from a fresh literal. */
const NO_FILTERS: readonly never[] = Object.freeze([]);

/** Options accepted by {@link useFilters}. All are optional; the default is an uncontrolled empty filter set. */
export interface UseFiltersOptions<TField extends string = string> {
  /** The controlled clause list. Pass to own the filter state; omit for uncontrolled. */
  filters?: readonly FilterDescriptor<TField>[];
  /** The initial clause list when uncontrolled. Ignored once `filters` is passed. */
  defaultFilters?: readonly FilterDescriptor<TField>[];
  /** Fires with the next clause list whenever it changes. */
  onFiltersChange?: (filters: readonly FilterDescriptor<TField>[]) => void;
}

/** The filter state and bound operations returned by {@link useFilters}. */
export interface FilterControls<TField extends string = string> {
  /** The current clauses, AND-ed. Feed to `applyFilters` / `filterPredicate`. */
  readonly filters: readonly FilterDescriptor<TField>[];
  /** Replaces the whole clause list — the escape hatch for several clauses on one field. */
  readonly setFilters: (filters: readonly FilterDescriptor<TField>[]) => void;
  /** Upserts a clause by field, keeping its position when it already exists. */
  readonly setFilter: (filter: FilterDescriptor<TField>) => void;
  /** Drops every clause on a field. */
  readonly removeFilter: (field: TField) => void;
  /** Drops every clause. */
  readonly clear: () => void;
  /** The first clause on a field, or `undefined` — what a filter-bar control reads to render its value. */
  readonly filterFor: (field: TField) => FilterDescriptor<TField> | undefined;
}

/**
 * Binds the filter model to React state, controlled or uncontrolled.
 *
 * Controlled when `filters` is passed: the hook stores nothing and only calls `onFiltersChange` — the shape a
 * server-side filtered list wants, where the clauses round-trip through a query.
 */
export function useFilters<TField extends string = string>(
  options: UseFiltersOptions<TField> = {},
): FilterControls<TField> {
  const { filters: controlledFilters, defaultFilters, onFiltersChange } = options;

  const [filters, setFilters] = useControlled<readonly FilterDescriptor<TField>[]>({
    controlled: controlledFilters,
    default: defaultFilters ?? NO_FILTERS,
    onChange: onFiltersChange,
  });

  const setFilter = useCallback(
    (filter: FilterDescriptor<TField>) => {
      const index = filters.findIndex((candidate) => candidate.field === filter.field);
      if (index === -1) {
        setFilters([...filters, filter]);
        return;
      }
      setFilters(filters.map((candidate, at) => (at === index ? filter : candidate)));
    },
    [filters, setFilters],
  );

  const removeFilter = useCallback(
    (field: TField) => setFilters(filters.filter((candidate) => candidate.field !== field)),
    [filters, setFilters],
  );

  return useMemo<FilterControls<TField>>(
    () => ({
      filters,
      setFilters,
      setFilter,
      removeFilter,
      clear: () => setFilters(NO_FILTERS),
      filterFor: (field) => filters.find((candidate) => candidate.field === field),
    }),
    [filters, setFilters, setFilter, removeFilter],
  );
}
