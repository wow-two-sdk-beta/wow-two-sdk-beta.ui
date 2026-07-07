import { forwardRef, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { Icon } from '../../../foundation/icons';
import {
  MONTHS_LONG,
  WEEKDAYS_SHORT,
  addDays,
  formatZonedTime,
  isToday,
  isZonedDayInRange,
  isZonedOnDay,
  minZoned,
  maxZoned,
  minutesBetween,
  nowZoned,
  zonedAtHour,
} from '../../forms/DateExtensions';

// EventCalendar models events as absolute instants (a wall-clock time in a
// specific zone) — `Temporal.ZonedDateTime`, the peer of .NET `DateTimeOffset`.
// The month/week grid + navigation project down to `Temporal.PlainDate`; the
// intra-day time-slot geometry does its math on `ZonedDateTime` (`.hour`,
// `.add`, `until`). Both come from the shared, Temporal-based `DateExtensions`.

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
  title?: ReactNode;
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
  color?: string;
  isAllDay?: boolean;
}

export interface EventCalendarProps extends HTMLAttributes<HTMLDivElement> {
  events: ReadonlyArray<EventCalendarEvent>;
  view?: EventCalendarView;
  defaultView?: EventCalendarView;
  onViewChange?: (view: EventCalendarView) => void;
  /** The focused instant; its calendar day drives the visible month/week/day. */
  date?: Temporal.ZonedDateTime;
  defaultDate?: Temporal.ZonedDateTime;
  onDateChange?: (date: Temporal.ZonedDateTime) => void;
  weekStart?: 0 | 1;
  hourRange?: [number, number];
  onEventClick?: (event: EventCalendarEvent) => void;
  /** Emits the clicked empty slot — `day` is the calendar day, `hour` the grid hour (time views). */
  onSlotClick?: (day: Temporal.PlainDate, hour?: number) => void;
}

/** First visible day of the week that contains `d`, honoring `weekStart`. */
function startOfWeek(d: Temporal.PlainDate, weekStart: 0 | 1): Temporal.PlainDate {
  // Temporal `dayOfWeek`: 1 (Mon) … 7 (Sun). Map to a Sunday=0 index, then shift.
  const sundayIdx = d.dayOfWeek % 7;
  const diff = (sundayIdx - weekStart + 7) % 7;
  return d.subtract({ days: diff });
}

/**
 * First-generation EventCalendar — month / week / day / agenda views.
 * Header: Today / Prev / Next / Title + view switcher. Events as colored
 * blocks. Drag-edit, recurrence, "+N more" overflow deferred.
 */
