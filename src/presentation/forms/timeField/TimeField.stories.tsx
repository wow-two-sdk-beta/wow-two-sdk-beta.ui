import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { TimeField } from './TimeField';

const meta: Meta<typeof TimeField> = {
  title: 'Forms/TimeField',
  component: TimeField,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TimeField>;

function Demo() {
  const [time, setTime] = useState<Temporal.PlainTime | null>(null);
  return (
    <div className="flex flex-col gap-3 w-72">
      <TimeField value={time} onValueChange={setTime} aria-label="Time" />
      <p className="text-sm text-muted-foreground">
        Value: {time ? time.toString({ smallestUnit: 'minute' }) : 'none'}
      </p>
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const FiveMinuteSteps: Story = {
  render: () => (
    <div className="w-72">
      <TimeField step={300} aria-label="Time" />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <TimeField state="invalid" aria-label="Time" />
    </div>
  ),
};
