<script lang="ts">
import type { CSSProperties } from 'vue';
import type { HSV } from '../ColorExtensions';

/** Defines which HSV/alpha channel a color slider drives. */
export const ColorChannel = {
  /** Refers to the hue channel (0–360°). */
  Hue: 'hue',
  /** Refers to the saturation channel (0–1). */
  Saturation: 'saturation',
  /** Refers to the value/brightness channel (0–1). */
  Value: 'value',
  /** Refers to the alpha/opacity channel (0–1). */
  Alpha: 'alpha',
} as const;

export type ColorChannel = (typeof ColorChannel)[keyof typeof ColorChannel];

export interface ColorSliderProps {
  /** The channel the track drives. */
  channel?: ColorChannel;

  /** The channel value, controlled — React's spelling, which wins when both are set. */
  value?: number;

  /** The channel value, controlled. The `v-model` binding target. */
  modelValue?: number;

  /** The initial value when uncontrolled. */
  defaultValue?: number;

  /** The surrounding color the non-hue gradients are built from. */
  color?: HSV;

  /** The arrow-key increment. Defaults to `1` for hue, `0.01` otherwise. */
  step?: number;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  isDisabled?: boolean;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;
}

export function channelMax(channel: ColorChannel): number {
  return channel === ColorChannel.Hue ? 360 : 1;
}

export function defaultStep(channel: ColorChannel): number {
  return channel === ColorChannel.Hue ? 1 : 0.01;
}

const CHECKERBOARD: CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)',
  backgroundSize: '8px 8px',
  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, type StyleValue } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { clamp01, clampHue, hsvToHex } from '../ColorExtensions';

/**
 * Single-channel color track (hue / saturation / value / alpha). Pointer-draggable
 * and fully keyboard operable as an ARIA `slider`.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'ColorSlider', inheritAttrs: false });

const props = withDefaults(defineProps<ColorSliderProps>(), {
  channel: ColorChannel.Hue,
  /* Explicit `undefined` default: the flag falls back to the form control context, and Vue
     casts an absent `boolean` prop to `false` — which would shadow the context. */
  isDisabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: number];
  /** Replaces React's `onValueChange`. Native `keydown` / pointer events stay fallthrough. */
  'value-change': [value: number];
}>();

const attrs = useAttrs();

const max = computed(() => channelMax(props.channel));
const stepValue = computed(() => props.step ?? defaultStep(props.channel));

