<script lang="ts">
import type { Component, SVGAttributes } from 'vue';

export interface IconAdapterProps extends SVGAttributes {
  /**
   * The pixel size handed to the adapter. `number` only, NOT `number | string`.
   *
   * Component props are contravariant: an adapter satisfies this type only if it accepts every
   * prop declared here. `lucide-vue-next` types its own `size` as `number`, so widening this to
   * `number | string` — as the React original did, where the looser `SVGProps` made it moot —
   * makes every lucide icon unassignable to `IconAdapter` and forces an `as unknown as` cast at
   * each import site. Narrow is the fix; a CSS-unit size belongs on `class`, not on this prop.
   */
  size?: number;
}

export type IconAdapter = Component<IconAdapterProps>;

export interface IconProps extends Omit<SVGAttributes, 'aria-hidden'> {
  /** The icon component — pass a `lucide-vue-next` icon, custom SVG component, or any matching shape. */
  icon: IconAdapter;

  /** The pixel size of the rendered SVG. Default 20. */
  size?: number;

  /**
   * The aria-label for when the icon stands alone (decorative siblings
   * should pass it via parent). Sets `role="img"` and unhides from AT.
   * Without it, the icon is `aria-hidden` and decorative.
   */
  'aria-label'?: string;
}
</script>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cn } from '../utils/cn';

/**
 * Generic icon wrapper. Accepts any icon component matching the lucide-vue-next
 * shape (`{ size, color, class, ...svgAttrs }`).
 *
 * - Without `aria-label` → decorative, `aria-hidden`.
 * - With `aria-label` → semantic, `role="img"`.
 *
 * Every other SVG attribute falls through to the rendered icon, and — as with
 * the React original's trailing `{...rest}` — a caller-supplied attribute wins
 * over the wrapper's own binding.
 */
defineOptions({ name: 'Icon' });

withDefaults(
  defineProps<{
    /** The icon component — pass a `lucide-vue-next` icon, custom SVG component, or any matching shape. */
    icon: IconAdapter;
    /** The pixel size of the rendered SVG. Default 20. */
    size?: number;
  }>(),
  { size: 20 },
);

const attrs = useAttrs();

/** `aria-label` arrives as a fallthrough attr; its presence flips the icon from decorative to semantic. */
const labelled = computed(() => attrs['aria-label'] != null);
</script>

<template>
  <component
    :is="icon"
    :size="size"
    :class="cn('shrink-0')"
    :aria-hidden="labelled ? undefined : true"
    :role="labelled ? 'img' : undefined"
    focusable="false"
  />
</template>
