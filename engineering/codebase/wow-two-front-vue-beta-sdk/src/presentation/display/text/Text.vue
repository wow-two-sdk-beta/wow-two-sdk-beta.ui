<script lang="ts">
import type { ElementType } from '../../../foundation/dom';
import type { Size } from '../../../foundation/styles';
import type { TextAlign, TextColor, TextWeight } from './Text.variants';

export interface TextProps {
  readonly as?: ElementType;
  /** The font size step. */
  readonly size?: Size;
  /** The font weight. */
  readonly weight?: TextWeight;
  /** The color role. */
  readonly color?: TextColor;
  /** The text alignment. */
  readonly align?: TextAlign;
  /** The single-line truncation with an ellipsis. */
  readonly isTruncated?: boolean;
  /** The tabular (fixed-width) figures treatment. */
  readonly isTabular?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/styles';
import { textVariants } from './Text.variants';

/** Renders body text as a `<p>`, or as any element given to `as` to match surrounding semantics. */
defineOptions({ name: 'Text', inheritAttrs: false });

/** The text content — React's `children`. */
defineSlots<{ default(): unknown }>();

/**
 * `isTruncated` / `isTabular` default to `undefined`, not `false`: Vue casts an
 * absent `Boolean` prop to `false`, which would hand `textVariants` an explicit
 * `false` where React handed it `undefined`. Same rendered class either way for
 * these two, but the tri-state is what the variants config expects.
 */
const props = withDefaults(defineProps<TextProps>(), {
  as: 'p',
  isTruncated: undefined,
  isTabular: undefined,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const classes = computed(() =>
  cn(
    textVariants({
      size: props.size,
      weight: props.weight,
      color: props.color,
      align: props.align,
      isTruncated: props.isTruncated,
      isTabular: props.isTabular,
    }),
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
  <component :is="props.as" ref="el" v-bind="rest" :class="classes"><slot /></component>
</template>
