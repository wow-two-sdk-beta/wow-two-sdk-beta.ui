<script lang="ts">
/** Defines the geometry of a CSS gradient. */
export const GradientKind = {
  /** Refers to a linear gradient. */
  Linear: 'linear',
  /** Refers to a radial gradient. */
  Radial: 'radial',
  /** Refers to a conic gradient. */
  Conic: 'conic',
} as const;

export type GradientKind = (typeof GradientKind)[keyof typeof GradientKind];

export interface GradientStop {
  color: string;
  position: number;
}

export interface Gradient {
  kind: GradientKind;
  angle: number;
  stops: ReadonlyArray<GradientStop>;
}

export interface GradientPickerProps {
  /** The gradient, controlled — React's spelling, which wins when both are set. */
  value?: Gradient;

  /** The gradient, controlled. The `v-model` binding target. */
  modelValue?: Gradient;

  /** The initial gradient when uncontrolled. */
  defaultValue?: Gradient;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  isDisabled?: boolean;

  /** The hidden input name; the hidden input emits the CSS string. */
  name?: string;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;
}

const DEFAULT_GRADIENT: Gradient = {
  kind: GradientKind.Linear,
  angle: 90,
  stops: [
    { color: '#3b82f6', position: 0 },
    { color: '#a855f7', position: 100 },
  ],
};

export function gradientToCss(g: Gradient): string {
  const stops = [...g.stops].sort((a, b) => a.position - b.position);
  const stopsStr = stops.map((s) => `${s.color} ${s.position}%`).join(', ');
  if (g.kind === GradientKind.Linear) return `linear-gradient(${g.angle}deg, ${stopsStr})`;
  if (g.kind === GradientKind.Radial) return `radial-gradient(circle, ${stopsStr})`;
  return `conic-gradient(from ${g.angle}deg, ${stopsStr})`;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { Plus, Trash } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { Icon } from '../../../foundation/icons';
import { useFormControl } from '../../../foundation/primitives';
import { inputBaseVariants, InputSize } from '../InputStyles';

/**
 * Visual gradient editor — kind / angle / stops. Output `Gradient` object via
 * `update:modelValue` / `value-change`; `name` emits the CSS string for forms.
 *
 * Form-aware at GROUP level: inside a `Field`/`form.Field` the root (`role="group"`)
 * takes the context id + `aria-labelledby`/`aria-describedby`/`aria-invalid`, and
 * the disabled flag cascades to every inner control.
 */
/* `inheritAttrs: false` so `class` folds into the root's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'GradientPicker', inheritAttrs: false });

const props = withDefaults(defineProps<GradientPickerProps>(), {
  /* Explicit `undefined` defaults: `useControlled` keys on `=== undefined`, and Vue casts an
     absent `boolean` prop to `false` — which would shadow the form control context. */
  value: undefined,
  modelValue: undefined,
  defaultValue: undefined,
  isDisabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: Gradient];
  /** Replaces React's `onValueChange`. */
  'value-change': [value: Gradient];
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const ctx = useFormControl();
const isDisabled = computed(() => props.isDisabled ?? ctx?.isDisabled);

const controlled = useControlled<Gradient>({
  controlled: () => props.value ?? props.modelValue,
  default: () => props.defaultValue ?? DEFAULT_GRADIENT,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const gradient = controlled.value;

const css = computed(() => gradientToCss(gradient.value));

/* `Object.values` hoisted out of the template — the runtime template compiler resolves plain
   identifiers, not arbitrary global calls. */
const kinds = Object.values(GradientKind);

function update(patch: Partial<Gradient>): void {
  controlled.setValue({ ...gradient.value, ...patch });
}

function updateStop(index: number, patch: Partial<GradientStop>): void {
  controlled.setValue({
    ...gradient.value,
    stops: gradient.value.stops.map((s, i) => (i === index ? { ...s, ...patch } : s)),
  });
}

function addStop(): void {
  const last = gradient.value.stops[gradient.value.stops.length - 1];
  const newPos = last ? Math.min(100, last.position + 25) : 50;
  controlled.setValue({
    ...gradient.value,
    stops: [...gradient.value.stops, { color: '#ffffff', position: newPos }],
  });
}

function removeStop(index: number): void {
  if (gradient.value.stops.length <= 2) return;
  controlled.setValue({
    ...gradient.value,
    stops: gradient.value.stops.filter((_, i) => i !== index),
  });
}

function onAngleInput(event: Event): void {
  const raw = Number((event.target as HTMLInputElement).value) || 0;
  update({ angle: Math.max(0, Math.min(360, raw)) });
}

function onStopColorInput(index: number, event: Event): void {
  updateStop(index, { color: (event.target as HTMLInputElement).value });
}

function onStopPositionInput(index: number, event: Event): void {
  const raw = Number((event.target as HTMLInputElement).value) || 0;
  updateStop(index, { position: Math.max(0, Math.min(100, raw)) });
}

function kindClass(kind: GradientKind): string {
  return cn(
    'inline-flex h-6 items-center rounded px-2 text-xs font-medium transition-colors',
    gradient.value.kind === kind
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground',
  );
}

const rootId = computed(() => props.id ?? ctx?.id);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    'flex flex-col gap-3 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm',
    isDisabled.value && 'opacity-60',
    attrs.class as ClassValue,
  ),
);

