<script lang="ts">
/**
 * The prop surface of `AlertModalAction`.
 *
 * React declared `extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>`
 * plus an `onAction` callback; attributes reach the root through `useAttrs` here
 * and `onAction` is the `action` emit, which leaves no declared prop.
 */
export type AlertModalActionProps = Record<string, never>;
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, type ComponentPublicInstance } from 'vue';
import { cn } from '../../../foundation/utils';
import OverlayCloseButton from '../OverlayCloseButton.vue';

/* The confirming button of an `AlertModal` — fires `action`, then closes the dialog. */
defineOptions({ name: 'AlertModalAction', inheritAttrs: false });

/** The button label — React's `children`. */
defineSlots<{ default(): unknown }>();

const emit = defineEmits<{
  /** Replaces React's `onAction`. Fires when the action is confirmed, before the dialog closes. */
  action: [];
}>();

const attrs = useAttrs();
const inner = useTemplateRef<ComponentPublicInstance & { el?: unknown }>('inner');

/**
 * Passed on to `OverlayCloseButton`, which merges it over its own chrome the way
 * React's `ModalClose` did — `cn` resolves the two, last-in wins per utility.
 */
const classes = computed(() =>
  cn(
    'inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

/**
 * Declared after `v-bind="rest"`, so Vue chains the caller's own handler first
 * and this one second; `OverlayCloseButton`'s close runs last. React's order.
 */
function handleClick(event: MouseEvent): void {
  if (event.defaultPrevented) return;
  emit('action');
}

const el = computed(() => (inner.value?.$el ?? null) as HTMLElement | null);

defineExpose({ el });
</script>

<template>
  <OverlayCloseButton ref="inner" v-bind="rest" :class="classes" @click="handleClick">
    <slot />
  </OverlayCloseButton>
</template>
