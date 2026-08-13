<script lang="ts">
/**
 * Defines props for a `Legend`.
 *
 * React's `HTMLAttributes<HTMLLegendElement>` has no Vue counterpart — every
 * native attribute is a fallthrough attr and lands on the `<legend>` unchanged.
 * The name is kept so consumers importing `LegendProps` still resolve.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LegendProps {}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';

/**
 * `<legend>` styled to match `Label`. Pair with `Fieldset`.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'Legend', inheritAttrs: false });

const attrs = useAttrs();

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn('mb-2 text-sm font-medium text-foreground', attrs.class as ClassValue),
);

const root = useTemplateRef<HTMLLegendElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <legend ref="root" :class="rootClass" v-bind="passthroughAttrs">
    <slot />
  </legend>
</template>
