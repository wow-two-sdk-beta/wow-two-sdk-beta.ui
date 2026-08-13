<script lang="ts">
/**
 * The prop surface of `AppShellMain`.
 *
 * React declared `HTMLAttributes<HTMLElement>`; attributes reach the root
 * through `useAttrs` here and `children` is the default slot, which leaves no
 * declared prop.
 */
export type AppShellMainProps = Record<string, never>;
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * The primary column — the `main` grid area, and the skip-link's target.
 *
 * `id` and `tabindex` are bound before `v-bind="rest"` so a caller-supplied
 * value still wins, matching React's attribute-then-spread order.
 */
defineOptions({ name: 'AppShellMain', inheritAttrs: false });

/** The page content — React's `children`. */
defineSlots<{ default?(): unknown }>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const classes = computed(() =>
  cn('flex flex-col [grid-area:main] focus:outline-none', attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <main ref="el" id="app-shell-main" tabindex="-1" v-bind="rest" :class="classes">
    <slot />
  </main>
</template>
