<script lang="ts">
/** Defines the Stat tile visual size. */
export const StatSize = {
  /** Refers to the small tile. */
  Sm: 'sm',
  /** Refers to the medium tile. */
  Md: 'md',
  /** Refers to the large tile. */
  Lg: 'lg',
} as const;

export type StatSize = (typeof StatSize)[keyof typeof StatSize];

/** The optional trend readout — positive = up/green, negative = down/red. */
export interface StatTrend {
  /** The signed percentage. */
  value: number;

  /** The muted caption rendered after the percentage. */
  label?: string | number;
}

export interface StatProps {
  /** The label above the value. Rich content goes through the `label` slot. */
  label: string | number;

  /** The primary value (large). Rich content goes through the `value` slot. */
  value: string | number;

  /** The optional trend — positive = up/green, negative = down/red. */
  trend?: StatTrend;

  /** The optional helper / supporting text below. Rich content goes through the `helper` slot. */
  helper?: string | number;

  /** The visual size. Default `md`. */
  size?: StatSize;
}

const VALUE_SIZE: Record<StatSize, '2xl' | '3xl' | '4xl'> = {
  sm: '2xl',
  md: '3xl',
  lg: '4xl',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { TrendingDown, TrendingUp } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';
import Heading from '../heading/Heading.vue';
import Text from '../text/Text.vue';

/**
 * Single metric tile — label + big value + optional trend + helper. Use
 * inside dashboards / KPI grids.
 */
defineOptions({ name: 'Stat', inheritAttrs: false });

defineSlots<{
  /** The rich override for the `label` prop. */
  label?(): unknown;
  /** The rich override for the `value` prop. */
  value?(): unknown;
  /** The rich override for the `helper` prop. */
  helper?(): unknown;
}>();

const props = withDefaults(defineProps<StatProps>(), { size: 'md' });

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const trendUp = computed(() => (props.trend ? props.trend.value >= 0 : false));

const valueSize = computed(() => VALUE_SIZE[props.size]);

const classes = computed(() =>
  cn('flex flex-col gap-1', attrs.class as string | undefined),
);

const trendClasses = computed(() =>
  cn(
    'inline-flex items-center gap-0.5 text-xs font-medium',
    trendUp.value ? 'text-success' : 'text-destructive',
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
  <div ref="el" v-bind="rest" :class="classes">
    <Text size="sm" color="muted"><slot name="label">{{ props.label }}</slot></Text>
    <Heading :level="3" :size="valueSize" weight="bold">
      <slot name="value">{{ props.value }}</slot>
    </Heading>
    <div v-if="props.trend || props.helper" class="mt-1 flex items-center gap-2">
      <span v-if="props.trend" :class="trendClasses">
        <Icon :icon="trendUp ? TrendingUp : TrendingDown" :size="12" />
        {{ props.trend.value > 0 ? '+' : '' }}{{ props.trend.value }}%
        <span v-if="props.trend.label" class="text-muted-foreground"> {{ props.trend.label }}</span>
      </span>
      <Text v-if="props.helper && !props.trend" size="xs" color="muted">
        <slot name="helper">{{ props.helper }}</slot>
      </Text>
    </div>
  </div>
</template>