const angleInputClass = cn(inputBaseVariants({ size: InputSize.Sm }), 'w-20');
const hexInputClass = cn(inputBaseVariants({ size: InputSize.Sm }), 'flex-1 font-mono');
const positionInputClass = cn(inputBaseVariants({ size: InputSize.Sm }), 'w-16');

const PlusIcon = Plus;
const TrashIcon = Trash;

/** The rendered root `<div>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el });
</script>

<template>
  <div
    ref="el"
    role="group"
    :id="rootId"
    :aria-labelledby="ctx?.labelledBy"
    :aria-describedby="ctx?.describedBy"
    :aria-invalid="ctx?.isInvalid || undefined"
    :class="rootClass"
    v-bind="passthroughAttrs"
  >
    <!-- Kind + angle -->
    <div class="flex items-center gap-2 text-sm">
      <div
        role="radiogroup"
        aria-label="Gradient kind"
        class="flex items-center gap-0.5 rounded-md bg-muted/40 p-0.5 ring-1 ring-border"
      >
        <button
          v-for="k in kinds"
          :key="k"
          type="button"
          role="radio"
          :aria-checked="gradient.kind === k"
          :disabled="isDisabled"
          :class="kindClass(k)"
          @click="update({ kind: k })"
        >
          {{ k }}
        </button>
      </div>
      <label
        v-if="gradient.kind !== 'radial'"
        class="ml-auto flex items-center gap-2 text-xs text-muted-foreground"
      >
        Angle
        <input
          type="number"
          :min="0"
          :max="360"
          :value="gradient.angle"
          :disabled="isDisabled"
          :class="angleInputClass"
          @input="onAngleInput"
        />
        °
      </label>
    </div>

    <!-- Preview bar -->
    <div
      aria-hidden="true"
      class="h-12 rounded-md border border-border"
      :style="{ background: css }"
    />

    <!-- Stops -->
    <ul class="flex flex-col gap-2">
      <li v-for="(stop, i) in gradient.stops" :key="i" class="flex items-center gap-2">
        <input
          type="color"
          aria-label="Stop color"
          :value="stop.color"
          :disabled="isDisabled"
          class="h-7 w-10 cursor-pointer rounded-sm border border-input bg-background"
          @input="onStopColorInput(i, $event)"
        />
        <input
          type="text"
          aria-label="Stop color hex"
          :value="stop.color"
          :disabled="isDisabled"
          :class="hexInputClass"
          @input="onStopColorInput(i, $event)"
        />
        <input
          type="number"
          aria-label="Stop position"
          :min="0"
          :max="100"
          :value="stop.position"
          :disabled="isDisabled"
          :class="positionInputClass"
          @input="onStopPositionInput(i, $event)"
        />
        <span class="text-xs text-muted-foreground">%</span>
        <button
          type="button"
          aria-label="Remove stop"
          :disabled="isDisabled || gradient.stops.length <= 2"
          class="inline-flex h-7 w-7 items-center justify-center rounded text-destructive hover:bg-destructive-soft disabled:pointer-events-none disabled:opacity-40"
          @click="removeStop(i)"
        >
          <Icon :icon="TrashIcon" :size="12" />
        </button>
      </li>
    </ul>

    <button
      type="button"
      :disabled="isDisabled"
      class="inline-flex h-8 w-full items-center justify-center gap-1 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
      @click="addStop"
    >
      <Icon :icon="PlusIcon" :size="12" /> Add stop
    </button>

    <!-- CSS output -->
    <code
      class="block break-all rounded-md bg-muted/40 px-2 py-1.5 text-[10px] text-muted-foreground"
    >
      {{ css }}
    </code>
    <input v-if="name" type="hidden" :name="name" :value="css" />
  </div>
</template>
