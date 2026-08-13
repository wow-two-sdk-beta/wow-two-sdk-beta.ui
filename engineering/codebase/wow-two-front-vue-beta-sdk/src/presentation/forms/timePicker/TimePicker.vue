<script lang="ts">
import type { Temporal } from 'temporal-polyfill';
import type { SelectSize } from '../select';
import type { InputState } from '../InputStyles';

export interface TimePickerProps {
  /** The selected time, controlled — React's spelling, which wins when both are set. */
  value?: Temporal.PlainTime | null;

  /** The selected time, controlled. The `v-model` binding target. */
  modelValue?: Temporal.PlainTime | null;

  /** The uncontrolled initial selection. */
  defaultValue?: Temporal.PlainTime | null;

  /** The minute interval. Default 5. */
  minuteStep?: number;

  /** The empty-state text on the trigger. */
  placeholder?: string;

  /**
   * The trigger's time formatter.
   *
   * Kept a PROP, not an emit: it RETURNS the rendered string, which an emit cannot do.
   */
  format?: (time: Temporal.PlainTime) => string;

  /** The invalid surface override. Falls back to the surrounding form control's `isInvalid`. */
  isInvalid?: boolean;

  /** The hidden input name; when set, a hidden input ships the value with form submission. */
  name?: string;

  /** The trigger size. */
  size?: SelectSize;

  /** The validity surface. */
  state?: InputState;

  /** The trigger's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef, watch } from 'vue';
import type { ClassValue } from 'clsx';
import { Temporal as TemporalValue } from 'temporal-polyfill';
import { Clock } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { selectTriggerVariants } from '../select/Select.variants';
import { InputState as InputStateValue } from '../InputStyles';

/** Trigger button + popover hour/minute columns. */
/* `inheritAttrs: false` so `class` folds into the trigger's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'TimePicker', inheritAttrs: false });

const props = withDefaults(defineProps<TimePickerProps>(), {
  minuteStep: 5,
  placeholder: 'Pick a time',
  format: (t: Temporal.PlainTime) => t.toString({ smallestUnit: 'minute' }),
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form control
     context, and Vue casts an absent `boolean` prop to `false` — which would shadow it. */
  isInvalid: undefined,
  disabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [time: Temporal.PlainTime | null];
  /** Replaces React's `onValueChange`. */
  'value-change': [time: Temporal.PlainTime | null];
}>();

const attrs = useAttrs();

/* Inherits id/disabled/invalid/labelledby/describedby from a surrounding <Field>;
   standalone props win when provided, context fills the gaps (Select parity). */
const field = useFormControl();

const finalDisabled = computed(() => props.disabled ?? field?.isDisabled);
const finalInvalid = computed(() => props.isInvalid ?? field?.isInvalid);

const controlled = useControlled<Temporal.PlainTime | null>({
  /* `??` is wrong here — `null` is a MEANINGFUL selection, and `??` would fall through it
     to `modelValue`. Only `undefined` means "not controlled". */
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? null,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const time = controlled.value;

const open = ref(false);
const hours = useTemplateRef<HTMLDivElement>('hours');
const minutesEl = useTemplateRef<HTMLDivElement>('minutesEl');

const minutes = computed(() => {
  const list: Array<number> = [];
  for (let m = 0; m < 60; m += props.minuteStep) list.push(m);
  return list;
});

/*
 * Auto-scroll the selected hour/minute into view when opening. NOT `immediate` — an
 * immediate watcher runs during setup, on the server too, where `requestAnimationFrame`
 * is undefined; a change-only watcher can only fire in the browser.
 */
watch(
  open,
  (isOpen) => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      hours.value
        ?.querySelector<HTMLButtonElement>('[data-selected]')
        ?.scrollIntoView({ block: 'center' });
      minutesEl.value
        ?.querySelector<HTMLButtonElement>('[data-selected]')
        ?.scrollIntoView({ block: 'center' });
    });
  },
  { flush: 'post' },
);

