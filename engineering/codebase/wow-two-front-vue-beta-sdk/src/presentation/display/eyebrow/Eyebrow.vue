<script lang="ts">
type EyebrowLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Defines the Eyebrow color tone. */
export const EyebrowTone = {
  /** Refers to the muted foreground. */
  Muted: 'muted',
  /** Refers to the subtle foreground. */
  Subtle: 'subtle',
  /** Refers to the default foreground. */
  Default: 'default',
} as const;

export type EyebrowTone = (typeof EyebrowTone)[keyof typeof EyebrowTone];

export interface EyebrowProps {
  /** The semantic heading level (1–6). Default 3. */
  level?: EyebrowLevel;

  /** The color tone. Default `muted`. */
  tone?: EyebrowTone;
}

const TONE: Record<NonNullable<EyebrowProps['tone']>, string> = {
  muted: 'text-muted-foreground',
  subtle: 'text-subtle-foreground',
  default: 'text-foreground',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * Tiny uppercase mini-heading — used above sections in drawers/cards
 * ("FULL TEXT", "SEGMENTS"). Lighter than `SectionHeader` (which is a
 * chunkier title+description+actions component). Standardised uppercase +
 * tracking treatment.
 */
defineOptions({ name: 'Eyebrow', inheritAttrs: false });

/** The eyebrow copy — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<EyebrowProps>(), {
  level: 3,
  tone: EyebrowTone.Muted,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLHeadingElement>('el');

const tag = computed(() => `h${props.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');

const classes = computed(() =>
  cn('text-[10px] font-semibold uppercase tracking-wider', TONE[props.tone], attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <component :is="tag" ref="el" v-bind="rest" :class="classes"><slot /></component>
</template>
