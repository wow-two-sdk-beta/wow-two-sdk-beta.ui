export { default as EventCalendar, type EventCalendarProps } from './EventCalendar.vue';
/* React declared these beside the component; here they sit in a sibling module so the
   private `MonthView.vue` / `TimeGridView.vue` / `AgendaView.vue` can share them. The
   exported surface is unchanged — `startOfWeek`, `startOfCellInstant` and
   `EVENT_CALENDAR_VIEWS` stay internal, exactly as they were in `EventCalendar.tsx`. */
export { EventCalendarView, type EventCalendarEvent } from './EventCalendarTypes';
