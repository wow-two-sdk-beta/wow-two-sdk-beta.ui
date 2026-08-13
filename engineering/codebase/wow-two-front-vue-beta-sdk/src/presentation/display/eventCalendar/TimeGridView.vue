<script lang="ts">
import type { Temporal } from 'temporal-polyfill';
import type { EventCalendarEvent } from './EventCalendarTypes';

export interface TimeGridViewProps {
  timeZone: string;
  events: ReadonlyArray<EventCalendarEvent>;
  days: number;
  firstDay: Temporal.PlainDate;
  hourRange: [number, number];
}

/** The fixed pixel height of one hour row. */
const HOUR_PX = 48;
</script>

<script setup lang="ts">
import { computed, type StyleValue } from 'vue';
import { cn } from '../../../foundation/utils';
import {
  formatZonedTime,
  isToday,
  isZonedDayInRange,
  isZonedOnDay,
  maxZoned,
  minZoned,
  minutesBetween,
  nowZoned,
  zonedAtHour,
} from '../../forms/DateExtensions';
import { startOfCellInstant } from './EventCalendarTypes';

/* The week / day time grid of an `EventCalendar`. Internal — never exported. */
defineOptions({ name: 'TimeGridView' });

const props = defineProps<TimeGridViewProps>();

const emit = defineEmits<{
  /** Fires when an event block is clicked. */
  'event-click': [event: EventCalendarEvent];
  /** Fires when an empty hour cell is clicked. */
  'slot-click': [day: Temporal.PlainDate, hour?: number];
}>();

const startHour = computed(() => props.hourRange[0]);
const endHour = computed(() => props.hourRange[1]);
const visibleHours = computed(() => endHour.value - startHour.value);

const dayDates = computed(() =>
  Array.from({ length: props.days }, (_, i) => props.firstDay.add({ days: i })),
);

function eventsForDay(day: Temporal.PlainDate): Array<EventCalendarEvent> {
  return props.events.filter((e) => !e.isAllDay && isZonedOnDay(e.start, day));
}

function allDayForDay(day: Temporal.PlainDate): Array<EventCalendarEvent> {
  return props.events.filter(
    (e) =>
      e.isAllDay && isZonedDayInRange(startOfCellInstant(day, props.timeZone), e.start, e.end),
  );
}

/* Numeric CSS lengths are spelled with their unit — React's style object auto-appended `px`,
   Vue's does not, so a bare `48` would be dropped as an invalid declaration. */
const HOUR_STYLE: StyleValue = { height: `${HOUR_PX}px` };

const gridColumns = computed<StyleValue>(() => ({
  gridTemplateColumns: `repeat(${props.days}, minmax(120px, 1fr))`,
}));

const columnStyle = computed<StyleValue>(() => ({
  height: `${visibleHours.value * HOUR_PX}px`,
}));

function hourLabel(index: number): string {
  return `${String((startHour.value + index) % 24).padStart(2, '0')}:00`;
}

function dayHeaderClass(d: Temporal.PlainDate): string {
  return cn(
    'h-6 border-b border-r border-border bg-muted/40 px-2 text-xs font-medium',
    isToday(d) && 'bg-primary-soft/30',
  );
}

function dayHeaderLabel(d: Temporal.PlainDate): string {
  return d.toLocaleString(undefined, { weekday: 'short', day: 'numeric' });
}

function allDayClass(e: EventCalendarEvent): string {
  return cn(
    'truncate rounded-sm px-1 py-0.5',
    !e.color && 'bg-primary-soft text-primary-soft-foreground',
  );
}

function eventStyle(e: EventCalendarEvent, d: Temporal.PlainDate): StyleValue {
  const dayStart = zonedAtHour(d, startHour.value, props.timeZone);
  const dayEnd = zonedAtHour(d, endHour.value, props.timeZone);
  const start = maxZoned(e.start, dayStart);
  const end = minZoned(e.end, dayEnd);
  const topMin = minutesBetween(dayStart, start);
  const durMin = Math.max(15, minutesBetween(start, end));
  return {
    top: `${(topMin / 60) * HOUR_PX}px`,
    height: `${(durMin / 60) * HOUR_PX}px`,
    left: '2px',
    right: '2px',
    background: e.color,
  };
}

