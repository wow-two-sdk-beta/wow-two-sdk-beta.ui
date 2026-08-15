<script lang="ts">
import { Temporal } from 'temporal-polyfill';
import { compareStrings } from '../../../foundation/utils';
import type { TableDensity } from '../table';

/** Defines the sort order of a DataTable column. */
export const SortDirection = {
  /** Refers to ascending order. */
  Asc: 'asc',
  /** Refers to descending order. */
  Desc: 'desc',
} as const;

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

/** Defines the horizontal text alignment of a DataTable column. */
export const DataTableColumnAlign = {
  /** Refers to left alignment. */
  Left: 'left',
  /** Refers to centered alignment. */
  Center: 'center',
  /** Refers to right alignment. */
  Right: 'right',
} as const;

export type DataTableColumnAlign = (typeof DataTableColumnAlign)[keyof typeof DataTableColumnAlign];

export interface DataTableSort {
  columnKey: string;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  key: string;
  /**
   * The header label. React took a `ReactNode`; a column is an array entry and
   * cannot become its own slot, so the scalar stays here and the `header`
   * scoped slot is the rich override.
   */
  header: string | number;
  accessor?: (row: T) => unknown;
  /**
   * The per-cell renderer. Returns a value rendered as text; for rich markup
   * use the `cell` scoped slot, which receives `{ row, column, index }`.
   */
  cell?: (row: T, index: number) => unknown;
  isSortable?: boolean;
  align?: DataTableColumnAlign;
  width?: string;
}

export interface DataTableProps<T> {
  columns: ReadonlyArray<DataTableColumn<T>>;
  data: ReadonlyArray<T>;
  rowKey?: (row: T, index: number) => string | number;
  /**
   * Fires with the clicked row and its index.
   *
   * Kept a prop rather than an emit because its *presence* is load-bearing — it
   * seeds `isHoverable` and the `cursor-pointer` class, and Vue strips declared
   * emit listeners out of `useAttrs()`.
   */
  onRowClick?: (row: T, index: number) => void;
  sortBy?: DataTableSort | null;
  defaultSortBy?: DataTableSort | null;
  isStriped?: boolean;
  isHoverable?: boolean;
  density?: TableDensity;
  isBare?: boolean;
  /** The empty-state text. Default `No results.`; override richly via the `emptyContent` slot. */
  emptyContent?: string | number;
}

function defaultCompare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Temporal.PlainDate && b instanceof Temporal.PlainDate) return Temporal.PlainDate.compare(a, b);
  if (a instanceof Temporal.PlainTime && b instanceof Temporal.PlainTime) return Temporal.PlainTime.compare(a, b);
  if (a instanceof Temporal.PlainDateTime && b instanceof Temporal.PlainDateTime)
    return Temporal.PlainDateTime.compare(a, b);
  if (a instanceof Temporal.ZonedDateTime && b instanceof Temporal.ZonedDateTime)
    return Temporal.ZonedDateTime.compare(a, b);
  // Native `Date` retained: DataTable cells hold arbitrary consumer values, so a
  // consumer may still put a `Date` in a column — this is a generic value
  // comparator, not a date-value API surface.
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return compareStrings(String(a), String(b));
}
</script>

<script setup lang="ts" generic="T">
import { computed } from 'vue';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../table';

/**
 * Sortable data table driven by a `columns` descriptor. Wraps the `Table`
 * primitives; `class` and `aria-label` reach the inner `<table>` by fallthrough,
 * which is why this component keeps `inheritAttrs` on.
 */
defineOptions({ name: 'DataTable' });

const props = withDefaults(defineProps<DataTableProps<T>>(), {
  rowKey: undefined,
  onRowClick: undefined,
  sortBy: undefined,
  defaultSortBy: undefined,
  // Explicit `undefined` so an absent Boolean prop is not cast to `false` and
  // each one keeps deferring to `Table`'s own default.
  isStriped: undefined,
  isHoverable: undefined,
  density: undefined,
  isBare: undefined,
  emptyContent: 'No results.',
});

const emit = defineEmits<{
  /** Fires with the next sort, or `null` once the cycle clears it. */
  'sort-change': [sort: DataTableSort | null];
}>();

defineSlots<{
  /** Overrides a column header. Falls back to the column's own `header`. */
  header(props: { column: DataTableColumn<T> }): unknown;
  /** Overrides a body cell. Falls back to the column's `cell`, then its `accessor`. */
  cell(props: { row: T; column: DataTableColumn<T>; index: number }): unknown;
  /** Overrides the empty-state content. Falls back to the `emptyContent` prop. */
  emptyContent(): unknown;
}>();

