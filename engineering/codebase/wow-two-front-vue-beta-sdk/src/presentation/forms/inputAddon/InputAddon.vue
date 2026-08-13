<script lang="ts">
export interface InputAddonProps {
  /** The text rendered to the left of the input (e.g. "https://"). Fill the `leading` slot for richer content. */
  leading?: string | number;

  /** The text rendered to the right of the input (e.g. ".com"). Fill the `trailing` slot for richer content. */
  trailing?: string | number;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useSlots, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';

/**
 * Wrap any input with leading and/or trailing addon slots — visually
 * connected to the input border. Common for protocol prefixes, units,
 * suffixes ("https://", ".com", "kg").
 *
 * Each of React's two `ReactNode` props keeps its scalar form and gains a
 * same-named slot for richer content; the prop stays the discriminator.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'InputAddon', inheritAttrs: false });

const props = defineProps<InputAddonProps>();

/** The input element (TextInput, EmailInput, …) — React's `children`. */
defineSlots<{
  default(): unknown;
  leading?(): unknown;
  trailing?(): unknown;
}>();

const attrs = useAttrs();
const slots = useSlots();

const hasLeading = computed(() => Boolean(props.leading) || Boolean(slots.leading));
const hasTrailing = computed(() => Boolean(props.trailing) || Boolean(slots.trailing));

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    'inline-flex w-full items-stretch [&>*]:rounded-none',
    '[&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md',
    '[&>*:not(:first-child)]:-ml-px',
    attrs.class as ClassValue,
  ),
);

const ADDON_CLASS =
  'inline-flex shrink-0 items-center border border-input bg-muted px-3 text-sm text-muted-foreground';

const root = useTemplateRef<HTMLDivElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div ref="root" :class="rootClass" v-bind="passthroughAttrs">
    <span v-if="hasLeading" :class="ADDON_CLASS">
      <slot name="leading">{{ leading }}</slot>
    </span>
    <slot />
    <span v-if="hasTrailing" :class="ADDON_CLASS">
      <slot name="trailing">{{ trailing }}</slot>
    </span>
  </div>
</template>
