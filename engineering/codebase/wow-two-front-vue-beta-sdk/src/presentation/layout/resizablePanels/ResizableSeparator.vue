<script lang="ts">
export interface ResizableSeparatorProps {
  isDisabled?: boolean;
}
</script>

<script setup lang="ts">
import { computed, onUnmounted, ref, useAttrs, useTemplateRef } from 'vue';
import { cn, composeEventHandlers, Orientation } from '../../../foundation/utils';
import { useResizableContext } from './ResizablePanels.vue';

/** The draggable rule between two `<ResizablePanel>`s. Arrow keys nudge, double-click resets the pair. */
defineOptions({ name: 'ResizableSeparator', inheritAttrs: false });

const props = withDefaults(defineProps<ResizableSeparatorProps>(), { isDisabled: false });

const context = useResizableContext();
const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const token = Symbol('wow-two.resizableSeparator');
context.registerSeparator(token);
onUnmounted(() => context.unregisterSeparator(token));

const index = computed(() => context.separatorIndex(token));
const dragging = ref(false);

function handleMouseDown(e: MouseEvent): void {
  if (props.isDisabled) return;
  if (e.button !== 0) return;
  e.preventDefault();
  dragging.value = true;
  context.beginDrag(index.value, e);
  const onUp = (): void => {
    dragging.value = false;
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mouseup', onUp);
}

function handleKeydown(e: KeyboardEvent): void {
  if (props.isDisabled) return;
  const step = e.shiftKey ? 10 : 1;
  if (context.orientation === Orientation.Horizontal) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      context.nudge(index.value, -step);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      context.nudge(index.value, step);
    }
  } else {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      context.nudge(index.value, -step);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      context.nudge(index.value, step);
    }
  }
}

function handleDblclick(): void {
  if (props.isDisabled) return;
  context.resetPair(index.value);
}

/** A fallthrough listener may already be a chain; flatten it to one callable. */
function asHandler<E extends Event>(value: unknown): ((event: E) => void) | undefined {
  if (typeof value === 'function') return value as (event: E) => void;
  if (Array.isArray(value)) {
    return (event) => {
      for (const fn of value) if (typeof fn === 'function') fn(event);
    };
  }
  return undefined;
}

/*
 * React ran the consumer's handler first, then skipped its own when the consumer
 * called `preventDefault()`. Vue's own attr merge would run both unconditionally,
 * so the two are composed by hand through the house helper instead.
 */
const onKeydown = computed(() => composeEventHandlers<KeyboardEvent>(asHandler(attrs.onKeydown), handleKeydown));
const onDblclick = computed(() => composeEventHandlers<MouseEvent>(asHandler(attrs.onDblclick), handleDblclick));

// Announce the panel BEFORE the separator — ArrowRight/ArrowDown grow it, so size moves with the key.
const ariaValueNow = computed(() => Math.round(context.sizes[index.value] ?? 50));
const panelBefore = computed(() => context.panels[index.value]);

const classes = computed(() =>
  cn(
    'flex shrink-0 items-center justify-center bg-border transition-colors',
    context.orientation === Orientation.Horizontal
      ? 'w-1 cursor-col-resize hover:bg-border-strong data-[dragging]:bg-primary'
      : 'h-1 cursor-row-resize hover:bg-border-strong data-[dragging]:bg-primary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    props.isDisabled && 'cursor-default opacity-50 hover:bg-border',
    attrs.class as string | undefined,
  ),
);

/** Everything but `class` and the two composed listeners, all re-applied above. */
const rest = computed(() => {
  const { class: _class, onKeydown: _keydown, onDblclick: _dblclick, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div
    ref="el"
    role="separator"
    :aria-orientation="context.orientation === Orientation.Horizontal ? 'vertical' : 'horizontal'"
    :aria-valuenow="ariaValueNow"
    :aria-valuemin="panelBefore?.minSize ?? 0"
    :aria-valuemax="panelBefore?.maxSize ?? 100"
    :aria-disabled="isDisabled || undefined"
    :tabindex="isDisabled ? -1 : 0"
    :data-dragging="dragging || undefined"
    v-bind="rest"
    :class="classes"
    @mousedown="handleMouseDown"
    @keydown="onKeydown"
    @dblclick="onDblclick"
  />
</template>