const { value: sort, setValue: setSort } = useControlled<DataTableSort | null>({
  controlled: () => props.sortBy,
  default: props.defaultSortBy ?? null,
  onChange: (next) => emit('sort-change', next),
});

/** React seeded `isHoverable` from `!!onRowClick`; kept as an explicit fallback. */
const resolvedHoverable = computed(() => props.isHoverable ?? props.onRowClick != null);

const sortedData = computed<ReadonlyArray<T>>(() => {
  const active = sort.value;
  if (!active) return props.data;
  const column = props.columns.find((entry) => entry.key === active.columnKey);
  const accessor = column?.accessor;
  if (!accessor) return props.data;
  return [...props.data].sort((a, b) => {
    const result = defaultCompare(accessor(a), accessor(b));
    return active.direction === SortDirection.Asc ? result : -result;
  });
});

function cycleSort(columnKey: string): void {
  const active = sort.value;
  if (!active || active.columnKey !== columnKey) {
    setSort({ columnKey, direction: SortDirection.Asc });
  } else if (active.direction === SortDirection.Asc) {
    setSort({ columnKey, direction: SortDirection.Desc });
  } else {
    setSort(null);
  }
}

function alignClass(align: DataTableColumn<T>['align']): string {
  if (align === DataTableColumnAlign.Right) return 'text-right';
  if (align === DataTableColumnAlign.Center) return 'text-center';
  return 'text-left';
}

const headerCells = computed(() =>
  props.columns.map((column) => {
    const active = sort.value;
    const isSorted = active?.columnKey === column.key;
    return {
      key: column.key,
      column,
      isSorted,
      isAscending: isSorted && active?.direction === SortDirection.Asc,
      ariaSort: isSorted
        ? active?.direction === SortDirection.Asc
          ? 'ascending'
          : 'descending'
        : column.isSortable
          ? 'none'
          : undefined,
      style: column.width ? { width: column.width } : undefined,
      class: alignClass(column.align),
    };
  }),
);

const rows = computed(() =>
  sortedData.value.map((row, index) => ({
    key: props.rowKey ? props.rowKey(row, index) : index,
    row,
    index,
    /* `onClick` only exists when a handler was supplied — React's `onClick={onRowClick ? … : undefined}`. */
    attrs: props.onRowClick ? { onClick: (): void => props.onRowClick?.(row, index) } : ({} as Record<string, never>),
    class: cn(props.onRowClick && 'cursor-pointer'),
  })),
);

/** The column's own renderer, then its accessor — the fallback under the `cell` slot. */
function renderCell(column: DataTableColumn<T>, row: T, index: number): unknown {
  if (column.cell) return column.cell(row, index);
  if (column.accessor) return column.accessor(row);
  return null;
}

const SORT_BUTTON_CLASS =
  'inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
</script>

<template>
  <Table :is-striped="isStriped" :is-hoverable="resolvedHoverable" :density="density" :is-bare="isBare">
    <TableHead>
      <TableRow>
        <TableHeaderCell
          v-for="cell in headerCells"
          :key="cell.key"
          :aria-sort="cell.ariaSort"
          :style="cell.style"
          :class="cell.class"
        >
          <button v-if="cell.column.isSortable" type="button" :class="SORT_BUTTON_CLASS" @click="cycleSort(cell.key)">
            <span>
              <slot name="header" :column="cell.column">{{ cell.column.header }}</slot>
            </span>
            <ArrowUp v-if="cell.isSorted && cell.isAscending" class="h-3.5 w-3.5" />
            <ArrowDown v-else-if="cell.isSorted" class="h-3.5 w-3.5" />
            <ArrowUpDown v-else class="h-3.5 w-3.5 opacity-50" />
          </button>
          <slot v-else name="header" :column="cell.column">{{ cell.column.header }}</slot>
        </TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <template v-if="rows.length === 0">
        <TableRow>
          <TableCell :colspan="columns.length" class="py-8 text-center text-muted-foreground">
            <slot name="emptyContent">{{ emptyContent }}</slot>
          </TableCell>
        </TableRow>
      </template>
      <template v-else>
        <TableRow v-for="row in rows" :key="row.key" v-bind="row.attrs" :class="row.class">
          <TableCell v-for="column in columns" :key="column.key" :class="alignClass(column.align)">
            <slot name="cell" :row="row.row" :column="column" :index="row.index">{{
              renderCell(column, row.row, row.index)
            }}</slot>
          </TableCell>
        </TableRow>
      </template>
    </TableBody>
  </Table>
</template>
