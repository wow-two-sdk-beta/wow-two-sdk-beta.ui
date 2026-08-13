<script lang="ts">
/**
 * The prop surface of `AlertModalCancel`.
 *
 * React declared `extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>`;
 * attributes reach the root through `useAttrs` here, which leaves no declared prop.
 */
export type AlertModalCancelProps = Record<string, never>;
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, type ComponentPublicInstance } from 'vue';
import { cn } from '../../../foundation/utils';
import OverlayCloseButton from '../OverlayCloseButton.vue';

/* The dismissing button of an `AlertModal` — closes the dialog without firing an action. */
defineOptions({ name: 'AlertModalCancel', inheritAttrs: false });

/** The button label — React's `children`. */
defineSlots<{ default(): unknown }>();

const attrs = useAttrs();
const inner = useTemplateRef<ComponentPublicInstance & { el?: unknown }>('inner');

/**
 * Passed on to `OverlayCloseButton`, which merges it over its own chrome the way
 * React's `ModalClose` did — `cn` resolves the two, last-in wins per utility.
 */
const classes = computed(() =>
  cn(
    'inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

const el = computed(() => (inner.value?.$el ?? null) as HTMLElement | null);

defineExpose({ el });
</script>

<template>
  <OverlayCloseButton ref="inner" v-bind="rest" :class="classes"><slot /></OverlayCloseButton>
</template>
