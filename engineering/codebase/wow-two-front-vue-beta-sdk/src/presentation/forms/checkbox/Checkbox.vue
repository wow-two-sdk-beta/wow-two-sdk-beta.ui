<script lang="ts">
import type { ColorProp, ColorTone, SizePreset, SizeUnion } from '../../../foundation/utils';
import type { CheckboxVariant, CheckboxVariants } from './Checkbox.variants';

/* Checkbox supports the 5-preset core (skips `2xl` — outsized for a form control). */
export type CheckboxSizePreset = Extract<SizePreset, 'xs' | 'sm' | 'md' | 'lg' | 'xl'>;

export interface CheckboxProps {
  /** The size — preset (`xs|sm|md|lg|xl`) → box + icon scale · raw number/string → square inline · object → explicit dims. See `SizeUnion`. */
  size?: SizeUnion<CheckboxSizePreset>;

  /** The visual surface style. */
  variant?: CheckboxVariant;

  /** The semantic tone palette. */
  tone?: ColorTone;

  /** The tristate visual state — input stays unchecked but renders as a dash with the same checked-state styling. */
  isIndeterminate?: boolean;

  /** The per-instance color override (string seed or slot object) — overrides the active `tone`'s theme tokens locally. */
  color?: ColorProp;

  /** The checked state, controlled — React's spelling, which wins when both are set. */
  checked?: boolean;

  /** The checked state, controlled. The `v-model` binding target. */
  modelValue?: boolean;

  /** The initial checked state when uncontrolled. */
  defaultChecked?: boolean;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;

  /** The required state. Falls back to the surrounding form control's `isRequired`. */
  required?: boolean;
}

const COMPONENT_NAME = 'Checkbox';

/* Outer wrapper box dim per preset. */
const BOX_SIZE_CLASS: Record<CheckboxSizePreset, string> = {
  xs: 'h-3.5 w-3.5', // 14px — dense / mobile-tight (consumer must ensure ≥24px hit target via wrapping label)
  sm: 'h-4 w-4', // 16px
  md: 'h-5 w-5', // 20px (default)
  lg: 'h-6 w-6', // 24px (WCAG-compliant standalone)
  xl: 'h-7 w-7', // 28px (emphasis / a11y-first)
};

/* Inner icon dim per preset — scales proportionally to box. */
const ICON_SIZE_CLASS: Record<CheckboxSizePreset, string> = {
  xs: 'h-2.5 w-2.5',
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
  xl: 'h-5 w-5',
};

/* Fallback icon dim when raw/object size used — middle of scale. */
const DEFAULT_ICON_CLASS = 'h-3 w-3';

/* When indeterminate=true, apply the compound's checked classes regardless of peer-checked state. */
const INDETERMINATE_CHECKED_CLASS: Record<
  NonNullable<CheckboxVariants['variant']>,
  Record<NonNullable<CheckboxVariants['tone']>, string>
> = {
  solid: {
    primary: 'bg-primary border-primary text-primary-foreground',
    neutral: 'bg-foreground border-foreground text-background',
    danger: 'bg-destructive border-destructive text-destructive-foreground',
    success: 'bg-success border-success text-success-foreground',
    warning: 'bg-warning border-warning text-warning-foreground',
  },
  soft: {
    primary: 'bg-primary text-primary-foreground',
    neutral: 'bg-foreground text-background',
    danger: 'bg-destructive text-destructive-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
  },
  outline: {
    primary: 'bg-primary text-primary-foreground',
    neutral: 'bg-foreground text-background',
    danger: 'bg-destructive text-destructive-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
  },
  ghost: {
    primary: 'bg-primary/10 text-primary',
    neutral: 'bg-muted text-foreground',
    danger: 'bg-destructive/10 text-destructive',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  },
  /* Glass family keeps dark glass bg in indeterminate state (matches checked behavior). The Minus icon renders unconditionally; text-white from variant base makes it visible. */
  glass: {
    primary: 'text-white',
    neutral: 'text-white',
    danger: 'text-white',
    success: 'text-white',
    warning: 'text-white',
  },
  'glass-surface': {
    primary: 'text-white border-white/80',
    neutral: 'text-white border-white/80',
    danger: 'text-white border-white/80',
    success: 'text-white border-white/80',
    warning: 'text-white border-white/80',
  },
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, watch, type StyleValue } from 'vue';
import type { ClassValue } from 'clsx';
import { Check, Minus } from 'lucide-vue-next';
import {
  cn,
  ColorExtensions,
  CssExtensions,
  ColorTone as ColorToneValue,
} from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { checkboxVariants, CheckboxVariant as CheckboxVariantValue } from './Checkbox.variants';

