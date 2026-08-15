<script lang="ts">
import type { HSV } from '../ColorExtensions';
import type { ColorSwatchSize } from '../colorSwatch';

/** Defines which built-in trigger a color picker renders. */
export const ColorPickerTriggerVariant = {
  /** Refers to a swatch plus hex-value text in a framed button. */
  Full: 'full',
  /** Refers to a bare interactive swatch, no text. */
  Swatch: 'swatch',
  /** Refers to hex-value text only, no swatch. */
  Value: 'value',
} as const;

export type ColorPickerTriggerVariant = (typeof ColorPickerTriggerVariant)[keyof typeof ColorPickerTriggerVariant];

export interface ColorPickerProps {
  /** The selected hex, controlled — React's spelling, which wins when both are set. */
  value?: string | null;

  /** The selected hex, controlled. The `v-model` binding target. */
  modelValue?: string | null;

  /** The initial hex when uncontrolled. Default `#3b82f6`. */
  defaultValue?: string | null;

  /** Whether the committed hex keeps its alpha channel, and the alpha slider renders. */
  hasAlpha?: boolean;

  /** The preset palette rendered under the panel; omitted or empty hides the row. */
  presets?: ReadonlyArray<string>;

  /** The size step the built-in trigger's swatch renders at. */
  triggerSize?: ColorSwatchSize;

  /**
   * The built-in trigger to render (ignored when the `trigger` slot is filled):
   * - `full` *(default)* — swatch + hex-value text, framed button.
   * - `swatch` — a bare interactive swatch, no text (compact toolbars, tiles).
   * - `value` — hex-value text only, no swatch (dense / code contexts).
   */
  triggerVariant?: ColorPickerTriggerVariant;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  isDisabled?: boolean;

  /** The hidden input's name — renders a form-submittable mirror of the hex. */
  name?: string;

  /** The trigger id; falls back to a surrounding `<Field>`'s control id. */
  id?: string;
}

/** The panel's fallback geometry when no parseable color is committed. */
const FALLBACK_HSV: HSV = { h: 217, s: 0.91, v: 0.96, a: 1 };
</script>

<script setup lang="ts">
import { computed, shallowRef, useAttrs, useTemplateRef, watch } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { FormControlProvider, useFormControl } from '../../../foundation/primitives';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { hsvToHex, parseColorToHsv } from '../ColorExtensions';
import { ColorSwatchSize as ColorSwatchSizeValue } from '../colorSwatch';
import ColorSwatch from '../colorSwatch/ColorSwatch.vue';
import ColorArea from '../colorArea/ColorArea.vue';
import ColorSlider, { ColorChannel } from '../colorSlider/ColorSlider.vue';
import ColorField from '../colorField/ColorField.vue';
import ColorSwatchPicker from '../colorSwatchPicker/ColorSwatchPicker.vue';

/**
 * Full color picker — a trigger that opens a panel with a saturation/value area,
 * a hue slider, an optional alpha slider, a hex field and an optional preset row.
 */
/* `inheritAttrs: false` so `class` folds into the trigger's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'ColorPicker', inheritAttrs: false });

const props = withDefaults(defineProps<ColorPickerProps>(), {
  defaultValue: '#3b82f6',
  hasAlpha: false,
  triggerSize: ColorSwatchSizeValue.Md,
  triggerVariant: ColorPickerTriggerVariant.Full,
  /* Explicit `undefined` default: the flag falls back to the form control context, and Vue
     casts an absent `boolean` prop to `false` — which would shadow the context. */
  isDisabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: string | null];
  /** Replaces React's `onValueChange`. */
  'value-change': [value: string | null];
}>();

/**
 * The custom trigger — React's `trigger?: ReactNode`. Structural content, so a slot
 * rather than a scalar prop. Must hold a single focusable element (it becomes the
 * popover trigger via `as-child`). Form-control context wiring (id/aria) is the
 * consumer's responsibility for a custom trigger, exactly as in React.
 */
const slots = defineSlots<{ trigger?(): unknown }>();

const attrs = useAttrs();

/* Inherits id/disabled/invalid/labelledby/describedby from a surrounding <Field>;
   standalone props win when provided, context fills the gaps (Select parity). */
const field = useFormControl();

const finalDisabled = computed(() => props.isDisabled ?? field?.isDisabled ?? false);
const triggerId = computed(() => props.id ?? field?.id);

/* Never a declared prop — a declared `'aria-label'` would arrive as `props.ariaLabel` and
   stop reaching the DOM. It is read off the attrs so it can be relocated onto the trigger. */
const ariaLabel = computed(() => attrs['aria-label'] as string | undefined);

/* Names the trigger from the Field label when present; an explicit aria-label always
   wins, and the default label only applies when nothing else names the trigger. */
const labelledBy = computed(() => (ariaLabel.value ? undefined : field?.labelledBy));
const finalAriaLabel = computed(() => ariaLabel.value ?? (labelledBy.value ? undefined : 'Pick a color'));
const describedBy = computed(() => field?.describedBy);
const isInvalid = computed(() => field?.isInvalid || undefined);

