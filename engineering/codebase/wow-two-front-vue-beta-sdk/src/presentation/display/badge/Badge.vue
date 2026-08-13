<script lang="ts">
import type { Size } from '../../../foundation/utils';
import type { BadgeVariant } from './Badge.variants';

export interface BadgeProps {
  /** The color treatment. */
  variant?: BadgeVariant;
  /** The size step. */
  size?: Size;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { badgeVariants, type BadgeVariants } from './Badge.variants';

/**
 * Pill-shaped status / category indicator. Non-interactive — for clickable
 * use `Tag`. For severity-tinted callouts at message scale, use `Alert*`.
 */
defineOptions({ name: 'Badge', inheritAttrs: false });

/** The badge copy — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = defineProps<BadgeProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLSpanElement>('el');

const classes = computed(() =>
  cn(
    badgeVariants({
      variant: props.variant,
      size: props.size as BadgeVariants['size'],
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
  <span ref="el" v-bind="rest" :class="classes"><slot /></span>
</template>
