<script lang="ts">
/* `Radius` is imported here (not in `<script setup>`) so the one binding serves
   as both the type below and the runtime value used in `withDefaults`. */
import { Radius } from '../../../foundation/utils';

/** Defines the surface background of a `Frame`. */
export const FrameSurface = {
  /** Refers to a raised card surface. */
  Card: 'card',
  /** Refers to a recessed muted surface. */
  Muted: 'muted',
  /** Refers to no surface fill (transparent). */
  Transparent: 'transparent',
} as const;

export type FrameSurface = (typeof FrameSurface)[keyof typeof FrameSurface];

export interface FrameProps {
  /** The padding. Default `4`. */
  padding?: '0' | '2' | '3' | '4' | '6' | '8';

  /** The border radius. Default `md`. */
  radius?: Radius;

  /** The surface background — `card` (raised) or `muted` (recessed). Default `card`. */
  surface?: FrameSurface;

  /** The border visibility. Default `true`. */
  isBordered?: boolean;
}

const PADDING: Record<NonNullable<FrameProps['padding']>, string> = {
  '0': '', '2': 'p-2', '3': 'p-3', '4': 'p-4', '6': 'p-6', '8': 'p-8',
};
const RADIUS: Record<Radius, string> = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};
const SURFACE: Record<FrameSurface, string> = {
  card: 'bg-card text-card-foreground',
  muted: 'bg-muted text-foreground',
  transparent: '',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * Bordered shell with padding + radius — `Card` without slot semantics.
 * Use when you want the visual but not the structured Header/Body/Footer.
 */
/* `<frame>` is a deprecated HTML element. This is a library component — imported,
   never globally registered — so the name cannot shadow the tag, and renaming it
   would break parity with the React package. */
// eslint-disable-next-line vue/no-reserved-component-names
defineOptions({ name: 'Frame', inheritAttrs: false });

const props = withDefaults(defineProps<FrameProps>(), {
  padding: '4',
  radius: Radius.Md,
  surface: FrameSurface.Card,
  isBordered: true,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const classes = computed(() =>
  cn(
    SURFACE[props.surface],
    PADDING[props.padding],
    RADIUS[props.radius],
    props.isBordered && 'border border-border',
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
  <div ref="el" v-bind="rest" :class="classes"><slot /></div>
</template>
