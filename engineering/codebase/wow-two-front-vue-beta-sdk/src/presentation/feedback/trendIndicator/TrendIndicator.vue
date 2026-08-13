<script lang="ts">
import type { Size } from '../../../foundation/utils';

export interface TrendIndicatorProps {
  /** The numeric delta — sign drives direction. */
  value: number;

  /** The optional value formatter (default: `${sign}${value}%`). Rich content → the `value` slot. */
  format?: (value: number) => string;

  /** The inverse-direction flag — when `true`, an increase reads as bad (e.g. error rate, churn). */
  isInverse?: boolean;

  /** The small trailing label, e.g. "vs last week". Rich content → the `label` slot. */
  label?: string;

  /** The text + icon scale. */
  size?: Size;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useSlots, useTemplateRef } from 'vue';
import { Minus, TrendingDown, TrendingUp } from 'lucide-vue-next';
import { cn, Size as SizeToken } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';

/* Only xs/sm/md carry a scale; other `Size` members fall through to `md` at
   the lookup below. */
const SIZE_TEXT: Partial<Record<Size, string>> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
};
const SIZE_ICON: Partial<Record<Size, number>> = {
  xs: 12,
  sm: 14,
  md: 16,
};

const ARROW = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

/**
 * Up / down / flat arrow + value + optional label. Used inside `Stat` and
 * dashboard tiles. Pass `isInverse` for metrics where higher is worse.
 */
defineOptions({ name: 'TrendIndicator', inheritAttrs: false });

const props = withDefaults(defineProps<TrendIndicatorProps>(), { size: SizeToken.Sm });

const attrs = useAttrs();
const slots = useSlots();
const el = useTemplateRef<HTMLSpanElement>('el');

const direction = computed<'up' | 'down' | 'flat'>(() =>
  props.value > 0 ? 'up' : props.value < 0 ? 'down' : 'flat',
);

const positive = computed(() =>
  direction.value === 'flat' ? false : (direction.value === 'up') !== Boolean(props.isInverse),
);

const tone = computed(() =>
  direction.value === 'flat'
    ? 'text-muted-foreground'
    : positive.value
      ? 'text-success'
      : 'text-destructive',
);

const arrow = computed(() => ARROW[direction.value]);

const display = computed(() =>
  props.format ? props.format(props.value) : `${props.value > 0 ? '+' : ''}${props.value}%`,
);

const iconSize = computed(() => SIZE_ICON[props.size] ?? SIZE_ICON.md);

const hasLabel = computed(() => Boolean(props.label) || Boolean(slots.label));

const classes = computed(() =>
  cn(
    'inline-flex items-center gap-1 font-medium',
    SIZE_TEXT[props.size] ?? SIZE_TEXT.md,
    tone.value,
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
  <span ref="el" v-bind="rest" :class="classes">
    <Icon :icon="arrow" :size="iconSize" />
    <slot name="value" :value="props.value" :display="display">{{ display }}</slot>
    <span v-if="hasLabel" class="text-muted-foreground">
      <slot name="label">{{ props.label }}</slot>
    </span>
  </span>
</template>
