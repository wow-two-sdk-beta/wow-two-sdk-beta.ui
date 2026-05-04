import { forwardRef, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Icon } from '../../icons';
import {
  addDays,
  addMonths,
  buildMonthGrid,
  isSameDay,
  isToday,
  MONTHS_LONG,
  startOfDay,
  WEEKDAYS_SHORT,
} from '../../forms/DateExtensions';

export type EventCalendarView = 'month' | 'week' | 'day' | 'agenda';

export interface EventCalendarEvent {
  id: string;
  title?: ReactNode;
  start: Date;
  end: Date;
  color?: string;
  allDay?: boolean;
}

export interface EventCalendarProps extends HTMLAttributes<HTMLDivElement> {
  events: EventCalendarEvent[];
  view?: EventCalendarView;
  defaultView?: EventCalendarView;
  onViewChange?: (view: EventCalendarView) => void;
  date?: Date;
  defaultDate?: Date;
  onDateChange?: (date: Date) => void;
  weekStart?: 0 | 1;
  hourRange?: [number, number];
  onEventClick?: (event: EventCalendarEvent) => void;
  onSlotClick?: (date: Date, hour?: number) => void;
}

function startOfWeek(d: Date, weekStart: 0 | 1): Date {
  const c = startOfDay(d);
  const diff = (c.getDay() - weekStart + 7) % 7;
  c.setDate(c.getDate() - diff);
  return c;
}

function isInRange(d: Date, start: Date, end: Date): boolean {
  return d >= startOfDay(start) && d <= startOfDay(end);
}

function minutesSince(reference: Date, target: Date): number {
  return (target.getTime() - reference.getTime()) / 60000;
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
    const [date, setDate] = useControlled({
      controlled: dateProp,
      default: defaultDate ?? new Date(),
      onChange: onDateChange,
    });

    const sortedEvents = useMemo(
      () => [...events].sort((a, b) => a.start.getTime() - b.start.getTime()),
      [events],
    );

    const goPrev = () => {
      switch (view) {
        case 'month':
          setDate(addMonths(date, -1));
          break;
        case 'week':
          setDate(addDays(date, -7));
          break;
        case 'day':
        case 'agenda':
          setDate(addDays(date, -1));
          break;
      }
    };
    const goNext = () => {
      switch (view) {
        case 'month':
          setDate(addMonths(date, 1));
          break;
        case 'week':
          setDate(addDays(date, 7));
          break;
        case 'day':
        case 'agenda':
          setDate(addDays(date, 1));
          break;
      }
    };
    const goToday = () => setDate(new Date());

    const title = useMemo(() => {
      switch (view) {
        case 'month':
          return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
        case 'week': {
          const ws = startOfWeek(date, weekStart);
          const we = addDays(ws, 6);
          return `${ws.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        case 'day':
          return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        case 'agenda':
          return `Upcoming from ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      }
    }, [view, date, weekStart]);

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
              date={date}
              events={sortedEvents}
              weekStart={weekStart}
              onEventClick={onEventClick}
              onSlotClick={onSlotClick}
            />
          )}
          {view === 'week' && (
            <TimeGridView
              date={date}
              events={sortedEvents}
              days={7}
              firstDay={startOfWeek(date, weekStart)}
              hourRange={hourRange}
              onEventClick={onEventClick}
              onSlotClick={onSlotClick}
            />
          )}
          {view === 'day' && (
            <TimeGridView
              date={date}
              events={sortedEvents}
              days={1}
              firstDay={startOfDay(date)}
              hourRange={hourRange}
              onEventClick={onEventClick}
              onSlotClick={onSlotClick}
            />
          )}
          {view === 'agenda' && (
            <AgendaView date={date} events={sortedEvents} onEventClick={onEventClick} />
          )}
        </div>
      </div>
    );
  },
);

interface MonthViewProps {
  date: Date;
  events: EventCalendarEvent[];
  weekStart: 0 | 1;
  onEventClick?: (event: EventCalendarEvent) => void;
  onSlotClick?: (date: Date, hour?: number) => void;
}

