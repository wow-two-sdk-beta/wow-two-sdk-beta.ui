// The React seam over the pure sort model — descriptor-list state, controlled or uncontrolled.
//
// Deliberately NOT exposed here: a `sortItems(items)` convenience. It would have to be rebuilt every render
// (its identity depends on the items it closes over), so it could not be a dependency of the consumer's
// `useMemo` without defeating it — a hook that hands back an unstable sorting function invites exactly the
// re-sort-every-render bug this model exists to avoid. The honest seam is: the hook owns the descriptors,
// the consumer calls the pure `applySort(items, controls.descriptors, accessors)` inside its own `useMemo`
// keyed on `[items, controls.descriptors]`. Same for `useFilters`.
//
// The controlled value is the descriptor ARRAY even for single-field sort, so switching a surface from
// single to multi is a flag (`isMulti`) rather than a state-shape migration.

import { useCallback, useMemo } from 'react';

import { useControlled } from '../hooks/useControlled';
import {
  sortDirectionFor,
  sortIndexFor,
  toggleSort,
  type SortDescriptor,
  type SortDirection,
} from './Sort';

/** The stable empty seed — a module constant so an uncontrolled hook never re-seeds from a fresh literal. */
const NO_SORT: readonly never[] = Object.freeze([]);

/** Options accepted by {@link useSort}. All are optional; the default is an uncontrolled single-field sort. */
export interface UseSortOptions<TField extends string = string> {
  /** The controlled ordering. Pass to own the sort state; omit for uncontrolled. */
  sort?: readonly SortDescriptor<TField>[];
  /** The initial ordering when uncontrolled. Ignored once `sort` is passed. */
  defaultSort?: readonly SortDescriptor<TField>[];
  /** Fires with the next ordering whenever it changes. */
  onSortChange?: (sort: readonly SortDescriptor<TField>[]) => void;
  /** The multi-field behaviour of {@link SortControls.toggle}. Defaults to `false` (one sorted field). */
  isMulti?: boolean;
}

/** The sort state and bound operations returned by {@link useSort}. */
export interface SortControls<TField extends string = string> {
  /** The current ordering — array order is precedence. Feed to `applySort` / `sortComparator`. */
  readonly descriptors: readonly SortDescriptor<TField>[];
  /** Advances a field through `asc → desc → none` — the header click. */
  readonly toggle: (field: TField) => void;
  /** Replaces the whole ordering — for a "sort by" menu that sets state outright. */
  readonly setSort: (descriptors: readonly SortDescriptor<TField>[]) => void;
  /** Drops all ordering. */
  readonly clear: () => void;
  /** The direction applied to a field, or `null` when unsorted — drives the header's arrow and `aria-sort`. */
  readonly directionFor: (field: TField) => SortDirection | null;
  /** The 0-based precedence of a field, or `-1` — the multi-sort header's order badge. */
  readonly indexFor: (field: TField) => number;
}

/**
 * Binds the sort model to React state, controlled or uncontrolled.
 *
 * Controlled when `sort` is passed: the hook stores nothing and only calls `onSortChange` — the shape a
 * server-side sorted table wants, where the ordering round-trips through a query rather than local state.
 */
export function useSort<TField extends string = string>(
  options: UseSortOptions<TField> = {},
): SortControls<TField> {
  const { sort, defaultSort, onSortChange, isMulti = false } = options;

  const [descriptors, setDescriptors] = useControlled<readonly SortDescriptor<TField>[]>({
    controlled: sort,
    default: defaultSort ?? NO_SORT,
    onChange: onSortChange,
  });

  const handleToggle = useCallback(
    (field: TField) => setDescriptors(toggleSort(descriptors, field, { isMulti })),
    [descriptors, isMulti, setDescriptors],
  );

  return useMemo<SortControls<TField>>(
    () => ({
      descriptors,
      toggle: handleToggle,
      setSort: setDescriptors,
      clear: () => setDescriptors(NO_SORT),
      directionFor: (field) => sortDirectionFor(descriptors, field),
      indexFor: (field) => sortIndexFor(descriptors, field),
    }),
    [descriptors, handleToggle, setDescriptors],
  );
}
