<script lang="ts">
import type { Temporal } from 'temporal-polyfill';
import type { EventCalendarEvent, EventCalendarView } from './EventCalendarTypes';

// EventCalendar models events as absolute instants (a wall-clock time in a
// specific zone) — `Temporal.ZonedDateTime`, the peer of .NET `DateTimeOffset`.
// The month/week grid + navigation project down to `Temporal.PlainDate`; the
// intra-day time-slot geometry does its math on `ZonedDateTime` (`.hour`,
// `.add`, `until`). Both come from the shared, Temporal-based `DateExtensions`.

export interface EventCalendarProps {
  events: ReadonlyArray<EventCalendarEvent>;

  /** The visible range mode, controlled. The `v-model:view` binding target. */
  view?: EventCalendarView;

  /** The initial view when uncontrolled. */
  defaultView?: EventCalendarView;

  /**
   * The focused instant, controlled; its calendar day drives the visible month/week/day.
   * The `v-model:date` binding target.
   */
  date?: Temporal.ZonedDateTime;

  /** The initial focused instant when uncontrolled. Defaults to now. */
  defaultDate?: Temporal.ZonedDateTime;

  weekStart?: 0 | 1;
  hourRange?: [number, number];
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { Temporal as TemporalValue } from 'temporal-polyfill';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { Icon } from '../../../foundation/icons';
import { MONTHS_LONG, addDays, nowZoned } from '../../forms/DateExtensions';
import {
  EVENT_CALENDAR_VIEWS,
  EventCalendarView as EventCalendarViewValue,
  startOfWeek,
} from './EventCalendarTypes';
import MonthView from './MonthView.vue';
import TimeGridView from './TimeGridView.vue';
import AgendaView from './AgendaView.vue';

/**
 * First-generation EventCalendar — month / week / day / agenda views.
 * Header: Today / Prev / Next / Title + view switcher. Events as colored
 * blocks. Drag-edit, recurrence, "+N more" overflow deferred.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'EventCalendar', inheritAttrs: false });

const props = withDefaults(defineProps<EventCalendarProps>(), {
  defaultView: EventCalendarViewValue.Month,
  weekStart: 0,
  hourRange: () => [0, 24],
});

const emit = defineEmits<{
  /** The `v-model:view` half. */
  'update:view': [view: EventCalendarView];
  /** Replaces React's `onViewChange`. */
  'view-change': [view: EventCalendarView];
  /** The `v-model:date` half. */
  'update:date': [date: Temporal.ZonedDateTime];
  /** Replaces React's `onDateChange`. */
  'date-change': [date: Temporal.ZonedDateTime];
  /** Replaces React's `onEventClick`. */
  'event-click': [event: EventCalendarEvent];
  /** Replaces React's `onSlotClick`. `day` is the calendar day, `hour` the grid hour (time views). */
  'slot-click': [day: Temporal.PlainDate, hour?: number];
}>();

const attrs = useAttrs();

const viewControlled = useControlled<EventCalendarView>({
  controlled: () => props.view,
  default: () => props.defaultView,
  onChange: (next) => {
    emit('update:view', next);
    emit('view-change', next);
  },
});

/* `nowZoned()` reads the host time zone through `Temporal.Now` — universal, not a browser
   global, so it is safe as the uncontrolled seed on the server. */
const dateControlled = useControlled<Temporal.ZonedDateTime>({
  controlled: () => props.date,
  default: () => props.defaultDate ?? nowZoned(),
  onChange: (next) => {
    emit('update:date', next);
    emit('date-change', next);
  },
});

/* Named apart from the `view` / `date` props: a setup const sharing a prop name shadows it
   in the template and trips `vue/no-dupe-keys`. */
const currentView = viewControlled.value;
const currentDate = dateControlled.value;

/** Calendar day the view is anchored on, in the focus instant's own zone. */
const focusDay = computed(() => currentDate.value.toPlainDate());

const timeZone = computed(() => currentDate.value.timeZoneId);

const sortedEvents = computed(() =>
  [...props.events].sort((a, b) => TemporalValue.ZonedDateTime.compare(a.start, b.start)),
);

function goPrev(): void {
  switch (currentView.value) {
    case EventCalendarViewValue.Month:
      dateControlled.setValue(currentDate.value.add({ months: -1 }));
      break;
    case EventCalendarViewValue.Week:
      dateControlled.setValue(currentDate.value.add({ days: -7 }));
      break;
    case EventCalendarViewValue.Day:
    case EventCalendarViewValue.Agenda:
      dateControlled.setValue(currentDate.value.add({ days: -1 }));
      break;
  }
}

