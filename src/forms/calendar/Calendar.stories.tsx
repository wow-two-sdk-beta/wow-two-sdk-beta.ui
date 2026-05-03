import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Calendar } from './Calendar';

const meta: Meta<typeof Calendar> = {
  title: 'Forms/Calendar',
  component: Calendar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Calendar>;

function Demo() {
  const [date, setDate] = useState<Date | null>(new Date());
  return (
    <div className="flex flex-col gap-3">
      <Calendar value={date} onChange={setDate} />
      <p className="text-sm text-muted-foreground">
        Selected: {date ? date.toDateString() : 'none'}
      </p>
    </div>
  );
}

function MinMaxDemo() {
  const today = new Date();
  const min = new Date(today);
  min.setDate(today.getDate() - 7);
  const max = new Date(today);
  max.setDate(today.getDate() + 14);
  return <Calendar min={min} max={max} aria-label="Bounded calendar" />;
}

function DisabledWeekendsDemo() {
  return (
    <Calendar
      isDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
      aria-label="Weekdays only"
    />
  );
}

export const Default: Story = { render: () => <Demo /> };
export const MinMax: Story = { render: () => <MinMaxDemo /> };
export const DisabledWeekends: Story = { render: () => <DisabledWeekendsDemo /> };