/* Native checkbox with custom visual. Renders the input visually hidden but accessible — wrap in a `<label>` (or pair with `Label` via `FormControl`). Supports 6 variants × 5 tones matrix + indeterminate. */
/* `inheritAttrs: false` so `class` folds into the wrapper's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: COMPONENT_NAME, inheritAttrs: false });

const props = withDefaults(defineProps<CheckboxProps>(), {
  size: 'md',
  variant: CheckboxVariantValue.Solid,
  tone: ColorToneValue.Primary,
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form control
     context or to a meaningful tri-state, and Vue casts an absent `boolean` prop to `false`. */
  isIndeterminate: undefined,
  checked: undefined,
  modelValue: undefined,
  defaultChecked: undefined,
  disabled: undefined,
  required: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [checked: boolean];
  /** Replaces React's `onCheckedChange`. Native `change` / `input` stay fallthrough. */
  'value-change': [checked: boolean];
}>();

const attrs = useAttrs();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useFormControl();

const controlled = useControlled<boolean>({
  controlled: () => props.checked ?? props.modelValue,
  default: () => props.defaultChecked ?? false,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const isChecked = controlled.value;

function onChange(event: Event): void {
  controlled.setValue((event.target as HTMLInputElement).checked);
}

const input = useTemplateRef<HTMLInputElement>('input');

/*
 * Syncs the native `indeterminate` property — it has no attribute, so it is only reachable
 * imperatively. `flush: 'post'` runs after the DOM patch; `immediate` is safe here ONLY
 * because the body touches the template ref rather than a browser global, and the ref is
 * `null` on the server, where the guard below short-circuits.
 */
watch(
  [input, () => props.isIndeterminate],
  ([node, indeterminate]) => {
    if (node) node.indeterminate = Boolean(indeterminate);
  },
  { immediate: true, flush: 'post' },
);

/* Parse union-typed `size` — preset routes to box+icon class lookup, raw/object routes to inline dims. */
const CHECKBOX_SIZE_PRESETS: ReadonlySet<string> = new Set<CheckboxSizePreset>([
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
]);

const parsedSize = computed(() =>
  CssExtensions.parseSizeUnion<CheckboxSizePreset>(props.size, CHECKBOX_SIZE_PRESETS),
);

const boxClass = computed(() =>
  parsedSize.value.preset ? BOX_SIZE_CLASS[parsedSize.value.preset] : undefined,
);
const iconClass = computed(() =>
  parsedSize.value.preset ? ICON_SIZE_CLASS[parsedSize.value.preset] : DEFAULT_ICON_CLASS,
);

/* Per-instance color override → sets CSS vars on wrapper; the visual span inherits via cascade. */
const composedStyle = computed<StyleValue | undefined>(() => {
  const boxStyle = parsedSize.value.box
    ? CssExtensions.resolveBoxSize(parsedSize.value.box)
    : undefined;
  const colorStyle = ColorExtensions.toneColorOverride(props.color, props.tone);
  return colorStyle || boxStyle ? { ...colorStyle, ...boxStyle } : undefined;
});

const inputId = computed(() => props.id ?? ctx?.id);
const isDisabled = computed(() => props.disabled ?? ctx?.isDisabled);
const isRequired = computed(() => props.required ?? ctx?.isRequired);
const ariaChecked = computed(() => (props.isIndeterminate ? 'mixed' : undefined));
const isInvalid = computed(() => ctx?.isInvalid || undefined);
const describedBy = computed(() => ctx?.describedBy);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const wrapperClass = computed(() =>
  cn('relative inline-flex shrink-0', boxClass.value, attrs.class as ClassValue),
);

const visualClass = computed(() =>
  cn(
    checkboxVariants({ variant: props.variant, tone: props.tone }),
    props.isIndeterminate
      ? INDETERMINATE_CHECKED_CLASS[props.variant][props.tone]
      : /* Opacity gate lives on this span (a peer sibling of the input) — child-selector targets the SVG. peer-checked: cannot reach descendants directly. */
        '[&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100',
  ),
);

/** The rendered `<input>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: input });
</script>

<template>
  <span :class="wrapperClass" :style="composedStyle">
    <input
      ref="input"
      type="checkbox"
      :id="inputId"
      :disabled="isDisabled"
      :required="isRequired"
      :checked="isChecked"
      :aria-checked="ariaChecked"
      :aria-invalid="isInvalid"
      :aria-describedby="describedBy"
      class="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      v-bind="passthroughAttrs"
      @change="onChange"
    />
    <span aria-hidden="true" :class="visualClass">
      <Minus v-if="isIndeterminate" :class="iconClass" />
      <Check v-else :class="iconClass" />
    </span>
  </span>
</template>
