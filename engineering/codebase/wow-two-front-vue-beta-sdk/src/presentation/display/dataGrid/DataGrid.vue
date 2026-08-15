<script lang="ts">
import { DataGridCellType, DataGridColumnAlign, DataGridMove, type DataGridColumn } from './DataGridTypes';

export interface DataGridProps<T> {
  columns: ReadonlyArray<DataGridColumn<T>>;
  rows: ReadonlyArray<T>;
  /**
   * Returns the stable key of a row.
   *
   * Kept a prop rather than an emit: React made it required and it is called as
   * a plain function on every render, which is not what an emit models.
   */
  rowKey: (row: T) => string;
  /** The dense row height. Default `false`. */
  isDense?: boolean;
}

interface CellPos {
  row: number;
  col: number;
}

function castValue(raw: string, type: DataGridCellType): unknown {
  if (type === DataGridCellType.Number) {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
  }
  if (type === DataGridCellType.Boolean) return raw === 'true';
  return raw;
}
</script>

<script setup lang="ts" generic="T">
import { computed, ref, useAttrs, useTemplateRef, watch } from 'vue';
import { cn } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import CellEditor from './CellEditor.vue';

/**
 * First-generation editable DataGrid. Keyboard nav between cells; click /
 * Enter / F2 enter edit; Escape reverts. Range select, fill, paste TSV are
 * deferred — log them in a follow-up batch.
 */
defineOptions({ name: 'DataGrid', inheritAttrs: false });

const props = withDefaults(defineProps<DataGridProps<T>>(), {
  /* These three stay declared-required — Vue still warns when one is missing — but
     the defaults keep an absent (or transiently-undefined) value from reaching the
     `.length` reads below, which took the whole page down. An empty grid renders
     its own header-only shell instead. */
  columns: () => [],
  rows: () => [],
  rowKey: (row: unknown) => String(row),
  // Explicit `undefined` so an absent Boolean prop is not cast to `false`.
  isDense: undefined,
});

const emit = defineEmits<{
  /** Fires per committed cell with the row, the column key, and the cast value. */
  'row-change': [row: T, colKey: string, value: unknown];
}>();

defineSlots<{
  /** Overrides a column header. Falls back to the column's own `header`. */
  header(props: { column: DataGridColumn<T> }): unknown;
  /**
   * Overrides a body cell in read mode. Falls back to the column's `cell`
   * renderer, then to its `accessor`.
   */
  cell(props: { row: T; column: DataGridColumn<T>; rowIndex: number; colIndex: number }): unknown;
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');
const tableEl = useTemplateRef<HTMLTableElement>('tableEl');

const active = ref<CellPos>({ row: 0, col: 0 });
const editing = ref(false);
const draft = ref('');

const gridId = useId();
function cellId(row: number, col: number): string {
  return `${gridId}-cell-${row}-${col}`;
}

const colCount = computed(() => props.columns.length);
const rowCount = computed(() => props.rows.length);

// The editor just unmounted — without this, focus drops to <body> and the
// grid's keyboard navigation goes dead. React did it from the same effect that
// focused the editor; the editor now focuses itself, so only this half is left.
watch(
  editing,
  (isEditing, wasEditing) => {
    if (!isEditing && wasEditing) tableEl.value?.focus();
  },
  { flush: 'post' },
);

function beginEdit(): void {
  const column = props.columns[active.value.col];
  const row = props.rows[active.value.row];
  if (!column || row === undefined) return;
  if (column.isEditable === false) return;
  const raw = column.accessor(row);
  draft.value = raw == null ? '' : String(raw);
  editing.value = true;
}

function commitEdit(move?: DataGridMove, rawValue?: string): void {
  const column = props.columns[active.value.col];
  const row = props.rows[active.value.row];
  if (!column || row === undefined) {
    editing.value = false;
    return;
  }
  // rawValue lets editors commit synchronously with the fresh value — the draft
  // is still the previous text when a select's change and its commit fire in the
  // same event (select/boolean editors).
  const value = castValue(rawValue ?? draft.value, column.type ?? DataGridCellType.Text);
  emit('row-change', row, column.key, value);
  editing.value = false;
  if (move === DataGridMove.Right) {
    active.value = {
      row: active.value.row,
      col: Math.min(colCount.value - 1, active.value.col + 1),
    };
  }
  if (move === DataGridMove.Down) {
    active.value = {
      row: Math.min(rowCount.value - 1, active.value.row + 1),
      col: active.value.col,
    };
  }
}

function cancelEdit(): void {
  editing.value = false;
}

function onKeydown(event: KeyboardEvent): void {
  if (editing.value) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitEdit(DataGridMove.Down);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      commitEdit(DataGridMove.Right);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
    return;
  }
  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault();
      active.value = {
        row: active.value.row,
        col: Math.min(colCount.value - 1, active.value.col + 1),
      };
      break;
    case 'ArrowLeft':
      event.preventDefault();
      active.value = { row: active.value.row, col: Math.max(0, active.value.col - 1) };
      break;
    case 'ArrowDown':
      event.preventDefault();
      active.value = {
        row: Math.min(rowCount.value - 1, active.value.row + 1),
        col: active.value.col,
      };
      break;
    case 'ArrowUp':
      event.preventDefault();
      active.value = { row: Math.max(0, active.value.row - 1), col: active.value.col };
      break;
    case 'Home':
      event.preventDefault();
      active.value = { row: active.value.row, col: 0 };
      break;
    case 'End':
      event.preventDefault();
      active.value = { row: active.value.row, col: colCount.value - 1 };
      break;
    case 'Enter':
    case 'F2':
      event.preventDefault();
      beginEdit();
      break;
  }
}