export const EventCalendar = forwardRef<HTMLDivElement, EventCalendarProps>(
  function EventCalendar(
    {
      events,
      view: viewProp,
      defaultView = 'month',
      onViewChange,
      date: dateProp,
      defaultDate,
      onDateChange,
      weekStart = 0,
      hourRange = [0, 24],
      onEventClick,
      onSlotClick,
      className,
      ...rest
    },
    ref,
  ) {
    const [view, setView] = useControlled({
      controlled: viewProp,
      default: defaultView,
      onChange: onViewChange,
    });
    const [date, setDate] = useControlled<Temporal.ZonedDateTime>({
      controlled: dateProp,
      default: defaultDate ?? nowZoned(),
      onChange: onDateChange,
    });

    // Calendar day the view is anchored on, in the focus instant's own zone.
    const focusDay = useMemo(() => date.toPlainDate(), [date]);

    const sortedEvents = useMemo(
      () =>
        [...events].sort((a, b) =>
          Temporal.ZonedDateTime.compare(a.start, b.start),
        ),
      [events],
    );

    const goPrev = () => {
      switch (view) {
        case 'month':
          setDate(date.add({ months: -1 }));
          break;
        case 'week':
          setDate(date.add({ days: -7 }));
          break;
        case 'day':
        case 'agenda':
          setDate(date.add({ days: -1 }));
          break;
      }
    };
    const goNext = () => {
      switch (view) {
        case 'month':
          setDate(date.add({ months: 1 }));
          break;
        case 'week':
          setDate(date.add({ days: 7 }));
          break;
        case 'day':
        case 'agenda':
          setDate(date.add({ days: 1 }));
          break;
      }
    };
    const goToday = () => setDate(nowZoned());

    const title = useMemo(() => {
      switch (view) {
        case 'month':
          return `${MONTHS_LONG[focusDay.month - 1]} ${focusDay.year}`;
        case 'week': {
          const ws = startOfWeek(focusDay, weekStart);
          const we = addDays(ws, 6);
          return `${ws.toLocaleString(undefined, { month: 'short', day: 'numeric' })} – ${we.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        case 'day':
          return focusDay.toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        case 'agenda':
          return `Upcoming from ${focusDay.toLocaleString(undefined, { month: 'short', day: 'numeric' })}`;
      }
    }, [view, focusDay, weekStart]);

    return (
      <div
        ref={ref}
        className={cn('flex flex-col overflow-hidden rounded-md border border-border bg-card text-sm shadow-sm', className)}
        {...rest}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
          <button
            type="button"
            onClick={goToday}
            className="inline-flex h-7 items-center rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Previous"
            onClick={goPrev}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <Icon icon={ChevronLeft} size={14} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={goNext}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <Icon icon={ChevronRight} size={14} />
          </button>
          <h3 className="ml-1 text-base font-semibold">{title}</h3>
          <div role="radiogroup" aria-label="View" className="ml-auto flex items-center gap-0.5 rounded-md bg-card p-0.5 ring-1 ring-border">
            {(['month', 'week', 'day', 'agenda'] as EventCalendarView[]).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={cn(
                  'inline-flex h-6 items-center rounded px-2 text-xs font-medium transition-colors',
                  view === v
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
          {view === 'month' && (
            <MonthView
              focusDay={focusDay}
              timeZone={date.timeZoneId}
              events={sortedEvents}
              weekStart={weekStart}
              onEventClick={onEventClick}
              onSlotClick={onSlotClick}
            />
          )}
          {view === 'week' && (
            <TimeGridView
              timeZone={date.timeZoneId}
              events={sortedEvents}
              days={7}
              firstDay={startOfWeek(focusDay, weekStart)}
              hourRange={hourRange}
              onEventClick={onEventClick}
              onSlotClick={onSlotClick}
            />
          )}
          {view === 'day' && (
            <TimeGridView
              timeZone={date.timeZoneId}
              events={sortedEvents}
              days={1}
              firstDay={focusDay}
              hourRange={hourRange}
              onEventClick={onEventClick}
              onSlotClick={onSlotClick}
            />
          )}
          {view === 'agenda' && (
            <AgendaView focusDay={focusDay} events={sortedEvents} onEventClick={onEventClick} />
          )}
        </div>
      </div>
    );
  },
);

interface MonthViewProps {
  focusDay: Temporal.PlainDate;
  timeZone: string;
  events: ReadonlyArray<EventCalendarEvent>;
  weekStart: 0 | 1;
  onEventClick?: (event: EventCalendarEvent) => void;
  onSlotClick?: (day: Temporal.PlainDate, hour?: number) => void;
}

function MonthView({ focusDay, timeZone, events, weekStart, onEventClick, onSlotClick }: MonthViewProps) {
  // Reorder weekdays per weekStart.
  const weekdayHeaders = Array.from({ length: 7 }, (_, i) => WEEKDAYS_SHORT[(i + weekStart) % 7]!);
  // Build a 42-cell grid whose first column matches weekStart so dates land
  // under the right headers (buildMonthGrid is Sunday-anchored, so build here).
  const month = focusDay.month;
  const first = focusDay.with({ day: 1 });
  const gridStart = startOfWeek(first, weekStart);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = gridStart.add({ days: i });
    return { day, outOfMonth: day.month !== month };
  });

  const eventsForDay = (day: Temporal.PlainDate) =>
    events.filter((e) => isZonedDayInRange(startOfCellInstant(day, timeZone), e.start, e.end));

  return (
    <div className="grid h-full grid-cols-7 border-l border-t border-border">
      {weekdayHeaders.map((wd) => (
        <div
          key={wd}
          className="border-b border-r border-border bg-muted/40 px-2 py-1 text-xs font-medium uppercase text-muted-foreground"
        >
          {wd}
        </div>
      ))}
      {cells.map((cell, i) => {
        const cellEvents = eventsForDay(cell.day);
        return (
          <div
            key={i}
            className={cn(
              'flex flex-col border-b border-r border-border p-1 text-xs',
              cell.outOfMonth && 'bg-muted/20',
              isToday(cell.day) && 'bg-primary-soft/20',
            )}
            style={{ minHeight: 96 }}
          >
            <button
              type="button"
              onClick={() => onSlotClick?.(cell.day)}
              className={cn(
                'mb-1 self-start rounded-sm px-1 text-xs tabular-nums transition-colors',
                cell.outOfMonth ? 'text-muted-foreground' : 'text-foreground',
                isToday(cell.day) && 'bg-primary text-primary-foreground',
                'hover:bg-muted',
              )}
            >
              {cell.day.day}
            </button>
            <div className="flex flex-col gap-0.5">
              {cellEvents.slice(0, 3).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onEventClick?.(e);
                  }}
                  style={{ background: e.color }}
                  className={cn(
                    'truncate rounded-sm px-1.5 py-0.5 text-left text-[11px] font-medium transition-colors hover:brightness-95',
                    !e.color && 'bg-primary-soft text-primary-soft-foreground',
                  )}
                  aria-label={`${typeof e.title === 'string' ? e.title : e.id} at ${formatZonedTime(e.start)}`}
                >
                  {e.isAllDay ? '• ' : ''}
                  {e.title ?? '(no title)'}
                </button>
              ))}
              {cellEvents.length > 3 && (
                <span className="px-1 text-[10px] text-muted-foreground">+{cellEvents.length - 3} more</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Midnight instant for a calendar day in `timeZone` — the range-anchor for all-day/multi-day spans. */
function startOfCellInstant(day: Temporal.PlainDate, timeZone: string): Temporal.ZonedDateTime {
  return zonedAtHour(day, 0, timeZone);
}

interface TimeGridViewProps {
  timeZone: string;
  events: ReadonlyArray<EventCalendarEvent>;
  days: number;
  firstDay: Temporal.PlainDate;
  hourRange: [number, number];
  onEventClick?: (event: EventCalendarEvent) => void;
  onSlotClick?: (day: Temporal.PlainDate, hour?: number) => void;
}

function TimeGridView({ timeZone, events, days, firstDay, hourRange, onEventClick, onSlotClick }: TimeGridViewProps) {
  const [startHour, endHour] = hourRange;
  const visibleHours = endHour - startHour;
  const HOUR_PX = 48;
  const dayDates = Array.from({ length: days }, (_, i) => firstDay.add({ days: i }));

  const eventsForDay = (day: Temporal.PlainDate) =>
    events.filter((e) => !e.isAllDay && isZonedOnDay(e.start, day));
  const allDayForDay = (day: Temporal.PlainDate) =>
    events.filter((e) => e.isAllDay && isZonedDayInRange(startOfCellInstant(day, timeZone), e.start, e.end));

  const now = nowZoned();

  return (
    <div className="flex">
      {/* Hour gutter */}
      <div className="w-14 shrink-0 border-r border-border">
        <div className="h-6 border-b border-border bg-muted/40" />
        <div className="h-7 border-b border-border bg-muted/20" />
        {Array.from({ length: visibleHours }, (_, i) => (
          <div
            key={i}
            className="border-b border-border bg-muted/10 px-1 text-[10px] tabular-nums text-muted-foreground"
            style={{ height: HOUR_PX }}
          >
            {String((startHour + i) % 24).padStart(2, '0')}:00
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${days}, minmax(120px, 1fr))` }}>
          {/* Day headers */}
          {dayDates.map((d, i) => (
            <div
              key={`h-${i}`}
              className={cn(
                'h-6 border-b border-r border-border bg-muted/40 px-2 text-xs font-medium',
                isToday(d) && 'bg-primary-soft/30',
              )}
            >
              {d.toLocaleString(undefined, { weekday: 'short', day: 'numeric' })}
            </div>
          ))}
          {/* All-day row */}
          {dayDates.map((d, i) => {
            const list = allDayForDay(d);
            return (
              <div
                key={`ad-${i}`}
                className="h-7 border-b border-r border-border bg-muted/10 p-0.5 text-[11px]"
              >
                <div className="flex flex-wrap gap-0.5">
                  {list.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onEventClick?.(e);
                      }}
                      style={{ background: e.color }}
                      className={cn(
                        'truncate rounded-sm px-1 py-0.5',
                        !e.color && 'bg-primary-soft text-primary-soft-foreground',
                      )}
                    >
                      {e.title ?? '(no title)'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {/* Time grid columns */}
          {dayDates.map((d, di) => {
            const list = eventsForDay(d);
            const dayStart = zonedAtHour(d, startHour, timeZone);
            const dayEnd = zonedAtHour(d, endHour, timeZone);
            return (
              <div
                key={`g-${di}`}
                className="relative border-r border-border"
                style={{ height: visibleHours * HOUR_PX }}
              >
                {/* Hour grid lines */}
                {Array.from({ length: visibleHours }, (_, i) => (
                  <div
                    key={i}
                    className="border-b border-border/60"
                    style={{ height: HOUR_PX }}
                    onClick={() => onSlotClick?.(d, startHour + i)}
                  />
                ))}
                {/* Today line */}
                {isToday(d) && (() => {
                  const minutes = minutesBetween(dayStart, now);
                  if (minutes < 0 || minutes > visibleHours * 60) return null;
                  const top = (minutes / 60) * HOUR_PX;
                  return (
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 z-raised border-t border-primary"
                      style={{ top }}
                    />
                  );
                })()}
                {/* Events */}
                {list.map((e) => {
                  const start = maxZoned(e.start, dayStart);
                  const end = minZoned(e.end, dayEnd);
                  const topMin = minutesBetween(dayStart, start);
                  const durMin = Math.max(15, minutesBetween(start, end));
                  const top = (topMin / 60) * HOUR_PX;
                  const height = (durMin / 60) * HOUR_PX;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onEventClick?.(e);
                      }}
                      style={{
                        top,
                        height,
                        left: 2,
                        right: 2,
                        background: e.color,
                      }}
                      className={cn(
                        'absolute overflow-hidden rounded-sm border border-border/60 px-1 py-0.5 text-left text-[11px] font-medium transition-colors hover:brightness-95',
                        !e.color && 'bg-primary text-primary-foreground',
                      )}
                    >
                      <div className="truncate">{e.title ?? '(no title)'}</div>
                      <div className="text-[10px] opacity-80 tabular-nums">
                        {formatZonedTime(start)}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface AgendaViewProps {
  focusDay: Temporal.PlainDate;
  events: ReadonlyArray<EventCalendarEvent>;
  onEventClick?: (event: EventCalendarEvent) => void;
}

function AgendaView({ focusDay, events, onEventClick }: AgendaViewProps) {
  const horizon = focusDay.add({ days: 30 });
  const upcoming = events.filter((e) => {
    const startDay = e.start.toPlainDate();
    const endDay = e.end.toPlainDate();
    return (
      Temporal.PlainDate.compare(endDay, focusDay) >= 0 &&
      Temporal.PlainDate.compare(startDay, horizon) <= 0
    );
  });
  // Group by calendar day of the event start.
  const groups = new Map<string, Array<EventCalendarEvent>>();
  for (const e of upcoming) {
    const key = e.start.toPlainDate().toString();
    const list = groups.get(key);
    if (list) list.push(e);
    else groups.set(key, [e]);
  }
  if (groups.size === 0) {
    return <div className="p-6 text-center text-sm text-muted-foreground">No upcoming events.</div>;
  }
  return (
    <ul className="divide-y divide-border">
      {Array.from(groups.entries()).map(([key, list]) => {
        const groupDay = list[0]!.start.toPlainDate();
        return (
          <li key={key} className="px-4 py-3">
            <div
              className={cn(
                'mb-2 text-xs font-semibold uppercase text-muted-foreground',
                isToday(groupDay) && 'text-primary',
              )}
            >
              {groupDay.toLocaleString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <ul className="space-y-1">
              {list.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onEventClick?.(e)}
                    className="flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: e.color || 'var(--color-primary)' }}
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium">{e.title ?? '(no title)'}</span>
                      <span className="block text-xs text-muted-foreground tabular-nums">
                        {e.isAllDay
                          ? 'All day'
                          : `${formatZonedTime(e.start)} – ${formatZonedTime(e.end)}`}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