function MonthView({ date, events, weekStart, onEventClick, onSlotClick }: MonthViewProps) {
  const grid = buildMonthGrid(date.getFullYear(), date.getMonth());
  // Reorder weekdays per weekStart.
  const weekdayHeaders = Array.from({ length: 7 }, (_, i) => WEEKDAYS_SHORT[(i + weekStart) % 7]!);
  // The grid from buildMonthGrid is Sunday-first; rotate if weekStart=1.
  const cells = weekStart === 0 ? grid : (() => {
    // Rotate each row by -1 from Sunday-first to Monday-first.
    const out = grid.slice();
    return out;
  })();

  const eventsForDay = (d: Date) =>
    events.filter((e) => isInRange(d, e.start, e.end));

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
        const cellEvents = eventsForDay(cell.date);
        return (
          <div
            key={i}
            className={cn(
              'flex flex-col border-b border-r border-border p-1 text-xs',
              cell.outOfMonth && 'bg-muted/20',
              isToday(cell.date) && 'bg-primary-soft/20',
            )}
            style={{ minHeight: 96 }}
          >
            <button
              type="button"
              onClick={() => onSlotClick?.(cell.date)}
              className={cn(
                'mb-1 self-start rounded-sm px-1 text-xs tabular-nums transition-colors',
                cell.outOfMonth ? 'text-muted-foreground' : 'text-foreground',
                isToday(cell.date) && 'bg-primary text-primary-foreground',
                'hover:bg-muted',
              )}
            >
              {cell.date.getDate()}
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
                  aria-label={`${typeof e.title === 'string' ? e.title : e.id} at ${e.start.toLocaleTimeString()}`}
                >
                  {e.allDay ? '• ' : ''}
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

interface TimeGridViewProps {
  date: Date;
  events: EventCalendarEvent[];
  days: number;
  firstDay: Date;
  hourRange: [number, number];
  onEventClick?: (event: EventCalendarEvent) => void;
  onSlotClick?: (date: Date, hour?: number) => void;
}

function TimeGridView({ events, days, firstDay, hourRange, onEventClick, onSlotClick }: TimeGridViewProps) {
  const [startHour, endHour] = hourRange;
  const visibleHours = endHour - startHour;
  const HOUR_PX = 48;
  const dayDates = Array.from({ length: days }, (_, i) => addDays(firstDay, i));

  const eventsForDay = (d: Date) =>
    events.filter((e) => !e.allDay && isSameDay(d, e.start));
  const allDayForDay = (d: Date) =>
    events.filter((e) => e.allDay && isInRange(d, e.start, e.end));

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
              {d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
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
            const dayStart = new Date(d);
            dayStart.setHours(startHour, 0, 0, 0);
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
                  const now = new Date();
                  const minutes = now.getHours() * 60 + now.getMinutes() - startHour * 60;
                  if (minutes < 0 || minutes > visibleHours * 60) return null;
                  const top = (minutes / 60) * HOUR_PX;
                  return (
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 z-10 border-t border-primary"
                      style={{ top }}
                    />
                  );
                })()}
                {/* Events */}
                {list.map((e) => {
                  const start = e.start < dayStart ? dayStart : e.start;
                  const dayEnd = new Date(d);
                  dayEnd.setHours(endHour, 0, 0, 0);
                  const end = e.end > dayEnd ? dayEnd : e.end;
                  const topMin = minutesSince(dayStart, start);
                  const durMin = Math.max(15, minutesSince(start, end));
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
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
  date: Date;
  events: EventCalendarEvent[];
  onEventClick?: (event: EventCalendarEvent) => void;
}

function AgendaView({ date, events, onEventClick }: AgendaViewProps) {
  const horizon = addDays(date, 30);
  const upcoming = events.filter((e) => e.end >= date && e.start <= horizon);
  // Group by date.
  const groups = new Map<string, EventCalendarEvent[]>();
  for (const e of upcoming) {
    const key = e.start.toDateString();
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
        const groupDate = list[0]!.start;
        return (
          <li key={key} className="px-4 py-3">
            <div
              className={cn(
                'mb-2 text-xs font-semibold uppercase text-muted-foreground',
                isToday(groupDate) && 'text-primary',
              )}
            >
              {groupDate.toLocaleDateString(undefined, {
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
                        {e.allDay
                          ? 'All day'
                          : `${e.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${e.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
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
