<script lang="ts">
export interface SortableItemProps {
  /** The zero-based position of this item in the list. */
  index: number;
}
</script>

<script setup lang="ts">
import { computed, provide, ref, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { SortableItemKey, useSortableRoot, type SortableItemContextValue } from './SortableContext';

/** One reorderable row. Becomes `draggable` only while its `SortableHandle` is pressed. */
defineOptions({ name: 'SortableItem', inheritAttrs: false });

/** The row content — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = defineProps<SortableItemProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');
const root = useSortableRoot();

const armed = ref(false);

const isDragging = computed(() => root.dragIndex === props.index);
const isOver = computed(
  () => root.overIndex === props.index && root.dragIndex !== null && root.dragIndex !== props.index,
);

provide<SortableItemContextValue>(SortableItemKey, {
  get index() {
    return props.index;
  },
  arm: () => {
    armed.value = true;
  },
  disarm: () => {
    armed.value = false;
  },
});

function onDragStart(event: DragEvent): void {
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  root.begin(props.index);
}

function onDragOver(event: DragEvent): void {
  if (root.dragIndex !== null) event.preventDefault();
}

function onDrop(event: DragEvent): void {
  event.preventDefault();
  root.end();
  armed.value = false;
}

function onDragEnd(): void {
  root.end();
  armed.value = false;
}

const classes = computed(() =>
  cn('transition-opacity', isDragging.value && 'opacity-50', attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div
    ref="el"
    :draggable="armed"
    :data-dragging="isDragging || undefined"
    :data-over="isOver || undefined"
    v-bind="rest"
    :class="classes"
    @dragstart="onDragStart"
    @dragenter="root.hover(props.index)"
    @dragover="onDragOver"
    @drop="onDrop"
    @dragend="onDragEnd"
  >
    <slot />
  </div>
</template>
