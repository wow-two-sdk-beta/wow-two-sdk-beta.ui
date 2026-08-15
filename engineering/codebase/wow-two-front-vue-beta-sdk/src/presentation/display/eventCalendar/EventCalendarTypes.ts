/**
 * Shared vocabulary for the EventCalendar folder.
 *
 * React kept these next to the component in `EventCalendar.tsx`, where the private
 * `MonthView` / `TimeGridView` / `AgendaView` closed over them. Here each view is its
 * own SFC, so the enum, the event shape and the two date helpers live in a sibling
 * module all four files import — the same split `dataGrid/` uses for `DataGridTypes.ts`.
 * `startOfWeek` / `startOfCellInstant` stay out of the folder barrel, exactly as they
 * were module-private in React.
 */
import type { Temporal } from 'temporal-polyfill';
import { zonedAtHour } from '../../forms/DateExtensions';

/** Defines the EventCalendar visible range mode. */
export const EventCalendarView = {
  /** Refers to the month grid. */
  Month: 'month',
  /** Refers to the week columns. */
  Week: 'week',
  /** Refers to the single-day view. */
  Day: 'day',
  /** Refers to the chronological agenda list. */
  Agenda: 'agenda',
} as const;

export type EventCalendarView = (typeof EventCalendarView)[keyof typeof EventCalendarView];

export interface EventCalendarEvent {
  id: string;
  /** The event title. React took a `ReactNode`; it is narrowed to a scalar for the port. */
  title?: string | number;
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
  color?: string;
  isAllDay?: boolean;
}

/** First visible day of the week that contains `d`, honoring `weekStart`. */
export function startOfWeek(d: Temporal.PlainDate, weekStart: 0 | 1): Temporal.PlainDate {
  // Temporal `dayOfWeek`: 1 (Mon) … 7 (Sun). Map to a Sunday=0 index, then shift.
  const sundayIdx = d.dayOfWeek % 7;
  const diff = (sundayIdx - weekStart + 7) % 7;
  return d.subtract({ days: diff });
}

/** Midnight instant for a calendar day in `timeZone` — the range-anchor for all-day/multi-day spans. */
export function startOfCellInstant(day: Temporal.PlainDate, timeZone: string): Temporal.ZonedDateTime {
  return zonedAtHour(day, 0, timeZone);
}

/** The order the header's view switcher renders its radios in. */
export const EVENT_CALENDAR_VIEWS: ReadonlyArray<EventCalendarView> = [
  EventCalendarView.Month,
  EventCalendarView.Week,
  EventCalendarView.Day,
  EventCalendarView.Agenda,
];
