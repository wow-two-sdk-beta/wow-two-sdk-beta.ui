<script lang="ts">
import { Temporal } from 'temporal-polyfill';
import { addDays, addMonths, daysInMonth, formatISODate, sundayIndex } from '../DateExtensions';

/** Defines an RFC-5545 recurrence frequency (the `FREQ=` value). */
export const RecurrenceFreq = {
  /** Refers to a daily recurrence. */
  Daily: 'DAILY',
  /** Refers to a weekly recurrence. */
  Weekly: 'WEEKLY',
  /** Refers to a monthly recurrence. */
  Monthly: 'MONTHLY',
  /** Refers to a yearly recurrence. */
  Yearly: 'YEARLY',
} as const;

export type RecurrenceFreq = (typeof RecurrenceFreq)[keyof typeof RecurrenceFreq];

/** Defines an RFC-5545 weekday token (the `BYDAY=` value). */
export const RecurrenceWeekday = {
  /** Refers to Monday. */
  Monday: 'MO',
  /** Refers to Tuesday. */
  Tuesday: 'TU',
  /** Refers to Wednesday. */
  Wednesday: 'WE',
  /** Refers to Thursday. */
  Thursday: 'TH',
  /** Refers to Friday. */
  Friday: 'FR',
  /** Refers to Saturday. */
  Saturday: 'SA',
  /** Refers to Sunday. */
  Sunday: 'SU',
} as const;

export type RecurrenceWeekday = (typeof RecurrenceWeekday)[keyof typeof RecurrenceWeekday];

/** Defines how a recurrence terminates. */
export const RecurrenceEndMode = {
  /** Refers to an open-ended recurrence (no end). */
  Never: 'never',
  /** Refers to ending after a fixed occurrence count. */
  Count: 'count',
  /** Refers to ending on a fixed until-date. */
  Until: 'until',
} as const;

export type RecurrenceEndMode = (typeof RecurrenceEndMode)[keyof typeof RecurrenceEndMode];

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval: number;
  byDay?: ReadonlyArray<RecurrenceWeekday>;
  byMonthDay?: number;
  count?: number;
  until?: Temporal.PlainDate | null;
}

export interface RecurrenceEditorProps {
  /** The rule, controlled — React's spelling, which wins when both are set. */
  value?: RecurrenceRule;

  /** The rule, controlled. The `v-model` binding target. */
  modelValue?: RecurrenceRule;

  /** The initial rule when uncontrolled. */
  defaultValue?: RecurrenceRule;

  /** The anchor date the preview counts forward from. Defaults to today. */
  from?: Temporal.PlainDate;

  /** How many occurrences the preview lists. Default `5`. */
  previewCount?: number;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  isDisabled?: boolean;

  /** The read-only state. Falls back to the surrounding form control's `isReadOnly`. */
  isReadOnly?: boolean;

  /** The hidden input name; when set, emits a hidden input with the serialized `RRULE:` string. */
  name?: string;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;
}

const ALL_WEEKDAYS: ReadonlyArray<RecurrenceWeekday> = [
  RecurrenceWeekday.Sunday,
  RecurrenceWeekday.Monday,
  RecurrenceWeekday.Tuesday,
  RecurrenceWeekday.Wednesday,
  RecurrenceWeekday.Thursday,
  RecurrenceWeekday.Friday,
  RecurrenceWeekday.Saturday,
];
const WEEKDAY_LABEL: Record<RecurrenceWeekday, string> = {
  [RecurrenceWeekday.Sunday]: 'Su',
  [RecurrenceWeekday.Monday]: 'Mo',
  [RecurrenceWeekday.Tuesday]: 'Tu',
  [RecurrenceWeekday.Wednesday]: 'We',
  [RecurrenceWeekday.Thursday]: 'Th',
  [RecurrenceWeekday.Friday]: 'Fr',
  [RecurrenceWeekday.Saturday]: 'Sa',
};
/* Maps a Sunday-indexed JS weekday (0=Sun … 6=Sat) to its RRULE token. */
const JS_TO_RRULE: ReadonlyArray<RecurrenceWeekday> = [
  RecurrenceWeekday.Sunday,
  RecurrenceWeekday.Monday,
  RecurrenceWeekday.Tuesday,
  RecurrenceWeekday.Wednesday,
  RecurrenceWeekday.Thursday,
  RecurrenceWeekday.Friday,
  RecurrenceWeekday.Saturday,
];

