<script lang="ts">
import type { Size } from '../../../foundation/utils';

/** Defines the character set a pin-input cell accepts. */
export const PinInputType = {
  /** Refers to digits only (`0-9`). */
  Numeric: 'numeric',
  /** Refers to any single alphanumeric character. */
  Alphanumeric: 'alphanumeric',
} as const;

export type PinInputType = (typeof PinInputType)[keyof typeof PinInputType];

export interface PinInputProps {
  /** The number of digit cells. Default 6. */
  length?: number;

  /** The value, controlled (full string) — React's spelling, which wins when both are set. */
  value?: string;

  /** The value, controlled (full string). The `v-model` binding target. */
  modelValue?: string;

  /** The uncontrolled initial value. */
  defaultValue?: string;

  /** The allowed characters — digits (`numeric`) or any single char (`alphanumeric`). Default `numeric`. */
  type?: PinInputType;

  /** The cell visual size. Default `md`. */
  size?: Size;

  /** The masked mode — renders each cell as `*` (good for verification codes). */
  isMasked?: boolean;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  isDisabled?: boolean;
}

/* Sizes not listed fall back to the `md` row at the call site. */
const SIZE: Partial<Record<Size, string>> = {
  sm: 'h-9 w-9 text-base',
  md: 'h-11 w-11 text-lg',
  lg: 'h-14 w-14 text-xl',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, Size as SizeValue } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { inputBaseVariants, InputState } from '../InputStyles';

/**
 * One-time-code / PIN input — N single-character cells with auto-advance,
 * paste-spread, and backspace-to-previous behavior.
 */
/* `inheritAttrs: false` so `class` folds into the wrapper's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'PinInput', inheritAttrs: false });

const props = withDefaults(defineProps<PinInputProps>(), {
  length: 6,
  type: PinInputType.Numeric,
  size: SizeValue.Md,
  /* Explicit `undefined` defaults are load-bearing: `isDisabled` falls back to the form
     control context, and Vue casts an absent `boolean` prop to `false`. */
  isMasked: undefined,
  isDisabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: string];
  /** Emits the value whenever it changes. Replaces React's `onValueChange`. */
  'value-change': [value: string];
  /** Emits the value when the user fills the final cell. Replaces React's `onComplete`. */
  complete: [value: string];
}>();

const attrs = useAttrs();

/* Per-cell array state — a joined string compacts empties, remapping cell i to char 0. */
function toCells(s: string): ReadonlyArray<string> {
  return Array.from({ length: props.length }, (_, i) => s[i] ?? '');
}

const controlled = useControlled<ReadonlyArray<string>>({
  controlled: () => {
    const external = props.value ?? props.modelValue;
    return external === undefined ? undefined : toCells(external);
  },
  default: () => toCells(props.defaultValue ?? ''),
  onChange: (next) => {
    emit('update:modelValue', next.join(''));
    emit('value-change', next.join(''));
  },
});

const cells = controlled.value;

/* Plain array of element refs, filled by the function ref below — the Vue counterpart of
   React's `useRef<Array<HTMLInputElement | null>>`. */
const inputs: Array<HTMLInputElement | null> = [];

function setCellRef(el: unknown, index: number): void {
  inputs[index] = el instanceof HTMLInputElement ? el : null;
}

/* FormControlContext adoption — flags cascade onto every cell; the id/describedby
   land on the FIRST cell (the composite's primary input), so `Field`-rendered
   labels/helper reach the control. A user `id` prop stays on the wrapper div. */
const ctx = useFormControl();
const isDisabled = computed(() => props.isDisabled ?? ctx?.isDisabled);
const isInvalid = computed(() => ctx?.isInvalid ?? false);
const isReadOnly = computed(() => ctx?.isReadOnly || undefined);

function isAllowed(ch: string): boolean {
  return props.type === PinInputType.Numeric ? /^[0-9]$/.test(ch) : /^[A-Za-z0-9]$/.test(ch);
}

function update(next: ReadonlyArray<string>): void {
  controlled.setValue(next);
  if (next.every(Boolean)) emit('complete', next.join(''));
}

function onCellInput(index: number, event: Event): void {
  const ch = (event.target as HTMLInputElement).value.slice(-1);
  if (ch && !isAllowed(ch)) return;
  const arr = cells.value.slice();
  arr[index] = ch;
  update(arr);
  if (ch && index < props.length - 1) inputs[index + 1]?.focus();
}

function onCellKeydown(index: number, event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  if (event.key === 'Backspace' && !cells.value[index] && index > 0) {
    inputs[index - 1]?.focus();
  } else if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault();
    inputs[index - 1]?.focus();
  } else if (event.key === 'ArrowRight' && index < props.length - 1) {
    event.preventDefault();
    inputs[index + 1]?.focus();
  }
}

function onPaste(event: ClipboardEvent): void {
  const pasted = event.clipboardData?.getData('text').replace(/\s+/g, '') ?? '';
  const filtered = pasted.split('').filter(isAllowed).join('');
  if (filtered) {
    event.preventDefault();
    update(toCells(filtered));
    const focusIdx = Math.min(filtered.length, props.length - 1);
    inputs[focusIdx]?.focus();
  }
}

const cellType = computed(() => (props.isMasked ? 'password' : 'text'));
const inputMode = computed(() => (props.type === PinInputType.Numeric ? 'numeric' : 'text'));

/* Cells are internal — consumers can't label them individually, so each carries a built-in
   name (the aria-label wins over a `Field` label's htmlFor, keeping per-digit announcements). */
function cellLabel(index: number): string {
  const noun = props.type === PinInputType.Numeric ? 'Digit' : 'Character';
  return `${noun} ${index + 1} of ${props.length}`;
}

const firstCellId = computed(() => ctx?.id);
const firstCellDescribedBy = computed(() => ctx?.describedBy);
const firstCellRequired = computed(() => ctx?.isRequired || undefined);

const cellClass = computed(() =>
  cn(
    inputBaseVariants({ state: isInvalid.value ? InputState.Invalid : InputState.Default }),
    'text-center font-medium',
    SIZE[props.size] ?? SIZE.md,
  ),
);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() => cn('inline-flex gap-2', attrs.class as ClassValue));

const root = useTemplateRef<HTMLDivElement>('root');

/** The rendered wrapper — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div ref="root" :class="rootClass" v-bind="passthroughAttrs">
    <input
      v-for="(ch, i) in cells"
      :key="i"
      :ref="(el) => setCellRef(el, i)"
      :type="cellType"
      :inputmode="inputMode"
      :aria-label="cellLabel(i)"
      :id="i === 0 ? firstCellId : undefined"
      :aria-describedby="i === 0 ? firstCellDescribedBy : undefined"
      :aria-required="i === 0 ? firstCellRequired : undefined"
      :aria-invalid="isInvalid || undefined"
      autocomplete="one-time-code"
      :maxlength="1"
      :disabled="isDisabled"
      :readonly="isReadOnly"
      :value="ch"
      :class="cellClass"
      @input="onCellInput(i, $event)"
      @keydown="onCellKeydown(i, $event)"
      @paste="onPaste"
    />
  </div>
</template>