function onCellClick(rowIndex: number, colIndex: number): void {
  const column = props.columns[colIndex];
  if (!column) return;
  const isEditingThisCell = editing.value && active.value.row === rowIndex && active.value.col === colIndex;
  active.value = { row: rowIndex, col: colIndex };
  // React deferred this to a `requestAnimationFrame` because its `active` state
  // was still stale inside the click closure. A Vue ref updates on the line
  // above, so the edit starts here and the frame hop is gone.
  if (column.isEditable !== false && !isEditingThisCell) beginEdit();
}

function isActiveCell(rowIndex: number, colIndex: number): boolean {
  return active.value.row === rowIndex && active.value.col === colIndex;
}

const cellPad = computed(() => (props.isDense ? 'px-2 py-1' : 'px-3 py-2'));

const headerClasses = computed(() => cn('border-b border-border font-medium text-muted-foreground', cellPad.value));

/** `width` is consumer-supplied CSS, so no unit is implied — Vue would not add one. */
function headerStyle(column: DataGridColumn<T>): Record<string, string | undefined> {
  return { width: column.width, textAlign: column.align ?? DataGridColumnAlign.Left };
}

function cellStyle(column: DataGridColumn<T>): Record<string, string> {
  return { textAlign: column.align ?? DataGridColumnAlign.Left };
}

function cellClasses(column: DataGridColumn<T>, rowIndex: number, colIndex: number): string {
  return cn(
    'relative cursor-cell whitespace-nowrap',
    cellPad.value,
    isActiveCell(rowIndex, colIndex) && 'bg-primary-soft/40 ring-2 ring-inset ring-primary',
    column.isEditable === false && 'cursor-default',
  );
}

/** The read-mode default under the `cell` slot, for columns without their own renderer. */
function displayValue(column: DataGridColumn<T>, row: T): string {
  const value = column.accessor(row);
  if (column.type === DataGridCellType.Boolean) return value ? '✓' : '·';
  return String(value ?? '');
}

const classes = computed(() =>
  cn('overflow-auto rounded-md border border-border bg-card text-sm', attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <!-- Scroll container only — the grid role lives on the <table> below.
       A `grid` may own nothing but rows/rowgroups, so putting `role="grid"`
       on a wrapper whose child is a (role `table`) <table> is an illegal
       accessibility tree (axe: aria-required-children). -->
  <div ref="el" v-bind="rest" :class="classes">
    <table
      ref="tableEl"
      role="grid"
      :aria-rowcount="rowCount + 1"
      :aria-colcount="colCount"
      :tabindex="0"
      :aria-activedescendant="rowCount > 0 ? cellId(active.row, active.col) : undefined"
      class="w-full border-collapse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      @keydown="onKeydown"
    >
      <thead role="rowgroup">
        <tr role="row" :aria-rowindex="1" class="bg-muted/40">
          <th
            v-for="(column, colIndex) in columns"
            :key="column.key"
            role="columnheader"
            :aria-colindex="colIndex + 1"
            scope="col"
            :style="headerStyle(column)"
            :class="headerClasses"
          >
            <slot name="header" :column="column">{{ column.header }}</slot>
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        <tr
          v-for="(row, rowIndex) in rows"
          :key="rowKey(row)"
          role="row"
          :aria-rowindex="rowIndex + 2"
          class="border-b border-border last:border-b-0"
        >
          <td
            v-for="(column, colIndex) in columns"
            :id="cellId(rowIndex, colIndex)"
            :key="column.key"
            role="gridcell"
            :aria-colindex="colIndex + 1"
            :aria-readonly="column.isEditable === false || undefined"
            :aria-selected="isActiveCell(rowIndex, colIndex) || undefined"
            :tabindex="isActiveCell(rowIndex, colIndex) ? 0 : -1"
            :style="cellStyle(column)"
            :class="cellClasses(column, rowIndex, colIndex)"
            @click="onCellClick(rowIndex, colIndex)"
          >
            <CellEditor
              v-if="editing && isActiveCell(rowIndex, colIndex)"
              v-model:value="draft"
              :type="column.type"
              :options="column.options"
              @commit="commitEdit"
              @cancel="cancelEdit"
            />
            <slot v-else name="cell" :row="row" :column="column" :row-index="rowIndex" :col-index="colIndex">
              <template v-if="column.cell">{{ column.cell(row) }}</template>
              <span v-else class="tabular-nums">{{ displayValue(column, row) }}</span>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
