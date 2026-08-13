<script lang="ts">
import type { ElementTag } from '../../../foundation/utils';

export interface TiltProps {
  /** The maximum rotation in degrees at the edges. Default `12`. */
  maxAngle?: number;

  /** The px perspective depth. Default `800`. */
  perspective?: number;

  /** The cursor-following highlight. */
  hasGlare?: boolean;

  /** The scale applied while tilted. Default `1`. */
  scale?: number;

  /** The rendered tag. Default `div`. */
  as?: ElementTag;
}

interface TiltState {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
  active: boolean;
}

const RESTING: TiltState = { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, active: false };
</script>

<script setup lang="ts">
import { computed, normalizeStyle, ref, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useReducedMotion } from '../../../foundation/hooks';

/**
 * 3D card tilt — `rotateX`/`rotateY` from cursor position. Disabled under
 * `prefers-reduced-motion`. `hasGlare` paints a cursor-following highlight.
 */
defineOptions({ name: 'Tilt', inheritAttrs: false });

/** The tilted content — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<TiltProps>(), {
  maxAngle: 12,
  perspective: 800,
  hasGlare: undefined,
  scale: 1,
  as: 'div',
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');
const reducedMotion = useReducedMotion();

const tilt = ref<TiltState>({ ...RESTING });

/*
 * React pulled `onPointerMove` / `onPointerLeave` out of props and called them
 * before its own handling. Here they stay in the fallthrough bag: Vue's
 * `mergeProps` chains a caller's handler with the one bound below, caller first
 * (`v-bind="rest"` precedes `@pointermove` in the template) — same order.
 */
function handleMove(e: PointerEvent): void {
  if (reducedMotion.value) return;
  const node = el.value;
  if (!node) return;
  const rect = node.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  tilt.value = {
    rotateX: (0.5 - y) * 2 * props.maxAngle,
    rotateY: (x - 0.5) * 2 * props.maxAngle,
    glareX: x * 100,
    glareY: y * 100,
    active: true,
  };
}

function handleLeave(): void {
  tilt.value = { ...RESTING };
}

const classes = computed(() => cn('relative', attrs.class as string | undefined));

/**
 * Vue does not append `px` to a numeric `:style` value the way React did, so
 * `perspective` is spelled out. `normalizeStyle` merges left → right, so a
 * caller's `style` lands last and wins — as React's `{ …, ...style }` did.
 */
const styles = computed(() =>
  normalizeStyle([
    {
      perspective: `${props.perspective}px`,
      transform:
        tilt.value.active && !reducedMotion.value
          ? `rotateX(${tilt.value.rotateX}deg) rotateY(${tilt.value.rotateY}deg) scale(${props.scale})`
          : 'rotateX(0) rotateY(0) scale(1)',
      transition: tilt.value.active ? 'transform 80ms ease-out' : 'transform 220ms ease-out',
      transformStyle: 'preserve-3d',
    },
    attrs.style,
  ]),
);

const showGlare = computed(() => Boolean(props.hasGlare) && !reducedMotion.value && tilt.value.active);

const glareStyle = computed(() => ({
  background: `radial-gradient(circle at ${tilt.value.glareX}% ${tilt.value.glareY}%, rgba(255,255,255,0.35) 0%, transparent 50%)`,
}));

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
    v-bind="rest"
    :class="classes"
    :style="styles"
    @pointermove="handleMove"
    @pointerleave="handleLeave"
  >
    <slot />
    <span
      v-if="showGlare"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-overlay"
      :style="glareStyle"
    />
  </component>
</template>
