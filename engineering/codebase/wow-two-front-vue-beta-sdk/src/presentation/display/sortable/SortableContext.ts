import { inject, type InjectionKey } from 'vue';

/** The drag state a `Sortable` root shares with its items and handles. */
export interface SortableContextValue {
  dragIndex: number | null;
  overIndex: number | null;
  begin: (index: number) => void;
  hover: (index: number) => void;
  end: () => void;
  move: (from: number, to: number) => void;
}

export const SortableKey: InjectionKey<SortableContextValue> = Symbol('wow-two.sortable');

/** The per-row state a `SortableItem` shares with its handle. */
export interface SortableItemContextValue {
  index: number;
  arm: () => void;
  disarm: () => void;
}

export const SortableItemKey: InjectionKey<SortableItemContextValue> = Symbol('wow-two.sortableItem');

/** Reads the enclosing `Sortable` drag state. */
export function useSortableRoot(): SortableContextValue {
  const context = inject(SortableKey, null);
  if (!context) throw new Error('Sortable.Item must be rendered inside <Sortable>.');
  return context;
}

/** Reads the enclosing `SortableItem` state. */
export function useSortableItem(): SortableItemContextValue {
  const context = inject(SortableItemKey, null);
  if (!context) throw new Error('Sortable.Handle must be rendered inside <Sortable.Item>.');
  return context;
}
