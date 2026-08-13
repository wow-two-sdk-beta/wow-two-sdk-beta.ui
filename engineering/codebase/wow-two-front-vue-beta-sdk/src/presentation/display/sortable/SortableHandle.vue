<script lang="ts">
/* eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an
   exported name: React declared `SortableHandleProps` and consumers import it.
   It was an alias for the native button props, all of which fall through here. */
export interface SortableHandleProps {}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn, Key } from '../../../foundation/utils';
import { useSortableItem, useSortableRoot } from './SortableContext';

/** The grab affordance of a `SortableItem`. Pointer arms the drag; Arrow Up/Down moves by one. */
defineOptions({ name: 'SortableHandle', inheritAttrs: false });

/** The handle glyph — React's `children`. */
defineSlots<{ default(): unknown }>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLButtonElement>('el');
const item = useSortableItem();
const root = useSortableRoot();

/* Own handler runs after any consumer `@keydown` that arrived through `rest`
   (React called `onKeyDown?.(e)` last instead); `defaultPrevented` is the
   consumer's opt-out either way. */
function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  if (event.key === Key.ArrowUp) {
    event.preventDefault();
    root.move(item.index, item.index - 1);
  } else if (event.key === Key.ArrowDown) {
    event.preventDefault();
    root.move(item.index, item.index + 1);
  }
}

const classes = computed(() =>
  cn(
    'inline-flex cursor-grab touch-none items-center justify-center text-subtle-foreground transition-colors hover:text-muted-foreground active:cursor-grabbing',
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <button
    ref="el"
    type="button"
    aria-label="Drag to reorder"
    aria-roledescription="sortable item handle"
    v-bind="rest"
    :class="classes"
    @pointerdown="item.arm"
    @pointerup="item.disarm"
    @blur="item.disarm"
    @keydown="onKeydown"
  >
    <slot />
  </button>
</template>
