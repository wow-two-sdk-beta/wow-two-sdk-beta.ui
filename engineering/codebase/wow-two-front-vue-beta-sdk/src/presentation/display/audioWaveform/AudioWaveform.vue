<script lang="ts">
/** Defines the AudioWaveform color tone. */
export const AudioWaveformTone = {
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

export type AudioWaveformTone = (typeof AudioWaveformTone)[keyof typeof AudioWaveformTone];

const TONE_CLASS: Record<AudioWaveformTone, string> = {
  brand: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  muted: 'text-muted-foreground',
  current: '',
};

export interface AudioWaveformProps {
  /** The per-bin amplitudes in 0..1. */
  peaks: ReadonlyArray<number>;
  /** The played fraction in 0..1. Default `0`. */
  progress?: number;
  /** The SVG width in px. Default `320`. */
  width?: number;
  /** The SVG height in px. Default `48`. */
  height?: number;
  /** The width of a single bar in px. Default `2`. */
  barWidth?: number;
  /** The gap between bars in px. Default `1`. */
  gap?: number;
  /** The color tone. Default `brand`. */
  tone?: AudioWaveformTone;
  /**
   * Fires with the seeked progress in 0..1.
   *
   * Kept a prop rather than an emit because its *presence* is load-bearing —
   * it decides `role="slider"` vs `role="img"` when `isInteractive` is omitted,
   * and Vue strips declared emit listeners out of `useAttrs()`, leaving no way
   * to observe them.
   */
  onSeek?: (progress: number) => void;
  /** The interactive state. Defaults to whether `onSeek` was supplied. */
  isInteractive?: boolean;
}

/** Resample `peaks` to exactly `n` bars by max-pooling consecutive runs. */
function sampleTo(peaks: ReadonlyArray<number>, n: number): ReadonlyArray<number> {
  if (peaks.length === 0) return new Array<number>(n).fill(0);
  if (peaks.length === n) return peaks;
  const out: Array<number> = new Array<number>(n);
  const ratio = peaks.length / n;
  for (let i = 0; i < n; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.max(start + 1, Math.floor((i + 1) * ratio));
    let max = 0;
    for (let j = start; j < end && j < peaks.length; j++) {
      const v = Math.abs(peaks[j]!);
      if (v > max) max = v;
    }
    out[i] = max;
  }
  return out;
}

interface Bar {
  index: number;
  x: number;
  y: number;
  height: number;
  isPlayed: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * SVG bar-style audio waveform. `peaks` are per-bin amplitudes in 0..1.
 * Click-to-seek + arrow-key seek when `onSeek` is provided.
 */
defineOptions({ name: 'AudioWaveform', inheritAttrs: false });

const props = withDefaults(defineProps<AudioWaveformProps>(), {
  /* `peaks` stays declared-required — Vue still warns when it is missing — but a
     default keeps an absent (or transiently-undefined) value from reaching
     `sampleTo`, which read `.length` off it and took the whole page down. */
  peaks: () => [],
  progress: 0,
  width: 320,
  height: 48,
  barWidth: 2,
  gap: 1,
  tone: 'brand',
  onSeek: undefined,
  // `undefined` is meaningful — it falls back to `onSeek != null`. Without an
  // explicit default Vue would cast the absent Boolean prop to `false`.
  isInteractive: undefined,
});

const attrs = useAttrs();
const el = useTemplateRef<SVGSVGElement>('el');

const stepX = computed(() => props.barWidth + props.gap);
const barCount = computed(() => Math.max(1, Math.floor(props.width / stepX.value)));
const playedBars = computed(() => Math.round(props.progress * barCount.value));
const resolvedInteractive = computed(() => props.isInteractive ?? props.onSeek != null);

const bars = computed<ReadonlyArray<Bar>>(() =>
  sampleTo(props.peaks, barCount.value).map((amp, index) => {
    const height = Math.max(1, amp * props.height);
    return {
      index,
      x: index * stepX.value,
      y: (props.height - height) / 2,
      height,
      isPlayed: index < playedBars.value,
    };
  }),
);

function seekFromX(clientX: number, rect: DOMRect): void {
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
  props.onSeek?.(x / rect.width);
}

function onClick(event: MouseEvent): void {
  if (!resolvedInteractive.value) return;
  const rect = el.value?.getBoundingClientRect();
  if (rect) seekFromX(event.clientX, rect);
}

function onKeydown(event: KeyboardEvent): void {
  const seek = props.onSeek;
  if (!seek) return;
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    seek(Math.min(1, props.progress + 0.05));
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    seek(Math.max(0, props.progress - 0.05));
  } else if (event.key === 'Home') {
    event.preventDefault();
    seek(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    seek(1);
  }
}

const classes = computed(() =>
  cn(
    'inline-block',
    resolvedInteractive.value &&
      'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
    TONE_CLASS[props.tone],
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
  <!-- Own attrs, then `rest` (a consumer attr wins, as React's trailing `{...rest}` did),
       then own handlers last so a consumer's handler runs first. -->
  <svg
    ref="el"
    :role="resolvedInteractive ? 'slider' : 'img'"
    aria-label="Audio waveform"
    :aria-valuenow="Math.round(progress * 100)"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :tabindex="resolvedInteractive ? 0 : -1"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    v-bind="rest"
    :class="classes"
    @click="onClick"
    @keydown="onKeydown"
  >
    <rect
      v-for="bar in bars"
      :key="bar.index"
      :x="bar.x"
      :y="bar.y"
      :width="barWidth"
      :height="bar.height"
      :rx="1"
      :class="bar.isPlayed ? 'fill-current' : 'fill-current opacity-30'"
    />
  </svg>
</template>
