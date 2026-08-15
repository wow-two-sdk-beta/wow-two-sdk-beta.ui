<script lang="ts">
import type { Temporal } from 'temporal-polyfill';
import type { SelectSize } from '../select';
import type { InputState } from '../InputStyles';
import type { DateRange } from '../rangeCalendar';

export interface DateRangePickerProps {
  /** The selected range, controlled — React's spelling, which wins when both are set. */
  value?: DateRange | null;

  /** The selected range, controlled. The `v-model` binding target. */
  modelValue?: DateRange | null;

  /** The uncontrolled initial selection. */
  defaultValue?: DateRange | null;

  /** The empty-state text on the trigger. */
  placeholder?: string;

  /**
   * The trigger's date formatter.
   *
   * Kept a PROP, not an emit: it RETURNS the rendered string, which an emit cannot do.
   */
  format?: (date: Temporal.PlainDate) => string;

  /** The minimum selectable date. */
  min?: Temporal.PlainDate | null;

  /** The maximum selectable date. */
  max?: Temporal.PlainDate | null;

  /** The custom per-day disable predicate. Also a returning prop. */
  isDisabled?: (date: Temporal.PlainDate) => boolean;

  /** The invalid surface override. Falls back to the surrounding form control's `isInvalid`. */
  isInvalid?: boolean;

  /** The hidden input name; when set, two hidden inputs (`{name}_start`, `{name}_end`) ship the ISO values. */
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
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef, watch } from 'vue';
import type { ClassValue } from 'clsx';
import { Calendar as CalendarIcon } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { selectTriggerVariants } from '../select/Select.variants';
import { InputState as InputStateValue } from '../InputStyles';
import { formatISODate, today } from '../DateExtensions';
import RangeCalendar from '../rangeCalendar/RangeCalendar.vue';

/** Trigger button + popover `RangeCalendar`, auto-closing once both ends are picked. */
/* `inheritAttrs: false` so `class` folds into the trigger's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'DateRangePicker', inheritAttrs: false });

const props = withDefaults(defineProps<DateRangePickerProps>(), {
  placeholder: 'Pick a range',
  format: (d: Temporal.PlainDate) => d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form control
     context, and Vue casts an absent `boolean` prop to `false` — which would shadow it. */
  isInvalid: undefined,
  disabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [range: DateRange | null];
  /** Replaces React's `onValueChange`. */
  'value-change': [range: DateRange | null];
}>();

const attrs = useAttrs();

/* Inherits id/disabled/invalid/labelledby/describedby from a surrounding <Field>;
   standalone props win when provided, context fills the gaps (Select parity). */
const field = useFormControl();

const finalDisabled = computed(() => props.disabled ?? field?.isDisabled);
const finalInvalid = computed(() => props.isInvalid ?? field?.isInvalid);

const controlled = useControlled<DateRange | null>({
  /* `??` is wrong here — `null` is a MEANINGFUL selection, and `??` would fall through it
     to `modelValue`. Only `undefined` means "not controlled". */
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? null,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const range = controlled.value;

const open = ref(false);

/*
 * Auto-close when both ends are picked. NOT `immediate` — an immediate watcher runs during
 * setup, on the server too, and the React original's effect only mattered after a change.
 */
let wasComplete = false;
watch([range, open], ([nextRange, isOpen]) => {
  const complete = Boolean(nextRange?.start && nextRange?.end);
  if (complete && !wasComplete && isOpen) open.value = false;
  wasComplete = complete;
});

function onCalendarChange(next: DateRange | null): void {
  controlled.setValue(next);
}

const triggerState = computed(
  () => props.state ?? (finalInvalid.value ? InputStateValue.Invalid : InputStateValue.Default),
);

const display = computed(() => {
  const current = range.value;
  if (!current?.start) return null;
  return current.end
    ? `${props.format(current.start)} → ${props.format(current.end)}`
    : `${props.format(current.start)} → …`;
});

const displayText = computed(() => display.value ?? props.placeholder);

/* Never a declared prop — a declared `'aria-label'` would arrive as `props.ariaLabel`. */
const ariaLabel = computed(() => attrs['aria-label'] as string | undefined);

const triggerId = computed(() => props.id ?? field?.id);
/* Names the trigger from the Field label when present; an explicit aria-label always wins. */
const labelledBy = computed(() => (ariaLabel.value ? undefined : field?.labelledBy));
const describedBy = computed(() => field?.describedBy);
const ariaInvalid = computed(() => triggerState.value === InputStateValue.Invalid || undefined);

const defaultMonth = computed(() => range.value?.start ?? today());
const hiddenStart = computed(() => formatISODate(range.value?.start));
const hiddenEnd = computed(() => formatISODate(range.value?.end));

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class', 'aria-label']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const triggerClass = computed(() =>
  cn(selectTriggerVariants({ size: props.size, state: triggerState.value }), attrs.class as ClassValue),
);

const labelClass = computed(() => cn('truncate', !display.value && 'text-muted-foreground'));

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
      <CalendarIcon class="h-4 w-4 shrink-0 text-muted-foreground" />
    </PopoverTrigger>
    <PopoverContent is-bare>
      <RangeCalendar
        :value="range"
        :default-month="defaultMonth"
        :min="min"
        :max="max"
        :is-disabled="isDisabled"
        @value-change="onCalendarChange"
      />
    </PopoverContent>
    <template v-if="name">
      <input type="hidden" :name="`${name}_start`" :value="hiddenStart" />
      <input type="hidden" :name="`${name}_end`" :value="hiddenEnd" />
    </template>
  </Popover>
</template>
