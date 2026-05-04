import type { Meta, StoryObj } from '@storybook/react';
import { ScheduleView, type ScheduleBooking, type ScheduleResource } from './ScheduleView';

const meta: Meta<typeof ScheduleView> = {
  title: 'Display/ScheduleView',
  component: ScheduleView,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ScheduleView>;

const TODAY = new Date();
const at = (h: number, m = 0) => {
  const d = new Date(TODAY);
  d.setHours(h, m, 0, 0);
  return d;
};

const RESOURCES: ScheduleResource[] = [
  { id: 'r1', label: 'Room A' },
  { id: 'r2', label: 'Room B' },
  { id: 'r3', label: 'Studio 1' },
  { id: 'r4', label: 'Conference' },
];

const BOOKINGS: ScheduleBooking[] = [
  { id: 'b1', resourceId: 'r1', start: at(9, 0), end: at(10, 30), label: 'Standup', color: 'var(--color-primary-soft)' },
  { id: 'b2', resourceId: 'r1', start: at(13, 0), end: at(14, 0), label: 'Lunch chat' },
  { id: 'b3', resourceId: 'r2', start: at(11, 0), end: at(12, 0), label: '1:1' },
  { id: 'b4', resourceId: 'r3', start: at(10, 0), end: at(13, 0), label: 'Recording', color: 'var(--color-warning-soft)' },
  { id: 'b5', resourceId: 'r4', start: at(15, 0), end: at(17, 0), label: 'All-hands' },
];

export const Default: Story = {
  render: () => (
    <div className="w-[56rem]">
      <ScheduleView
        resources={RESOURCES}
        bookings={BOOKINGS}
        date={TODAY}
        onBookingClick={(b) => alert(`Booking: ${b.label}`)}
        onSlotClick={(r, t) => alert(`${r} @ ${t.toLocaleTimeString()}`)}
      />
    </div>
  ),
};

export const NarrowHours: Story = {
  render: () => (
    <div className="w-[40rem]">
      <ScheduleView resources={RESOURCES} bookings={BOOKINGS} date={TODAY} hourRange={[9, 14]} />
    </div>
  ),
};
