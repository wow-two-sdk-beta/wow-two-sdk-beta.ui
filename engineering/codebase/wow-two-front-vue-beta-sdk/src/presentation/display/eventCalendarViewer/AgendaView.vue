<script lang="ts">
import type { Temporal } from 'temporal-polyfill';
import type { EventCalendarViewerEvent } from './EventCalendarViewerTypes';

export interface AgendaViewProps {
  readonly focusDay: Temporal.PlainDate;
  readonly events: ReadonlyArray<EventCalendarViewerEvent>;
}

interface AgendaGroup {
  key: string;
  day: Temporal.PlainDate;
  events: Array<EventCalendarViewerEvent>;
}
</script>

<script setup lang="ts">
import { computed, type StyleValue } from 'vue';
import { Temporal as TemporalValue } from 'temporal-polyfill';
import { cn } from '../../../foundation/styles';
import { formatZonedTime, isToday } from '../../forms/DateExtensions';

/** Renders the chronological agenda list of an `EventCalendarViewer`. Internal — never exported. */
defineOptions({ name: 'AgendaView' });

const props = defineProps<AgendaViewProps>();

const emit = defineEmits<{
  /** Fires when an agenda row is clicked. */
  'event-click': [event: EventCalendarViewerEvent];
}>();

const groups = computed<Array<AgendaGroup>>(() => {
  const horizon = props.focusDay.add({ days: 30 });
  const upcoming = props.events.filter((e) => {
    const startDay = e.start.toPlainDate();
    const endDay = e.end.toPlainDate();
    return (
      TemporalValue.PlainDate.compare(endDay, props.focusDay) >= 0 &&
      TemporalValue.PlainDate.compare(startDay, horizon) <= 0
    );
  });
  /* Group by calendar day of the event start. */
  const map = new Map<string, Array<EventCalendarViewerEvent>>();
  for (const e of upcoming) {
    const key = e.start.toPlainDate().toString();
    const list = map.get(key);
    if (list) list.push(e);
    else map.set(key, [e]);
  }
  return Array.from(map.entries()).map(([key, list]) => ({
    key,
    day: list[0]!.start.toPlainDate(),
    events: list,
  }));
});

function groupHeadingClass(day: Temporal.PlainDate): string {
  return cn('mb-2 text-xs font-semibold uppercase text-muted-foreground', isToday(day) && 'text-primary');
}

function groupLabel(day: Temporal.PlainDate): string {
  return day.toLocaleString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function dotStyle(e: EventCalendarViewerEvent): StyleValue {
  return { background: e.color || 'var(--color-primary)' };
}

function timeLabel(e: EventCalendarViewerEvent): string {
  return e.isAllDay ? 'All day' : `${formatZonedTime(e.start)} – ${formatZonedTime(e.end)}`;
}
</script>

<template>
  <div v-if="groups.length === 0" class="p-6 text-center text-sm text-muted-foreground">No upcoming events.</div>
  <ul v-else class="divide-y divide-border">
    <li v-for="group in groups" :key="group.key" class="px-4 py-3">
      <div :class="groupHeadingClass(group.day)">{{ groupLabel(group.day) }}</div>
      <ul class="space-y-1">
        <li v-for="e in group.events" :key="e.id">
          <button
            type="button"
            class="flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted"
            @click="emit('event-click', e)"
          >
            <span aria-hidden="true" class="mt-1 h-2 w-2 shrink-0 rounded-full" :style="dotStyle(e)" />
            <span class="flex-1">
              <span class="block text-sm font-medium">{{ e.title ?? '(no title)' }}</span>
              <span class="block text-xs text-muted-foreground tabular-nums">
                {{ timeLabel(e) }}
              </span>
            </span>
          </button>
        </li>
      </ul>
    </li>
  </ul>
</template>
