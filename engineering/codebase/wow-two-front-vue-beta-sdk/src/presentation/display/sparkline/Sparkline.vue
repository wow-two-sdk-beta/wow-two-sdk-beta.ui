<script lang="ts">
/** Defines the Sparkline render style. */
export const SparklineVariant = {
  /** Refers to a connected line. */
  Line: 'line',
  /** Refers to a filled area under the line. */
  Area: 'area',
  /** Refers to vertical bars. */
  Bar: 'bar',
  /** Refers to discrete dots. */
  Dot: 'dot',
} as const;

export type SparklineVariant = (typeof SparklineVariant)[keyof typeof SparklineVariant];

/** Defines the Sparkline color tone. */
export const SparklineTone = {
  /** Refers to the primary brand color. */
  Brand: 'brand',
  /** Refers to the positive / confirmation color. */
  Success: 'success',
  /** Refers to the caution color. */
  Warning: 'warning',
  /** Refers to the destructive / error color. */
  Danger: 'danger',
  /** Refers to the muted color. */
  Muted: 'muted',
  /** Refers to the inherited `currentColor`. */
  Current: 'current',
} as const;

export type SparklineTone = (typeof SparklineTone)[keyof typeof SparklineTone];

export interface SparklineProps {
  /** The series to plot, in order. */
  data: ReadonlyArray<number>;

  /** The render style. Default `line`. */
  variant?: SparklineVariant;

  /** The px width of the viewBox. Default `120`. */
  width?: number;

  /** The px height of the viewBox. Default `32`. */
  height?: number;

  /** The color tone. Default `brand`. */
  tone?: SparklineTone;

  /** The lower bound of the value scale. Defaults to the series minimum. */
  min?: number;

  /** The upper bound of the value scale. Defaults to the series maximum. */
  max?: number;

  /** The emphasized dot on the final point. */
  hasLast?: boolean;

  /** The accessible label summarizing the trend. */
  ariaLabel?: string;
}

/** The derived plot geometry — React's `useMemo` payload. */
interface SparklineGeometry {
  points: ReadonlyArray<readonly [number, number]>;
  barWidth: number;
  barRenderWidth: number;
  lastX: number;
  lastY: number;
  areaPath: string;
  linePath: string;
}

const EMPTY_GEOMETRY: SparklineGeometry = {
  points: [],
  barWidth: 0,
  barRenderWidth: 0,
  lastX: 0,
  lastY: 0,
  areaPath: '',
  linePath: '',
};

const TONE_CLASS: Record<SparklineTone, string> = {
  brand: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  muted: 'text-muted-foreground',
  current: '',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';

/**
 * Inline trend chart — line / area / bar / dot. SVG, no scales/axes/legend.
 * Color via Tailwind tokens (`text-*`); pair with `currentColor` for parent
 * inheritance.
 */
defineOptions({ name: 'Sparkline', inheritAttrs: false });

const props = withDefaults(defineProps<SparklineProps>(), {
  variant: 'line',
  width: 120,
  height: 32,
  tone: 'brand',
  min: undefined,
  max: undefined,
  hasLast: undefined,
  ariaLabel: 'Trend',
});

const attrs = useAttrs();
const el = useTemplateRef<SVGSVGElement>('el');
const titleId = useId();

const geometry = computed<SparklineGeometry>(() => {
  const { data, width, height } = props;
  if (data.length === 0) return EMPTY_GEOMETRY;

  const min = props.min ?? Math.min(...data);
  const max = props.max ?? Math.max(...data);
  const range = max - min || 1;
  const stepX = data.length === 1 ? 0 : width / (data.length - 1);
  const pad = 1; // keep stroke inside the box

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - pad * 2) - pad;
    return [x, y] as const;
  });

  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return EMPTY_GEOMETRY;

  const linePath = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const areaPath = `${linePath} L${last[0]},${height} L${first[0]},${height} Z`;
  const barWidth = width / data.length - 1;

  return {
    points,
    barWidth,
    barRenderWidth: Math.max(1, barWidth),
    lastX: last[0],
    lastY: last[1],
    areaPath,
    linePath,
  };
});

const showLast = computed(() => Boolean(props.hasLast) && props.data.length > 0 && props.variant !== 'dot');

const classes = computed(() =>
  cn('inline-block overflow-visible', TONE_CLASS[props.tone], attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <svg
    ref="el"
    role="img"
    :aria-labelledby="titleId"
    :width="props.width"
    :height="props.height"
    :viewBox="`0 0 ${props.width} ${props.height}`"
    preserveAspectRatio="none"
    v-bind="rest"
    :class="classes"
  >
    <title :id="titleId">{{ props.ariaLabel }}</title>

    <template v-if="props.variant === 'area'">
      <path :d="geometry.areaPath" fill="currentColor" fill-opacity="0.15" />
      <path
        :d="geometry.linePath"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <path
      v-if="props.variant === 'line'"
      :d="geometry.linePath"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <g v-if="props.variant === 'bar'">
      <rect
        v-for="(point, i) in geometry.points"
        :key="i"
        :x="point[0] - geometry.barWidth / 2"
        :y="point[1]"
        :width="geometry.barRenderWidth"
        :height="props.height - point[1]"
        fill="currentColor"
        rx="1"
      />
    </g>

    <g v-if="props.variant === 'dot'">
      <circle
        v-for="(point, i) in geometry.points"
        :key="i"
        :cx="point[0]"
        :cy="point[1]"
        r="1.5"
        fill="currentColor"
      />
    </g>

    <circle v-if="showLast" :cx="geometry.lastX" :cy="geometry.lastY" r="2.5" fill="currentColor" />
  </svg>
</template>
