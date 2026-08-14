<script lang="ts">
import type { Temporal } from 'temporal-polyfill';

export interface CalendarProps {
  /** The selected date, controlled — React's spelling, which wins when both are set. */
  value?: Temporal.PlainDate | null;

  /** The selected date, controlled. The `v-model` binding target. */
  modelValue?: Temporal.PlainDate | null;

  /** The uncontrolled initial selection. */
  defaultValue?: Temporal.PlainDate | null;

  /** The initial visible month (uncontrolled). */
  defaultMonth?: Temporal.PlainDate;

  /** The minimum selectable date. */
  min?: Temporal.PlainDate | null;

  /** The maximum selectable date. */
  max?: Temporal.PlainDate | null;

  /**
   * The custom disable predicate.
   *
   * Kept a PROP, not an emit: it RETURNS a value the grid reads on every cell, which is
   * not what an emit models.
   */
  isDisabled?: (date: Temporal.PlainDate) => boolean;
}
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { isDateDisabled, isSameDay, isToday, startOfMonth, today } from '../DateExtensions';
import MonthGrid from '../MonthGrid.vue';
import type { MonthGridDayProps } from '../MonthGrid.vue';

/** Single-date calendar grid. */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'Calendar', inheritAttrs: false });

const props = defineProps<CalendarProps>();

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [date: Temporal.PlainDate | null];
  /** Replaces React's `onValueChange`. */
  'value-change': [date: Temporal.PlainDate | null];
}>();

const attrs = useAttrs();

const controlled = useControlled<Temporal.PlainDate | null>({
  /* `??` is wrong here — `null` is a MEANINGFUL selection ("nothing selected"), and `??`
     would fall through it to `modelValue`. Only `undefined` means "not controlled". */
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? null,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const selected = controlled.value;

/* `today()` reads the host time zone through `Temporal.Now` — universal, not a browser
   global, so both seeds are safe on the server. */
const viewMonth = ref<Temporal.PlainDate>(
  startOfMonth(props.defaultMonth ?? selected.value ?? today()),
);
const focusedDate = ref<Temporal.PlainDate>(selected.value ?? today());

function setViewMonth(next: Temporal.PlainDate): void {
  viewMonth.value = next;
}

function setFocusedDate(next: Temporal.PlainDate): void {
  focusedDate.value = next;
}

function isDayDisabled(d: Temporal.PlainDate): boolean {
  return isDateDisabled(d, { min: props.min, max: props.max, isDisabled: props.isDisabled });
}

function onDayActivate(d: Temporal.PlainDate): void {
  controlled.setValue(d);
}

/*
 * `hover:text-primary-foreground` is load-bearing, not decoration: `MonthGrid`'s base carries
 * `hover:text-foreground`, and tailwind-merge only drops a class from the same utility group
 * AND the same variant — a plain `text-primary-foreground` does not displace a `hover:text-*`.
 * Without it the selected day's number flipped to near-black on `bg-primary` while hovered.
 *
 * `hover:bg-primary/90` (the package's solid-surface hover, see `Button.variants`) rather than
 * a flat `hover:bg-primary`, so hovering the selected day still reads as a hover.
 */
function dayProps(date: Temporal.PlainDate): MonthGridDayProps {
  const isSelectedCell = isSameDay(selected.value, date);
  return {
    'aria-selected': isSelectedCell,
    'data-selected': isSelectedCell ? '' : undefined,
    class: cn(
      'rounded-sm',
      isToday(date) && !isSelectedCell && 'border border-border',
      isSelectedCell &&
        'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
    ),
  };
}

/* Never a declared prop — a declared `'aria-label'` would arrive as `props.ariaLabel`. It is
   read off the attrs so it can be relocated onto the inner grid, as React did. */
const ariaLabel = computed(() => (attrs['aria-label'] as string | undefined) ?? 'Calendar');

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class', 'aria-label']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() => cn(attrs.class as ClassValue));

const root = useTemplateRef<HTMLDivElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div ref="root" :class="rootClass" v-bind="passthroughAttrs">
    <MonthGrid
      :view-month="viewMonth"
      :on-view-month-change="setViewMonth"
      :focused-date="focusedDate"
      :on-focused-date-change="setFocusedDate"
      :is-day-disabled="isDayDisabled"
      :on-day-activate="onDayActivate"
      :day-props="dayProps"
      :aria-label="ariaLabel"
    />
  </div>
</template>
