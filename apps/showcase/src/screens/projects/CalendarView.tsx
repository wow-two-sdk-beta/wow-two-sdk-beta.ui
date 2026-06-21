/** Calendar view — month EventCalendar + single-day ScheduleView (June 2026 fixtures). */
import { EventCalendar, ScheduleView } from '@wow-two-beta/ui/display';
import { useToaster } from '@wow-two-beta/ui/feedback';
import { events, scheduleEntries, usersById } from '../../fixtures';
import { parseDateOnly, parseDateTime } from './taskMeta';

const calendarEvents = events.map((e) => ({
  id: e.id,
  title: e.title,
  start: new Date(e.start),
  end: new Date(e.end),
  isAllDay: e.allDay,
}));

const scheduleResourceIds = [...new Set(scheduleEntries.map((e) => e.ownerId))];

const scheduleResources = scheduleResourceIds.map((id) => ({
  id,
  label: usersById[id]?.name ?? id,
}));

const scheduleBookings = scheduleEntries.map((e) => ({
  id: e.id,
  resourceId: e.ownerId,
  start: parseDateTime(e.day, e.startTime),
  end: parseDateTime(e.day, e.endTime),
  label: e.title,
}));

export function CalendarView() {
  const { toast } = useToaster();
  return (
    <div className="flex flex-col gap-6">
      <EventCalendar
        events={calendarEvents}
        defaultView="month"
        defaultDate={parseDateOnly('2026-06-12')}
        hourRange={[7, 19]}
        onEventClick={(event) => {
          const source = events.find((e) => e.id === event.id);
          toast({
            title: typeof event.title === 'string' ? event.title : event.id,
            description: source
              ? `${source.kind} · owner ${usersById[source.ownerId]?.name ?? source.ownerId}`
              : undefined,
            severity: 'info',
          });
        }}
      />
      <section className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ops schedule — Fri, Jun 12 2026</h3>
          <p className="text-xs text-muted-foreground">
            One row per owner; click a booking for details.
          </p>
        </div>
        <ScheduleView
          resources={scheduleResources}
          bookings={scheduleBookings}
          date={parseDateOnly('2026-06-12')}
          hourRange={[8, 18]}
          onBookingClick={(booking) => {
            toast({
              title: typeof booking.label === 'string' ? booking.label : booking.id,
              description: `${booking.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${booking.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              severity: 'neutral',
            });
          }}
        />
      </section>
    </div>
  );
}
