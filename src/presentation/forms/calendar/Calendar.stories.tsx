import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Temporal } from 'temporal-polyfill';
import { Calendar } from './Calendar';

const meta: Meta<typeof Calendar> = {
  title: 'Forms/Calendar',
  component: Calendar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Calendar>;

function Demo() {
  const [date, setDate] = useState<Temporal.PlainDate | null>(Temporal.Now.plainDateISO());
  return (
    <div className="flex flex-col gap-3">
      <Calendar value={date} onValueChange={setDate} />
      <p className="text-sm text-muted-foreground">
        Selected: {date ? date.toString() : 'none'}
      </p>
    </div>
  );
}

function MinMaxDemo() {
  const today = Temporal.Now.plainDateISO();
  const min = today.subtract({ days: 7 });
  const max = today.add({ days: 14 });
  return <Calendar min={min} max={max} aria-label="Bounded calendar" />;
}

function DisabledWeekendsDemo() {
  return (
    <Calendar
      // Temporal `dayOfWeek`: 6 = Saturday, 7 = Sunday.
      isDisabled={(d) => d.dayOfWeek === 6 || d.dayOfWeek === 7}
      aria-label="Weekdays only"
    />
  );
}

export const Default: Story = { render: () => <Demo /> };
export const MinMax: Story = { render: () => <MinMaxDemo /> };
export const DisabledWeekends: Story = { render: () => <DisabledWeekendsDemo /> };