const controlled = useControlled<string | null>({
  /* `??` is wrong here — `null` is a MEANINGFUL committed value ("no color"), and `??` would
     fall through it to `modelValue`. Only `undefined` means "not controlled". */
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? null,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const hex = controlled.value;

/* Internal HSV state (kept in sync with hex). HSV preserves picker geometry when the user
   moves to a fully-desaturated value (otherwise hue collapses). */
const hsv = shallowRef<HSV>(parseColorToHsv(hex.value) ?? FALLBACK_HSV);

/* React's `useEffect([hex, hasAlpha])`. No `immediate` — the initial state above already
   seeds from `hex`, and an immediate watcher would re-run it before mount. */
watch([hex, () => props.hasAlpha], () => {
  if (!hex.value) return;
  const parsed = parseColorToHsv(hex.value);
  if (!parsed) return;
  /* Only update internal HSV if the *committed* hex differs from what our HSV currently
     produces — avoids hue collapsing when SV passes through 0. */
  const currentHex = hsvToHex(hsv.value, { withAlpha: props.hasAlpha });
  if (currentHex.toLowerCase() !== hex.value.toLowerCase()) {
    hsv.value = { ...parsed, a: hsv.value.a };
  }
});

function updateHsv(next: HSV): void {
  hsv.value = next;
  controlled.setValue(hsvToHex(next, { withAlpha: props.hasAlpha }));
}

function onAreaChange(next: { saturation: number; value: number }): void {
  updateHsv({ ...hsv.value, s: next.saturation, v: next.value });
}

function onHueChange(h: number): void {
  updateHsv({ ...hsv.value, h });
}

function onAlphaChange(a: number): void {
  updateHsv({ ...hsv.value, a });
}

function onHexChange(next: string | null): void {
  controlled.setValue(next);
}

function onPresetChange(next: string | null): void {
  controlled.setValue(next);
}

/*
 * The swatch trigger's real open handler is composed on by `PopoverTrigger`'s `as-child`
 * merge; `ColorSwatch` only needs a truthy click listener to render as a <button>.
 */
function noop(): void {}

const hasCustomTrigger = computed(() => Boolean(slots.trigger));
const isSwatchTrigger = computed(() => props.triggerVariant === ColorPickerTriggerVariant.Swatch);
const isFullTrigger = computed(() => props.triggerVariant === ColorPickerTriggerVariant.Full);

const swatchColor = computed(() => hex.value ?? '#00000000');
const hexText = computed(() => hex.value ?? '—');
const hiddenValue = computed(() => hex.value ?? '');
const alphaValue = computed(() => hsv.value.a ?? 1);
const hasPresets = computed(() => Boolean(props.presets && props.presets.length > 0));

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class', 'aria-label']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const framedTriggerClass = computed(() =>
  cn(
    'inline-flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-sm transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
    attrs.class as ClassValue,
  ),
);

const swatchTriggerClass = computed(() => attrs.class as ClassValue);

const trigger = useTemplateRef<{ el: HTMLElement | null }>('trigger');

/** The rendered trigger element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: computed(() => trigger.value?.el ?? null) });
</script>

<template>
  <Popover>
    <!-- Custom trigger: no id/aria wiring, per the React original's contract. -->
    <PopoverTrigger v-if="hasCustomTrigger" ref="trigger" as-child>
      <slot name="trigger" />
    </PopoverTrigger>

    <!-- Bare interactive swatch — ColorSwatch is a real <button> here (given a click
         listener), so it becomes the popover trigger with no wrapper chrome. -->
    <PopoverTrigger
      v-else-if="isSwatchTrigger"
      ref="trigger"
      as-child
      :id="triggerId"
      :aria-label="finalAriaLabel"
      :aria-labelledby="labelledBy"
      :aria-describedby="describedBy"
      :aria-invalid="isInvalid"
      v-bind="passthroughAttrs"
    >
      <ColorSwatch
        :color="swatchColor"
        :size="triggerSize"
        :is-disabled="finalDisabled"
        :class="swatchTriggerClass"
        @click="noop"
      />
    </PopoverTrigger>

    <PopoverTrigger
      v-else
      ref="trigger"
      :id="triggerId"
      :aria-label="finalAriaLabel"
      :aria-labelledby="labelledBy"
      :aria-describedby="describedBy"
      :aria-invalid="isInvalid"
      :disabled="finalDisabled"
      :class="framedTriggerClass"
      v-bind="passthroughAttrs"
    >
      <ColorSwatch v-if="isFullTrigger" :color="swatchColor" :size="triggerSize" />
      <span class="font-mono uppercase">{{ hexText }}</span>
    </PopoverTrigger>

    <PopoverContent aria-label="Color picker" class="flex w-64 flex-col gap-3">
      <!-- The panel widgets are sub-controls of the picker, not the field's control — each
           gets its OWN bare FormControlProvider so none of them adopts the surrounding
           Field's id (which now names the trigger; adoption would duplicate it) or its
           label/describedby/invalid chrome. One provider per widget: they all read
           `id ?? ctx.id`, so a single shared provider would duplicate ids among them. -->
      <FormControlProvider>
        <ColorArea :hue="hsv.h" :saturation="hsv.s" :value="hsv.v" @value-change="onAreaChange" />
      </FormControlProvider>
      <FormControlProvider>
        <ColorSlider :channel="ColorChannel.Hue" :value="hsv.h" aria-label="Hue" @value-change="onHueChange" />
      </FormControlProvider>
      <FormControlProvider v-if="hasAlpha">
        <ColorSlider
          :channel="ColorChannel.Alpha"
          :value="alphaValue"
          :color="hsv"
          aria-label="Alpha"
          @value-change="onAlphaChange"
        />
      </FormControlProvider>
      <FormControlProvider>
        <ColorField aria-label="Hex color" :value="hex" :has-alpha="hasAlpha" @value-change="onHexChange" />
      </FormControlProvider>
      <FormControlProvider v-if="hasPresets">
        <ColorSwatchPicker :colors="presets ?? []" :value="hex" swatch-size="sm" @value-change="onPresetChange" />
      </FormControlProvider>
    </PopoverContent>

    <input v-if="name" type="hidden" :name="name" :value="hiddenValue" />
  </Popover>
</template>
