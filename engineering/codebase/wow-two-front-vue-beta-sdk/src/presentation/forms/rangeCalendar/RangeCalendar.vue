<script lang="ts">
import type { Temporal } from 'temporal-polyfill';

/** A completed date range. Both ends are set; the in-progress state is internal. */
export interface DateRange {
  start: Temporal.PlainDate;
  end: Temporal.PlainDate;
}

export interface RangeCalendarProps {
  /** The selected range, controlled — React's spelling, which wins when both are set. */
  value?: DateRange | null;

  /** The selected range, controlled. The `v-model` binding target. */
  modelValue?: DateRange | null;

  /** The uncontrolled initial selection. */
  defaultValue?: DateRange | null;

  /** The initial visible month (uncontrolled). */
  defaultMonth?: Temporal.PlainDate;

  /** The minimum selectable date. */
  min?: Temporal.PlainDate | null;

  /** The maximum selectable date. */
  max?: Temporal.PlainDate | null;

  /**
   * The custom disable predicate.
   *
   * Kept a PROP, not an emit: it RETURNS a value the grid reads on every cell.
   */
  isDisabled?: (date: Temporal.PlainDate) => boolean;
}
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { Temporal as TemporalValue } from 'temporal-polyfill';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { isDateDisabled, isInRange, isSameDay, isToday, startOfMonth, today } from '../DateExtensions';
import MonthGrid from '../MonthGrid.vue';
import type { MonthGridDayProps } from '../MonthGrid.vue';

/** Two-ended date-range calendar grid with hover preview. */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'RangeCalendar', inheritAttrs: false });

const props = defineProps<RangeCalendarProps>();

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [range: DateRange | null];
  /** Replaces React's `onValueChange`. */
  'value-change': [range: DateRange | null];
}>();

const attrs = useAttrs();

const controlled = useControlled<DateRange | null>({
  /* `??` is wrong here — `null` is a MEANINGFUL selection ("nothing selected"), and `??`
     would fall through it to `modelValue`. Only `undefined` means "not controlled". */
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? null,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const range = controlled.value;

/* `today()` reads the host time zone through `Temporal.Now` — universal, not a browser
   global, so both seeds are safe on the server. */
const viewMonth = ref<Temporal.PlainDate>(startOfMonth(props.defaultMonth ?? range.value?.start ?? today()));
const focusedDate = ref<Temporal.PlainDate>(range.value?.start ?? today());
const hoveredDate = ref<Temporal.PlainDate | null>(null);
const pendingStart = ref<Temporal.PlainDate | null>(null);

function setViewMonth(next: Temporal.PlainDate): void {
  viewMonth.value = next;
}

function setFocusedDate(next: Temporal.PlainDate): void {
  focusedDate.value = next;
}

function isDayDisabled(d: Temporal.PlainDate): boolean {
  return isDateDisabled(d, { min: props.min, max: props.max, isDisabled: props.isDisabled });
}

function onDayActivate(date: Temporal.PlainDate): void {
  if (!pendingStart.value) {
    /* First click opens a pending range; the public value clears until both ends are set
       (a `DateRange` always carries a real start and end). */
    pendingStart.value = date;
    controlled.setValue(null);
    return;
  }
  const forward = TemporalValue.PlainDate.compare(pendingStart.value, date) <= 0;
  const finalStart = forward ? pendingStart.value : date;
  const finalEnd = forward ? date : pendingStart.value;
  controlled.setValue({ start: finalStart, end: finalEnd });
  pendingStart.value = null;
}

const previewEnd = computed(() => (pendingStart.value ? hoveredDate.value : (range.value?.end ?? null)));

function isStart(d: Temporal.PlainDate): boolean {
  return isSameDay(d, range.value?.start ?? null) || isSameDay(d, pendingStart.value);
}

function isEnd(d: Temporal.PlainDate): boolean {
  return isSameDay(d, range.value?.end ?? null);
}

function inRange(d: Temporal.PlainDate): boolean {
  return isInRange(d, pendingStart.value ?? range.value?.start, previewEnd.value);
}

function dayProps(date: Temporal.PlainDate): MonthGridDayProps {
  const startCell = isStart(date);
  const endCell = isEnd(date);
  const rangeCell = inRange(date) && !startCell && !endCell;
  const selected = startCell || endCell;
  return {
    'aria-selected': selected,
    'data-range-start': startCell ? '' : undefined,
    'data-range-end': endCell ? '' : undefined,
    'data-in-range': rangeCell ? '' : undefined,
    onPointerenter: () => {
      hoveredDate.value = date;
    },
    onPointerleave: () => {
      if (isSameDay(hoveredDate.value, date)) hoveredDate.value = null;
    },
    /*
     * Every painted cell has to restate BOTH `hover:bg-*` and `hover:text-*`. `MonthGrid`'s
     * base hover is `hover:bg-primary/10 hover:text-foreground`, and a `:hover` rule outranks
     * the unqualified `bg-primary` / `bg-primary-soft` here on specificity — so without an
     * explicit hover the selected ends and the in-range run lost their fill the moment the
     * pointer touched them. tailwind-merge only resolves same-group + same-variant pairs.
     *
     * The ladder: `/90` on the solid ends (the package's solid-surface hover), `/25` on the
     * in-range run — a step deeper than its `primary-soft` fill, so the hover reads against
     * the range without competing with the ends.
     */
    class: cn(
      isToday(date) && !startCell && !endCell && 'border border-border rounded-sm',
      rangeCell &&
        'bg-primary-soft text-primary-soft-foreground hover:bg-primary/25 hover:text-primary-soft-foreground',
      startCell && 'bg-primary text-primary-foreground rounded-l-sm hover:bg-primary/90 hover:text-primary-foreground',
      endCell && 'bg-primary text-primary-foreground rounded-r-sm hover:bg-primary/90 hover:text-primary-foreground',
      !startCell && !endCell && !rangeCell && 'rounded-sm',
    ),
  };
}

/* Never a declared prop — a declared `'aria-label'` would arrive as `props.ariaLabel`. It is
   read off the attrs so it can be relocated onto the inner grid, as React did. */
const ariaLabel = computed(() => (attrs['aria-label'] as string | undefined) ?? 'Date range');

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