function goNext(): void {
  switch (currentView.value) {
    case EventCalendarViewValue.Month:
      dateControlled.setValue(currentDate.value.add({ months: 1 }));
      break;
    case EventCalendarViewValue.Week:
      dateControlled.setValue(currentDate.value.add({ days: 7 }));
      break;
    case EventCalendarViewValue.Day:
    case EventCalendarViewValue.Agenda:
      dateControlled.setValue(currentDate.value.add({ days: 1 }));
      break;
  }
}

function goToday(): void {
  dateControlled.setValue(nowZoned());
}

function setView(next: EventCalendarView): void {
  viewControlled.setValue(next);
}

const title = computed(() => {
  const day = focusDay.value;
  switch (currentView.value) {
    case EventCalendarViewValue.Month:
      return `${MONTHS_LONG[day.month - 1]} ${day.year}`;
    case EventCalendarViewValue.Week: {
      const ws = startOfWeek(day, props.weekStart);
      const we = addDays(ws, 6);
      return `${ws.toLocaleString(undefined, { month: 'short', day: 'numeric' })} – ${we.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    case EventCalendarViewValue.Day:
      return day.toLocaleString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    case EventCalendarViewValue.Agenda:
      return `Upcoming from ${day.toLocaleString(undefined, { month: 'short', day: 'numeric' })}`;
  }
  return '';
});

const weekFirstDay = computed(() => startOfWeek(focusDay.value, props.weekStart));

function viewButtonClass(v: EventCalendarView): string {
  return cn(
    'inline-flex h-6 items-center rounded px-2 text-xs font-medium transition-colors',
    currentView.value === v
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground',
  );
}

const isMonth = computed(() => currentView.value === EventCalendarViewValue.Month);
const isWeek = computed(() => currentView.value === EventCalendarViewValue.Week);
const isDay = computed(() => currentView.value === EventCalendarViewValue.Day);
const isAgenda = computed(() => currentView.value === EventCalendarViewValue.Agenda);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    'flex flex-col overflow-hidden rounded-md border border-border bg-card text-sm shadow-sm',
    attrs.class as ClassValue,
  ),
);

const root = useTemplateRef<HTMLDivElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div ref="root" :class="rootClass" v-bind="passthroughAttrs">
    <!-- Header -->
    <div class="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
      <button
        type="button"
        class="inline-flex h-7 items-center rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted"
        @click="goToday"
      >
        Today
      </button>
      <button
        type="button"
        aria-label="Previous"
        class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        @click="goPrev"
      >
        <Icon :icon="ChevronLeft" :size="14" />
      </button>
      <button
        type="button"
        aria-label="Next"
        class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        @click="goNext"
      >
        <Icon :icon="ChevronRight" :size="14" />
      </button>
      <h3 class="ml-1 text-base font-semibold">{{ title }}</h3>
      <div
        role="radiogroup"
        aria-label="View"
        class="ml-auto flex items-center gap-0.5 rounded-md bg-card p-0.5 ring-1 ring-border"
      >
        <button
          v-for="v in EVENT_CALENDAR_VIEWS"
          :key="v"
          type="button"
          role="radio"
          :aria-checked="currentView === v"
          :class="viewButtonClass(v)"
          @click="setView(v)"
        >
          {{ v }}
        </button>
      </div>
    </div>
    <!-- Body -->
    <div class="flex-1 overflow-auto" style="min-height: 0">
      <MonthView
        v-if="isMonth"
        :focus-day="focusDay"
        :time-zone="timeZone"
        :events="sortedEvents"
        :week-start="weekStart"
        @event-click="emit('event-click', $event)"
        @slot-click="(day, hour) => emit('slot-click', day, hour)"
      />
      <TimeGridView
        v-else-if="isWeek"
        :time-zone="timeZone"
        :events="sortedEvents"
        :days="7"
        :first-day="weekFirstDay"
        :hour-range="hourRange"
        @event-click="emit('event-click', $event)"
        @slot-click="(day, hour) => emit('slot-click', day, hour)"
      />
      <TimeGridView
        v-else-if="isDay"
        :time-zone="timeZone"
        :events="sortedEvents"
        :days="1"
        :first-day="focusDay"
        :hour-range="hourRange"
        @event-click="emit('event-click', $event)"
        @slot-click="(day, hour) => emit('slot-click', day, hour)"
      />
      <AgendaView
        v-else-if="isAgenda"
        :focus-day="focusDay"
        :events="sortedEvents"
        @event-click="emit('event-click', $event)"
      />
    </div>
  </div>
</template>
