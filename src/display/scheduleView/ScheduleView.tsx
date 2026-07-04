import { forwardRef, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { cn } from '../../utils';
import { formatZonedTime, minutesBetween, nowZoned, zonedAtHour } from '../../forms/DateExtensions';

// ScheduleView models bookings as absolute instants (a wall-clock time in a
// specific zone) — `Temporal.ZonedDateTime`, the peer of .NET `DateTimeOffset`.
// The single-day header projects down to the day's calendar date; the
// intra-day slot geometry does its math on `ZonedDateTime` (`.hour`, `.add`,
// `until`) via the shared, Temporal-based `DateExtensions`.

export interface ScheduleResource {
  id: string;
  label: ReactNode;
  color?: string;
}

export interface ScheduleBooking {
  id: string;
  resourceId: string;
  start: Temporal.ZonedDateTime;
  end: Temporal.ZonedDateTime;
  label?: ReactNode;
  color?: string;
}

export interface ScheduleViewProps extends HTMLAttributes<HTMLDivElement> {
  resources: ScheduleResource[];
  bookings: ScheduleBooking[];
  /** The day to render; its calendar date + time zone anchor the grid. */
  date?: Temporal.ZonedDateTime;
  hourRange?: [number, number];
  slotMinutes?: number;
  onBookingClick?: (booking: ScheduleBooking) => void;
  onSlotClick?: (resourceId: string, time: Temporal.ZonedDateTime) => void;
  renderBooking?: (booking: ScheduleBooking) => ReactNode;
}

/**
 * Multi-resource single-day schedule. Resources × hours grid; bookings
 * positioned absolutely within each row's timeline by minute offset.
 */
export const ScheduleView = forwardRef<HTMLDivElement, ScheduleViewProps>(function ScheduleView(
  {
    resources,
    bookings,
    date = nowZoned(),
    hourRange = [8, 20],
    slotMinutes = 30,
    onBookingClick,
    onSlotClick,
    renderBooking,
    className,
    ...rest
  },
  ref,
) {
  const [startHour, endHour] = hourRange;
  const totalMinutes = (endHour - startHour) * 60;
  const slotCount = Math.ceil(totalMinutes / slotMinutes);
  const dayStart = useMemo(
    () => zonedAtHour(date.toPlainDate(), startHour, date.timeZoneId),
    [date, startHour],
  );

  const bookingsByResource = useMemo(() => {
    const map = new Map<string, ScheduleBooking[]>();
    for (const b of bookings) {
      const list = map.get(b.resourceId);
      if (list) list.push(b);
      else map.set(b.resourceId, [b]);
    }
    return map;
  }, [bookings]);

  return (
    <div
      ref={ref}
      role="grid"
      aria-label="Schedule"
      className={cn(
        'overflow-auto rounded-md border border-border bg-card text-sm shadow-sm',
        className,
      )}
      {...rest}
    >
      {/* Hour header */}
      <div className="sticky top-0 z-raised flex border-b border-border bg-muted/40">
        <div className="w-32 shrink-0 border-r border-border px-3 py-2 text-xs font-medium text-muted-foreground">
          {date.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${endHour - startHour}, 1fr)` }}>
          {Array.from({ length: endHour - startHour }, (_, i) => (
            <div key={i} className="border-l border-border px-2 py-1 text-xs text-muted-foreground tabular-nums">
              {String((startHour + i) % 24).padStart(2, '0')}:00
            </div>
          ))}
        </div>
      </div>
      {/* Rows */}
      {resources.map((resource) => {
        const items = bookingsByResource.get(resource.id) ?? [];
        return (
          <div key={resource.id} role="row" className="flex border-b border-border last:border-b-0">
            <div className="w-32 shrink-0 border-r border-border bg-muted/20 px-3 py-2 text-xs font-medium">
              {resource.label}
            </div>
            <div className="relative flex-1" style={{ height: 56 }}>
              {/* Vertical hour gridlines */}
              <div
                aria-hidden="true"
                className="absolute inset-0 grid pointer-events-none"
                style={{ gridTemplateColumns: `repeat(${endHour - startHour}, 1fr)` }}
              >
                {Array.from({ length: endHour - startHour }, (_, i) => (
                  <div key={i} className="border-l border-border" />
                ))}
              </div>
              {/* Slot click overlay */}
              {onSlotClick && (
                <div
                  className="absolute inset-0 grid"
                  style={{ gridTemplateColumns: `repeat(${slotCount}, 1fr)` }}
                >
                  {Array.from({ length: slotCount }, (_, i) => {
                    const slotTime = dayStart.add({ minutes: i * slotMinutes });
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Empty slot at ${formatZonedTime(slotTime)}`}
                        onClick={() => onSlotClick(resource.id, slotTime)}
                        className="hover:bg-primary-soft/30"
                      />
                    );
                  })}
                </div>
              )}
              {/* Bookings */}
              {items.map((booking) => {
                const offsetMin = Math.max(0, minutesBetween(dayStart, booking.start));
                const durMin = Math.max(15, minutesBetween(booking.start, booking.end));
                const left = (offsetMin / totalMinutes) * 100;
                const width = (durMin / totalMinutes) * 100;
                const color = booking.color ?? resource.color;
                return (
                  <button
                    key={booking.id}
                    type="button"
                    role="button"
                    aria-label={`${resource.label} ${formatZonedTime(booking.start)} – ${formatZonedTime(booking.end)}: ${booking.label ?? ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookingClick?.(booking);
                    }}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      top: 4,
                      bottom: 4,
                      background: color,
                    }}
                    className={cn(
                      'absolute overflow-hidden rounded-md border border-border/60 px-2 py-1 text-left text-xs font-medium transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      !color && 'bg-primary-soft text-primary-soft-foreground',
                    )}
                  >
                    {renderBooking ? (
                      renderBooking(booking)
                    ) : (
                      <>
                        <div className="truncate">{booking.label ?? booking.id}</div>
                        <div className="text-[10px] opacity-70 tabular-nums">
                          {formatZonedTime(booking.start)}
                          {' – '}
                          {formatZonedTime(booking.end)}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});
