<script lang="ts">
import type { ElementTag } from '../../../foundation/utils';

/** Defines the gradient sweep direction (compass shorthand). */
export const GradientTextDirection = {
  /** Refers to a left-to-right sweep. */
  Right: 'r',
  /** Refers to a right-to-left sweep. */
  Left: 'l',
  /** Refers to a bottom-to-top sweep. */
  Top: 't',
  /** Refers to a top-to-bottom sweep. */
  Bottom: 'b',
  /** Refers to a bottom-left-to-top-right sweep. */
  TopRight: 'tr',
  /** Refers to a top-left-to-bottom-right sweep. */
  BottomRight: 'br',
  /** Refers to a top-right-to-bottom-left sweep. */
  TopLeft: 'tl',
  /** Refers to a bottom-right-to-top-left sweep. */
  BottomLeft: 'bl',
} as const;

export type GradientTextDirection =
  (typeof GradientTextDirection)[keyof typeof GradientTextDirection];

export interface GradientTextProps {
  /** The first color stop. Default `var(--color-primary)`. */
  from?: string;

  /** The optional middle color stop. */
  via?: string;

  /** The last color stop. Default `var(--color-accent, var(--color-primary))`. */
  to?: string;

  /** The sweep direction. Default `r`. */
  direction?: GradientTextDirection;

  /** The gradient-pan animation, skipped under `prefers-reduced-motion`. */
  isAnimated?: boolean;

  /** The rendered tag. Default `span`. */
  as?: ElementTag;
}

const DIR_TO_DEG: Record<GradientTextDirection, number> = {
  r: 90,
  l: 270,
  t: 0,
  b: 180,
  tr: 45,
  br: 135,
  bl: 225,
  tl: 315,
};
</script>

<script setup lang="ts">
import { computed, normalizeStyle, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * Decorative gradient-filled text via `background-clip: text`. Optional
 * `isAnimated` pans the gradient on a 4s loop (skipped under
 * `prefers-reduced-motion` via the global `motion-reduce:` CSS guard).
 */
defineOptions({ name: 'GradientText', inheritAttrs: false });

/** The gradient-filled copy — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<GradientTextProps>(), {
  from: 'var(--color-primary)',
  via: undefined,
  to: 'var(--color-accent, var(--color-primary))',
  direction: 'r',
  isAnimated: undefined,
  as: 'span',
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const stops = computed(() =>
  props.via ? `${props.from}, ${props.via}, ${props.to}` : `${props.from}, ${props.to}`,
);

const classes = computed(() =>
  cn(
    'inline-block bg-clip-text text-transparent',
    props.isAnimated && 'motion-safe:animate-[gradient-shift_4s_ease-in-out_infinite]',
    attrs.class as string | undefined,
  ),
);

/** `normalizeStyle` merges left → right, so a caller's `style` lands last and wins — as React's `{ …, ...style }` did. */
const styles = computed(() =>
  normalizeStyle([
    {
      backgroundImage: `linear-gradient(${DIR_TO_DEG[props.direction]}deg, ${stops.value})`,
      backgroundSize: props.isAnimated ? '200% 100%' : undefined,
    },
    attrs.style,
  ]),
);

/** Everything but `class` / `style`, both re-applied above. */
const rest = computed(() => {
  const { class: _class, style: _style, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <component :is="props.as" ref="el" v-bind="rest" :class="classes" :style="styles">
    <slot />
  </component>
</template>
