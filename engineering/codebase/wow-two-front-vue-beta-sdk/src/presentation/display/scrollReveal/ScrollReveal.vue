<script lang="ts">
import type { ElementTag } from '../../../foundation/utils';

/** Defines the ScrollReveal enter-viewport animation. */
export const ScrollRevealEffect = {
  /** Refers to a plain opacity fade. */
  Fade: 'fade',
  /** Refers to a fade + upward slide. */
  SlideUp: 'slide-up',
  /** Refers to a fade + downward slide. */
  SlideDown: 'slide-down',
  /** Refers to a fade + leftward slide. */
  SlideLeft: 'slide-left',
  /** Refers to a fade + rightward slide. */
  SlideRight: 'slide-right',
  /** Refers to a fade + scale-in zoom. */
  Zoom: 'zoom',
} as const;

export type ScrollRevealEffect = (typeof ScrollRevealEffect)[keyof typeof ScrollRevealEffect];

export interface ScrollRevealProps {
  /** The enter animation. Default `fade`. */
  effect?: ScrollRevealEffect;

  /** The transition length in ms. Default `600`. */
  duration?: number;

  /** The transition delay in ms. Default `0`. */
  delay?: number;

  /** The IntersectionObserver visibility ratio that counts as revealed. Default `0.1`. */
  threshold?: number;

  /** The reveal-once flag — `false` re-hides when scrolled back out. Default `true`. */
  isOnce?: boolean;

  /** The rendered tag. Default `div`. */
  as?: ElementTag;
}

const HIDDEN_TRANSFORMS: Record<ScrollRevealEffect, string> = {
  fade: '',
  'slide-up': 'translateY(20px)',
  'slide-down': 'translateY(-20px)',
  'slide-left': 'translateX(20px)',
  'slide-right': 'translateX(-20px)',
  zoom: 'scale(0.95)',
};
</script>

<script setup lang="ts">
import { computed, normalizeStyle, onBeforeUnmount, onMounted, ref, useAttrs, useTemplateRef, watch } from 'vue';
import { cn } from '../../../foundation/utils';
import { useReducedMotion } from '../../../foundation/hooks';

/**
 * Reveal children on enter-viewport. CSS-driven (opacity + transform);
 * IntersectionObserver toggles `data-revealed`. Honors
 * `prefers-reduced-motion` (no transform / opacity at all — content visible
 * from the start).
 */
defineOptions({ name: 'ScrollReveal', inheritAttrs: false });

/** The revealed content — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<ScrollRevealProps>(), {
  effect: 'fade',
  duration: 600,
  delay: 0,
  threshold: 0.1,
  isOnce: true,
  as: 'div',
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');
/* Called before the lifecycle hooks below so its own `onMounted` subscription
   lands first and the flag is already settled when `observe` fires. */
const reducedMotion = useReducedMotion();

const revealed = ref(false);

/*
 * React's `useEffect` on `[reduced, threshold, isOnce]`. Kicked off from
 * `onMounted` rather than an `immediate` watcher because the observer needs the
 * element, which only exists after mount.
 */
let observer: IntersectionObserver | undefined;

function disconnect(): void {
  observer?.disconnect();
  observer = undefined;
}

function observe(): void {
  disconnect();

  if (reducedMotion.value) {
    revealed.value = true;
    return;
  }

  const node = el.value;
  if (!node || typeof IntersectionObserver === 'undefined') {
    revealed.value = true;
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          revealed.value = true;
          if (props.isOnce) disconnect();
        } else if (!props.isOnce) {
          revealed.value = false;
        }
      }
    },
    { threshold: props.threshold },
  );
  observer.observe(node);
}

onMounted(observe);

watch([reducedMotion, () => props.threshold, () => props.isOnce], observe);

onBeforeUnmount(disconnect);

const classes = computed(() => cn(attrs.class as string | undefined));

/** `normalizeStyle` merges left → right, so a caller's `style` lands last and wins — as React's `{ …, ...style }` did. */
const styles = computed(() =>
  normalizeStyle([
    {
      opacity: revealed.value || reducedMotion.value ? 1 : 0,
      transform: revealed.value || reducedMotion.value ? 'none' : HIDDEN_TRANSFORMS[props.effect],
      transition: reducedMotion.value
        ? undefined
        : `opacity ${props.duration}ms ease-out ${props.delay}ms, transform ${props.duration}ms ease-out ${props.delay}ms`,
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
  <component
    :is="props.as"
    ref="el"
    :data-revealed="revealed || undefined"
    v-bind="rest"
    :class="classes"
    :style="styles"
  >
    <slot />
  </component>
</template>
