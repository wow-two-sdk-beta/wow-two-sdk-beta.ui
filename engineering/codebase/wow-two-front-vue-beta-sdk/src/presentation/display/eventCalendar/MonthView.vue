<script lang="ts">
import type { Temporal } from 'temporal-polyfill';
import type { EventCalendarEvent } from './EventCalendarTypes';

export interface MonthViewProps {
  focusDay: Temporal.PlainDate;
  timeZone: string;
  events: ReadonlyArray<EventCalendarEvent>;
  weekStart: 0 | 1;
}

interface MonthCell {
  day: Temporal.PlainDate;
  outOfMonth: boolean;
}
</script>

<script setup lang="ts">
import { computed, type StyleValue } from 'vue';
import { cn } from '../../../foundation/utils';
import { WEEKDAYS_SHORT, formatZonedTime, isToday, isZonedDayInRange } from '../../forms/DateExtensions';
import { startOfCellInstant, startOfWeek } from './EventCalendarTypes';

/* The month grid of an `EventCalendar`. Internal — never exported from the folder. */
defineOptions({ name: 'MonthView' });

const props = defineProps<MonthViewProps>();

const emit = defineEmits<{
  /** Fires when an event block is clicked. */
  'event-click': [event: EventCalendarEvent];
  /** Fires when an empty day cell's date button is clicked. */
  'slot-click': [day: Temporal.PlainDate, hour?: number];
}>();

/** Reorder weekdays per weekStart. */
const weekdayHeaders = computed(() => Array.from({ length: 7 }, (_, i) => WEEKDAYS_SHORT[(i + props.weekStart) % 7]!));

/* Build a 42-cell grid whose first column matches weekStart so dates land
   under the right headers (buildMonthGrid is Sunday-anchored, so build here). */
const cells = computed<Array<MonthCell>>(() => {
  const month = props.focusDay.month;
  const first = props.focusDay.with({ day: 1 });
  const gridStart = startOfWeek(first, props.weekStart);
  return Array.from({ length: 42 }, (_, i) => {
    const day = gridStart.add({ days: i });
    return { day, outOfMonth: day.month !== month };
  });
});

function eventsForDay(day: Temporal.PlainDate): Array<EventCalendarEvent> {
  return props.events.filter((e) => isZonedDayInRange(startOfCellInstant(day, props.timeZone), e.start, e.end));
}

function cellClass(cell: MonthCell): string {
  return cn(
    'flex flex-col border-b border-r border-border p-1 text-xs',
    cell.outOfMonth && 'bg-muted/20',
    isToday(cell.day) && 'bg-primary-soft/20',
  );
}

function dateButtonClass(cell: MonthCell): string {
  return cn(
    'mb-1 self-start rounded-sm px-1 text-xs tabular-nums transition-colors',
    cell.outOfMonth ? 'text-muted-foreground' : 'text-foreground',
    isToday(cell.day) && 'bg-primary text-primary-foreground',
    'hover:bg-muted',
  );
}

function eventClass(e: EventCalendarEvent): string {
  return cn(
    'truncate rounded-sm px-1.5 py-0.5 text-left text-[11px] font-medium transition-colors hover:brightness-95',
    !e.color && 'bg-primary-soft text-primary-soft-foreground',
  );
}

function eventStyle(e: EventCalendarEvent): StyleValue {
  return { background: e.color };
}

function eventLabel(e: EventCalendarEvent): string {
  /* React narrowed a `ReactNode` title to a string before using it as a name; a numeric
     title falls back to the id here for the same reason. */
  return `${typeof e.title === 'string' ? e.title : e.id} at ${formatZonedTime(e.start)}`;
}

function onEvent(ev: MouseEvent, e: EventCalendarEvent): void {
  ev.stopPropagation();
  emit('event-click', e);
}

/* Numeric CSS lengths are spelled with their unit — React's style object auto-appended `px`,
   Vue's does not, so a bare `96` would be dropped as an invalid declaration. */
const CELL_STYLE: StyleValue = { minHeight: '96px' };
</script>

<template>
  <div class="grid h-full grid-cols-7 border-l border-t border-border">
    <div
      v-for="wd in weekdayHeaders"
      :key="wd"
      class="border-b border-r border-border bg-muted/40 px-2 py-1 text-xs font-medium uppercase text-muted-foreground"
    >
      {{ wd }}
    </div>
    <div v-for="(cell, i) in cells" :key="i" :class="cellClass(cell)" :style="CELL_STYLE">
      <button type="button" :class="dateButtonClass(cell)" @click="emit('slot-click', cell.day)">
        {{ cell.day.day }}
      </button>
      <div class="flex flex-col gap-0.5">
        <button
          v-for="e in eventsForDay(cell.day).slice(0, 3)"
          :key="e.id"
          type="button"
          :style="eventStyle(e)"
          :class="eventClass(e)"
          :aria-label="eventLabel(e)"
          @click="onEvent($event, e)"
        >
          {{ e.isAllDay ? '• ' : '' }}{{ e.title ?? '(no title)' }}
        </button>
        <span v-if="eventsForDay(cell.day).length > 3" class="px-1 text-[10px] text-muted-foreground"
          >+{{ eventsForDay(cell.day).length - 3 }} more</span
        >
      </div>
    </div>
  </div>
</template>
