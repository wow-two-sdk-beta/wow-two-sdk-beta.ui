import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { EventCalendar, type EventCalendarEvent, type EventCalendarView } from './EventCalendar';

const meta: Meta = {
  title: 'Display/EventCalendar',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const TODAY = new Date();
const at = (offsetDays: number, hour: number, minute = 0) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const EVENTS: EventCalendarEvent[] = [
  { id: 'e1', title: 'Standup', start: at(0, 9), end: at(0, 9, 30), color: 'var(--color-primary-soft)' },
  { id: 'e2', title: 'Lunch', start: at(0, 12), end: at(0, 13) },
  { id: 'e3', title: 'Design review', start: at(1, 14), end: at(1, 15, 30), color: 'var(--color-warning-soft)' },
  { id: 'e4', title: 'Off-site', start: at(2, 0), end: at(3, 23, 59), color: 'var(--color-success-soft)', allDay: true },
  { id: 'e5', title: '1:1 with Bob', start: at(3, 11), end: at(3, 12) },
  { id: 'e6', title: 'Sprint planning', start: at(5, 10), end: at(5, 11, 30) },
  { id: 'e7', title: 'Conference', start: at(8, 0), end: at(10, 23, 59), allDay: true, color: 'var(--color-info-soft)' },
];

export const Default: Story = {
  render: () => {
    function Demo() {
      const [view, setView] = useState<EventCalendarView>('month');
      return (
        <div className="p-4">
          <EventCalendar
            events={EVENTS}
            view={view}
            onViewChange={setView}
            onEventClick={(e) => alert(`Event: ${e.title}`)}
            onSlotClick={(d, h) => alert(`Slot: ${d.toLocaleDateString()} ${h ?? ''}`)}
          />
        </div>
      );
    }
    return <Demo />;
  },
};

export const Week: Story = {
  render: () => (
    <div className="p-4">
      <EventCalendar events={EVENTS} defaultView="week" hourRange={[7, 20]} />
    </div>
  ),
};

export const Day: Story = {
  render: () => (
    <div className="p-4">
      <EventCalendar events={EVENTS} defaultView="day" hourRange={[7, 20]} />
    </div>
  ),
};

export const Agenda: Story = {
  render: () => (
    <div className="p-4">
      <EventCalendar events={EVENTS} defaultView="agenda" />
    </div>
  ),
};