function serializeRule(r: RecurrenceRule): string {
  const parts: Array<string> = [`FREQ=${r.freq}`];
  if (r.interval > 1) parts.push(`INTERVAL=${r.interval}`);
  if (r.byDay && r.byDay.length > 0) parts.push(`BYDAY=${r.byDay.join(',')}`);
  if (r.byMonthDay) parts.push(`BYMONTHDAY=${r.byMonthDay}`);
  if (r.count) parts.push(`COUNT=${r.count}`);
  if (r.until) parts.push(`UNTIL=${formatISODate(r.until).replace(/-/g, '')}`);
  return `RRULE:${parts.join(';')}`;
}

function nextOccurrence(
  rule: RecurrenceRule,
  prev: Temporal.PlainDate,
): Temporal.PlainDate | null {
  switch (rule.freq) {
    case RecurrenceFreq.Daily:
      return addDays(prev, rule.interval);
    case RecurrenceFreq.Weekly: {
      if (!rule.byDay || rule.byDay.length === 0) return addDays(prev, 7 * rule.interval);
      // Find the next allowed weekday in `prev`'s week (weeks start Sunday);
      // exhausted → jump to the week `interval` weeks later and scan it.
      const allowed = new Set(rule.byDay);
      let cursor = addDays(prev, 1);
      while (sundayIndex(cursor) !== 0) {
        if (allowed.has(JS_TO_RRULE[sundayIndex(cursor)]!)) return cursor;
        cursor = addDays(cursor, 1);
      }
      // `cursor` is the Sunday opening the following week; skip interval-1 more weeks.
      cursor = addDays(cursor, 7 * (rule.interval - 1));
      for (let i = 0; i < 7; i++) {
        if (allowed.has(JS_TO_RRULE[sundayIndex(cursor)]!)) return cursor;
        cursor = addDays(cursor, 1);
      }
      return null;
    }
    case RecurrenceFreq.Monthly: {
      const next = addMonths(prev, rule.interval);
      if (rule.byMonthDay) {
        // Clamp to the month's length so day 31 in a 30-day month lands on the last day.
        const day = Math.min(rule.byMonthDay, daysInMonth(next.year, next.month));
        return next.with({ day });
      }
      return next;
    }
    case RecurrenceFreq.Yearly:
      return prev.add({ years: rule.interval });
  }
}

function buildPreview(
  rule: RecurrenceRule,
  from: Temporal.PlainDate,
  count: number,
): ReadonlyArray<Temporal.PlainDate> {
  const out: Array<Temporal.PlainDate> = [];
  let cursor = from;
  // Include `from` if it satisfies the rule (simplification: always include for visual hint).
  out.push(cursor);
  for (let i = 0; i < count - 1; i++) {
    const next = nextOccurrence(rule, cursor);
    if (!next) break;
    if (rule.until && Temporal.PlainDate.compare(next, rule.until) > 0) break;
    if (rule.count && out.length >= rule.count) break;
    out.push(next);
    cursor = next;
  }
  return out;
}

const DEFAULT_RULE: RecurrenceRule = {
  freq: RecurrenceFreq.Weekly,
  interval: 1,
  byDay: [RecurrenceWeekday.Monday],
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled, useId } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { parseISODate, today } from '../DateExtensions';
import { inputBaseVariants, InputSize } from '../InputStyles';

/**
 * Visual RRULE editor. Output is a JS `RecurrenceRule` object via `update:modelValue` /
 * `value-change`; if `name` is set, also emits a hidden `RRULE:FREQ=…` string for forms.
 *
 * Form-aware at GROUP level: inside a `Field`/`form.Field` the root (`role="group"`)
 * takes the context id + `aria-labelledby`/`aria-describedby`/`aria-invalid`, and
 * the disabled/read-only flags cascade to every inner control.
 */