const triggerState = computed(
  () =>
    props.state ??
    (finalInvalid.value ? InputStateValue.Invalid : InputStateValue.Default),
);

function update(next: { hour?: number; minute?: number }): void {
  const merged = TemporalValue.PlainTime.from({
    hour: next.hour ?? time.value?.hour ?? 0,
    minute: next.minute ?? time.value?.minute ?? 0,
  });
  controlled.setValue(merged);
}

function cellClass(isSelected: boolean): string {
  return cn(
    'grid h-8 w-12 place-items-center rounded-sm text-sm transition-colors hover:bg-muted',
    isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
  );
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

const displayText = computed(() =>
  time.value ? props.format(time.value) : props.placeholder,
);

/* Never a declared prop — a declared `'aria-label'` would arrive as `props.ariaLabel`. */
const ariaLabel = computed(() => attrs['aria-label'] as string | undefined);

const triggerId = computed(() => props.id ?? field?.id);
/* Names the trigger from the Field label when present; an explicit aria-label always wins. */
const labelledBy = computed(() => (ariaLabel.value ? undefined : field?.labelledBy));
const describedBy = computed(() => field?.describedBy);
const ariaInvalid = computed(
  () => triggerState.value === InputStateValue.Invalid || undefined,
);

const hiddenValue = computed(() => time.value?.toString({ smallestUnit: 'minute' }) ?? '');

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class', 'aria-label']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const triggerClass = computed(() =>
  cn(
    selectTriggerVariants({ size: props.size, state: triggerState.value }),
    attrs.class as ClassValue,
  ),
);

const labelClass = computed(() => cn('truncate', !time.value && 'text-muted-foreground'));

const HOUR_LIST = HOURS;

const trigger = useTemplateRef<{ el: HTMLElement | null }>('trigger');

/** The rendered trigger — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: computed(() => trigger.value?.el ?? null) });
</script>

<template>
  <Popover v-model:open="open" placement="bottom-start" :offset="6">
    <PopoverTrigger
      ref="trigger"
      :id="triggerId"
      :disabled="finalDisabled"
      :aria-invalid="ariaInvalid"
      :aria-label="ariaLabel"
      :aria-labelledby="labelledBy"
      :aria-describedby="describedBy"
      :class="triggerClass"
      v-bind="passthroughAttrs"
    >
      <!-- `muted-foreground` (not `subtle-foreground`): the trigger surface is muted, where
           subtle is only 4.2:1 (see index.css). -->
      <span :class="labelClass">{{ displayText }}</span>
      <Clock class="h-4 w-4 shrink-0 text-muted-foreground" />
    </PopoverTrigger>
    <PopoverContent is-bare>
      <div
        class="flex gap-1 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-md"
      >
        <div
          ref="hours"
          role="listbox"
          aria-label="Hours"
          class="flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1"
        >
          <button
            v-for="h in HOUR_LIST"
            :key="h"
            type="button"
            role="option"
            :aria-selected="time?.hour === h"
            :data-selected="time?.hour === h ? '' : undefined"
            :class="cellClass(time?.hour === h)"
            @click="update({ hour: h })"
          >
            {{ pad(h) }}
          </button>
        </div>
        <div class="w-px self-stretch bg-border" />
        <div
          ref="minutesEl"
          role="listbox"
          aria-label="Minutes"
          class="flex max-h-56 flex-col gap-0.5 overflow-y-auto pl-1"
        >
          <button
            v-for="m in minutes"
            :key="m"
            type="button"
            role="option"
            :aria-selected="time?.minute === m"
            :data-selected="time?.minute === m ? '' : undefined"
            :class="cellClass(time?.minute === m)"
            @click="update({ minute: m })"
          >
            {{ pad(m) }}
          </button>
        </div>
      </div>
    </PopoverContent>
    <input v-if="name && time" type="hidden" :name="name" :value="hiddenValue" />
  </Popover>
</template>
