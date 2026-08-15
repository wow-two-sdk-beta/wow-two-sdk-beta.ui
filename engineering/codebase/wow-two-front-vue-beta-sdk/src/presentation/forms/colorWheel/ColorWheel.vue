<script lang="ts">
export interface ColorWheelProps {
  /** The hue, controlled — React's spelling, which wins when both are set. */
  value?: number;

  /** The hue, controlled. The `v-model` binding target. */
  modelValue?: number;

  /** The initial hue when uncontrolled. */
  defaultValue?: number;

  /** The outer diameter in pixels. Default 200. */
  size?: number;

  /** The ring thickness in pixels. Default 30. */
  thickness?: number;

  /** The arrow-key increment. */
  step?: number;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  isDisabled?: boolean;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;
}

function angleFromCenter(clientX: number, clientY: number, rect: DOMRect): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (angle + 360) % 360;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, type StyleValue } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { clampHue } from '../ColorExtensions';

/** Circular hue ring. Pointer-draggable and fully keyboard operable as an ARIA `slider`. */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'ColorWheel', inheritAttrs: false });

const props = withDefaults(defineProps<ColorWheelProps>(), {
  size: 200,
  thickness: 30,
  step: 1,
  /* Explicit `undefined` default: the flag falls back to the form control context, and Vue
     casts an absent `boolean` prop to `false` — which would shadow it. */
  isDisabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [hue: number];
  /** Replaces React's `onValueChange`. */
  'value-change': [hue: number];
}>();

const attrs = useAttrs();

const controlled = useControlled<number>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? 0,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const hue = controlled.value;

/* Inherits id/disabled/invalid/labelling from a surrounding <Field>; explicit props win. */
const ctx = useFormControl();
const disabled = computed(() => props.isDisabled ?? ctx?.isDisabled ?? false);

/* Never a declared prop — a declared `'aria-label'` would arrive as `props.ariaLabel` and
   stop reaching the DOM. It is read off the attrs so it can be relocated onto the wheel. */
const ariaLabel = computed(() => attrs['aria-label'] as string | undefined);

/* Names the wheel from the Field label when present; an explicit aria-label always wins. */
const labelledBy = computed(() => (!ariaLabel.value ? ctx?.labelledBy : undefined));

const track = useTemplateRef<HTMLDivElement>('track');

/* `getBoundingClientRect` is safe unguarded — pointer handlers never run on the server. */
function updateFromClient(clientX: number, clientY: number): void {
  const node = track.value;
  if (!node) return;
  controlled.setValue(clampHue(angleFromCenter(clientX, clientY, node.getBoundingClientRect())));
}

function onPointerdown(event: PointerEvent): void {
  if (event.defaultPrevented) return;
  if (disabled.value) return;
  event.preventDefault();
  (event.target as Element).setPointerCapture?.(event.pointerId);
  updateFromClient(event.clientX, event.clientY);
}

function onPointermove(event: PointerEvent): void {
  if (event.defaultPrevented) return;
  if (disabled.value || event.buttons !== 1) return;
  updateFromClient(event.clientX, event.clientY);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  if (disabled.value) return;
  let next = hue.value;
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = hue.value + props.step;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      next = hue.value - props.step;
      break;
    case 'PageUp':
      next = hue.value + props.step * 10;
      break;
    case 'PageDown':
      next = hue.value - props.step * 10;
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = 359;
      break;
    default:
      return;
  }
  event.preventDefault();
  controlled.setValue(clampHue(next));
}

const radius = computed(() => (props.size - props.thickness) / 2);

/* Numeric CSS lengths are spelled with their unit — React's style object auto-appended `px`,
   Vue's does not, so a bare `200` would be dropped as an invalid declaration. */
const wheelStyle = computed<StyleValue>(() => {
  const inner = radius.value - props.thickness / 2;
  const outer = radius.value + props.thickness / 2;
  const mask = `radial-gradient(circle, transparent ${inner}px, black ${inner + 1}px, black ${outer}px, transparent ${outer + 1}px)`;
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    background:
      'conic-gradient(from 0deg, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))',
    WebkitMaskImage: mask,
    maskImage: mask,
  };
});

const thumbStyle = computed<StyleValue>(() => {
  const angleRad = (hue.value * Math.PI) / 180;
  return {
    left: `${props.size / 2 + radius.value * Math.sin(angleRad)}px`,
    top: `${props.size / 2 - radius.value * Math.cos(angleRad)}px`,
    backgroundColor: `hsl(${hue.value}, 100%, 50%)`,
  };
});

const controlId = computed(() => props.id ?? ctx?.id);
const finalAriaLabel = computed(() => ariaLabel.value ?? (labelledBy.value ? undefined : 'Hue'));
const valueNow = computed(() => Math.round(hue.value));
const isInvalid = computed(() => ctx?.isInvalid || undefined);
const describedBy = computed(() => ctx?.describedBy);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class', 'style', 'aria-label']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    'relative inline-block select-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    disabled.value && 'pointer-events-none opacity-50',
    attrs.class as ClassValue,
  ),
);

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: track });
</script>

<template>
  <div
    ref="track"
    role="slider"
    :id="controlId"
    :tabindex="disabled ? -1 : 0"
    :aria-label="finalAriaLabel"
    :aria-labelledby="labelledBy"
    :aria-valuemin="0"
    :aria-valuemax="360"
    :aria-valuenow="valueNow"
    :aria-invalid="isInvalid"
    :aria-describedby="describedBy"
    :aria-disabled="disabled || undefined"
    :data-disabled="disabled ? '' : undefined"
    :style="wheelStyle"
    :class="rootClass"
    v-bind="passthroughAttrs"
    @pointerdown="onPointerdown"
    @pointermove="onPointermove"
    @keydown="onKeydown"
  >
    <div
      aria-hidden="true"
      :style="thumbStyle"
      class="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/30"
    />
  </div>
</template>