/* `inheritAttrs: false` so `class` folds into the root's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'RecurrenceEditor', inheritAttrs: false });

const props = withDefaults(defineProps<RecurrenceEditorProps>(), {
  from: () => today(),
  previewCount: 5,
  /* Explicit `undefined` defaults: `useControlled` keys on `=== undefined`, and Vue casts an
     absent `boolean` prop to `false` — which would shadow the form control context. */
  value: undefined,
  modelValue: undefined,
  defaultValue: undefined,
  isDisabled: undefined,
  isReadOnly: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [rule: RecurrenceRule];
  /** Replaces React's `onValueChange`. */
  'value-change': [rule: RecurrenceRule];
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const ctx = useFormControl();
const isDisabled = computed(() => props.isDisabled ?? ctx?.isDisabled);
const isReadOnly = computed(() => props.isReadOnly ?? ctx?.isReadOnly);

const controlled = useControlled<RecurrenceRule>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? DEFAULT_RULE,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const rule = controlled.value;
const uid = useId('recurrence');

const preview = computed(() => buildPreview(rule.value, props.from, props.previewCount));

function update(patch: Partial<RecurrenceRule>): void {
  const next = { ...rule.value, ...patch };
  // Reset incompatible fields when freq changes.
  if (patch.freq && patch.freq !== rule.value.freq) {
    if (patch.freq !== RecurrenceFreq.Weekly) next.byDay = undefined;
    if (patch.freq !== RecurrenceFreq.Monthly) next.byMonthDay = undefined;
  }
  controlled.setValue(next);
}

const endMode = computed<RecurrenceEndMode>(() =>
  rule.value.count
    ? RecurrenceEndMode.Count
    : rule.value.until
      ? RecurrenceEndMode.Until
      : RecurrenceEndMode.Never,
);

function onIntervalInput(event: Event): void {
  const raw = Number((event.target as HTMLInputElement).value) || 1;
  update({ interval: Math.max(1, raw) });
}

function onFreqChange(event: Event): void {
  update({ freq: (event.target as HTMLSelectElement).value as RecurrenceFreq });
}

function isWeekdayChecked(wd: RecurrenceWeekday): boolean {
  return rule.value.byDay?.includes(wd) ?? false;
}

function toggleWeekday(wd: RecurrenceWeekday): void {
  const set = new Set(rule.value.byDay ?? []);
  if (set.has(wd)) set.delete(wd);
  else set.add(wd);
  update({ byDay: Array.from(set) });
}

function onMonthDayInput(event: Event): void {
  const raw = Number((event.target as HTMLInputElement).value) || 1;
  update({ byMonthDay: Math.min(31, Math.max(1, raw)) });
}

function onCountInput(event: Event): void {
  const raw = Number((event.target as HTMLInputElement).value) || 1;
  update({ count: Math.max(1, raw), until: null });
}

function onUntilInput(event: Event): void {
  update({ until: parseISODate((event.target as HTMLInputElement).value), count: undefined });
}

function weekdayClass(wd: RecurrenceWeekday): string {
  return cn(
    'inline-flex h-7 w-9 items-center justify-center rounded-md border text-xs font-medium transition-colors',
    isWeekdayChecked(wd)
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-input bg-background text-muted-foreground hover:bg-muted',
  );
}

function weekdayLabel(wd: RecurrenceWeekday): string {
  return WEEKDAY_LABEL[wd];
}

const rootId = computed(() => props.id ?? ctx?.id);
const endRadioName = computed(() => `${props.name ?? 'rule'}-end`);
const untilValue = computed(() => formatISODate(rule.value.until ?? null));
const serialized = computed(() => serializeRule(rule.value));

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    'flex flex-col gap-3 rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm',
    isDisabled.value && 'opacity-60',
    attrs.class as ClassValue,
  ),
);

