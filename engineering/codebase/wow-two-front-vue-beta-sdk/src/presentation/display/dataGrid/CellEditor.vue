<script lang="ts">
import { DataGridCellType, type DataGridMove } from './DataGridTypes';

export interface CellEditorProps {
  /** The cell's editable data type — decides which editor renders. Default `text`. */
  type?: DataGridCellType;
  /** The choices for a `select` cell. */
  options?: Array<{ value: string | number; label: string | number }>;
  /** The draft text under edit. */
  value: string;
}

const BASE_CLASS =
  'h-7 w-full rounded-sm border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
</script>

<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from 'vue';

/**
 * The active cell's editor. Private to the folder — React kept it in the same
 * file and never exported it, and the folder barrel still does not.
 *
 * React drove focus from the parent through a forwarded ref; here the editor
 * focuses itself on mount, which removes the ref plumbing and is immune to the
 * mount/unmount ordering of two cells swapping in one patch.
 */
defineOptions({ name: 'CellEditor' });

const props = withDefaults(defineProps<CellEditorProps>(), {
  type: undefined,
  options: undefined,
});

const emit = defineEmits<{
  /** Fires with the editor's current text on every keystroke or selection. */
  'update:value': [value: string];
  /** Fires when the edit commits, with the cursor advance and the fresh raw text. */
  commit: [move?: DataGridMove, rawValue?: string];
  /** Fires when the edit is abandoned. */
  cancel: [];
}>();

const el = useTemplateRef<HTMLInputElement | HTMLSelectElement>('el');

onMounted(() => {
  const node = el.value;
  if (!node) return;
  node.focus();
  if ('select' in node && typeof node.select === 'function') node.select();
});

const isSelect = computed(() => props.type === DataGridCellType.Select && !!props.options);
const isBoolean = computed(() => props.type === DataGridCellType.Boolean);
const inputType = computed(() => (props.type === DataGridCellType.Number ? 'number' : 'text'));

/** A `<select>` change is both the edit and its commit — React committed with the fresh
    value because the parent's draft state was still stale in the same event. */
function onSelectChange(event: Event): void {
  const next = (event.target as HTMLSelectElement).value;
  emit('update:value', next);
  emit('commit', 'down', next);
}

function onInput(event: Event): void {
  emit('update:value', (event.target as HTMLInputElement).value);
}

function onBlur(): void {
  emit('commit');
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('cancel');
  }
}
</script>

<template>
  <select
    v-if="isSelect"
    ref="el"
    :value="value"
    :class="BASE_CLASS"
    @change="onSelectChange"
    @blur="onBlur"
    @keydown="onKeydown"
  >
    <option v-for="option in options" :key="String(option.value)" :value="String(option.value)">
      {{ String(option.label) }}
    </option>
  </select>
  <select
    v-else-if="isBoolean"
    ref="el"
    :value="value"
    :class="BASE_CLASS"
    @change="onSelectChange"
    @blur="onBlur"
    @keydown="onKeydown"
  >
    <option value="true">true</option>
    <option value="false">false</option>
  </select>
  <input
    v-else
    ref="el"
    :type="inputType"
    :value="value"
    :class="BASE_CLASS"
    @input="onInput"
    @blur="onBlur"
    @keydown="onKeydown"
  />
</template>
