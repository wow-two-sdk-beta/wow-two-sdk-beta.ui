<script lang="ts">
/* eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an
   exported name: React declared `SortableProps` and consumers import it. Its one
   member, `onReorder`, is the `reorder` emit below; every div attribute falls through. */
export interface SortableProps {}
</script>

<script setup lang="ts">
import { computed, provide, ref, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { SortableKey, type SortableContextValue } from './SortableContext';

/**
 * Drag-to-reorder list. Headless behavior + minimal styling — consumers render their own rows.
 * Reorder fires the `reorder` emit; the consumer owns the array and re-renders.
 * Drag is handle-initiated (the row only becomes draggable while a `SortableHandle` is pressed),
 * so inputs/selects inside a row stay interactive. Keyboard: focus a handle, Arrow Up/Down to move.
 *
 * React attached the parts as `Sortable.Item` / `.Handle` via `Object.assign`. An SFC's
 * generated default export cannot carry statics cleanly, so they ship as siblings:
 * `SortableItem`, `SortableHandle`.
 */
defineOptions({ name: 'Sortable', inheritAttrs: false });

/** The `SortableItem` rows — React's `children`. */
defineSlots<{ default(): unknown }>();

/**
 * React's `onReorder`. Emits the `from`/`to` indices when a drag or keyboard move
 * completes — move the item at `from` to `to`. Indices are raw; clamp in the handler.
 */
const emit = defineEmits<{
  reorder: [from: number, to: number];
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const dragIndex = ref<number | null>(null);
const overIndex = ref<number | null>(null);
/* Plain locals, not refs — React held these in `useRef` because the drop handler
   must read the latest values without waiting for a re-render. */
let dragged: number | null = null;
let over: number | null = null;

function begin(index: number): void {
  dragged = index;
  dragIndex.value = index;
}

function hover(index: number): void {
  over = index;
  overIndex.value = index;
}

function end(): void {
  const from = dragged;
  const to = over;
  if (from !== null && to !== null && from !== to) emit('reorder', from, to);
  dragged = null;
  over = null;
  dragIndex.value = null;
  overIndex.value = null;
}

function move(from: number, to: number): void {
  if (from !== to && to >= 0) emit('reorder', from, to);
}

/* Live getters on the two indices — every mounted item reads them each render. */
provide<SortableContextValue>(SortableKey, {
  get dragIndex() {
    return dragIndex.value;
  },
  get overIndex() {
    return overIndex.value;
  },
  begin,
  hover,
  end,
  move,
});

const classes = computed(() => cn('flex flex-col', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div ref="el" v-bind="rest" :class="classes"><slot /></div>
</template>
