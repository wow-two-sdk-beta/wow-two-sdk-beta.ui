import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TimeField, type TimeValue } from './TimeField';

const meta: Meta<typeof TimeField> = {
  title: 'Forms/TimeField',
  component: TimeField,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TimeField>;

function Demo() {
  const [time, setTime] = useState<TimeValue | null>(null);
  return (
    <div className="flex flex-col gap-3 w-72">
      <TimeField value={time} onChange={setTime} />
      <p className="text-sm text-muted-foreground">
        Value: {time ? `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}` : 'none'}
      </p>
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const FiveMinuteSteps: Story = {
  render: () => (
    <div className="w-72">
      <TimeField step={300} />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <TimeField state="invalid" />
    </div>
  ),
};