const intervalClass = cn(inputBaseVariants({ size: InputSize.Sm }), 'w-16');
const freqClass = cn(inputBaseVariants({ size: InputSize.Sm }), 'w-32');
const monthDayClass = cn(inputBaseVariants({ size: InputSize.Sm }), 'w-20');
const countClass = cn(inputBaseVariants({ size: InputSize.Sm }), 'w-20');
const untilClass = cn(inputBaseVariants({ size: InputSize.Sm }), 'w-44');

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
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <label :for="`${uid}-interval`" class="text-muted-foreground">Every</label>
      <input
        :id="`${uid}-interval`"
        type="number"
        :min="1"
        :max="999"
        :value="rule.interval"
        :disabled="isDisabled"
        :readonly="isReadOnly"
        :class="intervalClass"
        @input="onIntervalInput"
      />
      <select
        aria-label="Frequency"
        :value="rule.freq"
        :disabled="isDisabled"
        :class="freqClass"
        @change="onFreqChange"
      >
        <option value="DAILY">{{ rule.interval > 1 ? 'days' : 'day' }}</option>
        <option value="WEEKLY">{{ rule.interval > 1 ? 'weeks' : 'week' }}</option>
        <option value="MONTHLY">{{ rule.interval > 1 ? 'months' : 'month' }}</option>
        <option value="YEARLY">{{ rule.interval > 1 ? 'years' : 'year' }}</option>
      </select>
    </div>

    <div v-if="rule.freq === 'WEEKLY'" class="flex items-center gap-2 text-sm">
      <span class="text-muted-foreground">On</span>
      <div role="group" aria-label="Days of week" class="flex flex-wrap gap-1">
        <button
          v-for="wd in ALL_WEEKDAYS"
          :key="wd"
          type="button"
          role="checkbox"
          :aria-checked="isWeekdayChecked(wd)"
          :disabled="isDisabled || isReadOnly"
          :class="weekdayClass(wd)"
          @click="toggleWeekday(wd)"
        >
          {{ weekdayLabel(wd) }}
        </button>
      </div>
    </div>

    <div v-if="rule.freq === 'MONTHLY'" class="flex items-center gap-2 text-sm">
      <label :for="`${uid}-month-day`" class="text-muted-foreground">On day</label>
      <input
        :id="`${uid}-month-day`"
        type="number"
        :min="1"
        :max="31"
        :value="rule.byMonthDay ?? from.day"
        :disabled="isDisabled"
        :readonly="isReadOnly"
        :class="monthDayClass"
        @input="onMonthDayInput"
      />
      <span class="text-muted-foreground">of the month</span>
    </div>

    <div role="radiogroup" aria-label="End mode" class="flex flex-col gap-2 text-sm">
      <label class="flex items-center gap-2">
        <input
          type="radio"
          :name="endRadioName"
          :checked="endMode === 'never'"
          :disabled="isDisabled || isReadOnly"
          @change="update({ count: undefined, until: null })"
        />
        Never
      </label>
      <label class="flex items-center gap-2">
        <input
          type="radio"
          :name="endRadioName"
          :checked="endMode === 'count'"
          :disabled="isDisabled || isReadOnly"
          @change="update({ count: rule.count ?? 10, until: null })"
        />
        After
        <input
          type="number"
          aria-label="Occurrence count"
          :min="1"
          :value="rule.count ?? ''"
          :disabled="isDisabled || isReadOnly || endMode !== 'count'"
          :class="countClass"
          @input="onCountInput"
        />
        occurrences
      </label>
      <label class="flex items-center gap-2">
        <input
          type="radio"
          :name="endRadioName"
          :checked="endMode === 'until'"
          :disabled="isDisabled || isReadOnly"
          @change="update({ until: addMonths(from, 6), count: undefined })"
        />
        On
        <input
          type="date"
          aria-label="End date"
          :value="untilValue"
          :disabled="isDisabled || isReadOnly || endMode !== 'until'"
          :class="untilClass"
          @input="onUntilInput"
        />
      </label>
    </div>

    <div class="rounded-md bg-muted/40 p-3 text-xs">
      <div class="mb-1 font-medium text-muted-foreground">Next occurrences</div>
      <ul aria-live="polite" class="grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3">
        <li v-for="(d, i) in preview" :key="i" class="text-foreground tabular-nums">
          {{ formatISODate(d) }}
        </li>
      </ul>
    </div>
    <input v-if="name" type="hidden" :name="name" :value="serialized" />
  </div>
</template>
