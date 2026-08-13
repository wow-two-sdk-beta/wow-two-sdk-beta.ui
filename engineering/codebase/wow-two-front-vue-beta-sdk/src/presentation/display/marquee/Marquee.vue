<script lang="ts">
/** Defines the Marquee scroll direction. */
export const MarqueeDirection = {
  /** Refers to leftward horizontal scroll. */
  Left: 'left',
  /** Refers to rightward horizontal scroll. */
  Right: 'right',
  /** Refers to upward vertical scroll. */
  Up: 'up',
  /** Refers to downward vertical scroll. */
  Down: 'down',
} as const;

export type MarqueeDirection = (typeof MarqueeDirection)[keyof typeof MarqueeDirection];

export interface MarqueeProps {
  /** The scroll direction. Default `left`. */
  direction?: MarqueeDirection;

  /** The seconds for one full traversal of the inner content. */
  speed?: number;

  /** The pause-while-hovered behaviour. Default `true`. */
  canPauseOnHover?: boolean;

  /** The px gap between repeated items. Default `48`. */
  gap?: number;
}

/* The two track copies. Index `1` is the aria-hidden duplicate that makes the
   -50% keyframes loop seamlessly. */
const COPIES = [0, 1] as const;
</script>

<script setup lang="ts">
import { computed, normalizeStyle, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useReducedMotion } from '../../../foundation/hooks';

/**
 * Continuously scrolls children. Content is duplicated once for a seamless
 * loop animated by `-50%`. Pause-on-hover toggles `animation-play-state`.
 */
defineOptions({ name: 'Marquee', inheritAttrs: false });

/** The scrolled content — React's required `children`. Rendered once per copy. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<MarqueeProps>(), {
  direction: 'left',
  speed: 30,
  canPauseOnHover: true,
  gap: 48,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');
const reducedMotion = useReducedMotion();

const horizontal = computed(() => props.direction === 'left' || props.direction === 'right');
const reverse = computed(() => props.direction === 'right' || props.direction === 'down');
const animationName = computed(() => (horizontal.value ? 'marquee-x' : 'marquee-y'));

const classes = computed(() =>
  cn(
    'group/marquee relative overflow-hidden',
    horizontal.value ? 'flex' : 'flex flex-col',
    attrs.class as string | undefined,
  ),
);

/** `normalizeStyle` merges left → right, so a caller's `style` lands last and wins. */
const styles = computed(() =>
  normalizeStyle([{ '--marquee-gap': `${props.gap}px` }, attrs.style]),
);

const trackClasses = computed(() =>
  cn(
    'flex shrink-0',
    horizontal.value ? 'items-center' : 'flex-col items-center',
    props.canPauseOnHover && 'group-hover/marquee:[animation-play-state:paused]',
  ),
);

const trackStyle = computed(() => ({
  animation: reducedMotion.value
    ? undefined
    : `${animationName.value} ${props.speed}s linear infinite ${reverse.value ? 'reverse' : 'normal'}`,
}));

const copyClasses = computed(() =>
  cn('shrink-0', horizontal.value ? 'flex items-center' : 'flex flex-col items-center'),
);

/** Vue does not append `px` to a numeric `:style` value, so every length is spelled out. */
const copyStyle = computed(() => ({
  gap: `${props.gap}px`,
  paddingInline: horizontal.value ? `${props.gap / 2}px` : '0px',
  paddingBlock: horizontal.value ? '0px' : `${props.gap / 2}px`,
}));

/** Everything but `class` / `style`, both re-applied above. */
const rest = computed(() => {
  const { class: _class, style: _style, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div
    ref="el"
    role="marquee"
    :data-direction="props.direction"
    v-bind="rest"
    :class="classes"
    :style="styles"
  >
    <!-- Single animated track holding both copies — each copy is exactly
         50% of the track, so the -50% keyframes loop seamlessly. -->
    <div :class="trackClasses" :style="trackStyle">
      <div
        v-for="copy in COPIES"
        :key="copy"
        :aria-hidden="copy === 1"
        :class="copyClasses"
        :style="copyStyle"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
