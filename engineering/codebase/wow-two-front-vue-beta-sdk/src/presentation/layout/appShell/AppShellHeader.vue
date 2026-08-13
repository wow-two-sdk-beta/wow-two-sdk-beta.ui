<script lang="ts">
/**
 * The prop surface of `AppShellHeader`.
 *
 * React declared `HTMLAttributes<HTMLElement>`; attributes reach the root
 * through `useAttrs` here and `children` is the default slot, which leaves no
 * declared prop.
 */
export type AppShellHeaderProps = Record<string, never>;
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/* Sticky top bar of the shell — the `header` grid area. */
defineOptions({ name: 'AppShellHeader', inheritAttrs: false });

/** The header content — React's `children`. */
defineSlots<{ default?(): unknown }>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const classes = computed(() =>
  cn(
    'sticky top-0 z-sticky flex h-14 items-center gap-3 border-b border-border bg-card px-4 [grid-area:header]',
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
  <header ref="el" role="banner" v-bind="rest" :class="classes"><slot /></header>
</template>