function eventClass(e: EventCalendarEvent): string {
  return cn(
    'absolute overflow-hidden rounded-sm border border-border/60 px-1 py-0.5 text-left text-[11px] font-medium transition-colors hover:brightness-95',
    !e.color && 'bg-primary text-primary-foreground',
  );
}

function eventStartLabel(e: EventCalendarEvent, d: Temporal.PlainDate): string {
  const dayStart = zonedAtHour(d, startHour.value, props.timeZone);
  return formatZonedTime(maxZoned(e.start, dayStart));
}

/* Read on every render, exactly as React's per-render `nowZoned()` was — a `computed` would
   cache the instant for the component's lifetime. `Temporal.Now` is universal, not a browser
   global, so this is SSR-safe. */
function todayLineTop(d: Temporal.PlainDate): string | undefined {
  if (!isToday(d)) return undefined;
  const dayStart = zonedAtHour(d, startHour.value, props.timeZone);
  const minutes = minutesBetween(dayStart, nowZoned());
  if (minutes < 0 || minutes > visibleHours.value * 60) return undefined;
  return `${(minutes / 60) * HOUR_PX}px`;
}

function onEvent(ev: MouseEvent, e: EventCalendarEvent): void {
  ev.stopPropagation();
  emit('event-click', e);
}
</script>

<template>
  <div class="flex">
    <!-- Hour gutter -->
    <div class="w-14 shrink-0 border-r border-border">
      <div class="h-6 border-b border-border bg-muted/40" />
      <div class="h-7 border-b border-border bg-muted/20" />
      <div
        v-for="i in visibleHours"
        :key="i"
        class="border-b border-border bg-muted/10 px-1 text-[10px] tabular-nums text-muted-foreground"
        :style="HOUR_STYLE"
      >
        {{ hourLabel(i - 1) }}
      </div>
    </div>
    <div class="flex-1 overflow-x-auto">
      <div class="grid" :style="gridColumns">
        <!-- Day headers -->
        <div v-for="(d, i) in dayDates" :key="`h-${i}`" :class="dayHeaderClass(d)">
          {{ dayHeaderLabel(d) }}
        </div>
        <!-- All-day row -->
        <div
          v-for="(d, i) in dayDates"
          :key="`ad-${i}`"
          class="h-7 border-b border-r border-border bg-muted/10 p-0.5 text-[11px]"
        >
          <div class="flex flex-wrap gap-0.5">
            <button
              v-for="e in allDayForDay(d)"
              :key="e.id"
              type="button"
              :style="{ background: e.color }"
              :class="allDayClass(e)"
              @click="onEvent($event, e)"
            >
              {{ e.title ?? '(no title)' }}
            </button>
          </div>
        </div>
        <!-- Time grid columns -->
        <div
          v-for="(d, di) in dayDates"
          :key="`g-${di}`"
          class="relative border-r border-border"
          :style="columnStyle"
        >
          <!-- Hour grid lines -->
          <div
            v-for="i in visibleHours"
            :key="i"
            class="border-b border-border/60"
            :style="HOUR_STYLE"
            @click="emit('slot-click', d, startHour + i - 1)"
          />
          <!-- Today line -->
          <div
            v-if="todayLineTop(d)"
            aria-hidden="true"
            class="absolute inset-x-0 z-raised border-t border-primary"
            :style="{ top: todayLineTop(d) }"
          />
          <!-- Events -->
          <button
            v-for="e in eventsForDay(d)"
            :key="e.id"
            type="button"
            :style="eventStyle(e, d)"
            :class="eventClass(e)"
            @click="onEvent($event, e)"
          >
            <div class="truncate">{{ e.title ?? '(no title)' }}</div>
            <div class="text-[10px] opacity-80 tabular-nums">
              {{ eventStartLabel(e, d) }}
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