const controlled = useControlled<number>({
  controlled: () => props.value ?? props.modelValue,
  default: () => props.defaultValue ?? 0,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const val = controlled.value;

/* Inherits id/disabled/invalid/labelling from a surrounding <Field>; explicit props win. */
const ctx = useFormControl();
const disabled = computed(() => props.isDisabled ?? ctx?.isDisabled ?? false);

/* Never a declared prop — a declared `'aria-label'` would arrive as `props.ariaLabel` and
   stop reaching the DOM. It is read off the attrs so it can be relocated onto the track. */
const ariaLabel = computed(() => attrs['aria-label'] as string | undefined);

/* Names the track from the Field label when present; an explicit aria-label always wins. */
const labelledBy = computed(() => (!ariaLabel.value ? ctx?.labelledBy : undefined));

const track = useTemplateRef<HTMLDivElement>('track');
const root = useTemplateRef<HTMLDivElement>('root');

/* `getBoundingClientRect` is safe unguarded — pointer handlers never run on the server. */
function updateFromClientX(clientX: number): void {
  const node = track.value;
  if (!node) return;
  const rect = node.getBoundingClientRect();
  const ratio = clamp01((clientX - rect.left) / rect.width);
  const next = ratio * max.value;
  /* next is already within [0, max] — clampHue would wrap a full-right drag (360) back to 0. */
  controlled.setValue(props.channel === ColorChannel.Hue ? next : clamp01(next));
}

function onPointerdown(event: PointerEvent): void {
  if (event.defaultPrevented) return;
  if (disabled.value) return;
  event.preventDefault();
  (event.target as Element).setPointerCapture?.(event.pointerId);
  updateFromClientX(event.clientX);
}

function onPointermove(event: PointerEvent): void {
  if (event.defaultPrevented) return;
  if (disabled.value) return;
  if (event.buttons !== 1) return;
  updateFromClientX(event.clientX);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  if (disabled.value) return;
  let next = val.value;
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      next = val.value + stepValue.value;
      break;
    case 'ArrowLeft':
    case 'ArrowDown':
      next = val.value - stepValue.value;
      break;
    case 'PageUp':
      next = val.value + stepValue.value * 10;
      break;
    case 'PageDown':
      next = val.value - stepValue.value * 10;
      break;
    case 'Home':
    case 'End':
      /* Commit the extreme directly — clampHue(360) wraps to 0, which would make End act like Home. */
      event.preventDefault();
      controlled.setValue(event.key === 'Home' ? 0 : max.value);
      return;
    default:
      return;
  }
  event.preventDefault();
  controlled.setValue(props.channel === ColorChannel.Hue ? clampHue(next) : clamp01(next));
}

function buildGradient(channel: ColorChannel, color: HSV | undefined): string {
  if (channel === ColorChannel.Hue) {
    return 'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))';
  }
  const base: HSV = color ?? { h: 0, s: 1, v: 1 };
  if (channel === ColorChannel.Saturation) {
    const start = hsvToHex({ h: base.h, s: 0, v: base.v });
    const end = hsvToHex({ h: base.h, s: 1, v: base.v });
    return `linear-gradient(to right, ${start}, ${end})`;
  }
  if (channel === ColorChannel.Value) {
    const end = hsvToHex({ h: base.h, s: base.s, v: 1 });
    return `linear-gradient(to right, #000000, ${end})`;
  }
  // alpha
  const opaque = hsvToHex({ h: base.h, s: base.s, v: base.v });
  return `linear-gradient(to right, transparent, ${opaque})`;
}

const isAlpha = computed(() => props.channel === ColorChannel.Alpha);

/* val >= 360 pins the thumb to the right edge — clampHue would wrap the committed max back to 0. */
const ratio = computed(() =>
  props.channel === ColorChannel.Hue
    ? val.value >= 360
      ? 1
      : clampHue(val.value) / 360
    : clamp01(val.value),
);

const trackStyle = computed<StyleValue>(() => ({
  backgroundImage: buildGradient(props.channel, props.color),
  ...(isAlpha.value ? { backgroundColor: 'transparent' } : null),
}));

const thumbStyle = computed<StyleValue>(() => ({ left: `${ratio.value * 100}%` }));

const checkerboardStyle = CHECKERBOARD as StyleValue;

const controlId = computed(() => props.id ?? ctx?.id);
const finalAriaLabel = computed(
  () => ariaLabel.value ?? (labelledBy.value ? undefined : `${props.channel} slider`),
);
const valueNow = computed(() => Math.round(val.value * 100) / 100);
const isInvalid = computed(() => ctx?.isInvalid || undefined);
const describedBy = computed(() => ctx?.describedBy);

/* `id` and `aria-label` belong on the inner track (the ARIA slider), not the wrapper — the
   React original placed them there too, so both are kept off the passthrough set. */
const OWNED_ATTRS: ReadonlySet<string> = new Set(['class', 'aria-label']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn('relative inline-flex w-full select-none items-center', attrs.class as ClassValue),
);

const innerClass = computed(() =>
  cn(
    'relative h-3 w-full rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    disabled.value && 'pointer-events-none opacity-50',
  ),
);

/** The rendered wrapper — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div ref="root" :class="rootClass" v-bind="passthroughAttrs">
    <div v-if="isAlpha" aria-hidden="true" class="absolute inset-0 rounded-full" :style="checkerboardStyle" />
    <div
      ref="track"
      role="slider"
      :id="controlId"
      :tabindex="disabled ? -1 : 0"
      :aria-label="finalAriaLabel"
      :aria-labelledby="labelledBy"
      :aria-valuemin="0"
      :aria-valuemax="max"
      :aria-valuenow="valueNow"
      :aria-invalid="isInvalid"
      :aria-describedby="describedBy"
      :aria-disabled="disabled || undefined"
      aria-orientation="horizontal"
      :data-disabled="disabled ? '' : undefined"
      :style="trackStyle"
      :class="innerClass"
      @pointerdown="onPointerdown"
      @pointermove="onPointermove"
      @keydown="onKeydown"
    >
      <div
        aria-hidden="true"
        class="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-transparent shadow-md ring-1 ring-black/20"
        :style="thumbStyle"
      />
    </div>
  </div>
</template>
